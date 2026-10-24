// SAMANVAY - Credential Service (Ed25519-like digital signatures using SubtleCrypto)
import { dbAdd, dbGetAll, dbPut, dbGet } from './db.js';
import { addAuditEvent } from './audit.js';

// Use ECDSA P-256 as demo signing (SubtleCrypto available in browser)
let _keyPair = null;

export async function getSigningKeyPair() {
  if (_keyPair) return _keyPair;
  
  // Check if we have a stored key
  const stored = localStorage.getItem('samanvay_signing_key');
  if (stored) {
    try {
      const { publicKey, privateKey } = JSON.parse(stored);
      const pub = await crypto.subtle.importKey('jwk', publicKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['verify']);
      const priv = await crypto.subtle.importKey('jwk', privateKey, { name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign']);
      _keyPair = { publicKey: pub, privateKey: priv };
      return _keyPair;
    } catch {}
  }
  
  // Generate new key pair (demo only — in production, keys are managed externally)
  _keyPair = await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify']);
  const pubJwk = await crypto.subtle.exportKey('jwk', _keyPair.publicKey);
  const privJwk = await crypto.subtle.exportKey('jwk', _keyPair.privateKey);
  localStorage.setItem('samanvay_signing_key', JSON.stringify({ publicKey: pubJwk, privateKey: privJwk }));
  
  return _keyPair;
}

async function signData(data) {
  const { privateKey } = await getSigningKeyPair();
  const enc = new TextEncoder();
  const sig = await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, privateKey, enc.encode(data));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

async function verifySignature(data, signature) {
  const { publicKey } = await getSigningKeyPair();
  const enc = new TextEncoder();
  const sigBytes = new Uint8Array(signature.match(/.{1,2}/g).map(b => parseInt(b, 16)));
  try {
    return await crypto.subtle.verify({ name: 'ECDSA', hash: 'SHA-256' }, publicKey, sigBytes, enc.encode(data));
  } catch { return false; }
}

function generateCredentialId() {
  return 'CRED-' + Array.from(crypto.getRandomValues(new Uint8Array(8)))
    .map(b => b.toString(16).padStart(2, '0')).join('').toUpperCase();
}

export async function issueCredential(student, institutionName, issuerAdminId) {
  const credentialId = generateCredentialId();
  const issuedAt = new Date().toISOString();
  const expiresAt = new Date(Date.now() + 365 * 24 * 3600 * 1000).toISOString(); // 1 year
  
  // Only include necessary claims (selective disclosure)
  const claims = {
    credential_id: credentialId,
    issuer: institutionName,
    issuer_institution_id: student.institution_id,
    student_ref: student.id,
    student_name: student.full_name,
    enrollment_number: student.student_id,
    department: student.department,
    admission_year: student.admission_year,
    apaar_id_format_valid: student.apaar_id ? true : false,
    issued_at: issuedAt,
    expires_at: expiresAt,
    status: 'ACTIVE',
    demo_mode: true,
    demo_note: 'This is a DEMO_VERIFIED credential. Not officially verified by APAAR/ABC.',
  };
  
  const payload = JSON.stringify(claims);
  const signature = await signData(payload);
  
  const credential = {
    ...claims,
    signature,
    payload,
    issued_by: issuerAdminId,
  };
  
  const id = await dbAdd('credentials', credential);
  await addAuditEvent({
    action: 'CREDENTIAL_ISSUED',
    actor_id: issuerAdminId,
    record_id: id,
    record_type: 'credential',
    institution_id: student.institution_id,
    details: `Credential issued for student ${student.id}`
  });
  
  return { ...credential, id };
}

export async function verifyCredential(credentialId) {
  const credentials = await dbGetAll('credentials');
  const cred = credentials.find(c => c.credential_id === credentialId);
  
  if (!cred) {
    return { status: 'INVALID', message: 'Credential not found', verified: false };
  }
  
  // Check revocation
  const revocations = await dbGetAll('revocations');
  const revoked = revocations.find(r => r.credential_id === credentialId);
  if (revoked) {
    return { status: 'REVOKED', message: `Revoked on ${revoked.revoked_at}: ${revoked.reason}`, verified: false, credential: sanitizeCredential(cred) };
  }
  
  // Check expiry
  if (new Date() > new Date(cred.expires_at)) {
    return { status: 'EXPIRED', message: 'Credential has expired', verified: false, credential: sanitizeCredential(cred) };
  }
  
  // Verify signature
  const sigValid = await verifySignature(cred.payload, cred.signature);
  if (!sigValid) {
    return { status: 'TAMPERED', message: 'Signature verification failed — credential may have been tampered with', verified: false };
  }
  
  await addAuditEvent({ action: 'CREDENTIAL_VERIFIED', details: `Verified credential ${credentialId}` });
  
  return {
    status: 'DEMO_VERIFIED',
    message: 'Demo credential verified successfully. This is a DEMO_VERIFIED result — not an official APAAR verification.',
    verified: true,
    credential: sanitizeCredential(cred),
  };
}

function sanitizeCredential(cred) {
  // Only expose permitted fields during verification
  return {
    credential_id: cred.credential_id,
    issuer: cred.issuer,
    student_name: cred.student_name,
    enrollment_number: cred.enrollment_number,
    department: cred.department,
    issued_at: cred.issued_at,
    expires_at: cred.expires_at,
    status: cred.status,
    demo_mode: cred.demo_mode,
    demo_note: cred.demo_note,
  };
}

export async function revokeCredential(credentialId, reason, actorId) {
  const credentials = await dbGetAll('credentials');
  const cred = credentials.find(c => c.credential_id === credentialId);
  if (!cred) throw new Error('Credential not found');
  
  await dbAdd('revocations', {
    credential_id: credentialId,
    revoked_at: new Date().toISOString(),
    revoked_by: actorId,
    reason,
  });
  
  cred.status = 'REVOKED';
  await dbPut('credentials', cred);
  
  await addAuditEvent({ action: 'CREDENTIAL_REVOKED', actor_id: actorId, record_id: credentialId, details: reason });
  return { success: true };
}

export async function generateQRPayload(credentialId) {
  // QR contains ONLY credential reference, not PII
  return JSON.stringify({
    type: 'SAMANVAY_CREDENTIAL',
    id: credentialId,
    verify_url: `${window.location.origin}${window.location.pathname}#verify/${credentialId}`,
    demo: true,
  });
}
