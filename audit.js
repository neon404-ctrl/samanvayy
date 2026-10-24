// SAMANVAY - Audit Log Module (Hash-chained, append-only)
import { dbGetAll, dbAdd } from './db.js';

// Inline HMAC to avoid circular import with auth.js
async function hmacSha256Audit(key, message) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(key), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(message));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

const AUDIT_SECRET = 'samanvay_audit_chain_2026';

export async function addAuditEvent(event) {
  const allEvents = await dbGetAll('audit_events');
  const lastEvent = allEvents[allEvents.length - 1];
  const prevHash = lastEvent ? lastEvent.hash : '0000000000000000';
  
  const payload = {
    action: event.action,
    actor_id: event.actor_id || null,
    actor_name: event.actor_name || 'system',
    details: event.details || null,
    record_id: event.record_id || null,
    record_type: event.record_type || null,
    institution_id: event.institution_id || null,
    timestamp: new Date().toISOString(),
    prev_hash: prevHash
  };

  const content = JSON.stringify({ ...payload });
  const hash = await hmacSha256Audit(AUDIT_SECRET, content);
  
  await dbAdd('audit_events', { ...payload, hash });
}

export async function getAuditLogs(filters = {}) {
  const events = await dbGetAll('audit_events');
  let filtered = events.reverse(); // newest first
  
  if (filters.action) filtered = filtered.filter(e => e.action.includes(filters.action));
  if (filters.actor_id) filtered = filtered.filter(e => e.actor_id === filters.actor_id);
  if (filters.institution_id) filtered = filtered.filter(e => e.institution_id === filters.institution_id);
  
  return filtered;
}

export async function verifyAuditChain() {
  const events = await dbGetAll('audit_events');
  let valid = true;
  for (let i = 1; i < events.length; i++) {
    if (events[i].prev_hash !== events[i-1].hash) {
      valid = false;
      break;
    }
  }
  return { valid, count: events.length };
}
