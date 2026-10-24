// SAMANVAY - Data Normalization & Reconciliation Engine
// Implements fuzzy matching, name normalization, quality scoring

// Indian name normalization
const HONORIFICS = ['mr', 'mrs', 'ms', 'dr', 'prof', 'shri', 'smt', 'kumari', 'km', 'master', 'miss'];

export function normalizeName(name) {
  if (!name) return '';
  let n = name.toLowerCase().trim();
  // Remove honorifics
  HONORIFICS.forEach(h => {
    n = n.replace(new RegExp(`^${h}\\.?\\s+`, 'i'), '');
  });
  // Normalize whitespace
  n = n.replace(/\s+/g, ' ').trim();
  // Remove special chars except spaces and hyphens
  n = n.replace(/[^a-z\s\-\.]/g, '');
  // Expand common initials: "R. K. Sharma" → "r k sharma"
  n = n.replace(/([a-z])\.(\s|$)/g, '$1 ').trim();
  return n;
}

export function normalizeDate(dateStr) {
  if (!dateStr) return null;
  // Try multiple formats: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
  const formats = [
    { re: /^(\d{2})\/(\d{2})\/(\d{4})$/, fn: m => `${m[3]}-${m[2]}-${m[1]}` },
    { re: /^(\d{4})-(\d{2})-(\d{2})$/, fn: m => `${m[1]}-${m[2]}-${m[3]}` },
    { re: /^(\d{2})-(\d{2})-(\d{4})$/, fn: m => `${m[3]}-${m[2]}-${m[1]}` },
    { re: /^(\d{2})\.(\d{2})\.(\d{4})$/, fn: m => `${m[3]}-${m[2]}-${m[1]}` },
  ];
  for (const { re, fn } of formats) {
    const m = dateStr.match(re);
    if (m) {
      const d = new Date(fn(m));
      if (!isNaN(d)) return fn(m);
    }
  }
  return null;
}

export function validateApaarId(apaarId) {
  if (!apaarId) return { valid: false, reason: 'Missing APAAR ID' };
  const cleaned = String(apaarId).replace(/\s/g, '');
  if (!/^\d{12}$/.test(cleaned)) {
    return { valid: false, reason: 'APAAR ID must be exactly 12 digits', status: 'FORMAT_INVALID' };
  }
  return { valid: true, status: 'FORMAT_VALID', note: 'Format check only — not officially verified' };
}

// Levenshtein distance
function levenshtein(a, b) {
  const m = a.length, n = b.length;
  const dp = Array.from({ length: m+1 }, (_, i) => Array.from({ length: n+1 }, (_, j) => i === 0 ? j : j === 0 ? i : 0));
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i-1] === b[j-1] ? dp[i-1][j-1] : 1 + Math.min(dp[i-1][j], dp[i][j-1], dp[i-1][j-1]);
    }
  }
  return dp[m][n];
}

// Token sort ratio (like RapidFuzz)
export function fuzzyScore(s1, s2) {
  if (!s1 || !s2) return 0;
  const a = normalizeName(s1);
  const b = normalizeName(s2);
  if (a === b) return 100;
  // Token sort
  const sortA = a.split(' ').sort().join(' ');
  const sortB = b.split(' ').sort().join(' ');
  const maxLen = Math.max(sortA.length, sortB.length);
  if (maxLen === 0) return 100;
  const dist = levenshtein(sortA, sortB);
  return Math.round((1 - dist / maxLen) * 100);
}

// Data quality scoring
export function scoreRecord(student) {
  let score = 100;
  const issues = [];
  
  if (!student.full_name?.trim()) { score -= 20; issues.push({ field: 'full_name', type: 'ERROR', msg: 'Missing full name' }); }
  else if (student.full_name.trim().length < 3) { score -= 10; issues.push({ field: 'full_name', type: 'WARNING', msg: 'Name too short' }); }
  
  if (!student.date_of_birth) { score -= 15; issues.push({ field: 'date_of_birth', type: 'ERROR', msg: 'Missing date of birth' }); }
  else {
    const normalized = normalizeDate(student.date_of_birth);
    if (!normalized) { score -= 15; issues.push({ field: 'date_of_birth', type: 'ERROR', msg: 'Invalid date format' }); }
    else {
      const dob = new Date(normalized);
      const age = (new Date() - dob) / (365.25 * 24 * 3600 * 1000);
      if (age < 15 || age > 80) { score -= 10; issues.push({ field: 'date_of_birth', type: 'WARNING', msg: `Unusual age: ${Math.floor(age)} years` }); }
    }
  }
  
  if (!student.guardian_name?.trim()) { score -= 5; issues.push({ field: 'guardian_name', type: 'WARNING', msg: 'Missing guardian name' }); }
  if (!student.department?.trim()) { score -= 5; issues.push({ field: 'department', type: 'WARNING', msg: 'Missing department' }); }
  
  const apaarCheck = validateApaarId(student.apaar_id);
  if (!apaarCheck.valid) { score -= 10; issues.push({ field: 'apaar_id', type: 'ERROR', msg: apaarCheck.reason }); }
  
  if (!student.admission_year) { score -= 5; issues.push({ field: 'admission_year', type: 'WARNING', msg: 'Missing admission year' }); }
  else if (student.admission_year < 2000 || student.admission_year > 2030) {
    score -= 5; issues.push({ field: 'admission_year', type: 'WARNING', msg: 'Unusual admission year' });
  }

  return { score: Math.max(0, score), issues, quality: score >= 90 ? 'GOOD' : score >= 70 ? 'FAIR' : 'POOR' };
}

// CSV Validation
export function parseCSVRow(row) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    if (row[i] === '"') {
      inQuotes = !inQuotes;
    } else if (row[i] === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += row[i];
    }
  }
  result.push(current.trim());
  return result;
}

export function validateCSV(content, institutionId) {
  const lines = content.split('\n').filter(l => l.trim());
  if (lines.length < 2) return { valid: false, error: 'File too short — no data rows found' };
  
  const REQUIRED_HEADERS = ['student_id', 'full_name', 'date_of_birth'];
  const OPTIONAL_HEADERS = ['institution_id', 'guardian_name', 'department', 'admission_year', 'apaar_id', 'email'];
  
  const headers = parseCSVRow(lines[0]).map(h => h.toLowerCase().replace(/\s+/g, '_'));
  const missingRequired = REQUIRED_HEADERS.filter(h => !headers.includes(h));
  if (missingRequired.length) {
    return { valid: false, error: `Missing required columns: ${missingRequired.join(', ')}` };
  }
  
  const validRows = [];
  const warningRows = [];
  const rejectedRows = [];
  const seenStudentIds = new Set();
  
  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;
    const cells = parseCSVRow(lines[i]);
    const row = {};
    headers.forEach((h, idx) => { row[h] = cells[idx] || ''; });
    row._rowNumber = i + 1;
    
    const errors = [];
    const warnings = [];
    
    // Required field checks
    if (!row.student_id?.trim()) errors.push({ field: 'student_id', msg: 'Missing student ID' });
    else if (seenStudentIds.has(row.student_id)) errors.push({ field: 'student_id', msg: 'Duplicate student ID in this file' });
    else seenStudentIds.add(row.student_id);
    
    if (!row.full_name?.trim()) errors.push({ field: 'full_name', msg: 'Missing full name' });
    else if (row.full_name.trim().length < 3) warnings.push({ field: 'full_name', msg: 'Name seems too short' });
    
    if (!row.date_of_birth?.trim()) {
      errors.push({ field: 'date_of_birth', msg: 'Missing date of birth' });
    } else {
      const normalized = normalizeDate(row.date_of_birth);
      if (!normalized) errors.push({ field: 'date_of_birth', msg: `Invalid date format: "${row.date_of_birth}" — use DD/MM/YYYY or YYYY-MM-DD` });
      else row._normalized_dob = normalized;
    }
    
    // APAAR ID format check
    if (row.apaar_id) {
      const apaarCheck = validateApaarId(row.apaar_id);
      if (!apaarCheck.valid) warnings.push({ field: 'apaar_id', msg: apaarCheck.reason });
      else row._apaar_status = 'FORMAT_VALID';
    }
    
    // Admission year
    if (row.admission_year) {
      const yr = parseInt(row.admission_year);
      if (isNaN(yr) || yr < 2000 || yr > 2030) warnings.push({ field: 'admission_year', msg: 'Unusual admission year' });
    }
    
    // Name normalization suggestion
    if (row.full_name) {
      const normalized = normalizeName(row.full_name);
      if (normalized !== row.full_name.toLowerCase().trim()) {
        warnings.push({ field: 'full_name', msg: `Name will be normalized: "${row.full_name}" → "${toTitleCase(normalized)}"`, type: 'NORMALIZE' });
      }
    }

    row._errors = errors;
    row._warnings = warnings;
    row._quality = scoreRecord(row);
    
    if (errors.length > 0) rejectedRows.push(row);
    else if (warnings.length > 0) warningRows.push(row);
    else validRows.push(row);
  }
  
  return {
    valid: true,
    headers,
    totalRows: lines.length - 1,
    validRows,
    warningRows,
    rejectedRows,
    summary: {
      total: validRows.length + warningRows.length + rejectedRows.length,
      valid: validRows.length,
      warnings: warningRows.length,
      rejected: rejectedRows.length,
    }
  };
}

function toTitleCase(str) {
  return str.split(' ').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
}

// Reconciliation Engine
export function computeMatchConfidence(rec1, rec2) {
  const nameScore = fuzzyScore(rec1.full_name, rec2.full_name);
  const dob1 = normalizeDate(rec1.date_of_birth);
  const dob2 = normalizeDate(rec2.date_of_birth);
  const dobMatch = dob1 && dob2 && dob1 === dob2;
  const guardianScore = rec1.guardian_name && rec2.guardian_name 
    ? fuzzyScore(rec1.guardian_name, rec2.guardian_name) 
    : 50; // neutral if missing
  
  // Weighted confidence
  let confidence = (nameScore * 0.5) + (dobMatch ? 40 : 0) + (guardianScore * 0.1);
  
  const fields = [
    { field: 'full_name', score: nameScore, match: nameScore >= 90, label: 'Name' },
    { field: 'date_of_birth', score: dobMatch ? 100 : 0, match: dobMatch, label: 'Date of Birth' },
    { field: 'guardian_name', score: guardianScore, match: guardianScore >= 80, label: 'Guardian Name' },
  ];
  
  const reasons = [];
  if (nameScore >= 90) reasons.push(`Name similarity: ${nameScore}%`);
  else if (nameScore >= 70) reasons.push(`Partial name match: ${nameScore}%`);
  if (dobMatch) reasons.push('Date of birth matches exactly');
  if (guardianScore >= 80) reasons.push(`Guardian name similarity: ${guardianScore}%`);
  
  const band = confidence >= 90 ? 'HIGH' : confidence >= 70 ? 'MEDIUM' : 'LOW';
  
  return {
    confidence: Math.min(100, Math.round(confidence)),
    band,
    fields,
    reasons,
    recommendation: band === 'HIGH' ? 'Likely duplicate — send to human review'
      : band === 'MEDIUM' ? 'Possible match — requires human verification'
      : 'Low similarity — unlikely duplicate',
    auto_merge: false, // NEVER auto-merge
  };
}

// Privacy-preserving HMAC token for cross-institution matching
export async function makeMatchToken(value, secret) {
  const enc = new TextEncoder();
  const cryptoKey = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  );
  const normalized = normalizeName(String(value));
  const sig = await crypto.subtle.sign('HMAC', cryptoKey, enc.encode(normalized));
  return Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
}

export { toTitleCase };
