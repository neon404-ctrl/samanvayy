// SAMANVAY - Auth Module (JWT simulation, bcrypt simulation, TOTP)
import { dbGetAll, dbAdd, dbPut } from './db.js';
import { addAuditEvent } from './audit.js';

// Simple HMAC-SHA256 using SubtleCrypto
export async function hmacSha256(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Simulate Argon2 with SHA-256 + salt (demo only)
export async function hashPassword(password) {
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(16)))
    .map(b => b.toString(16).padStart(2, '0')).join('');
  const hash = await hmacSha256(salt, password);
  return `$argon2demo$${salt}$${hash}`;
}

export async function verifyPassword(password, stored) {
  if (!stored.startsWith('$argon2demo$')) return false;
  const parts = stored.split('$');
  const salt = parts[2];
  const expected = parts[3];
  const computed = await hmacSha256(salt, password);
  return computed === expected;
}

// JWT-like token (Base64URL encoded, HMAC signed)
const JWT_SECRET = 'samanvay_demo_secret_2026_hackathon';

function base64url(str) {
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}
function fromBase64url(str) {
  return atob(str.replace(/-/g, '+').replace(/_/g, '/'));
}

export async function signToken(payload) {
  const header = base64url(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = base64url(JSON.stringify(payload));
  const sig = await hmacSha256(JWT_SECRET, `${header}.${body}`);
  return `${header}.${body}.${base64url(sig)}`;
}

export async function verifyToken(token) {
  if (!token) return null;
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const [header, body, sig] = parts;
    const expectedSig = await hmacSha256(JWT_SECRET, `${header}.${body}`);
    if (base64url(expectedSig) !== sig) return null;
    const payload = JSON.parse(fromBase64url(body));
    if (payload.exp && Date.now() / 1000 > payload.exp) return null;
    return payload;
  } catch { return null; }
}

// Rate limiting (simple in-memory)
const loginAttempts = {};
export function checkRateLimit(username) {
  const now = Date.now();
  if (!loginAttempts[username]) loginAttempts[username] = [];
  loginAttempts[username] = loginAttempts[username].filter(t => now - t < 15 * 60 * 1000);
  if (loginAttempts[username].length >= 5) {
    return { blocked: true, remaining: Math.ceil((loginAttempts[username][0] + 15*60*1000 - now) / 1000) };
  }
  return { blocked: false };
}
export function recordLoginAttempt(username) {
  if (!loginAttempts[username]) loginAttempts[username] = [];
  loginAttempts[username].push(Date.now());
}

// Login
export async function login(username, password) {
  const rl = checkRateLimit(username);
  if (rl.blocked) throw new Error(`Too many attempts. Try again in ${rl.remaining}s`);

  const users = await dbGetAll('users');
  const user = users.find(u => u.username === username || u.email === username);
  if (!user) {
    recordLoginAttempt(username);
    await addAuditEvent({ action: 'LOGIN_FAILED', details: `User not found: ${username}` });
    throw new Error('Invalid credentials');
  }
  const valid = await verifyPassword(password, user.password_hash);
  if (!valid) {
    recordLoginAttempt(username);
    await addAuditEvent({ action: 'LOGIN_FAILED', actor_id: user.id, details: 'Wrong password' });
    throw new Error('Invalid credentials');
  }
  if (user.status === 'suspended') throw new Error('Account suspended');

  const payload = {
    sub: user.id,
    role: user.role,
    institution_id: user.institution_id || null,
    username: user.username,
    name: user.name,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + 8 * 3600
  };
  const token = await signToken(payload);
  await addAuditEvent({ action: 'LOGIN_SUCCESS', actor_id: user.id, actor_name: user.username });
  return { token, user: { id: user.id, name: user.name, role: user.role, username: user.username, email: user.email, institution_id: user.institution_id } };
}

export async function getCurrentUser() {
  const token = localStorage.getItem('samanvay_token');
  if (!token) return null;
  return await verifyToken(token);
}

export function logout() {
  localStorage.removeItem('samanvay_token');
  localStorage.removeItem('samanvay_user');
}

// Role permissions
export const PERMISSIONS = {
  super_admin: ['manage_institutions', 'manage_users', 'view_all_students', 'view_audit_logs', 'configure_system'],
  institution_admin: ['manage_own_students', 'upload_csv', 'review_matches', 'issue_credentials', 'view_own_audit'],
  student: ['view_own_profile', 'view_own_credentials', 'request_correction'],
  verifier: ['verify_credential'],
};

export function hasPermission(role, permission) {
  return PERMISSIONS[role]?.includes(permission) ?? false;
}
