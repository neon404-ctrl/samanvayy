# SAMANVAY — APAAR-Based Student Data Management & Verification Platform
### Smart India Hackathon 2026 | Team Codeverse | Problem PS-AICTE-04

---

## Important Notice

This application uses **synthetic demo data only**. No real APAAR, DigiLocker, or ABC API access is configured.  
All verification results are labeled DEMO_VERIFIED. Never treat them as official government verification.

---

## Quick Start

Simply open index.html in a modern browser. No server or Node.js required.

`ash
# Python local server (optional)
python -m http.server 8080

# Node.js local server (optional)
npx serve .
`

Data persists in IndexedDB across page refreshes. Use Admin Panel → Reset Database to reseed.

---

## Demo Accounts

| Username | Password | Role | Access |
|---|---|---|---|
| superadmin | SuperAdmin@2026 | Super Administrator | Full system |
| admin_nitchennai | NitAdmin@2026 | Institution Admin | NIT Chennai |
| admin_aucoimbatore | AuAdmin@2026 | Institution Admin | Anna University |
| admin_psgtech | PsgAdmin@2026 | Institution Admin | PSG Tech |
| student_arjun | Student@2026 | Student | Own profile & credentials |
| verifier_demo | Verifier@2026 | Verifier | QR verification |

Click demo account buttons on the login page for quick fill.

---

## Architecture

`
SAMANVAY (Single-Page Application - Vanilla JS + ES Modules)
├── index.html            -- Main HTML + complete CSS design system
└── src/
    ├── app.js            -- Router, sidebar, toast/modal system
    ├── auth.js           -- JWT-like tokens, HMAC-SHA256, rate limiting
    ├── db.js             -- IndexedDB ORM (simulates PostgreSQL)
    ├── seed.js           -- ~100 synthetic student records (3 institutions)
    ├── reconciliation.js -- Fuzzy matching, name normalization, CSV validation
    ├── credentials.js    -- ECDSA P-256 credential signing & verification
    ├── audit.js          -- Hash-chained append-only audit log
    └── pages/
        ├── landing.js    -- Public homepage
        ├── login.js      -- Auth with demo quick-fill buttons
        ├── dashboard.js  -- Role-specific stats + Chart.js doughnut
        ├── students.js   -- Searchable student table + CRUD
        ├── import.js     -- CSV wizard with drag-and-drop
        ├── reconciliation.js -- Match candidate review
        ├── review.js     -- Human review queue
        ├── credentials.js   -- Credential wallet + QR generation
        ├── verify.js     -- Public QR verification
        ├── audit.js      -- Audit log viewer with chain check
        └── admin.js      -- Super admin institution management
`

### Production Target Stack
- Frontend: React + TypeScript + Vite + Tailwind CSS + shadcn/ui + Recharts
- Backend: Python FastAPI + Pydantic + SQLAlchemy + JWT + Argon2 + Ed25519
- Database: PostgreSQL + Alembic migrations + Redis (rate limiting)

---

## Features

### Authentication & Authorization
- JWT-like tokens (HMAC-SHA256 signed, 8-hour expiry)
- Argon2-simulated password hashing (demo: HMAC-SHA256 + salt)
- Role-based access control enforced per page
- Rate limiting: 5 failed attempts per 15 minutes

### Institution Dashboard
- Real-time stats from IndexedDB (not hardcoded)
- Record quality breakdown: GOOD / FAIR / POOR
- Chart.js doughnut visualization
- Pending review badge counts
- Recent activity feed

### Student Management
- Searchable, filterable, paginated table
- APAAR ID masked by default
- Add / Edit / View with modals
- CSV export (institution-scoped)
- Per-record quality score and issues

### CSV Import Wizard
- Drag-and-drop or file picker
- Row-by-row validation with field-level errors
- Name normalization preview
- Date format normalization (DD/MM/YYYY → YYYY-MM-DD)
- APAAR ID format check (FORMAT_VALID only -- not official)
- Three tiers: Valid / Warning / Rejected
- Preview before commit, downloadable error report
- Import history

### Reconciliation Engine
- Levenshtein distance + token sort fuzzy matching
- Weighted confidence: name 50% + DOB 40% + guardian 10%
- Bands: HIGH (>=90), MEDIUM (70-89), LOW (<70)
- HMAC-keyed privacy-preserving tokens
- NEVER auto-merges -- all matches require human review

### Human Review Queue
- Side-by-side field comparison
- Status: PENDING_REVIEW -> APPROVED / REJECTED_MATCH / NEEDS_MORE_INFORMATION
- Reason recording, decision history, audit log entry

### Digital Credential Wallet
- ECDSA P-256 signatures (SubtleCrypto API)
- Selective disclosure (minimal claims in credential)
- QR code: credential reference only (no PII)
- Revocation and expiry support

### QR Verification
- Paste ID or upload QR image
- States: UNVERIFIED / FORMAT_VALID / DEMO_VERIFIED
- Never returns OFFICIALLY_VERIFIED from demo data
- Provider status: DemoProvider ACTIVE, OfficialProvider DISABLED

### Hash-Chained Audit Logs
- HMAC-SHA256 chain linking
- Chain integrity verification tool
- Role-scoped visibility

---

## Demo Dataset

| Institution | Students | Issues |
|---|---|---|
| NIT Chennai | 25 | Duplicates, invalid dates, missing IDs, all-caps |
| Anna University, Coimbatore | 22 | Cross-institution match, invalid IDs, date formats |
| PSG College of Technology | 21 | Cross-institution match, missing guardian, empty IDs |
| Total | ~68 | 10+ intentional quality test cases |

### Test Cases
- Exact name duplicate within institution (NIT-2021-001 & NIT-2021-003)
- Typo variation cross-institution (Arjun vs Ariun -- NIT <-> AU)
- Partial name + all-caps (Rahul Kumar Gupta vs RAHUL KUMAR -- NIT <-> PSG)
- Honorific removal (Smt., Mr., Dr., Ms.)
- Invalid date (29/02/2003 -- 2003 not a leap year)
- Invalid APAAR ID (short, alphanumeric)
- Missing guardian name, missing APAAR ID
- Pre-issued credential for student_arjun (ready to verify)

---

## Acceptance Criteria

1. Admin sees real DB stats -- Login as superadmin -> Dashboard
2. CSV upload works -- admin_nitchennai -> CSV Import -> use sample
3. Invalid CSV errors -- sample has rejected rows (DEMO-2024-004/005)
4. Mismatch explained -- Students -> filter MISMATCH
5. Duplicate in queue -- Review Queue -> 3 pending matches
6. Reviewer decides -- Review Queue -> Confirm/Reject buttons
7. Decision in audit -- Audit Logs -> REVIEW_DECISION event
8. Student credential -- Login as student_arjun -> My Credentials
9. QR verification -- verifier_demo -> Verify Credential -> paste CRED-...
10. Tampered rejected -- Wrong credential ID -> INVALID result
11. Unauthorized blocked -- Verifier cannot access Students page
12. OfficialProvider disabled -- Verify page -> provider status panel
13. Data persists -- Refresh page -> data still there
14. Local setup works -- Open index.html directly in browser
15. Reset works -- Admin Panel -> Reset Database

---

## APAAR Integration Design

DemoProvider (ACTIVE): Returns DEMO_VERIFIED for synthetic records
OfficialProvider (DISABLED): Returns UNAVAILABLE until authorized credentials configured

Verification states:
- UNVERIFIED: No attempt made
- FORMAT_VALID: 12-digit format check only
- DEMO_VERIFIED: Synthetic demo provider confirmed
- OFFICIALLY_VERIFIED: NEVER returned -- requires authorized APAAR API

---

## Security Notes

- Passwords: HMAC-SHA256 + random salt (simulates Argon2)
- JWT: HMAC-SHA256 signed, 8-hour expiry
- Credentials: ECDSA P-256 digital signatures
- QR codes: Credential reference only -- no PII
- Audit logs: HMAC-SHA256 hash chaining
- Rate limiting: 5 failed logins per 15 minutes
- APAAR IDs: Masked by default; FORMAT_VALID != official verification

---

## Team

Team Name: Codeverse
Hackathon: Smart India Hackathon 2026
Problem: PS-AICTE-04 -- APAAR ID-Based Student Data Management and Verification Platform
Category: Software

---

## Disclaimer

This software is a hackathon demonstration using entirely synthetic data.
No real student PII is used. SAMANVAY does not claim authorized access to
APAAR, DigiLocker, ABC, or any government system.
All results are labeled DEMO_VERIFIED and must not be used for real verification.
