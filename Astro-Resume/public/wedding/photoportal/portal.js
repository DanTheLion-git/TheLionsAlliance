// ============================================================
// CONFIG
// Add/edit users here. In production, replace with a real
// backend authentication system.
// ============================================================
const USERS = {
  'demo': {
    password: 'wedding2025',
    name: 'Sophie & Liam',
    wedding: '12 April 2025',
  },
};

// ============================================================
// PLACEHOLDER PHOTOS
// Free-to-use images via Unsplash (unsplash.com/license)
// Replace with real uploaded photos per user in production.
// ============================================================
const DEFAULT_PHOTOS = [
  { id: 'p01', title: 'The first dance',     datetime: '2025-04-12T20:15:00', camera: 'Camera 1',
    url:   'https://images.unsplash.com/photo-1519741497674-611481863552?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500&q=75' },
  { id: 'p02', title: 'Bridal portrait',     datetime: '2025-04-12T13:00:00', camera: 'Camera 2',
    url:   'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1583939003579-730e3918a45a?w=500&q=75' },
  { id: 'p03', title: 'The ceremony',        datetime: '2025-04-12T15:00:00', camera: 'Camera 3',
    url:   'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1511285560929-80b456fea0bc?w=500&q=75' },
  { id: 'p04', title: 'Reception tables',    datetime: '2025-04-12T17:00:00', camera: 'Camera 4',
    url:   'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1465495976277-4387d4b0b4c6?w=500&q=75' },
  { id: 'p05', title: 'The rings',           datetime: '2025-04-12T14:45:00', camera: 'Camera 5',
    url:   'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1522673607200-164d1b6ce486?w=500&q=75' },
  { id: 'p06', title: 'Bouquet',             datetime: '2025-04-12T12:30:00', camera: 'Camera 6',
    url:   'https://images.unsplash.com/photo-1524824267900-2b6ed4e51c17?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1524824267900-2b6ed4e51c17?w=500&q=75' },
  { id: 'p07', title: 'Walking together',    datetime: '2025-04-12T16:00:00', camera: 'Camera 7',
    url:   'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1519225421980-715cb0215aed?w=500&q=75' },
  { id: 'p08', title: 'The wedding party',   datetime: '2025-04-12T16:30:00', camera: 'Camera 8',
    url:   'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1460978812857-470ed1c77af0?w=500&q=75' },
  { id: 'p09', title: 'Wedding cake',        datetime: '2025-04-12T18:00:00', camera: 'Camera 9',
    url:   'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1591604466107-ec97de577aff?w=500&q=75' },
  { id: 'p10', title: 'Dancing the night away', datetime: '2025-04-12T21:00:00', camera: 'Camera 10',
    url:   'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1537633552985-df8429e8048b?w=500&q=75' },
  { id: 'p11', title: 'Exchanging vows',     datetime: '2025-04-12T15:15:00', camera: 'Camera 1',
    url:   'https://images.unsplash.com/photo-1529636162796-fe5e8d23c7e1?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1529636162796-fe5e8d23c7e1?w=500&q=75' },
  { id: 'p12', title: 'The venue',           datetime: '2025-04-12T11:00:00', camera: 'Camera 2',
    url:   'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1606800052052-a08af7148866?w=500&q=75' },
  { id: 'p13', title: 'Portrait together',   datetime: '2025-04-12T17:30:00', camera: 'Camera 3',
    url:   'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1543332164-6e82f355badc?w=500&q=75' },
  { id: 'p14', title: 'Champagne toast',     datetime: '2025-04-12T19:00:00', camera: 'Camera 4',
    url:   'https://images.unsplash.com/photo-1478145046317-39761428de82?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1478145046317-39761428de82?w=500&q=75' },
  { id: 'p15', title: 'Golden hour',         datetime: '2025-04-12T18:45:00', camera: 'Camera 5',
    url:   'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=1200&q=85',
    thumb: 'https://images.unsplash.com/photo-1532712938310-34cb3982ef74?w=500&q=75' },
];

// ============================================================
// STATE
// ============================================================
let state = {
  user:        null,   // { username, name, wedding }
  photos:      [],     // array of photo objects (with selected flag)
  sortMode:    'date-desc',
  activeTab:   'gallery',
  addressBook: [],     // array of { id, name, email, selected }
  lightboxIdx: -1,
};

// ============================================================
// STORAGE HELPERS
// ============================================================
function storageKey(suffix) { return `wcb_${state.user.username}_${suffix}`; }

function savePhotos()  { localStorage.setItem(storageKey('photos'),  JSON.stringify(state.photos)); }
function saveAB()      { localStorage.setItem(storageKey('ab'),      JSON.stringify(state.addressBook)); }
function saveSortMode(){ localStorage.setItem(storageKey('sort'),    state.sortMode); }

function loadUserData() {
  const savedPhotos = localStorage.getItem(storageKey('photos'));
  state.photos = savedPhotos ? JSON.parse(savedPhotos)
    : DEFAULT_PHOTOS.map(p => ({ ...p, selected: false }));

  const savedAB = localStorage.getItem(storageKey('ab'));
  state.addressBook = savedAB ? JSON.parse(savedAB) : [];

  state.sortMode = localStorage.getItem(storageKey('sort')) || 'date-desc';
}

// ============================================================
// AUTH
// ============================================================
function tryLogin(username, password) {
  const user = USERS[username.trim().toLowerCase()];
  if (!user || user.password !== password) return false;
  state.user = { username: username.trim().toLowerCase(), name: user.name, wedding: user.wedding };
  sessionStorage.setItem('wcb_session', JSON.stringify(state.user));
  return true;
}

function logout() {
  sessionStorage.removeItem('wcb_session');
  state = { user: null, photos: [], sortMode: 'date-desc', activeTab: 'gallery', addressBook: [], lightboxIdx: -1 };
  showView('login');
}

function checkExistingSession() {
  const saved = sessionStorage.getItem('wcb_session');
  if (!saved) return false;
  try {
    state.user = JSON.parse(saved);
    return true;
  } catch { return false; }
}

// ============================================================
// VIEW MANAGEMENT
// ============================================================
function showView(view) {
  document.getElementById('viewLogin').style.display  = view === 'login'  ? '' : 'none';
  document.getElementById('viewPortal').style.display = view === 'portal' ? '' : 'none';
}

function showTab(tabId) {
  state.activeTab = tabId;
  document.querySelectorAll('.p-tab').forEach(btn => {
    btn.classList.toggle('p-tab--active', btn.dataset.tab === tabId);
  });
  document.getElementById('tabGallery').style.display     = tabId === 'gallery'     ? '' : 'none';
  document.getElementById('tabAddressbook').style.display = tabId === 'addressbook' ? '' : 'none';
}

// ============================================================
// GALLERY — SORT
// ============================================================
function getSortedPhotos() {
  const arr = [...state.photos];
  switch (state.sortMode) {
    case 'date-desc': return arr.sort((a,b) => new Date(b.datetime) - new Date(a.datetime));
    case 'date-asc':  return arr.sort((a,b) => new Date(a.datetime) - new Date(b.datetime));
    case 'name-asc':  return arr.sort((a,b) => a.title.localeCompare(b.title));
    case 'name-desc': return arr.sort((a,b) => b.title.localeCompare(a.title));
    case 'custom':    return arr; // preserve array order
  }
  return arr;
}

// ============================================================
// GALLERY — RENDER
// ============================================================
function renderGallery() {
  const grid      = document.getElementById('photoGrid');
  const emptyEl   = document.getElementById('galleryEmpty');
  const sorted    = getSortedPhotos();
  const isDraggable = state.sortMode === 'custom';

  grid.innerHTML = '';
  grid.classList.toggle('sort-custom', isDraggable);

  if (!sorted.length) {
    emptyEl.style.display = '';
    updateGalleryToolbar();
    return;
  }
  emptyEl.style.display = 'none';

  sorted.forEach((photo) => {
    const card = buildPhotoCard(photo, isDraggable);
    grid.appendChild(card);
  });

  updateGalleryToolbar();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function buildPhotoCard(photo, draggable) {
  const time = new Date(photo.datetime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const card = document.createElement('div');
  card.className = 'photo-card' + (photo.selected ? ' is-selected' : '');
  card.dataset.id = photo.id;
  card.draggable = draggable;

  card.innerHTML = `
    <div class="photo-card__img-wrap">
      <img src="${photo.thumb}" alt="${photo.title}" loading="lazy" />
      <div class="photo-card__overlay">
        <label class="photo-check" title="Select photo">
          <input type="checkbox" class="photo-checkbox" data-id="${photo.id}" ${photo.selected ? 'checked' : ''} />
          <span class="photo-check__mark">✓</span>
        </label>
        <button class="photo-card__open-btn" data-id="${photo.id}" title="View full size"><i data-lucide="expand"></i> View</button>
      </div>
    </div>
    <div class="photo-card__body">
      <div class="photo-card__meta">
        <span class="photo-card__title" title="${photo.title}">${photo.title}</span>
        <span class="photo-card__sub">${photo.camera} · ${time}</span>
      </div>
      <div class="photo-card__actions">
        <button class="photo-action photo-action--download" data-id="${photo.id}" title="Download"><i data-lucide="download"></i></button>
        <button class="photo-action photo-action--delete" data-id="${photo.id}" title="Delete"><i data-lucide="trash-2"></i></button>
      </div>
    </div>`;

  // Checkbox toggle
  card.querySelector('.photo-checkbox').addEventListener('change', (e) => {
    e.stopPropagation();
    toggleSelect(photo.id);
  });

  // Open lightbox
  card.querySelector('.photo-card__open-btn').addEventListener('click', (e) => {
    e.stopPropagation();
    openLightbox(photo.id);
  });
  card.querySelector('.photo-card__img-wrap img').addEventListener('click', () => openLightbox(photo.id));

  // Individual download
  card.querySelector('.photo-action--download').addEventListener('click', (e) => {
    e.stopPropagation();
    showToast('Download is being prepared — this feature is coming soon!', 'info');
  });

  // Individual delete
  card.querySelector('.photo-action--delete').addEventListener('click', (e) => {
    e.stopPropagation();
    deletePhoto(photo.id);
  });

  // Drag & drop (custom sort mode only)
  if (draggable) {
    card.addEventListener('dragstart', onDragStart);
    card.addEventListener('dragover',  onDragOver);
    card.addEventListener('dragleave', onDragLeave);
    card.addEventListener('drop',      onDrop);
    card.addEventListener('dragend',   onDragEnd);
  }

  return card;
}

function updateGalleryToolbar() {
  const total    = state.photos.length;
  const selected = state.photos.filter(p => p.selected).length;

  document.getElementById('photoCountBadge').textContent  = total;
  document.getElementById('galleryCountLabel').textContent = `${total} photo${total !== 1 ? 's' : ''}`;
  document.getElementById('selCountBadge').textContent     = selected;
  document.getElementById('deleteSelectedBtn').disabled    = selected === 0;
  document.getElementById('selectAllLabel').textContent    = selected === total && total > 0
    ? 'Deselect all' : 'Select all';
}

// ============================================================
// GALLERY — SELECTION
// ============================================================
function toggleSelect(id) {
  const photo = state.photos.find(p => p.id === id);
  if (!photo) return;
  photo.selected = !photo.selected;
  savePhotos();

  const card = document.querySelector(`.photo-card[data-id="${id}"]`);
  if (card) card.classList.toggle('is-selected', photo.selected);
  updateGalleryToolbar();
}

function selectAllOrNone() {
  const allSelected = state.photos.every(p => p.selected);
  state.photos.forEach(p => p.selected = !allSelected);
  savePhotos();
  renderGallery();
}

// ============================================================
// GALLERY — DELETE
// ============================================================
function deletePhoto(id) {
  if (!confirm('Delete this photo? This cannot be undone.')) return;
  state.photos = state.photos.filter(p => p.id !== id);
  savePhotos();
  renderGallery();
  showToast('Photo deleted.', 'info');
}

function deleteSelected() {
  const count = state.photos.filter(p => p.selected).length;
  if (count === 0) return;
  if (!confirm(`Delete ${count} selected photo${count > 1 ? 's' : ''}? This cannot be undone.`)) return;
  state.photos = state.photos.filter(p => !p.selected);
  savePhotos();
  renderGallery();
  showToast(`${count} photo${count > 1 ? 's' : ''} deleted.`, 'info');
}

// ============================================================
// GALLERY — DRAG & DROP (custom sort)
// ============================================================
let dragSrcId = null;

function onDragStart(e) {
  dragSrcId = this.dataset.id;
  this.classList.add('is-dragging');
  e.dataTransfer.effectAllowed = 'move';
  e.dataTransfer.setData('text/plain', dragSrcId);
}
function onDragOver(e) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  if (this.dataset.id !== dragSrcId) this.classList.add('drag-over');
}
function onDragLeave() { this.classList.remove('drag-over'); }
function onDragEnd()   { this.classList.remove('is-dragging'); }

function onDrop(e) {
  e.preventDefault();
  this.classList.remove('drag-over');
  const dropId = this.dataset.id;
  if (!dragSrcId || dragSrcId === dropId) return;

  const fromIdx = state.photos.findIndex(p => p.id === dragSrcId);
  const toIdx   = state.photos.findIndex(p => p.id === dropId);
  if (fromIdx < 0 || toIdx < 0) return;

  state.photos.splice(toIdx, 0, state.photos.splice(fromIdx, 1)[0]);
  savePhotos();
  renderGallery();
}

// ============================================================
// LIGHTBOX
// ============================================================
function openLightbox(id) {
  const sorted = getSortedPhotos();
  const idx = sorted.findIndex(p => p.id === id);
  if (idx < 0) return;
  state.lightboxIdx = idx;
  showLightboxAt(idx, sorted);
  document.getElementById('lightbox').style.display = '';
  document.addEventListener('keydown', onLightboxKey);
}

function showLightboxAt(idx, sorted) {
  sorted = sorted || getSortedPhotos();
  const photo = sorted[idx];
  if (!photo) return;
  const time = new Date(photo.datetime).toLocaleTimeString('nl-NL', { hour: '2-digit', minute: '2-digit' });
  const date = new Date(photo.datetime).toLocaleDateString('nl-NL', { day: 'numeric', month: 'long', year: 'numeric' });
  document.getElementById('lightboxImg').src       = photo.url;
  document.getElementById('lightboxImg').alt       = photo.title;
  document.getElementById('lightboxTitle').textContent = photo.title;
  document.getElementById('lightboxInfo').textContent  = `${photo.camera} · ${date} ${time}`;
  document.getElementById('lightboxPrev').disabled = idx === 0;
  document.getElementById('lightboxNext').disabled = idx === sorted.length - 1;
}

function closeLightbox() {
  document.getElementById('lightbox').style.display = 'none';
  document.getElementById('lightboxImg').src = '';
  document.removeEventListener('keydown', onLightboxKey);
}

function navigateLightbox(dir) {
  const sorted = getSortedPhotos();
  const next = state.lightboxIdx + dir;
  if (next < 0 || next >= sorted.length) return;
  state.lightboxIdx = next;
  showLightboxAt(next, sorted);
}

function onLightboxKey(e) {
  if (e.key === 'ArrowLeft')  navigateLightbox(-1);
  if (e.key === 'ArrowRight') navigateLightbox(+1);
  if (e.key === 'Escape')     closeLightbox();
}

// ============================================================
// ADDRESS BOOK
// ============================================================
function renderAddressBook() {
  const list     = document.getElementById('abList');
  const emptyEl  = document.getElementById('abEmpty');
  const selHint  = document.getElementById('abSelHint');
  const sendBtn  = document.getElementById('sendShareBtn');
  const contacts = state.addressBook;

  document.getElementById('abCountBadge').textContent = contacts.length;
  list.innerHTML = '';

  if (!contacts.length) {
    emptyEl.style.display = '';
    sendBtn.disabled = true;
    selHint.textContent = 'No contacts yet';
    return;
  }
  emptyEl.style.display = 'none';

  contacts.forEach(contact => {
    const row = document.createElement('div');
    row.className = 'ab-contact' + (contact.selected ? ' is-selected' : '');
    row.dataset.id = contact.id;
    row.innerHTML = `
      <div class="ab-contact__check" data-id="${contact.id}" title="Select contact">
        <span class="ab-contact__check-mark">✓</span>
      </div>
      <div class="ab-contact__info">
        <span class="ab-contact__name">${escHtml(contact.name || contact.email.split('@')[0])}</span>
        <span class="ab-contact__email">${escHtml(contact.email)}</span>
      </div>
      <button class="ab-contact__remove" data-id="${contact.id}" title="Remove contact"><i data-lucide="x"></i></button>`;

    row.querySelector('.ab-contact__check').addEventListener('click', () => toggleContact(contact.id));
    row.querySelector('.ab-contact__remove').addEventListener('click', () => removeContact(contact.id));
    list.appendChild(row);
  });

  const selCount = contacts.filter(c => c.selected).length;
  sendBtn.disabled = selCount === 0;
  selHint.textContent = selCount > 0
    ? `${selCount} contact${selCount > 1 ? 's' : ''} selected`
    : 'Select contacts to send a share link';

  if (typeof lucide !== 'undefined') lucide.createIcons();
}

function toggleContact(id) {
  const c = state.addressBook.find(c => c.id === id);
  if (!c) return;
  c.selected = !c.selected;
  saveAB();
  renderAddressBook();
}

function addContact(name, email) {
  const id = 'c' + Date.now();
  state.addressBook.push({ id, name: name.trim(), email: email.trim().toLowerCase(), selected: false });
  saveAB();
  renderAddressBook();
}

function removeContact(id) {
  state.addressBook = state.addressBook.filter(c => c.id !== id);
  saveAB();
  renderAddressBook();
  showToast('Contact removed.', 'info');
}

// ============================================================
// SHARE MODAL
// ============================================================
function openShareModal() {
  const selected = state.addressBook.filter(c => c.selected);
  const shareId  = Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
  const link     = `https://thelionsalliance.com/wedding/photoportal/share/${shareId}`;

  document.getElementById('shareLinkInput').value = link;

  const listEl = document.getElementById('shareContactsList');
  listEl.innerHTML = '';
  selected.forEach(c => {
    const row = document.createElement('div');
    row.className = 'share-contact-row';
    row.innerHTML = `
      <span class="share-contact-row__dot"></span>
      <span>${escHtml(c.name || c.email)}</span>
      <span class="share-contact-row__email">${escHtml(c.email)}</span>`;
    listEl.appendChild(row);
  });

  document.getElementById('shareContactsWrap').style.display = selected.length ? '' : 'none';
  document.getElementById('shareModal').style.display = '';
}

function closeShareModal() {
  document.getElementById('shareModal').style.display = 'none';
}

// ============================================================
// TOAST
// ============================================================
function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const toast = document.createElement('div');
  toast.className = 'toast' + (type ? ` toast--${type}` : '');
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3200);
}

// ============================================================
// UTILS
// ============================================================
function escHtml(str) {
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

// ============================================================
// INIT
// ============================================================
function init() {
  if (checkExistingSession()) {
    loadUserData();
    launchPortal();
  } else {
    showView('login');
  }

  // ── Login form
  document.getElementById('loginForm').addEventListener('submit', e => {
    e.preventDefault();
    const username = document.getElementById('loginUsername').value;
    const password = document.getElementById('loginPassword').value;
    const errEl    = document.getElementById('loginError');

    if (tryLogin(username, password)) {
      errEl.classList.remove('visible');
      loadUserData();
      launchPortal();
    } else {
      errEl.textContent = '⚠ Incorrect username or password. Check your welcome email.';
      errEl.classList.add('visible');
      document.getElementById('loginPassword').value = '';
    }
  });

  // ── Toggle password visibility
  document.getElementById('togglePw').addEventListener('click', () => {
    const pwInput = document.getElementById('loginPassword');
    pwInput.type = pwInput.type === 'password' ? 'text' : 'password';
  });

  // ── Logout
  document.getElementById('logoutBtn').addEventListener('click', logout);

  // ── Tabs
  document.querySelectorAll('.p-tab').forEach(btn => {
    btn.addEventListener('click', () => showTab(btn.dataset.tab));
  });

  // ── Sort select
  document.getElementById('sortSelect').addEventListener('change', e => {
    state.sortMode = e.target.value;
    saveSortMode();
    renderGallery();
  });

  // ── Select all / deselect all
  document.getElementById('selectAllBtn').addEventListener('click', selectAllOrNone);

  // ── Delete selected
  document.getElementById('deleteSelectedBtn').addEventListener('click', deleteSelected);

  // ── Download all (placeholder)
  document.getElementById('downloadAllBtn').addEventListener('click', () => {
    showToast('Preparing your download — this feature is coming soon!', 'info');
  });

  // ── Lightbox controls
  document.getElementById('lightboxClose').addEventListener('click', closeLightbox);
  document.getElementById('lightboxBg').addEventListener('click', closeLightbox);
  document.getElementById('lightboxPrev').addEventListener('click', () => navigateLightbox(-1));
  document.getElementById('lightboxNext').addEventListener('click', () => navigateLightbox(+1));

  // ── Add contact form
  document.getElementById('addContactForm').addEventListener('submit', e => {
    e.preventDefault();
    const name    = document.getElementById('addName').value.trim();
    const email   = document.getElementById('addEmail').value.trim();
    const errEl   = document.getElementById('addContactError');

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errEl.textContent = 'Please enter a valid email address.';
      return;
    }
    if (state.addressBook.some(c => c.email.toLowerCase() === email.toLowerCase())) {
      errEl.textContent = 'This email address is already in your address book.';
      return;
    }
    errEl.textContent = '';
    addContact(name || email, email);
    document.getElementById('addName').value  = '';
    document.getElementById('addEmail').value = '';
    showToast(`${email} added to address book.`, 'success');
  });

  // ── Send share link button
  document.getElementById('sendShareBtn').addEventListener('click', openShareModal);

  // ── Share modal controls
  document.getElementById('shareModalClose').addEventListener('click', closeShareModal);
  document.getElementById('copyLinkBtn').addEventListener('click', () => {
    const link = document.getElementById('shareLinkInput').value;
    navigator.clipboard.writeText(link).then(() => showToast('Link copied to clipboard!', 'success'))
      .catch(() => { document.getElementById('shareLinkInput').select(); document.execCommand('copy'); showToast('Link copied!', 'success'); });
  });
  document.getElementById('confirmSendBtn').addEventListener('click', () => {
    const selected = state.addressBook.filter(c => c.selected);
    closeShareModal();
    const names = selected.map(c => c.name || c.email).join(', ');
    showToast(`Share link sent to: ${names}`, 'success');
  });

  // Close modal on overlay click
  document.getElementById('shareModal').addEventListener('click', e => {
    if (e.target === document.getElementById('shareModal')) closeShareModal();
  });
}

function launchPortal() {
  document.getElementById('headerName').textContent   = state.user.name;
  document.getElementById('headerWedding').textContent = state.user.wedding;
  document.getElementById('sortSelect').value = state.sortMode;
  showView('portal');
  showTab('gallery');
  renderGallery();
  renderAddressBook();
  if (typeof lucide !== 'undefined') lucide.createIcons();
}

document.addEventListener('DOMContentLoaded', init);
