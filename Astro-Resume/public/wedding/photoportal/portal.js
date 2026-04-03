// ============================================================
// CONFIG — add real users here, one entry per wedding couple
// ============================================================
const USERS = {
  'admin': {
    password: 'Hondje01',
    name:     'Admin',
    wedding:  'WeddingCamBox',
  },
  'demo': {
    password: 'wedding2025',
    name:     'Sophie & Liam',
    wedding:  '12 April 2025',
  },
};

// ============================================================
// PLACEHOLDER PHOTOS — replace per-user in production
// ============================================================
const DEFAULT_PHOTOS = [
  { id:'p01', title:'Bouquet',              datetime:'2025-04-12T12:30:00', camera:'Camera 6',  thumb:'https://images.unsplash.com/photo-1524824267900-2b6ed4e51c17?w=500&q=75',  url:'https://images.unsplash.com/photo-1524824267900-2b6ed4e51c17?w=1200&q=85' },
  { id:'p02', title:'Bridal portrait',      datetime:'2025-04-12T13:00:00', camera:'Camera 2',  thumb:'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=500&q=75',  url:'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=85' },
  { id:'p03', title:'Champagne toast',      datetime:'2025-04-12T19:00:00', camera:'Camera 4',  thumb:'https://images.unsplash.com/photo-1478145046317-39761428de82?w=500&q=75',  url:'https://images.unsplash.com/photo-1478145046317-39761428de82?w=1200&q=85' },
  { id:'p04', title:'Dancing the night',    datetime:'2025-04-12T21:00:00', camera:'Camera 10', thumb:'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=500&q=75',  url:'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=85' },
  { id:'p05', title:'Exchanging vows',      datetime:'2025-04-12T15:15:00', camera:'Camera 1',  thumb:'https://images.unsplash.com/photo-1529636162796-fe5e8d23c7e1?w=500&q=75',  url:'https://images.unsplash.com/photo-1529636162796-fe5e8d23c7e1?w=1200&q=85' },
  { id:'p06', title:'First dance',          datetime:'2025-04-12T20:15:00', camera:'Camera 1',  thumb:'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=75',  url:'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85' },
  { id:'p07', title:'Golden hour',          datetime:'2025-04-12T18:45:00', camera:'Camera 5',  thumb:'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=500&q=75',  url:'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1200&q=85' },
  { id:'p08', title:'Portrait together',    datetime:'2025-04-12T17:30:00', camera:'Camera 3',  thumb:'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=500&q=75',  url:'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=1200&q=85' },
  { id:'p09', title:'Reception tables',     datetime:'2025-04-12T17:00:00', camera:'Camera 4',  thumb:'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=500&q=75',  url:'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=85' },
  { id:'p10', title:'The ceremony',         datetime:'2025-04-12T15:00:00', camera:'Camera 3',  thumb:'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&q=75',  url:'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=85' },
  { id:'p11', title:'The rings',            datetime:'2025-04-12T14:45:00', camera:'Camera 5',  thumb:'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=500&q=75',  url:'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=85' },
  { id:'p12', title:'The venue',            datetime:'2025-04-12T11:00:00', camera:'Camera 2',  thumb:'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=500&q=75',  url:'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=85' },
  { id:'p13', title:'The wedding party',    datetime:'2025-04-12T16:30:00', camera:'Camera 8',  thumb:'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=500&q=75',  url:'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=1200&q=85' },
  { id:'p14', title:'Walking together',     datetime:'2025-04-12T16:00:00', camera:'Camera 7',  thumb:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&q=75',  url:'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=85' },
  { id:'p15', title:'Wedding cake',         datetime:'2025-04-12T18:00:00', camera:'Camera 9',  thumb:'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=500&q=75',  url:'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=85' },
];

// ============================================================
// STATE
// ============================================================
let state = {
  user:        null,
  step:        1,
  photos:      [],
  recycleBin:  [],
  guests:      [],
  lightboxIdx: -1,
  showBin:     false,
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
// AUTH
// ============================================================
window.addEventListener('DOMContentLoaded', () => {
  lucide.createIcons();

  // Auto-login from session
  const saved = sessionStorage.getItem('wcb_session');
  if (saved && USERS[saved]) {
    state.user = { username: saved, ...USERS[saved] };
    launchPortal();
    return;
  }

  // Show login
  document.getElementById('viewLogin').style.display = '';
});

document.getElementById('togglePw').addEventListener('click', function () {
  const pw   = document.getElementById('loginPassword');
  const icon = this.querySelector('i');
  const show = pw.type === 'password';
  pw.type = show ? 'text' : 'password';
  icon.setAttribute('data-lucide', show ? 'eye-off' : 'eye');
  lucide.createIcons({ nodes: [this] });
});

document.getElementById('loginForm').addEventListener('submit', function (e) {
  e.preventDefault();
  const username = document.getElementById('loginUsername').value.trim().toLowerCase();
  const password = document.getElementById('loginPassword').value;
  const errEl    = document.getElementById('loginError');
  const user     = USERS[username];

  if (!user || user.password !== password) {
    errEl.textContent = 'Incorrect username or password. Please try again.';
    errEl.classList.add('visible');
    return;
  }
  errEl.classList.remove('visible');
  state.user = { username, ...user };
  sessionStorage.setItem('wcb_session', username);
  launchPortal();
});

document.getElementById('logoutBtn').addEventListener('click', () => {
  sessionStorage.removeItem('wcb_session');
  location.reload();
});

function launchPortal() {
  loadUserData();
  document.getElementById('viewLogin').style.display  = 'none';
  document.getElementById('viewPortal').style.display = '';
  document.getElementById('headerName').textContent   = state.user.name;
  goToStep(1);
}

// ============================================================
// STEPPER / NAVIGATION
// ============================================================
function goToStep(n) {
  state.step = n;

  // Update stepper circles
  document.querySelectorAll('.stepper__item').forEach(el => {
    const s = +el.dataset.step;
    el.classList.toggle('stepper__item--active',    s === n);
    el.classList.toggle('stepper__item--completed', s < n);
  });

  // Show correct panel
  for (let i = 1; i <= 3; i++) {
    const p = document.getElementById('panel' + i);
    p.style.display = i === n ? '' : 'none';
  }

  // Update prev/next buttons
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

  // Render step content
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

  // Sort by filename (title), which mirrors camera/time order
  const sorted = [...state.photos].sort((a, b) => a.title.localeCompare(b.title));

  label.textContent = `${sorted.length} photo${sorted.length !== 1 ? 's' : ''}`;

  badge.textContent   = state.recycleBin.length;
  badge.style.display = state.recycleBin.length ? '' : 'none';

  empty.style.display = sorted.length ? 'none' : '';
  grid.style.display  = sorted.length ? ''     : 'none';

  grid.innerHTML = sorted.map(p => `
    <div class="photo-card" data-id="${p.id}">
      <div class="photo-card__img-wrap">
        <img src="${p.thumb}" alt="${escHtml(p.title)}" loading="lazy" />
        <div class="photo-card__overlay">
          <button class="photo-card__view-btn" data-id="${p.id}">
            <i data-lucide="eye"></i> View
          </button>
        </div>
        <button class="photo-card__delete" data-id="${p.id}" title="Move to recycle bin">
          <i data-lucide="trash-2"></i>
        </button>
      </div>
      <div class="photo-card__info">
        <span class="photo-card__title">${escHtml(p.title)}</span>
        <span class="photo-card__meta">${escHtml(p.camera)} &middot; ${formatDt(p.datetime)}</span>
      </div>
    </div>
  `).join('');

  grid.querySelectorAll('.photo-card__view-btn').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      const sortedIds = [...state.photos].sort((a,b) => a.title.localeCompare(b.title)).map(p => p.id);
      openLightbox(sortedIds.indexOf(btn.dataset.id));
    });
  });

  grid.querySelectorAll('.photo-card__delete').forEach(btn => {
    btn.addEventListener('click', e => {
      e.stopPropagation();
      moveToBin(btn.dataset.id);
    });
  });

  // Also open lightbox when clicking the image
  grid.querySelectorAll('.photo-card__img-wrap img').forEach(img => {
    img.addEventListener('click', () => {
      const id = img.closest('.photo-card').dataset.id;
      const sortedIds = [...state.photos].sort((a,b) => a.title.localeCompare(b.title)).map(p => p.id);
      openLightbox(sortedIds.indexOf(id));
    });
  });

  lucide.createIcons();
}

// Recycle bin toggle
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
  if (!confirm(`Permanently delete all ${state.recycleBin.length} photo${state.recycleBin.length > 1 ? 's' : ''} in the recycle bin? This cannot be undone.`)) return;
  state.recycleBin = [];
  saveAll();
  renderBin();
  renderPhotos();
  showToast('Recycle bin emptied.', 'info');
});

function moveToBin(id) {
  const idx = state.photos.findIndex(p => p.id === id);
  if (idx === -1) return;
  state.recycleBin.push(state.photos.splice(idx, 1)[0]);
  saveAll();
  renderPhotos();
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
    </div>
  `).join('');

  grid.querySelectorAll('.bin-btn--restore').forEach(btn =>
    btn.addEventListener('click', () => restorePhoto(btn.dataset.id)));

  grid.querySelectorAll('.bin-btn--delete').forEach(btn =>
    btn.addEventListener('click', () => permanentDelete(btn.dataset.id)));

  lucide.createIcons();
}

function restorePhoto(id) {
  const idx = state.recycleBin.findIndex(p => p.id === id);
  if (idx === -1) return;
  state.photos.push(state.recycleBin.splice(idx, 1)[0]);
  saveAll();
  renderBin();
  renderPhotos();
  showToast('Photo restored.', 'success');
}

function permanentDelete(id) {
  if (!confirm('Permanently delete this photo? This cannot be undone.')) return;
  state.recycleBin = state.recycleBin.filter(p => p.id !== id);
  saveAll();
  renderBin();
  renderPhotos();
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
  document.getElementById('lightboxImg').src          = p.url;
  document.getElementById('lightboxImg').alt          = p.title;
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
document.getElementById('lightboxBg').addEventListener('click', closeLightbox);
document.getElementById('lightboxPrev').addEventListener('click', () => {
  const sorted = [...state.photos].sort((a,b) => a.title.localeCompare(b.title));
  openLightbox((state.lightboxIdx - 1 + sorted.length) % sorted.length);
});
document.getElementById('lightboxNext').addEventListener('click', () => {
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

  badge.textContent = `${state.guests.length} guest${state.guests.length !== 1 ? 's' : ''}`;
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
    </div>
  `).join('');

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
    errEl.textContent = 'Please enter a valid email address.';
    return;
  }
  if (state.guests.some(g => g.email.toLowerCase() === email.toLowerCase())) {
    errEl.textContent = 'This email address is already in your list.';
    return;
  }
  errEl.textContent = '';
  state.guests.push({ id: 'g' + Date.now(), name, email });
  saveAll();
  renderGuests();
  document.getElementById('guestName').value  = '';
  document.getElementById('guestEmail').value = '';
  document.getElementById('guestEmail').focus();
});

function removeGuest(id) {
  state.guests = state.guests.filter(g => g.id !== id);
  saveAll();
  renderGuests();
}

// ============================================================
// STEP 3 — SEND EMAIL
// ============================================================
function renderSendStep() {
  const toEl    = document.getElementById('emailTo');
  const hintEl  = document.getElementById('sendHint');
  const sendBtn = document.getElementById('sendBtn');

  if (state.guests.length === 0) {
    toEl.innerHTML    = '<span class="email-field-placeholder">&mdash; no guests added yet, go back to step 2 &mdash;</span>';
    hintEl.textContent = 'Add guests in step 2 before sending.';
    sendBtn.disabled   = true;
  } else {
    toEl.innerHTML = state.guests
      .map(g => `<span class="email-chip">${escHtml(g.name || g.email)}</span>`)
      .join('');
    hintEl.textContent = `Will be sent to ${state.guests.length} guest${state.guests.length !== 1 ? 's' : ''}.`;
    sendBtn.disabled   = false;
  }

  updatePreview();
  lucide.createIcons();
}

function updatePreview() {
  const body = document.getElementById('emailBody');
  if (body) document.getElementById('previewBody').innerHTML = body.innerHTML;
}

// Formatting toolbar
document.querySelectorAll('.fmt-btn').forEach(btn => {
  btn.addEventListener('mousedown', e => {
    e.preventDefault();
    document.execCommand(btn.dataset.cmd, false, null);
    updatePreview();
  });
});

document.getElementById('emailBody').addEventListener('input', updatePreview);

document.getElementById('sendBtn').addEventListener('click', () => {
  const subject  = document.getElementById('emailSubject').value;
  const bodyText = document.getElementById('emailBody').innerText;
  const link     = 'https://thelionsalliance.com/wedding/photoportal/';
  const fullBody = bodyText + '\n\nView & download your photos:\n' + link;
  const bcc      = state.guests.map(g => g.email).join(',');

  window.location.href =
    'mailto:?bcc=' + encodeURIComponent(bcc) +
    '&subject=' + encodeURIComponent(subject) +
    '&body='    + encodeURIComponent(fullBody);

  showToast(`Opening email client with ${state.guests.length} recipient${state.guests.length !== 1 ? 's' : ''}…`, 'success');
});

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
  const c     = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className   = `toast toast--${type}`;
  toast.textContent = msg;
  c.appendChild(toast);
  requestAnimationFrame(() => toast.classList.add('toast--visible'));
  setTimeout(() => {
    toast.classList.remove('toast--visible');
    toast.addEventListener('transitionend', () => toast.remove(), { once: true });
  }, 3500);
}