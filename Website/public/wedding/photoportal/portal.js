// ============================================================
// CONFIG
// ============================================================
const SUPABASE_URL = 'https://zxiwsjjvigrxrgkxalet.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp4aXdzamp2aWdyeHJna3hhbGV0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY2Mjg1MjAsImV4cCI6MjA5MjIwNDUyMH0.fHD7jp7tfDmLbQe-ZqJfNiHyri_0y_5P9jHoQcuK0JY';

const CLOUDINARY_CONFIG = {
  cloudName:    'ds6l7rprf',
  uploadPreset: 'WeddingCamBox_Upload',
};

const EMAILJS_CONFIG = {
  serviceId:  'service_eoosuj2',
  templateId: 'template_don7795',
  publicKey:  'uMloEc253wEBd3sba',
};

// ============================================================
// SUPABASE REST HELPER
// ============================================================
const db = {
  _headers(extra = {}) {
    return {
      'apikey':        SUPABASE_KEY,
      'Authorization': `Bearer ${SUPABASE_KEY}`,
      'Content-Type':  'application/json',
      ...extra,
    };
  },

  async get(table, query = '') {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      headers: this._headers(),
    });
    if (!res.ok) throw new Error(`GET ${table} failed: ${res.status}`);
    return res.json();
  },

  async insert(table, body, extra = {}) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method:  'POST',
      headers: this._headers({ 'Prefer': 'return=representation', ...extra }),
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`INSERT ${table} failed: ${res.status}`);
    return res.json();
  },

  async upsert(table, body) {
    return this.insert(table, body, { 'Prefer': 'return=representation,resolution=merge-duplicates' });
  },

  async update(table, query, body) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      method:  'PATCH',
      headers: this._headers({ 'Prefer': 'return=representation' }),
      body:    JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`UPDATE ${table} failed: ${res.status}`);
    return res.json();
  },

  async delete(table, query) {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}?${query}`, {
      method:  'DELETE',
      headers: this._headers(),
    });
    if (!res.ok) throw new Error(`DELETE ${table} failed: ${res.status}`);
    return true;
  },
};

// ============================================================
// STATE
// ============================================================
let state = {
  user:           null,
  adminManaging:  null,
  step:           1,
  photos:         [],
  recycleBin:     [],
  guests:         [],
  lightboxIdx:    -1,
  showBin:        false,
};

// ============================================================
// DATA LOADING (Supabase)
// ============================================================
async function loadUserData() {
  const username = state.user.username;
  try {
    const [photos, binPhotos, guests] = await Promise.all([
      db.get('wcb_photos', `client_id=eq.${encodeURIComponent(username)}&deleted=eq.false&select=*`),
      db.get('wcb_photos', `client_id=eq.${encodeURIComponent(username)}&deleted=eq.true&select=*`),
      db.get('wcb_guests', `client_id=eq.${encodeURIComponent(username)}&select=*`),
    ]);
    state.photos     = photos.map(p => ({ id: p.id, title: p.title, datetime: p.datetime, camera: p.camera, url: p.url, thumb: p.thumb }));
    state.recycleBin = binPhotos.map(p => ({ id: p.id, title: p.title, datetime: p.datetime, camera: p.camera, url: p.url, thumb: p.thumb }));
    state.guests     = guests.map(g => ({ id: g.id, name: g.name, email: g.email }));
  } catch (err) {
    console.error('Failed to load user data:', err);
    showToast('Failed to load data. Please try again.', 'error');
    state.photos = [];
    state.recycleBin = [];
    state.guests = [];
  }
}

// ============================================================
// AUTH
// ============================================================
window.addEventListener('DOMContentLoaded', async () => {
  lucide.createIcons();
  const saved = sessionStorage.getItem('wcb_session');
  if (saved) {
    try {
      const rows = await db.get('wcb_clients', `id=eq.${encodeURIComponent(saved)}&select=*`);
      if (rows.length === 1) {
        const c = rows[0];
        state.user = {
          username: c.id,
          password: c.password,
          name:     c.name,
          wedding:  c.wedding,
          isAdmin:  c.is_admin,
        };
        await routeAfterLogin();
        return;
      }
    } catch (err) {
      console.error('Session restore failed:', err);
    }
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

document.getElementById('loginForm').addEventListener('submit', async function (e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  try {
    const rows = await db.get('wcb_clients', `id=eq.${encodeURIComponent(username)}&select=*`);
    if (rows.length === 0 || rows[0].password !== password) {
      errEl.textContent = 'Incorrect username or password.';
      errEl.classList.add('visible');
      return;
    }
    const c = rows[0];
    errEl.classList.remove('visible');
    state.user = {
      username: c.id,
      password: c.password,
      name:     c.name,
      wedding:  c.wedding,
      isAdmin:  c.is_admin,
    };
    sessionStorage.setItem('wcb_session', username);
    await routeAfterLogin();
  } catch (err) {
    console.error('Login error:', err);
    errEl.textContent = 'Connection error. Please try again.';
    errEl.classList.add('visible');
  }
});

async function routeAfterLogin() {
  if (state.user.isAdmin) { await launchAdmin(); }
  else                    { await launchPortal(); }
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
async function launchAdmin() {
  showView('admin');
  await renderDashboard();
  lucide.createIcons();
}

function showView(v) {
  document.getElementById('viewLogin').style.display  = v === 'login'  ? '' : 'none';
  document.getElementById('viewAdmin').style.display  = v === 'admin'  ? '' : 'none';
  document.getElementById('viewPortal').style.display = v === 'portal' ? '' : 'none';
}

async function renderDashboard() {
  const grid = document.getElementById('clientGrid');
  const emailOk = EMAILJS_CONFIG.serviceId !== 'YOUR_SERVICE_ID';
  document.getElementById('emailConfigWarning').style.display = emailOk ? 'none' : '';

  try {
    const [clients, allPhotos, allGuests, allStates] = await Promise.all([
      db.get('wcb_clients', 'is_admin=eq.false&select=*'),
      db.get('wcb_photos',  'deleted=eq.false&select=id,client_id'),
      db.get('wcb_guests',  'select=id,client_id'),
      db.get('wcb_client_state', 'select=*'),
    ]);

    const photoCounts = {};
    allPhotos.forEach(p => { photoCounts[p.client_id] = (photoCounts[p.client_id] || 0) + 1; });
    const guestCounts = {};
    allGuests.forEach(g => { guestCounts[g.client_id] = (guestCounts[g.client_id] || 0) + 1; });
    const stateMap = {};
    allStates.forEach(s => { stateMap[s.client_id] = s; });

    grid.innerHTML = clients.map(c => {
      const photoCount = photoCounts[c.id] || 0;
      const guestCount = guestCounts[c.id] || 0;
      const linkSent   = stateMap[c.id] && stateMap[c.id].link_sent === true;
      const wDate      = new Date(c.wedding_date);
      const today      = new Date(); today.setHours(0,0,0,0);
      const diffDays   = Math.round((today - wDate) / 86400000);
      const isFuture   = diffDays < 0;
      const dayLabel   = isFuture
        ? `In ${Math.abs(diffDays)} days`
        : diffDays === 0 ? 'Today!'
        : `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;

      const photoStatus = photoCount > 0 ? 'done' : isFuture ? 'future' : 'missing';
      const guestStatus = guestCount > 0 ? 'done' : isFuture ? 'future' : 'missing';
      const sentStatus  = linkSent       ? 'done' : isFuture ? 'future' : 'missing';

      const pill = (status, text) => {
        const icon = status === 'done' ? 'check-circle' : status === 'future' ? 'clock' : 'circle';
        const cls  = `status-pill status-pill--${status}`;
        return `<span class="${cls}"><i data-lucide="${icon}"></i>${escHtml(text)}</span>`;
      };

      return `
        <div class="client-card" data-username="${c.id}">
          <div class="client-card__head">
            <div>
              <h3 class="client-card__name">${escHtml(c.name)}</h3>
              <span class="client-card__date">${wDate.toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })}</span>
            </div>
            <span class="client-card__days ${isFuture ? 'client-card__days--future' : ''}">${dayLabel}</span>
          </div>
          <div class="client-card__status">
            ${pill(photoStatus, photoCount > 0 ? `${photoCount} photos uploaded` : 'No photos yet')}
            ${pill(guestStatus, guestCount > 0 ? `${guestCount} guests added`    : 'No guests yet')}
            ${pill(sentStatus,  linkSent        ? 'Gallery link sent'             : 'Link not sent')}
          </div>
          <div class="client-card__actions">
            <button class="btn btn--primary btn--sm" onclick="enterCustomerPortal('${c.id}')">
              <i data-lucide="layout-dashboard"></i> Manage portal
            </button>
            <button class="btn btn--ghost btn--sm" onclick="openUploadModal('${c.id}')">
              <i data-lucide="upload"></i> Upload photos
            </button>
          </div>
        </div>`;
    }).join('');

    lucide.createIcons();
    await updateRequestsBadge();
  } catch (err) {
    console.error('Dashboard load failed:', err);
    grid.innerHTML = '<p style="padding:2rem;color:var(--danger)">Failed to load clients. Please refresh.</p>';
  }
}

// ── Admin tab switching ──
function switchAdminTab(tab) {
  document.getElementById('panelClients').style.display  = tab === 'clients'  ? '' : 'none';
  document.getElementById('panelRequests').style.display = tab === 'requests' ? '' : 'none';
  document.getElementById('tabClients').classList.toggle('admin-tab--active',  tab === 'clients');
  document.getElementById('tabRequests').classList.toggle('admin-tab--active', tab === 'requests');
  if (tab === 'requests') renderRequests();
}

async function updateRequestsBadge() {
  try {
    const requests = await db.get('wcb_booking_requests', 'status=eq.pending&select=id');
    const pending  = requests.length;
    const badge    = document.getElementById('requestsBadge');
    badge.style.display = pending > 0 ? '' : 'none';
    badge.textContent   = pending;
  } catch (err) {
    console.error('Badge update failed:', err);
  }
}

// ── Requests panel ──
async function renderRequests() {
  const list = document.getElementById('requestsList');
  try {
    const requests = await db.get('wcb_booking_requests', 'select=*&order=submitted_at.desc');

    if (requests.length === 0) {
      list.innerHTML = '<p class="requests-empty"><i data-lucide="inbox"></i> No booking requests yet. They will appear here when someone fills in the form on the homepage.</p>';
      lucide.createIcons({ nodes: [list] });
      return;
    }

    list.innerHTML = requests.map(r => {
      const date = new Date(r.submitted_at).toLocaleDateString('en-GB', { day:'numeric', month:'short', year:'numeric', hour:'2-digit', minute:'2-digit' });
      const wDate = r.wedding_date ? new Date(r.wedding_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' }) : '—';
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
  } catch (err) {
    console.error('Render requests failed:', err);
    list.innerHTML = '<p style="padding:1rem;color:var(--danger)">Failed to load requests.</p>';
  }
}

// ── Approve flow ──
let approveTargetId = null;

async function openApproveModal(requestId) {
  try {
    const rows = await db.get('wcb_booking_requests', `id=eq.${encodeURIComponent(requestId)}&select=*`);
    if (rows.length === 0) return;
    const req = rows[0];
    approveTargetId = requestId;

    const suggested = req.name.toLowerCase().replace(/\s*&\s*/g, '-').replace(/[^a-z0-9-]/g, '').replace(/-+/g, '-').replace(/^-|-$/g, '');
    document.getElementById('approveUsername').value = suggested || 'couple';
    document.getElementById('approvePassword').value = generatePassword();
    document.getElementById('approvePackage').value  = req.package || 'Standard';
    document.getElementById('approveModal').style.display = '';
    lucide.createIcons({ nodes: [document.getElementById('approveModal')] });
  } catch (err) {
    console.error('Open approve modal failed:', err);
    showToast('Failed to load request details.', 'error');
  }
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

document.getElementById('approveConfirmBtn').addEventListener('click', async () => {
  const username = document.getElementById('approveUsername').value.trim();
  const password = document.getElementById('approvePassword').value.trim();
  const pkg      = document.getElementById('approvePackage').value;
  if (!username || !password) { showToast('Username and password are required.', 'error'); return; }

  try {
    // Check if username already exists
    const existing = await db.get('wcb_clients', `id=eq.${encodeURIComponent(username)}&select=id`);
    if (existing.length > 0) { showToast(`Username "${username}" already exists. Choose a different one.`, 'error'); return; }

    // Fetch the request
    const rows = await db.get('wcb_booking_requests', `id=eq.${encodeURIComponent(approveTargetId)}&select=*`);
    if (rows.length === 0) return;
    const req = rows[0];

    // Update request status
    await db.update('wcb_booking_requests', `id=eq.${encodeURIComponent(approveTargetId)}`, { status: 'approved' });

    // Create the new client
    const weddingDateFormatted = req.wedding_date
      ? new Date(req.wedding_date).toLocaleDateString('en-GB', { day:'numeric', month:'long', year:'numeric' })
      : '';
    await db.insert('wcb_clients', {
      id:           username,
      password:     password,
      name:         req.name,
      wedding:      weddingDateFormatted,
      wedding_date: req.wedding_date || null,
      package:      pkg,
      is_admin:     false,
    });

    // Create initial client state
    await db.upsert('wcb_client_state', {
      client_id: username,
      link_sent: false,
      sent_at:   null,
    });

    document.getElementById('approveModal').style.display = 'none';
    approveTargetId = null;
    await updateRequestsBadge();
    await renderRequests();
    await renderDashboard();
    showToast(`Account created for ${req.name}. Username: ${username} / Password: ${password}`, 'success');
  } catch (err) {
    console.error('Approve failed:', err);
    showToast('Failed to approve request. Please try again.', 'error');
  }
});

async function declineRequest(requestId) {
  if (!confirm('Decline this booking request?')) return;
  try {
    await db.update('wcb_booking_requests', `id=eq.${encodeURIComponent(requestId)}`, { status: 'declined' });
    await updateRequestsBadge();
    await renderRequests();
  } catch (err) {
    console.error('Decline failed:', err);
    showToast('Failed to decline request.', 'error');
  }
}

// ── Enter a customer's portal as admin ──
async function enterCustomerPortal(username) {
  try {
    const rows = await db.get('wcb_clients', `id=eq.${encodeURIComponent(username)}&select=*`);
    if (rows.length === 0) { showToast('Client not found.', 'error'); return; }
    const c = rows[0];
    state.adminManaging = username;
    state.user = {
      username: c.id,
      password: c.password,
      name:     c.name,
      wedding:  c.wedding,
      isAdmin:  false,
    };
    await launchPortal();
    document.getElementById('adminBanner').style.display = '';
    document.getElementById('adminBannerName').textContent = c.name;
  } catch (err) {
    console.error('Enter customer portal failed:', err);
    showToast('Failed to open client portal.', 'error');
  }
}

document.getElementById('adminBannerBack').addEventListener('click', async () => {
  state.adminManaging = null;
  const rows = await db.get('wcb_clients', 'id=eq.admin&select=*');
  if (rows.length > 0) {
    const c = rows[0];
    state.user = { username: c.id, password: c.password, name: c.name, wedding: c.wedding, isAdmin: c.is_admin };
  }
  showView('admin');
  await renderDashboard();
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

document.getElementById('uploadConfirmBtn').addEventListener('click', async () => {
  if (!pendingFiles.length) return;
  const btn = document.getElementById('uploadConfirmBtn');
  const statusEl = document.getElementById('uploadStatus');
  btn.disabled = true;
  btn.innerHTML = '<i data-lucide="loader"></i> Uploading…';
  lucide.createIcons({ nodes: [btn] });

  const uploaded = [];
  let failures = 0;
  for (let i = 0; i < pendingFiles.length; i++) {
    statusEl.textContent = `Uploading ${i + 1} of ${pendingFiles.length}…`;
    const file = pendingFiles[i];
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', CLOUDINARY_CONFIG.uploadPreset);
    fd.append('folder', `weddingcambox/${uploadTargetUser}`);
    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CONFIG.cloudName}/image/upload`, {
        method: 'POST', body: fd,
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      const thumbUrl = data.secure_url.replace('/upload/', '/upload/w_500,q_75/');
      uploaded.push({
        id:        'up_' + Date.now() + '_' + i,
        client_id: uploadTargetUser,
        title:     file.name.replace(/\.[^.]+$/, ''),
        datetime:  new Date().toISOString(),
        camera:    'Uploaded',
        url:       data.secure_url,
        thumb:     thumbUrl,
        deleted:   false,
      });
    } catch (err) {
      console.error('Upload failed for', file.name, err);
      failures++;
    }
  }

  if (uploaded.length > 0) {
    try {
      await db.insert('wcb_photos', uploaded);
    } catch (err) {
      console.error('Failed to save photos to Supabase:', err);
      showToast('Photos uploaded to Cloudinary but failed to save to database.', 'error');
    }
  }

  // Look up client name for toast message
  let clientName = uploadTargetUser;
  try {
    const clientRows = await db.get('wcb_clients', `id=eq.${encodeURIComponent(uploadTargetUser)}&select=name`);
    if (clientRows.length > 0) clientName = clientRows[0].name;
  } catch (_) {}

  document.getElementById('uploadModal').style.display = 'none';
  pendingFiles = [];
  await renderDashboard();
  const msg = failures > 0
    ? `${uploaded.length} photo${uploaded.length !== 1 ? 's' : ''} uploaded to Cloudinary. ${failures} failed.`
    : `${uploaded.length} photo${uploaded.length !== 1 ? 's' : ''} uploaded to Cloudinary and added to ${clientName}'s gallery.`;
  showToast(msg, failures > 0 ? 'warning' : 'success');
});

// ============================================================
// PORTAL — LAUNCH
// ============================================================
async function launchPortal() {
  await loadUserData();
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
document.getElementById('emptyBinBtn').addEventListener('click', async () => {
  if (!state.recycleBin.length) return;
  if (!confirm(`Permanently delete all ${state.recycleBin.length} photos? This cannot be undone.`)) return;
  try {
    await db.delete('wcb_photos', `client_id=eq.${encodeURIComponent(state.user.username)}&deleted=eq.true`);
    state.recycleBin = [];
    renderBin(); renderPhotos();
    showToast('Recycle bin emptied.', 'info');
  } catch (err) {
    console.error('Empty bin failed:', err);
    showToast('Failed to empty recycle bin.', 'error');
  }
});

async function moveToBin(id) {
  const idx = state.photos.findIndex(p => p.id === id);
  if (idx === -1) return;
  try {
    await db.update('wcb_photos', `id=eq.${encodeURIComponent(id)}`, { deleted: true });
    state.recycleBin.push(state.photos.splice(idx, 1)[0]);
    renderPhotos();
    if (state.showBin) renderBin();
    showToast('Photo moved to recycle bin.', 'info');
  } catch (err) {
    console.error('Move to bin failed:', err);
    showToast('Failed to move photo to bin.', 'error');
  }
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

async function restorePhoto(id) {
  const idx = state.recycleBin.findIndex(p => p.id === id);
  if (idx === -1) return;
  try {
    await db.update('wcb_photos', `id=eq.${encodeURIComponent(id)}`, { deleted: false });
    state.photos.push(state.recycleBin.splice(idx, 1)[0]);
    renderBin(); renderPhotos();
    showToast('Photo restored.', 'success');
  } catch (err) {
    console.error('Restore failed:', err);
    showToast('Failed to restore photo.', 'error');
  }
}

async function permanentDelete(id) {
  if (!confirm('Permanently delete this photo? This cannot be undone.')) return;
  try {
    await db.delete('wcb_photos', `id=eq.${encodeURIComponent(id)}`);
    state.recycleBin = state.recycleBin.filter(p => p.id !== id);
    renderBin(); renderPhotos();
    showToast('Photo permanently deleted.', 'info');
  } catch (err) {
    console.error('Permanent delete failed:', err);
    showToast('Failed to delete photo.', 'error');
  }
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

document.getElementById('guestForm').addEventListener('submit', async e => {
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
  const newGuest = { id: 'g_' + Date.now(), client_id: state.user.username, name, email };
  try {
    await db.insert('wcb_guests', newGuest);
    state.guests.push({ id: newGuest.id, name, email });
    renderGuests();
    document.getElementById('guestName').value  = '';
    document.getElementById('guestEmail').value = '';
    document.getElementById('guestEmail').focus();
  } catch (err) {
    console.error('Add guest failed:', err);
    showToast('Failed to add guest.', 'error');
  }
});

async function removeGuest(id) {
  try {
    await db.delete('wcb_guests', `id=eq.${encodeURIComponent(id)}`);
    state.guests = state.guests.filter(g => g.id !== id);
    renderGuests();
  } catch (err) {
    console.error('Remove guest failed:', err);
    showToast('Failed to remove guest.', 'error');
  }
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
    await sendViaMailto(subject, bodyText, galleryLink);
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

  // Mark link as sent in Supabase
  try {
    await db.upsert('wcb_client_state', {
      client_id: state.user.username,
      link_sent: true,
      sent_at:   new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to update link_sent:', err);
  }

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

async function sendViaMailto(subject, bodyText, galleryLink) {
  const fullBody = bodyText + '\n\nView & download your photos:\n' + galleryLink;
  const bcc = state.guests.map(g => g.email).join(',');
  window.location.href =
    'mailto:?bcc=' + encodeURIComponent(bcc) +
    '&subject='    + encodeURIComponent(subject) +
    '&body='       + encodeURIComponent(fullBody);

  // Mark link as sent in Supabase
  try {
    await db.upsert('wcb_client_state', {
      client_id: state.user.username,
      link_sent: true,
      sent_at:   new Date().toISOString(),
    });
  } catch (err) {
    console.error('Failed to update link_sent:', err);
  }

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