// SAMANVAY — Main Application Entry Point
import { seedDatabase, DEMO_CREDENTIALS_INFO } from './seed.js';
import { login, logout, getCurrentUser, verifyToken } from './auth.js';
import { renderLanding } from './pages/landing.js';
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderStudents } from './pages/students.js';
import { renderImport } from './pages/import.js';
import { renderReconciliation } from './pages/reconciliation.js';
import { renderReviewQueue } from './pages/review.js';
import { renderCredentials } from './pages/credentials.js';
import { renderVerify } from './pages/verify.js';
import { renderAuditLogs } from './pages/audit.js';
import { renderAdminPanel } from './pages/admin.js';

// ===== GLOBAL STATE =====
export const appState = {
  currentUser: null,
  currentPage: 'landing',
  sidebarCollapsed: false,
  pendingReviewCount: 0,
};

// ===== TOAST SYSTEM =====
export function showToast(title, message, type = 'info', duration = 4000) {
  const container = document.getElementById('toast-container');
  const icons = { success: '✅', error: '❌', warning: '⚠️', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `
    <span class="toast-icon">${icons[type]}</span>
    <div class="toast-content">
      <div class="toast-title">${title}</div>
      ${message ? `<div class="toast-msg">${message}</div>` : ''}
    </div>
  `;
  container.appendChild(toast);
  setTimeout(() => {
    toast.style.animation = 'toastIn 0.3s ease reverse forwards';
    setTimeout(() => toast.remove(), 300);
  }, duration);
}

// ===== MODAL SYSTEM =====
export function showModal(id, content) {
  const container = document.getElementById('modal-container');
  let overlay = document.getElementById(`overlay-${id}`);
  if (!overlay) {
    overlay = document.createElement('div');
    overlay.id = `overlay-${id}`;
    overlay.className = 'modal-overlay';
    container.appendChild(overlay);
  }
  overlay.innerHTML = content;
  overlay.classList.add('open');
  overlay.addEventListener('click', (e) => {
    if (e.target === overlay) closeModal(id);
  });
}

export function closeModal(id) {
  const overlay = document.getElementById(`overlay-${id}`);
  if (overlay) { overlay.classList.remove('open'); overlay.innerHTML = ''; }
}

// ===== CONFIRMATION DIALOG =====
export function confirmDialog(title, message, onConfirm, danger = false) {
  showModal('confirm', `
    <div class="modal">
      <div class="modal-header">
        <div>
          <div class="modal-title">${title}</div>
          <div class="modal-subtitle">${message}</div>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-ghost" onclick="closeModal('confirm')">Cancel</button>
        <button class="btn ${danger ? 'btn-danger' : 'btn-primary'}" id="confirm-ok">Confirm</button>
      </div>
    </div>
  `);
  document.getElementById('confirm-ok').onclick = () => { closeModal('confirm'); onConfirm(); };
}
window.closeModal = closeModal;

// ===== SVG ICONS =====
export const icons = {
  home: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`,
  users: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>`,
  upload: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>`,
  refresh: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>`,
  check: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>`,
  x: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>`,
  shield: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>`,
  award: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="6"/><path d="M15.477 12.89 17 22l-5-3-5 3 1.523-9.11"/></svg>`,
  qr: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="3" height="3"/><rect x="18" y="14" width="3" height="3"/><rect x="14" y="18" width="3" height="3"/><rect x="18" y="18" width="3" height="3"/></svg>`,
  log: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>`,
  settings: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>`,
  logout: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>`,
  search: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>`,
  filter: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"/></svg>`,
  download: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>`,
  plus: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>`,
  edit: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>`,
  eye: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>`,
  eyeoff: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94"/><path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19"/><line x1="1" y1="1" x2="23" y2="23"/></svg>`,
  alert: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>`,
  info: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>`,
  building: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="2" width="16" height="20" rx="2" ry="2"/><line x1="9" y1="22" x2="9" y2="2"/><line x1="15" y1="22" x2="15" y2="2"/><line x1="4" y1="7" x2="20" y2="7"/><line x1="4" y1="12" x2="20" y2="12"/><line x1="4" y1="17" x2="20" y2="17"/></svg>`,
  link: `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>`,
};

// ===== NAVIGATION CONFIG =====
const NAV_ITEMS = {
  super_admin: [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', section: 'Overview' },
    { id: 'admin', label: 'Institution Admin', icon: 'building', section: 'Administration' },
    { id: 'students', label: 'All Students', icon: 'users' },
    { id: 'reconciliation', label: 'Reconciliation', icon: 'link', badgeKey: 'matches' },
    { id: 'review', label: 'Review Queue', icon: 'alert', badgeKey: 'pending', section: 'Data Quality' },
    { id: 'credentials', label: 'Credentials', icon: 'award' },
    { id: 'verify', label: 'QR Verify', icon: 'qr' },
    { id: 'audit', label: 'Audit Logs', icon: 'log', section: 'Security' },
  ],
  institution_admin: [
    { id: 'dashboard', label: 'Dashboard', icon: 'home', section: 'Overview' },
    { id: 'students', label: 'Students', icon: 'users', section: 'Data Management' },
    { id: 'import', label: 'CSV Import', icon: 'upload' },
    { id: 'reconciliation', label: 'Reconciliation', icon: 'link', badgeKey: 'matches' },
    { id: 'review', label: 'Review Queue', icon: 'alert', badgeKey: 'pending' },
    { id: 'credentials', label: 'Credentials', icon: 'award', section: 'Credentials' },
    { id: 'verify', label: 'QR Verify', icon: 'qr' },
    { id: 'audit', label: 'Audit Logs', icon: 'log', section: 'Security' },
  ],
  student: [
    { id: 'dashboard', label: 'My Dashboard', icon: 'home', section: 'Overview' },
    { id: 'credentials', label: 'My Credentials', icon: 'award', section: 'Credentials' },
    { id: 'verify', label: 'QR Verify', icon: 'qr' },
  ],
  verifier: [
    { id: 'verify', label: 'Verify Credential', icon: 'qr', section: 'Verification' },
  ],
};

// ===== ROUTER =====
export function navigate(page, params = {}) {
  appState.currentPage = page;
  appState.pageParams = params;
  renderApp();
  // Scroll to top
  const mainContent = document.querySelector('.main-content');
  if (mainContent) mainContent.scrollTop = 0;
}
window.navigate = navigate;

// ===== SIDEBAR RENDERER =====
function renderSidebar(user) {
  const navItems = NAV_ITEMS[user.role] || [];
  const badge = appState.badgeCounts || {};
  
  let sections = {};
  navItems.forEach(item => {
    const sec = item.section || '__default__';
    if (!sections[sec]) sections[sec] = [];
    sections[sec].push(item);
  });

  let navHTML = '';
  Object.entries(sections).forEach(([sec, items]) => {
    if (sec !== '__default__') navHTML += `<div class="sidebar-section-label">${sec}</div>`;
    items.forEach(item => {
      const isActive = appState.currentPage === item.id;
      const count = item.badgeKey ? badge[item.badgeKey] : 0;
      navHTML += `
        <div class="nav-item ${isActive ? 'active' : ''}" onclick="navigate('${item.id}')">
          <span class="nav-icon">${icons[item.icon] || ''}</span>
          <span>${item.label}</span>
          ${count > 0 ? `<span class="nav-badge ${item.id === 'review' ? 'amber' : ''}">${count}</span>` : ''}
        </div>`;
    });
  });

  const initials = (user.name || 'U').split(' ').map(w => w[0]).join('').slice(0,2).toUpperCase();
  const roleLabel = user.role.replace(/_/g, ' ');

  return `
    <aside class="sidebar">
      <div class="sidebar-logo">
        <div class="sidebar-logo-icon">🎓</div>
        <div class="sidebar-logo-text">
          <div class="sidebar-logo-title">SAMANVAY</div>
          <div class="sidebar-logo-sub">AICTE · Smart India Hackathon</div>
        </div>
      </div>
      <nav class="sidebar-nav">${navHTML}</nav>
      <div class="sidebar-footer">
        <div class="user-card">
          <div class="user-avatar">${initials}</div>
          <div>
            <div class="user-name">${user.name}</div>
            <div class="user-role">${roleLabel}</div>
          </div>
          <button class="logout-btn" onclick="handleLogout()" title="Logout">
            <span style="width:16px;height:16px;display:block">${icons.logout}</span>
          </button>
        </div>
      </div>
    </aside>`;
}

// ===== TOP BAR =====
function renderTopbar(title, subtitle) {
  return `
    <header class="topbar">
      <div>
        <div class="topbar-title">${title}</div>
        ${subtitle ? `<div class="topbar-subtitle">${subtitle}</div>` : ''}
      </div>
      <div class="topbar-right">
        <span class="demo-badge">⚡ Demo Mode</span>
      </div>
    </header>`;
}

// ===== PAGE TITLES =====
const PAGE_TITLES = {
  dashboard: ['Dashboard', 'Welcome to SAMANVAY'],
  students: ['Student Management', 'Search, filter and manage student records'],
  import: ['CSV Import', 'Upload and validate student data files'],
  reconciliation: ['Reconciliation Engine', 'Review potential duplicate records'],
  review: ['Review Queue', 'Resolve flagged records and mismatches'],
  credentials: ['Credential Wallet', 'Manage and issue digital credentials'],
  verify: ['QR Verification', 'Verify student credential authenticity'],
  audit: ['Audit Logs', 'Security-monitored append-only event log'],
  admin: ['Admin Panel', 'Manage institutions and system configuration'],
};

// ===== MAIN RENDER FUNCTION =====
async function renderApp() {
  const app = document.getElementById('app');
  const token = localStorage.getItem('samanvay_token');
  const user = token ? await verifyToken(token) : null;
  appState.currentUser = user;

  // Handle hash-based verify route (public)
  const hash = window.location.hash;
  if (hash.startsWith('#verify/')) {
    const credId = hash.replace('#verify/', '');
    app.innerHTML = await renderVerify(null, credId);
    return;
  }

  // Public pages
  if (!user) {
    if (appState.currentPage === 'login') {
      app.innerHTML = renderLogin();
    } else if (appState.currentPage === 'verify') {
      app.innerHTML = await renderVerify(null);
    } else {
      app.innerHTML = renderLanding();
    }
    attachLoginHandlers();
    return;
  }

  // Authenticated: render app shell
  const page = appState.currentPage;
  const [title, subtitle] = PAGE_TITLES[page] || ['SAMANVAY', ''];
  
  // Load badge counts
  await loadBadgeCounts();

  let pageContent = '';
  try {
    switch(page) {
      case 'dashboard': pageContent = await renderDashboard(user); break;
      case 'students': pageContent = await renderStudents(user); break;
      case 'import': pageContent = await renderImport(user); break;
      case 'reconciliation': pageContent = await renderReconciliation(user); break;
      case 'review': pageContent = await renderReviewQueue(user); break;
      case 'credentials': pageContent = await renderCredentials(user); break;
      case 'verify': pageContent = await renderVerify(user); break;
      case 'audit': pageContent = await renderAuditLogs(user); break;
      case 'admin': pageContent = await renderAdminPanel(user); break;
      default: pageContent = await renderDashboard(user);
    }
  } catch(e) {
    console.error(e);
    pageContent = `<div class="content-area"><div class="error-panel"><span>⚠️</span><span>Error rendering page: ${e.message}</span></div></div>`;
  }

  app.innerHTML = `
    <div class="app-shell">
      ${renderSidebar(user)}
      <div class="main-content">
        ${renderTopbar(title, subtitle)}
        ${pageContent}
      </div>
    </div>`;
  
  attachPageHandlers();
}

async function loadBadgeCounts() {
  const { dbGetAll } = await import('./db.js');
  const matches = await dbGetAll('match_candidates');
  const pending = matches.filter(m => m.status === 'PENDING_REVIEW').length;
  appState.badgeCounts = { matches: pending, pending };
}

function attachLoginHandlers() {
  // Handled by login.js
}

function attachPageHandlers() {
  // Tab switching
  document.querySelectorAll('.tab-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const tabGroup = btn.dataset.tabGroup;
      const tabId = btn.dataset.tab;
      document.querySelectorAll(`.tab-btn[data-tab-group="${tabGroup}"]`).forEach(b => b.classList.remove('active'));
      document.querySelectorAll(`.tab-content[data-tab-group="${tabGroup}"]`).forEach(c => c.classList.remove('active'));
      btn.classList.add('active');
      const content = document.querySelector(`.tab-content[data-tab="${tabId}"][data-tab-group="${tabGroup}"]`);
      if (content) content.classList.add('active');
    });
  });
}

// ===== AUTH HANDLERS =====
window.handleLogin = async function(e) {
  e?.preventDefault();
  const username = document.getElementById('login-username')?.value?.trim();
  const password = document.getElementById('login-password')?.value;
  const btn = document.getElementById('login-btn');
  const errEl = document.getElementById('login-error');
  
  if (!username || !password) {
    if (errEl) errEl.textContent = 'Please enter username and password';
    return;
  }
  
  if (btn) { btn.disabled = true; btn.textContent = 'Signing in…'; }
  if (errEl) errEl.textContent = '';
  
  try {
    const { token, user } = await login(username, password);
    localStorage.setItem('samanvay_token', token);
    appState.currentPage = 'dashboard';
    showToast('Welcome back!', `Logged in as ${user.name}`, 'success');
    renderApp();
  } catch(err) {
    if (errEl) errEl.textContent = err.message;
    if (btn) { btn.disabled = false; btn.textContent = 'Sign In'; }
    showToast('Login failed', err.message, 'error');
  }
};

window.handleLogout = function() {
  logout();
  appState.currentUser = null;
  appState.currentPage = 'landing';
  showToast('Signed out', 'You have been logged out', 'info');
  renderApp();
};

window.fillDemoAccount = function(username, password) {
  const u = document.getElementById('login-username');
  const p = document.getElementById('login-password');
  if (u) u.value = username;
  if (p) p.value = password;
};

window.goToLogin = function() {
  appState.currentPage = 'login';
  renderApp();
};

window.goToLanding = function() {
  appState.currentPage = 'landing';
  renderApp();
};

window.goToVerify = function() {
  appState.currentPage = 'verify';
  renderApp();
};

// ===== INIT =====
async function init() {
  // Check hash for direct verify link
  const hash = window.location.hash;
  if (hash.startsWith('#verify/')) {
    appState.currentPage = 'verify';
  }
  
  // Seed DB on first load
  try {
    const result = await seedDatabase(false);
    if (result.success) console.log('✅ SAMANVAY demo database seeded:', result.counts);
  } catch(e) { console.warn('Seed warning:', e); }
  
  // Restore session
  const token = localStorage.getItem('samanvay_token');
  if (token) {
    const user = await verifyToken(token);
    if (user) {
      appState.currentUser = user;
      appState.currentPage = 'dashboard';
    }
  }
  
  renderApp();
}

// Handle browser back/forward
window.addEventListener('popstate', () => renderApp());
window.addEventListener('hashchange', () => renderApp());

init();
