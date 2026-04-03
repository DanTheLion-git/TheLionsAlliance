// ============================================================
// CONFIG
// ============================================================
let USERS = {
  'admin':          { password: 'Hondje01',    name: 'Admin',            isAdmin: true },
  'bob-linda':      { password: 'bobwed25',    name: 'Bob & Linda',      wedding: '15 March 2025' },
  'james-kim':      { password: 'kimwed25',    name: 'James & Kim',      wedding: '28 February 2025' },
  'suzie-nathasja': { password: 'suzwed26',    name: 'Suzie & Nathasja', wedding: '20 September 2026' },
  'demo':           { password: 'wedding2025', name: 'Sophie & Liam',    wedding: '12 April 2025' },
};

// Customer metadata (admin dashboard)
let CUSTOMERS = {
  'bob-linda':      { name: 'Bob & Linda',      weddingDate: '2025-03-15' },
  'james-kim':      { name: 'James & Kim',      weddingDate: '2025-02-28' },
  'suzie-nathasja': { name: 'Suzie & Nathasja', weddingDate: '2026-09-20' },
};

// Merge any dynamically approved users from localStorage
(function loadDynamicUsers() {
  try {
    const du = JSON.parse(localStorage.getItem('wcb_dynamic_users') || '{}');
    const dc = JSON.parse(localStorage.getItem('wcb_dynamic_customers') || '{}');
    Object.assign(USERS, du);
    Object.assign(CUSTOMERS, dc);
  } catch (_) {}
})();

// ============================================================
// EMAIL CONFIG — fill in after setting up emailjs.com (free)
// Steps:
//  1. Sign up at https://www.emailjs.com (free = 200 emails/month)
//  2. Add an Email Service (connect your Gmail / Outlook)
//  3. Create a Template with variables: {{to_email}}, {{to_name}},
//     {{couple_name}}, {{subject}}, {{message}}, {{gallery_link}}
//  4. Replace the placeholder strings below with your real IDs
// ============================================================
const EMAILJS_CONFIG = {
  serviceId:  'YOUR_SERVICE_ID',   // e.g. 'service_abc123'
  templateId: 'YOUR_TEMPLATE_ID',  // e.g. 'template_xyz789'
  publicKey:  'YOUR_PUBLIC_KEY',   // e.g. 'AbCdEfGh1234'
};

// ============================================================
// PLACEHOLDER PHOTOS
// ============================================================
const DEFAULT_PHOTOS = [
  { id:'p01', title:'Bouquet',           datetime:'2025-04-12T12:30:00', camera:'Camera 6',  thumb:'https://images.unsplash.com/photo-1524824267900-2b6ed4e51c17?w=500&q=75',  url:'https://images.unsplash.com/photo-1524824267900-2b6ed4e51c17?w=1200&q=85' },
  { id:'p02', title:'Bridal portrait',   datetime:'2025-04-12T13:00:00', camera:'Camera 2',  thumb:'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=500&q=75',  url:'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=85' },
  { id:'p03', title:'Champagne toast',   datetime:'2025-04-12T19:00:00', camera:'Camera 4',  thumb:'https://images.unsplash.com/photo-1478145046317-39761428de82?w=500&q=75',  url:'https://images.unsplash.com/photo-1478145046317-39761428de82?w=1200&q=85' },
  { id:'p04', title:'Dancing the night', datetime:'2025-04-12T21:00:00', camera:'Camera 10', thumb:'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=500&q=75',  url:'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=85' },
  { id:'p05', title:'Exchanging vows',   datetime:'2025-04-12T15:15:00', camera:'Camera 1',  thumb:'https://images.unsplash.com/photo-1529636162796-fe5e8d23c7e1?w=500&q=75',  url:'https://images.unsplash.com/photo-1529636162796-fe5e8d23c7e1?w=1200&q=85' },
  { id:'p06', title:'First dance',       datetime:'2025-04-12T20:15:00', camera:'Camera 1',  thumb:'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=75',  url:'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85' },
  { id:'p07', title:'Golden hour',       datetime:'2025-04-12T18:45:00', camera:'Camera 5',  thumb:'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=500&q=75',  url:'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1200&q=85' },
  { id:'p08', title:'Portrait together', datetime:'2025-04-12T17:30:00', camera:'Camera 3',  thumb:'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=500&q=75',  url:'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=1200&q=85' },
  { id:'p09', title:'Reception tables',  datetime:'2025-04-12T17:00:00', camera:'Camera 4',  thumb:'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=500&q=75',  url:'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=85' },
  { id:'p10', title:'The ceremony',      datetime:'2025-04-12T15:00:00', camera:'Camera 3',  thumb:'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&q=75',  url:'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=85' },
  { id:'p11', title:'The rings',         datetime:'2025-04-12T14:45:00', camera:'Camera 5',  thumb:'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=500&q=75',  url:'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=85' },
  { id:'p12', title:'The venue',         datetime:'2025-04-12T11:00:00', camera:'Camera 2',  thumb:'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=500&q=75',  url:'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=85' },
  { id:'p13', title:'The wedding party', datetime:'2025-04-12T16:30:00', camera:'Camera 8',  thumb:'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=500&q=75',  url:'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=1200&q=85' },
  { id:'p14', title:'Walking together',  datetime:'2025-04-12T16:00:00', camera:'Camera 7',  thumb:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&q=75',  url:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=85' },
  { id:'p15', title:'Wedding cake',      datetime:'2025-04-12T18:00:00', camera:'Camera 9',  thumb:'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=500&q=75',  url:'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=85' },
];

// ============================================================
// STATE
// ============================================================
let state = {
  user:           null,
  adminManaging:  null,   // username being managed by admin
  step:           1,
  photos:         [],
  recycleBin:     [],
  guests:         [],
  lightboxIdx:    -1,
  showBin:        false,
};

// ============================================================
// STORAGE
// ============================================================
const key  = s => `wcb_${state.user.username}_${s}`;
const save = (s, d) => localStorage.setItem(key(s), JSON.stringify(d));
const load = s => { try { const d = localStorage.getItem(key(s)); return d ? JSON.parse(d) : null; } catch { return null; } };

function saveAll() {
  save('photos',  state.photos);
  save('bin',     state.recycleBin);
  save('guests',  state.guests);
}

function loadUserData() {
  state.photos     = load('photos')  || DEFAULT_PHOTOS.map(p => ({ ...p }));
  state.recycleBin = load('bin')     || [];
  state.guests     = load('guests')  || [];
}

// ============================================================
// MOCK DATA — initialise 3 demo clients on first admin login
// ============================================================
function initMockData() {
  // Bob & Linda: all 15 photos + 5 guests + link sent
  if (!localStorage.getItem('wcb_bob-linda_photos')) {
    localStorage.setItem('wcb_bob-linda_photos',   JSON.stringify(DEFAULT_PHOTOS.map(p => ({ ...p }))));
    localStorage.setItem('wcb_bob-linda_guests',   JSON.stringify([
      { id:'g1', name:'Aunt Maria',    email:'maria@example.com' },
      { id:'g2', name:'Uncle Pete',    email:'pete@example.com'  },
      { id:'g3', name:'Sarah Johnson', email:'sarah@example.com' },
      { id:'g4', name:'Tom Williams',  email:'tom@example.com'   },
      { id:'g5', name:'Emma Brown',    email:'emma@example.com'  },
    ]));
    localStorage.setItem('wcb_bob-linda_linkSent',  'true');
    localStorage.setItem('wcb_bob-linda_bin',       JSON.stringify([]));
  }
  // James & Kim: 10 photos, no guests, no link
  if (!localStorage.getItem('wcb_james-kim_photos')) {
    localStorage.setItem('wcb_james-kim_photos',  JSON.stringify(DEFAULT_PHOTOS.slice(0, 10).map(p => ({ ...p }))));
    localStorage.setItem('wcb_james-kim_guests',  JSON.stringify([]));
    localStorage.setItem('wcb_james-kim_bin',     JSON.stringify([]));
  }
  // Suzie & Nathasja: future wedding, nothing yet
  if (!localStorage.getItem('wcb_suzie-nathasja_bin')) {
    localStorage.setItem('wcb_suzie-nathasja_photos',  JSON.stringify([]));
    localStorage.setItem('wcb_suzie-nathasja_guests',  JSON.stringify([]));
    localStorage.setItem('wcb_suzie-nathasja_bin',     JSON.stringify([]));
  }
}

// ============================================================
// AUTH
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();
  const saved = sessionStorage.getItem('wcb_session');
  if (saved) {
    const user = USERS[saved];
    if (user) { state.user = { username: saved, ...user }; routeAfterLogin(); return; }
  }
  document.getElementById('viewLogin').style.display = '';
});

document.getElementById('togglePw').addEventListener('click', function () {
  const pw = document.getElementById('loginPassword');
  const show = pw.type === 'password';
  pw.type = show ? 'text' : 'password';
  this.querySelector('i').setAttribute('data-lucide', show ? 'eye-off' : 'eye');
  lucide.createIcons({ nodes: [this] });
});

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  const user     = USERS[username];
  if (!user || user.password !== password) {
    errEl.textContent = 'Incorrect username or password.';
    errEl.classList.add('visible');
    return;
  }
  errEl.classList.remove('visible');
  state.user = { username, ...user };
  sessionStorage.setItem('wcb_session', username);
  routeAfterLogin();
});

function routeAfterLogin() {
  if (state.user.isAdmin) { launchAdmin(); }
  else                    { launchPortal(); }
}

document.getElementById('logoutBtn').addEventListener('click', doLogout);
document.getElementById('adminLogoutBtn').addEventListener('click', doLogout);
function doLogout() {
  sessionStorage.removeItem('wcb_session');
  location.reload();
}

// ============================================================
// ADMIN — DASHBOARD
// ============================================================
function launchAdmin() {
  initMockData();
  showView('admin');
  renderDashboard();
  lucide.createIcons();
}

function showView(v) {
  document.getElementById('viewLogin').style.display  = v === 'login'  ? '' : 'none';
  document.getElementById('viewAdmin').style.display  = v === 'admin'  ? '' : 'none';
  document.getElementById('viewPortal').style.display = v === 'portal' ? '' : 'none';
}

function renderDashboard() {
  const grid = document.getElementById('clientGrid');
  const emailOk = EMAILJS_CONFIG.serviceId !== 'YOUR_SERVICE_ID';
  document.getElementById('emailConfigWarning').style.display = emailOk ? 'none' : '';

  grid.innerHTML = Object.entries(CUSTOMERS).map(([uname, info]) => {
    const photos    = JSON.parse(localStorage.getItem(`wcb_${uname}_photos`)  || '[]');
    const guests    = JSON.parse(localStorage.getItem(`wcb_${uname}_guests`)  || '[]');
    const linkSent  = localStorage.getItem(`wcb_${uname}_linkSent`) === 'true';
    const wDate     = new Date(info.weddingDate);
    const today     = new Date(); today.setHours(0,0,0,0);
    const diffDays  = Math.round((today - wDate) / 86400000);
    const isFuture  = diffDays < 0;
    const dayLabel  = isFuture
      ? `In ${Math.abs(diffDays)} days`
      : diffDays === 0 ? 'Today!'
      : `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

    const photoStatus = photos.length > 0 ? 'done'    : isFuture ? 'future' : 'missing';
    const guestStatus = guests.length > 0 ? 'done'    : isFuture ? 'future' : 'missing';
    const sentStatus  = linkSent          ? 'done'    : isFuture ? 'future' : 'missing';

    const pill = (status, text) => {
      const icon  = status === 'done' ? 'check-circle' : status === 'future' ? 'clock' : 'circle';
      const cls   = `status-pill status-pill--${status}`;
      return `<span class="${cls}"><i data-lucide="${icon}"></i>${escHtml(text)}</span>`;
    };

    return `
      <div class="client-card" data-username="${uname}">
        <div class="client-card__head">
          <div>
            <h3 class="client-card__name">${escHtml(info.name)}</h3>
            <span class="client-card__date">${wDate.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</span>
          </div>
          <span class="client-card__days ${isFuture ? 'client-card__days--future' : ''}">${dayLabel}</span>
        </div>
        <div class="client-card__status">
          ${pill(photoStatus, photos.length > 0 ? `${photos.length} photos uploaded` : 'No photos yet')}
          ${pill(guestStatus, guests.length > 0 ? `${guests.length} guests added`    : 'No guests yet')}
          ${pill(sentStatus,  linkSent            ? 'Gallery link sent'               : 'Link not sent')}
        </div>
        <div class="client-card__actions">
          <button class="btn btn--primary btn--sm" onclick="enterCustomerPortal('${uname}')">
            <i data-lucide="layout-dashboard"></i> Manage portal
          </button>
          <button class="btn btn--ghost btn--sm" onclick="openUploadModal('${uname}')">
            <i data-lucide="upload"></i> Upload photos
          </button>
        </div>
      </div>`;
  }).join('');

  lucide.createIcons();
  updateRequestsBadge();
}

// ── Admin tab switching ──
function switchAdminTab(tab) {
  document.getElementById('panelClients').style.display  = tab === 'clients'  ? '' : 'none';
  document.getElementById('panelRequests').style.display = tab === 'requests' ? '' : 'none';
  document.getElementById('tabClients').classList.toggle('admin-tab--active',  tab === 'clients');
  document.getElementById('tabRequests').classList.toggle('admin-tab--active', tab === 'requests');
  if (tab === 'requests') renderRequests();
}

function updateRequestsBadge() {
  const requests = JSON.parse(localStorage.getItem('wcb_booking_requests') || '[]');
  const pending  = requests.filter(r => r.status === 'pending').length;
  const badge    = document.getElementById('requestsBadge');
  badge.style.display = pending > 0 ? '' : 'none';
  badge.textContent   = pending;
}

// ── Requests panel ──
function renderRequests() {
  const requests = JSON.parse(localStorage.getItem('wcb_booking_requests') || '[]');
  const list = document.getElementById('requestsList');

  if (requests.length === 0) {
    list.innerHTML = '<p class="requests-empty"><i data-lucide="inbox"></i> No booking requests yet. They will appear here when someone fills in the form on the homepage.</p>';
    lucide.createIcons({ nodes: [list] });
    return;
  }

  list.innerHTML = requests.slice().reverse().map(r => {
    const date = new Date(r.submittedAt).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
    const wDate = r.date ? new Date(r.date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }) : '—';
    const isPending  = r.status === 'pending';
    const isApproved = r.status === 'approved';
    const statusCls  = isPending ? 'status-pill--future' : isApproved ? 'status-pill--done' : 'status-pill--missing';
    const statusTxt  = isPending ? 'Pending' : isApproved ? 'Approved' : 'Declined';
    return `
      <div class="request-card ${isApproved ? 'request-card--approved' : ''}">
        <div class="request-card__head">
          <div>
            <h3 class="request-card__name">${escHtml(r.name)}</h3>
            <span class="request-card__meta">Submitted ${escHtml(date)}</span>
          </div>
          <span class="status-pill ${statusCls}">${statusTxt}</span>
        </div>
        <div class="request-card__info">
          <div class="request-info-row"><i data-lucide="mail"></i><a href="mailto:${escHtml(r.email)}">${escHtml(r.email)}</a></div>
          <div class="request-info-row"><i data-lucide="calendar"></i>${escHtml(wDate)}</div>
          <div class="request-info-row"><i data-lucide="package"></i>${escHtml(r.package || '—')}</div>
          ${r.guests ? `<div class="request-info-row"><i data-lucide="users"></i>${escHtml(r.guests)} guests (approx.)</div>` : ''}
          ${r.message ? `<div class="request-info-row request-info-row--message"><i data-lucide="message-square"></i><span>${escHtml(r.message)}</span></div>` : ''}
        </div>
        ${isPending ? `
        <div class="request-card__actions">
          <button class="btn btn--primary btn--sm" onclick="openApproveModal('${escHtml(r.id)}')">
            <i data-lucide="check"></i> Approve
          </button>
          <button class="btn btn--ghost btn--sm" onclick="declineRequest('${escHtml(r.id)}')">
            <i data-lucide="x"></i> Decline
          </button>
        </div>` : ''}
      </div>`;
  }).join('');

  lucide.createIcons({ nodes: [list] });
}

// ── Approve flow ──
let approveTargetId = null;

function openApproveModal(requestId) {
  const requests = JSON.parse(localStorage.getItem('wcb_booking_requests') || '[]');
  const req = requests.find(r => r.id === requestId);
  if (!req) return;
  approveTargetId = requestId;

  // Generate username from name: "Emma & James" → "emma-james"
  const suggested = req.name.toLowerCase().replace(/\s*&\s*/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
  document.getElementById('approveUsername').value = suggested || 'couple';
  document.getElementById('approvePassword').value = generatePassword();
  document.getElementById('approvePackage').value  = req.package || 'Standard';
  document.getElementById('approveModal').style.display = '';
  lucide.createIcons({ nodes: [document.getElementById('approveModal')] });
}

function generatePassword() {
  const chars = 'abcdefghjkmnpqrstuvwxyz23456789';
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

function regeneratePassword() {
  document.getElementById('approvePassword').value = generatePassword();
}

document.getElementById('approveModalClose').addEventListener('click',  () => { document.getElementById('approveModal').style.display = 'none'; });
document.getElementById('approveModalClose2').addEventListener('click', () => { document.getElementById('approveModal').style.display = 'none'; });

document.getElementById('approveConfirmBtn').addEventListener('click', () => {
  const username = document.getElementById('approveUsername').value.trim();
  const password = document.getElementById('approvePassword').value.trim();
  const pkg      = document.getElementById('approvePackage').value;
  if (!username || !password) { showToast('Username and password are required.', 'error'); return; }
  if (USERS[username]) { showToast(`Username "${username}" already exists. Choose a different one.`, 'error'); return; }

  const requests = JSON.parse(localStorage.getItem('wcb_booking_requests') || '[]');
  const req = requests.find(r => r.id === approveTargetId);
  if (!req) return;

  // Update request status
  req.status = 'approved';
  req.approvedUsername = username;
  localStorage.setItem('wcb_booking_requests', JSON.stringify(requests));

  // Create user + customer in memory
  const weddingDateFormatted = req.date
    ? new Date(req.date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
    : '';
  const newUser     = { password, name: req.name, wedding: weddingDateFormatted };
  const newCustomer = { name: req.name, weddingDate: req.date || '', package: pkg };
  USERS[username]     = newUser;
  CUSTOMERS[username] = newCustomer;

  // Persist dynamic users/customers to localStorage
  const dynUsers = JSON.parse(localStorage.getItem('wcb_dynamic_users')     || '{}');
  const dynCusts = JSON.parse(localStorage.getItem('wcb_dynamic_customers') || '{}');
  dynUsers[username] = newUser;
  dynCusts[username] = newCustomer;
  localStorage.setItem('wcb_dynamic_users',     JSON.stringify(dynUsers));
  localStorage.setItem('wcb_dynamic_customers', JSON.stringify(dynCusts));

  // Initialise empty photo/guest/bin storage for the new client
  if (!localStorage.getItem(`wcb_${username}_photos`)) {
    localStorage.setItem(`wcb_${username}_photos`, JSON.stringify([]));
    localStorage.setItem(`wcb_${username}_guests`, JSON.stringify([]));
    localStorage.setItem(`wcb_${username}_bin`,    JSON.stringify([]));
  }

  document.getElementById('approveModal').style.display = 'none';
  approveTargetId = null;
  updateRequestsBadge();
  renderRequests();
  showToast(`Account created for ${req.name}. Username: ${username} / Password: ${password}`, 'success');
});

function declineRequest(requestId) {
  if (!confirm('Decline this booking request?')) return;
  const requests = JSON.parse(localStorage.getItem('wcb_booking_requests') || '[]');
  const req = requests.find(r => r.id === requestId);
  if (req) { req.status = 'declined'; localStorage.setItem('wcb_booking_requests', JSON.stringify(requests)); }
  updateRequestsBadge();
  renderRequests();
}

// ── Enter a customer's portal as admin ──
function enterCustomerPortal(username) {
  state.adminManaging = username;
  state.user = { username, ...USERS[username] };
  launchPortal();
  document.getElementById('adminBanner').style.display = '';
  document.getElementById('adminBannerName').textContent = CUSTOMERS[username].name;
}

document.getElementById('adminBannerBack').addEventListener('click', () => {
  state.adminManaging = null;
  state.user = { username: 'admin', ...USERS['admin'] };
  showView('admin');
  renderDashboard();
});

// ── Upload modal ──
let uploadTargetUser = null;
let pendingFiles = [];

function openUploadModal(username) {
  uploadTargetUser = username;
  pendingFiles = [];
  document.getElementById('uploadPreviewGrid').innerHTML = '';
  document.getElementById('uploadConfirmBtn').disabled = true;
  document.getElementById('uploadStatus').textContent = 'No files selected.';
  document.getElementById('uploadModal').style.display = '';
}

document.getElementById('uploadModalClose').addEventListener('click', () => {
  document.getElementById('uploadModal').style.display = 'none';
});
document.getElementById('uploadBrowseBtn').addEventListener('click', () => {
  document.getElementById('uploadFileInput').click();
});

document.getElementById('uploadFileInput').addEventListener('change', function () {
  pendingFiles = Array.from(this.files);
  const grid = document.getElementById('uploadPreviewGrid');
  grid.innerHTML = '';
  pendingFiles.forEach(file => {
    const url = URL.createObjectURL(file);
    const img = document.createElement('img');
    img.src = url;
    img.className = 'upload-thumb';
    img.alt = file.name;
    grid.appendChild(img);
  });
  document.getElementById('uploadStatus').textContent =
    `${pendingFiles.length} file${pendingFiles.length !== 1 ? 's' : ''} selected.`;
  document.getElementById('uploadConfirmBtn').disabled = pendingFiles.length === 0;
});

document.getElementById('uploadConfirmBtn').addEventListener('click', () => {
  if (!pendingFiles.length) return;
  const existing = JSON.parse(localStorage.getItem(`wcb_${uploadTargetUser}_photos`) || '[]');
  const newPhotos = pendingFiles.map((file, i) => ({
    id:       'up_' + Date.now() + '_' + i,
    title:    file.name.replace(/\.[^.]+$/, ''),
    datetime: new Date().toISOString(),
    camera:   'Uploaded',
    url:      URL.createObjectURL(file),
    thumb:    URL.createObjectURL(file),
  }));
  localStorage.setItem(`wcb_${uploadTargetUser}_photos`, JSON.stringify([...existing, ...newPhotos]));
  document.getElementById('uploadModal').style.display = 'none';
  pendingFiles = [];
  renderDashboard();
  showToast(`${newPhotos.length} photo${newPhotos.length !== 1 ? 's' : ''} added to ${CUSTOMERS[uploadTargetUser].name}'s gallery (this session only — backend needed for permanent storage).`, 'success');
});

// ============================================================
// PORTAL — LAUNCH
// ============================================================
function launchPortal() {
  loadUserData();
  showView('portal');
  document.getElementById('headerName').textContent = state.user.name;
  goToStep(1);
  lucide.createIcons();
}

// ============================================================
// STEPPER / NAVIGATION
// ============================================================
function goToStep(n) {
  state.step = n;
  document.querySelectorAll('.stepper__item').forEach(el => {
    const s = +el.dataset.step;
    el.classList.toggle('stepper__item--active',    s === n);
    el.classList.toggle('stepper__item--completed', s < n);
  });
  for (let i = 1; i <= 3; i++) {
    document.getElementById('panel' + i).style.display = i === n ? '' : 'none';
  }
  const prevBtn = document.getElementById('prevBtn');
  const nextBtn = document.getElementById('nextBtn');
  prevBtn.disabled = n === 1;
  if (n === 3) {
    nextBtn.style.display = 'none';
  } else {
    nextBtn.style.display = '';
    nextBtn.innerHTML = n === 1
      ? 'Next: Add Guests <i data-lucide="arrow-right"></i>'
      : 'Next: Send Gallery <i data-lucide="arrow-right"></i>';
  }
  if (n === 1) renderPhotos();
  if (n === 2) renderGuests();
  if (n === 3) renderSendStep();
  lucide.createIcons();
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

document.getElementById('prevBtn').addEventListener('click', () => goToStep(state.step - 1));
document.getElementById('nextBtn').addEventListener('click', () => goToStep(state.step + 1));

// ============================================================
// STEP 1 — PHOTOS
// ============================================================
function renderPhotos() {
  const grid  = document.getElementById('photoGrid');
  const empty = document.getElementById('galleryEmpty');
  const badge = document.getElementById('binBadge');
  const label = document.getElementById('photoCountLabel');
  const sorted = [...state.photos].sort((a, b) => a.title.localeCompare(b.title));

  label.textContent   = `${sorted.length} photo${sorted.length !== 1 ? 's' : ''}`;
  badge.textContent   = state.recycleBin.length;
  badge.style.display = state.recycleBin.length ? '' : 'none';
  empty.style.display = sorted.length ? 'none' : '';
  grid.style.display  = sorted.length ? ''     : 'none';

  grid.innerHTML = sorted.map(p => `
    <div class="photo-card" data-id="${p.id}">
      <div class="photo-card__img-wrap">
        <img src="${p.thumb}" alt="${escHtml(p.title)}" loading="lazy" />
        <div class="photo-card__overlay">
          <button class="photo-card__view-btn" data-id="${p.id}"><i data-lucide="eye"></i> View</button>
        </div>
        <button class="photo-card__delete" data-id="${p.id}" title="Move to recycle bin">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
      <div class="photo-card__info">
        <span class="photo-card__title">${escHtml(p.title)}</span>
        <span class="photo-card__meta">${escHtml(p.camera)} &middot; ${formatDt(p.datetime)}</span>
      </div>
    </div>`).join('');

  grid.querySelectorAll('.photo-card__view-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const ids = [...state.photos].sort((a,b) => a.title.localeCompare(b.title)).map(p => p.id);
      openLightbox(ids.indexOf(btn.dataset.id));
    });
  });
  grid.querySelectorAll('.photo-card__delete').forEach(btn => {
    btn.addEventListener('click', e => { e.stopPropagation(); moveToBin(btn.dataset.id); });
  });
  grid.querySelectorAll('.photo-card__img-wrap img').forEach(img => {
    img.addEventListener('click', () => {
      const ids = [...state.photos].sort((a,b) => a.title.localeCompare(b.title)).map(p => p.id);
      openLightbox(ids.indexOf(img.closest('.photo-card').dataset.id));
    });
  });
  lucide.createIcons();
}

document.getElementById('recycleBinBtn').addEventListener('click', () => {
  state.showBin = !state.showBin;
  document.getElementById('recycleBin').style.display = state.showBin ? '' : 'none';
  if (state.showBin) renderBin();
});
document.getElementById('closeBinBtn').addEventListener('click', () => {
  state.showBin = false;
  document.getElementById('recycleBin').style.display = 'none';
});
document.getElementById('emptyBinBtn').addEventListener('click', () => {
  if (!state.recycleBin.length) return;
  if (!confirm(`Permanently delete all ${state.recycleBin.length} photos? This cannot be undone.`)) return;
  state.recycleBin = [];
  saveAll(); renderBin(); renderPhotos();
  showToast('Recycle bin emptied.', 'info');
});

function moveToBin(id) {
  const idx = state.photos.findIndex(p => p.id === id);
  if (idx === -1) return;
  state.recycleBin.push(state.photos.splice(idx, 1)[0]);
  saveAll(); renderPhotos();
  if (state.showBin) renderBin();
  showToast('Photo moved to recycle bin.', 'info');
}

function renderBin() {
  const grid  = document.getElementById('binGrid');
  const empty = document.getElementById('binEmpty');
  empty.style.display = state.recycleBin.length ? 'none' : '';
  grid.style.display  = state.recycleBin.length ? ''     : 'none';
  grid.innerHTML = state.recycleBin.map(p => `
    <div class="photo-card photo-card--bin" data-id="${p.id}">
      <div class="photo-card__img-wrap">
        <img src="${p.thumb}" alt="${escHtml(p.title)}" loading="lazy" />
      </div>
      <div class="photo-card__info">
        <span class="photo-card__title">${escHtml(p.title)}</span>
        <span class="photo-card__meta">${escHtml(p.camera)}</span>
        <div class="bin-actions">
          <button class="bin-btn bin-btn--restore" data-id="${p.id}"><i data-lucide="rotate-ccw"></i> Restore</button>
          <button class="bin-btn bin-btn--delete"  data-id="${p.id}"><i data-lucide="trash"></i></button>
        </div>
      </div>
    </div>`).join('');
  grid.querySelectorAll('.bin-btn--restore').forEach(btn => btn.addEventListener('click', () => restorePhoto(btn.dataset.id)));
  grid.querySelectorAll('.bin-btn--delete').forEach(btn  => btn.addEventListener('click', () => permanentDelete(btn.dataset.id)));
  lucide.createIcons();
}

function restorePhoto(id) {
  const idx = state.recycleBin.findIndex(p => p.id === id);
  if (idx === -1) return;
  state.photos.push(state.recycleBin.splice(idx, 1)[0]);
  saveAll(); renderBin(); renderPhotos();
  showToast('Photo restored.', 'success');
}
function permanentDelete(id) {
  if (!confirm('Permanently delete this photo? This cannot be undone.')) return;
  state.recycleBin = state.recycleBin.filter(p => p.id !== id);
  saveAll(); renderBin(); renderPhotos();
  showToast('Photo permanently deleted.', 'info');
}

// ============================================================
// LIGHTBOX
// ============================================================
function openLightbox(sortedIdx) {
  const sorted = [...state.photos].sort((a,b) => a.title.localeCompare(b.title));
  if (sortedIdx < 0 || sortedIdx >= sorted.length) return;
  state.lightboxIdx = sortedIdx;
  const p = sorted[sortedIdx];
  document.getElementById('lightboxImg').src           = p.url;
  document.getElementById('lightboxImg').alt           = p.title;
  document.getElementById('lightboxTitle').textContent = p.title;
  document.getElementById('lightboxInfo').textContent  = `${p.camera} \u00b7 ${formatDt(p.datetime)}`;
  document.getElementById('lightbox').style.display    = 'flex';
  document.body.style.overflow = 'hidden';
}
function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
  document.body.style.overflow = '';
  state.lightboxIdx = -1;
}
document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
document.getElementById('lightboxBg').addEventListener('click',    closeLightbox);
document.getElementById('lightboxPrev').addEventListener('click',  () => {
  const sorted = [...state.photos].sort((a,b) => a.title.localeCompare(b.title));
  openLightbox((state.lightboxIdx - 1 + sorted.length) % sorted.length);
});
document.getElementById('lightboxNext').addEventListener('click',  () => {
  const sorted = [...state.photos].sort((a,b) => a.title.localeCompare(b.title));
  openLightbox((state.lightboxIdx + 1) % sorted.length);
});
document.addEventListener('keydown', e => {
  if (document.getElementById('lightbox').style.display === 'none') return;
  if (e.key === 'Escape')     closeLightbox();
  if (e.key === 'ArrowLeft')  document.getElementById('lightboxPrev').click();
  if (e.key === 'ArrowRight') document.getElementById('lightboxNext').click();
});

// ============================================================
// STEP 2 — GUESTS
// ============================================================
function renderGuests() {
  const list  = document.getElementById('guestList');
  const empty = document.getElementById('guestEmpty');
  const badge = document.getElementById('guestCountBadge');
  badge.textContent   = `${state.guests.length} guest${state.guests.length !== 1 ? 's' : ''}`;
  empty.style.display = state.guests.length ? 'none' : '';
  list.innerHTML = state.guests.map(g => `
    <div class="guest-item" data-id="${g.id}">
      <div class="guest-item__info">
        <span class="guest-item__name">${escHtml(g.name || g.email)}</span>
        ${g.name ? `<span class="guest-item__email">${escHtml(g.email)}</span>` : ''}
      </div>
      <button class="guest-item__remove" data-id="${g.id}" aria-label="Remove">
        <i data-lucide="x"></i>
      </button>
    </div>`).join('');
  list.querySelectorAll('.guest-item__remove').forEach(btn =>
    btn.addEventListener('click', () => removeGuest(btn.dataset.id)));
  lucide.createIcons();
}

document.getElementById('guestForm').addEventListener('submit', e => {
  e.preventDefault();
  const name  = document.getElementById('guestName').value.trim();
  const email = document.getElementById('guestEmail').value.trim();
  const errEl = document.getElementById('guestError');
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errEl.textContent = 'Please enter a valid email address.'; return;
  }
  if (state.guests.some(g => g.email.toLowerCase() === email.toLowerCase())) {
    errEl.textContent = 'This email is already in your list.'; return;
  }
  errEl.textContent = '';
  state.guests.push({ id: 'g' + Date.now(), name, email });
  saveAll(); renderGuests();
  document.getElementById('guestName').value  = '';
  document.getElementById('guestEmail').value = '';
  document.getElementById('guestEmail').focus();
});
function removeGuest(id) {
  state.guests = state.guests.filter(g => g.id !== id);
  saveAll(); renderGuests();
}

// ============================================================
// STEP 3 — SEND VIA EMAILJS (or mailto fallback)
// ============================================================
function renderSendStep() {
  const toEl    = document.getElementById('emailTo');
  const hintEl  = document.getElementById('sendHint');
  const sendBtn = document.getElementById('sendBtn');
  const emailOk = EMAILJS_CONFIG.serviceId !== 'YOUR_SERVICE_ID';

  // EmailJS config notice in step 3
  document.getElementById('emailjsNotice').style.display = emailOk ? 'none' : '';

  if (state.guests.length === 0) {
    toEl.innerHTML     = '<span class="email-field-placeholder">&mdash; no guests added yet &mdash;</span>';
    hintEl.textContent = 'Add guests in step 2 before sending.';
    sendBtn.disabled   = true;
  } else {
    toEl.innerHTML = state.guests.map(g =>
      `<span class="email-chip">${escHtml(g.name || g.email)}</span>`).join('');
    hintEl.textContent = `Will send to ${state.guests.length} guest${state.guests.length !== 1 ? 's' : ''}.`;
    sendBtn.disabled   = false;
  }
  updatePreview();
  lucide.createIcons();
}

function updatePreview() {
  const body = document.getElementById('emailBody');
  if (body) document.getElementById('previewBody').innerHTML = body.innerHTML;
}
document.querySelectorAll('.fmt-btn').forEach(btn => {
  btn.addEventListener('mousedown', e => {
    e.preventDefault();
    document.execCommand(btn.dataset.cmd, false, null);
    updatePreview();
  });
});
document.getElementById('emailBody').addEventListener('input', updatePreview);

document.getElementById('sendBtn').addEventListener('click', async () => {
  const subject     = document.getElementById('emailSubject').value;
  const bodyText    = document.getElementById('emailBody').innerText;
  const bodyHTML    = document.getElementById('emailBody').innerHTML;
  const galleryLink = 'https://thelionsalliance.com/wedding/photoportal/';
  const emailOk     = EMAILJS_CONFIG.serviceId !== 'YOUR_SERVICE_ID';

  if (emailOk) {
    await sendViaEmailJS(subject, bodyText, bodyHTML, galleryLink);
  } else {
    sendViaMailto(subject, bodyText, galleryLink);
  }
});

async function sendViaEmailJS(subject, bodyText, bodyHTML, galleryLink) {
  const sendBtn = document.getElementById('sendBtn');
  const hintEl  = document.getElementById('sendHint');
  sendBtn.disabled = true;
  sendBtn.innerHTML = '<i data-lucide="loader"></i> Sending…';
  lucide.createIcons();

  emailjs.init(EMAILJS_CONFIG.publicKey);
  let ok = 0, fail = 0;

  for (const guest of state.guests) {
    try {
      await emailjs.send(EMAILJS_CONFIG.serviceId, EMAILJS_CONFIG.templateId, {
        to_email:     guest.email,
        to_name:      guest.name || guest.email,
        couple_name:  state.user.name,
        subject:      subject,
        message:      bodyText,
        message_html: bodyHTML,
        gallery_link: galleryLink,
      });
      ok++;
    } catch (err) {
      console.error('EmailJS failed for', guest.email, err);
      fail++;
    }
  }

  // Mark link as sent
  localStorage.setItem(key('linkSent'), 'true');
  sendBtn.disabled = false;
  sendBtn.innerHTML = '<i data-lucide="send"></i> Send to all guests';
  lucide.createIcons();

  if (fail === 0) {
    showToast(`Gallery link sent to all ${ok} guests!`, 'success');
    hintEl.textContent = `Sent to ${ok} guest${ok !== 1 ? 's' : ''} \u2713`;
  } else {
    showToast(`Sent to ${ok} guests. ${fail} failed — check the console.`, 'info');
  }
}

function sendViaMailto(subject, bodyText, galleryLink) {
  const fullBody = bodyText + '\n\nView & download your photos:\n' + galleryLink;
  const bcc = state.guests.map(g => g.email).join(',');
  window.location.href =
    'mailto:?bcc=' + encodeURIComponent(bcc) +
    '&subject='    + encodeURIComponent(subject) +
    '&body='       + encodeURIComponent(fullBody);
  localStorage.setItem(key('linkSent'), 'true');
  showToast('Opening your email client with all guests pre-filled.', 'info');
}

// ============================================================
// HELPERS
// ============================================================
function formatDt(dt) {
  if (!dt) return '';
  const d = new Date(dt);
  return d.toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric' })
    + ' ' + d.toLocaleTimeString('en-GB', { hour:'2-digit', minute:'2-digit' });
}
function escHtml(str) {
  return String(str)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;')
    .replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}

// ============================================================
// TOASTS
// ============================================================
function showToast(msg, type = 'info') {
  const c = document.getElementById('toastContainer');
  const t = document.createElement('div');
  t.className = `toast toast--${type}`;
  t.textContent = msg;
  c.appendChild(t);
  requestAnimationFrame(() => t.classList.add('toast--visible'));
  setTimeout(() => {
    t.classList.remove('toast--visible');
    t.addEventListener('transitionend', () => t.remove(), { once: true });
  }, 4000);
}