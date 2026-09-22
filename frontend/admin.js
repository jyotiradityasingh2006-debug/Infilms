// API base URL for the deployed backend.
const API_BASE = (function() {
  var p = window.location;
  var isLocal = p.protocol === 'file:' || p.hostname === 'localhost' || p.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:5000/api' : p.origin + '/api';
})();
const API = API_BASE;

let token = localStorage.getItem('admin_token') || null;

const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginMsg = document.getElementById('loginMsg');
const logoutBtn = document.getElementById('logoutBtn');
const changePwdForm = document.getElementById('changePwdForm');
const currentPwdInput = document.getElementById('currentPwdInput');
const newPwdInput = document.getElementById('newPwdInput');
const confirmPwdInput = document.getElementById('confirmPwdInput');
const changePwdBtn = document.getElementById('changePwdBtn');
const changePwdMsg = document.getElementById('changePwdMsg');
const uploadForm = document.getElementById('uploadForm');
const mediaTypeSelect = document.getElementById('mediaTypeSelect');
const categoryGroup = document.getElementById('categoryGroup');
const customerGroup = document.getElementById('customerGroup');
const categorySelect = document.getElementById('categorySelect');
const customerSelect = document.getElementById('customerSelect');
const fileInput = document.getElementById('fileInput');
const fileInputHint = document.getElementById('fileInputHint');
const uploadBtn = document.getElementById('uploadBtn');
const uploadMsg = document.getElementById('uploadMsg');
const adminPhotos = document.getElementById('adminPhotos');

const VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/x-m4v,video/webm,video/x-msvideo,video/mpeg,video/3gpp,video/3gpp2';

function formatDuration(sec) {
  const s = Math.round(Number(sec) || 0);
  if (!s) return '';
  const m = Math.floor(s / 60);
  const r = s % 60;
  return m + ':' + (r < 10 ? '0' + r : r);
}

function setupMediaTypeToggle() {
  if (!mediaTypeSelect) return;
  mediaTypeSelect.addEventListener('change', function() {
    const isVideo = mediaTypeSelect.value === 'video';
    if (categoryGroup) categoryGroup.style.display = isVideo ? 'none' : '';
    if (customerGroup) customerGroup.style.display = isVideo ? 'none' : '';
    fileInput.accept = isVideo ? VIDEO_ACCEPT : 'image/jpeg,image/png,image/webp,image/gif,image/avif';
    fileInput.multiple = !isVideo;
    fileInput.value = '';
    if (fileInputHint) {
      fileInputHint.textContent = isVideo
        ? 'Select one film (MP4/MOV/WebM/AVI, max 10 minutes).'
        : 'Select one or more images to upload at once.';
    }
  });
}

function esc(s) {
  const div = document.createElement('div');
  div.textContent = s == null ? '' : String(s);
  return div.innerHTML;
}

function show(el) { el.style.display = ''; }
function hide(el) { el.style.display = 'none'; }

function msg(el, text, ok) {
  el.textContent = text;
  el.className = 'admin-msg ' + (ok ? 'msg-ok' : 'msg-err');
}

function showDashboard() {
  hide(loginSection);
show(dashboardSection);
  setupMediaTypeToggle();
  loadAdminPhotos();
  loadAdminTestimonials();
  loadAdminAppointments();
  loadSiteContent();
  loadCategories();
}

function showLogin() {
  show(loginSection);
  hide(dashboardSection);
  token = null;
  localStorage.removeItem('admin_token');
}

function authHeaders() {
  return { 'Authorization': 'Bearer ' + token };
}

loginForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const pw = passwordInput.value.trim();
  if (!pw) return;
  loginBtn.disabled = true;
  loginBtn.textContent = 'Logging in...';
  msg(loginMsg, '', false);
  try {
    const res = await window.apiFetch('/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    let data = {};
    try {
      data = await res.json();
    } catch (err) {
      data = {};
    }
    if (!res.ok) {
      if (typeof data.message === 'string' && data.message.length) {
        msg(loginMsg, data.message, false);
      } else {
        msg(loginMsg, 'Admin API not reachable. Open this page through the backend at http://localhost:5000 (npm start in the backend folder) — not a plain file server.', false);
      }
      return;
    }
    token = data.token;
    localStorage.setItem('admin_token', token);
    passwordInput.value = '';
    showDashboard();
  } catch (err) {
    console.error('Login error:', err);
    msg(loginMsg, 'Network error: ' + (err && err.message), false);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Log In';
  }
});

logoutBtn.addEventListener('click', function() {
  showLogin();
});

changePwdForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  if (newPwdInput.value !== confirmPwdInput.value) {
    msg(changePwdMsg, 'New passwords do not match', false);
    return;
  }
  changePwdBtn.disabled = true;
  changePwdBtn.textContent = 'Updating...';
  msg(changePwdMsg, '', false);
  try {
    const res = await window.apiFetch('/auth/change-password', {
      method: 'POST',
      headers: Object.assign({ 'Content-Type': 'application/json' }, authHeaders()),
      body: JSON.stringify({ currentPassword: currentPwdInput.value, newPassword: newPwdInput.value }),
    });
    let data = {};
    try {
      data = await res.json();
    } catch (err) {
      data = {};
    }
    if (res.status === 401) {
      const m = data.message || '';
      if (m === 'Token expired' || m === 'Invalid token' || m === 'Missing token') {
        msg(changePwdMsg, 'Session expired. Please log in again.', false);
        showLogin();
        return;
      }
    }
    if (!res.ok) {
      msg(changePwdMsg, typeof data.message === 'string' && data.message ? data.message : 'Could not update password', false);
      return;
    }
    msg(changePwdMsg, 'Password updated successfully', true);
    currentPwdInput.value = '';
    newPwdInput.value = '';
    confirmPwdInput.value = '';
  } catch (err) {
    console.error('Password change error:', err);
    msg(changePwdMsg, 'Network error: ' + (err && err.message), false);
  } finally {
    changePwdBtn.disabled = false;
    changePwdBtn.textContent = 'Update Password';
  }
});

uploadForm.addEventListener('submit', async function(e) {
  e.preventDefault();
  const files = Array.from(fileInput.files);
  if (files.length === 0) return;
  uploadBtn.disabled = true;
  uploadMsg.className = 'admin-msg';
  uploadMsg.textContent = '';

  let succeeded = 0;
  let failed = 0;

  for (let i = 0; i < files.length; i++) {
    uploadBtn.textContent = 'Uploading ' + (i + 1) + ' of ' + files.length + '...';
    const fd = new FormData();
    fd.append('image', files[i]);
    fd.append('category', categorySelect.value);
    if (customerSelect && customerSelect.value) fd.append('customer', customerSelect.value);
    try {
      const res = await window.apiFetch('/photos', {
        method: 'POST',
        headers: authHeaders(),
        body: fd,
      });
      const data = await res.json();
      if (res.status === 401) {
        msg(uploadMsg, 'Session expired. Please log in again.', false);
        showLogin();
        return;
      }
      if (!res.ok) {
        failed++;
      } else {
        succeeded++;
      }
    } catch (err) {
      failed++;
    }
  }

  fileInput.value = '';

  if (files.length === 1) {
    const label = mediaTypeSelect && mediaTypeSelect.value === 'video' ? 'Film' : 'Photo';
    msg(uploadMsg, succeeded ? label + ' uploaded successfully!' : label + ' upload failed.', succeeded > 0);
  } else {
    const parts = [];
    if (succeeded) parts.push(succeeded + ' uploaded');
    if (failed) parts.push(failed + ' failed');
    msg(uploadMsg, parts.join(', '), failed === 0);
  }

  uploadBtn.disabled = false;
  uploadBtn.textContent = 'Upload';
  loadAdminPhotos();
});

async function loadAdminPhotos() {
  adminPhotos.innerHTML = '<p style="color:#888; font-size:13px;">Loading...</p>';
  try {
    const res = await window.apiFetch('/photos');
    const data = await res.json();
    const photos = data.photos || [];
    if (photos.length === 0) {
      adminPhotos.innerHTML = '<p style="color:#888; font-size:13px;">No photos uploaded yet.</p>';
      return;
    }
    adminPhotos.innerHTML = '';
    photos.forEach(function(p) {
      const card = document.createElement('div');
      card.className = 'admin-photo-card';
      card.dataset.pid = p.public_id;
      const mediaHtml = p.type === 'video'
        ? '<video src="' + p.url + '" muted loop playsinline preload="metadata"></video>'
        : '<img src="' + p.url + '" alt="" loading="lazy">';
      const durationHtml = p.type === 'video' && p.duration
        ? ' <span style="color:#666;">(' + esc(formatDuration(p.duration)) + ')</span>'
        : '';
      card.innerHTML =
        mediaHtml +
        '<div class="admin-photo-info">' +
          '<span class="admin-photo-cat">' + (p.type === 'video' ? 'Film' : esc(categoryNameOf(p.category))) + durationHtml + '</span>' +
          '<span class="admin-photo-id">' + p.public_id + '</span>' +
          '<button class="btn btn-delete" data-pid="' + p.public_id + '">Delete</button>' +
        '</div>';
      adminPhotos.appendChild(card);
    });
    adminPhotos.querySelectorAll('.btn-delete').forEach(function(btn) {
      btn.addEventListener('click', handleDelete);
    });
    adminPhotos.querySelectorAll('video').forEach(function(vid) {
      vid.addEventListener('mouseenter', function() { vid.play().catch(function() {}); });
      vid.addEventListener('mouseleave', function() { vid.pause(); });
    });
  } catch (err) {
    adminPhotos.innerHTML = '<p style="color:#c44; font-size:13px;">Failed to load photos.</p>';
  }
}

async function handleDelete(e) {
  const btn = e.currentTarget;
  const pid = btn.dataset.pid;
  if (!confirm('Delete this photo?')) return;
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const res = await window.apiFetch('/photos/' + pid, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (res.status === 401) {
      alert('Session expired. Please log in again.');
      showLogin();
      return;
    }
    if (!res.ok) {
      alert(data.message || 'Delete failed');
      btn.disabled = false;
      btn.textContent = 'Delete';
      return;
    }
    const card = btn.closest('.admin-photo-card');
    if (card) card.remove();
  } catch (err) {
    alert('Network error');
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
}

// ==================== CATEGORIES MANAGER ====================
const adminCategories = document.getElementById('adminCategories');
const categoryForm = document.getElementById('categoryForm');
const categoryNameInput = document.getElementById('categoryNameInput');
const addCatBtn = document.getElementById('addCatBtn');
const categoryMsg = document.getElementById('categoryMsg');

let categoryList = [];

function categoryNameOf(key) {
  const c = categoryList.find(function(x) { return x.key === key; });
  return c ? c.name : key;
}

function populateUploadCategorySelect() {
  if (!categorySelect) return;
  const previous = categorySelect.value;
  categorySelect.innerHTML = '<option value="">No category (shared gallery)</option>';
  categoryList.forEach(function(c) {
    const opt = document.createElement('option');
    opt.value = c.key;
    opt.textContent = c.name;
    categorySelect.appendChild(opt);
  });
  if (previous && categoryList.some(function(c) { return c.key === previous; })) {
    categorySelect.value = previous;
  }
}

function renderCategories() {
  if (!adminCategories) return;
  if (categoryList.length === 0) {
    adminCategories.innerHTML = '<p style="color:#888; font-size:13px;">No categories yet. Add one above.</p>';
    return;
  }
  adminCategories.innerHTML = '';
  categoryList.forEach(function(c) {
    const row = document.createElement('div');
    row.className = 'admin-testi-row';
    row.innerHTML =
      '<div class="admin-testi-info">' +
        '<span class="admin-photo-cat"><strong>' + esc(c.name) + '</strong> <span style="color:#666; font-size:12px; font-weight:400;">(' + esc(c.key) + ')</span></span>' +
      '</div>' +
      '<div class="admin-testi-actions">' +
        '<button class="btn btn-edit" data-key="' + esc(c.key) + '">Rename</button>' +
        '<button class="btn btn-delete" data-key="' + esc(c.key) + '">Delete</button>' +
      '</div>';
    adminCategories.appendChild(row);
  });
  adminCategories.querySelectorAll('.btn-delete').forEach(function(btn) {
    btn.addEventListener('click', deleteCategory);
  });
  adminCategories.querySelectorAll('.btn-edit').forEach(function(btn) {
    btn.addEventListener('click', renameCategory);
  });
}

async function loadCategories() {
  if (!adminCategories) return;
  adminCategories.innerHTML = '<p style="color:#888; font-size:13px;">Loading categories...</p>';
  try {
    const res = await window.apiFetch('/categories');
    const data = await res.json();
    categoryList = data.categories || [];
    renderCategories();
    populateUploadCategorySelect();
  } catch (err) {
    adminCategories.innerHTML = '<p style="color:#c44; font-size:13px;">Failed to load categories.</p>';
  }
}

function renameCategory(e) {
  const btn = e.currentTarget;
  const key = btn.dataset.key;
  const cat = categoryList.find(function(c) { return c.key === key; });
  if (!cat) return;
  const name = prompt('New name for "' + cat.name + '":', cat.name);
  if (name == null) return;
  const trimmed = name.trim();
  if (!trimmed || trimmed === cat.name) return;
  btn.disabled = true;
  updateCategoryName(key, trimmed, btn);
}

async function updateCategoryName(key, name, btn) {
  try {
    const res = await window.apiFetch('/categories/' + encodeURIComponent(key), {
      method: 'PUT',
      headers: Object.assign(authHeaders(), { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ name: name }),
    });
    const data = await res.json();
    if (res.status === 401) {
      alert('Session expired. Please log in again.');
      showLogin();
      return;
    }
    if (!res.ok) {
      alert(data.message || 'Rename failed');
      btn.disabled = false;
      return;
    }
    loadCategories();
    loadAdminPhotos();
  } catch (err) {
    alert('Network error');
    btn.disabled = false;
  }
}

async function deleteCategory(e) {
  const btn = e.currentTarget;
  const key = btn.dataset.key;
  const cat = categoryList.find(function(c) { return c.key === key; });
  if (!cat) return;
  if (!confirm('Delete the "' + cat.name + '" category? Photos already in it will stay in the gallery but will no longer have their own filter button.')) return;
  btn.disabled = true;
  try {
    const res = await window.apiFetch('/categories/' + encodeURIComponent(key), {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (res.status === 401) {
      alert('Session expired. Please log in again.');
      showLogin();
      return;
    }
    if (!res.ok) {
      alert(data.message || 'Delete failed');
      btn.disabled = false;
      return;
    }
    loadCategories();
    loadAdminPhotos();
  } catch (err) {
    alert('Network error');
    btn.disabled = false;
  }
}

if (categoryForm) {
  categoryForm.addEventListener('submit', async function(e) {
    e.preventDefault();
    const name = categoryNameInput.value.trim();
    if (!name) return;
    addCatBtn.disabled = true;
    addCatBtn.textContent = 'Adding...';
    msg(categoryMsg, '', false);
    try {
      const res = await window.apiFetch('/categories', {
        method: 'POST',
        headers: Object.assign(authHeaders(), { 'Content-Type': 'application/json' }),
        body: JSON.stringify({ name: name }),
      });
      const data = await res.json();
      if (res.status === 401) {
        msg(categoryMsg, 'Session expired. Please log in again.', false);
        showLogin();
        return;
      }
      if (!res.ok) {
        msg(categoryMsg, data.message || 'Add failed', false);
        return;
      }
      categoryNameInput.value = '';
      msg(categoryMsg, 'Category "' + data.category.name + '" added.', true);
      loadCategories();
    } catch (err) {
      msg(categoryMsg, 'Network error', false);
    } finally {
      addCatBtn.disabled = false;
      addCatBtn.textContent = 'Add Category';
    }
  });
}

// ==================== APPOINTMENTS MANAGER ====================
const adminAppointments = document.getElementById('adminAppointments');
const apptCount = document.getElementById('apptCount');

function adminApptDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

async function loadAdminAppointments() {
  if (!adminAppointments) return;
  adminAppointments.innerHTML = '<p style="color:#888; font-size:13px;">Loading...</p>';
  try {
    const res = await window.apiFetch('/appointments', { headers: authHeaders() });
    if (res.status === 401) {
      alert('Session expired. Please log in again.');
      showLogin();
      return;
    }
    const data = await res.json();
    const appointments = data.appointments || [];
    if (apptCount) apptCount.textContent = 'Appointments: ' + appointments.length;
    if (appointments.length === 0) {
      adminAppointments.innerHTML = '<p style="color:#888; font-size:13px;">No appointments yet. They will appear here once visitors book a date.</p>';
      return;
    }
    adminAppointments.innerHTML = '';
    populateCustomerSelect(appointments);
    appointments.forEach(function(a) {
      const row = document.createElement('div');
      row.className = 'admin-testi-row';
      const loc = a.location ? ' · ' + esc(a.location) : '';
      const desc = a.description
        ? '<p class="admin-testi-text" style="margin-top:6px;">' + esc(a.description) + '</p>'
        : '';
      const emailLine = a.email
        ? '<p class="admin-testi-text" style="color:#999; font-size:12px; margin-top:2px;">Email: ' + esc(a.email) + '</p>'
        : '';
      const phoneLine = a.phone
        ? '<p class="admin-testi-text" style="color:#999; font-size:12px; margin-top:2px;">Phone: ' + esc(a.phone) + '</p>'
        : '';
      const datesLine = (a.dateFrom || a.dateTo)
        ? '<p class="admin-testi-text" style="color:#cbbd8d; font-size:13px; margin-top:4px;">Preferred shoot: ' +
            (a.dateFrom ? '<strong>' + esc(a.dateFrom) + '</strong>' : 'Not given') +
            ' to ' + (a.dateTo ? '<strong>' + esc(a.dateTo) + '</strong>' : 'Not given') +
          '</p>'
        : '';
      let photosHtml = '';
      if (a.photos && a.photos.length) {
        photosHtml = '<div class="appt-photos">' +
          a.photos.map(function(p) {
            return '<img src="' + esc(p.url) + '" alt="' + esc(p.category || 'photo') + '" loading="lazy" title="' + esc(p.category || 'photo') + '">';
          }).join('') +
          '<span class="admin-photo-cat">+' + a.photos.length + '</span>' +
          '</div>';
      }
      let testiHtml = '';
      if (a.testimonial && a.testimonial.text) {
        testiHtml =
          '<button class="btn btn-edit" data-testi="' + a.id + '" style="margin-top:10px;">Show Testimonial</button>' +
          '<div class="appt-testi-box" id="testi-box-' + a.id + '" style="display:none;">' +
            '<p>&ldquo;' + esc(a.testimonial.text) + '&rdquo;</p>' +
            '<p class="appt-testi-who">&mdash; ' + esc(a.testimonial.name) +
              (a.testimonial.location ? ', ' + esc(a.testimonial.location) : '') + '</p>' +
          '</div>';
      }
      row.innerHTML =
        '<div class="admin-testi-info">' +
          '<span class="admin-photo-cat"><strong>' + esc(a.name) + '</strong>' + loc + '</span>' +
          datesLine +
          '<p class="admin-testi-text" style="color:#999; font-size:12px; margin-top:2px;">Requested on ' + esc(adminApptDate(a.createdAt)) + '</p>' +
          emailLine +
          phoneLine +
          desc +
          photosHtml +
          testiHtml +
        '</div>' +
        '<div class="admin-testi-actions">' +
          '<button class="btn btn-delete" data-id="' + a.id + '">Delete</button>' +
        '</div>';
      adminAppointments.appendChild(row);
    });
    adminAppointments.querySelectorAll('.btn-delete').forEach(function(btn) {
      btn.addEventListener('click', deleteAppointment);
    });
    adminAppointments.querySelectorAll('[data-testi]').forEach(function(btn) {
      btn.addEventListener('click', function() {
        var box = document.getElementById('testi-box-' + btn.dataset.testi);
        if (!box) return;
        var hidden = box.style.display === 'none';
        box.style.display = hidden ? '' : 'none';
        btn.textContent = hidden ? 'Hide Testimonial' : 'Show Testimonial';
      });
    });
  } catch (err) {
    adminAppointments.innerHTML = '<p style="color:#c44; font-size:13px;">Failed to load appointments.</p>';
  }
}

function populateCustomerSelect(appointments) {
  if (!customerSelect) return;
  const previous = customerSelect.value;
  customerSelect.innerHTML = '<option value="">Post in gallery only</option>';
  const seen = {};
  appointments.forEach(function(a) {
    if (!a.email || seen[a.email]) return;
    seen[a.email] = true;
    const opt = document.createElement('option');
    opt.value = a.email;
    opt.textContent = a.name + ' — ' + a.email;
    customerSelect.appendChild(opt);
  });
  if (previous && seen[previous]) customerSelect.value = previous;
}

async function deleteAppointment(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  if (!confirm('Delete this appointment?')) return;
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const res = await window.apiFetch('/appointments/' + id, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (res.status === 401) {
      alert('Session expired. Please log in again.');
      showLogin();
      return;
    }
    if (!res.ok) {
      alert(data.message || 'Delete failed');
      btn.disabled = false;
      btn.textContent = 'Delete';
      return;
    }
    loadAdminAppointments();
  } catch (err) {
    alert('Network error');
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
}

// ==================== TESTIMONIALS MANAGER ====================
const adminTestimonials = document.getElementById('adminTestimonials');
const testiCount = document.getElementById('testiCount');

async function loadAdminTestimonials() {
  if (!adminTestimonials) return;
  adminTestimonials.innerHTML = '<p style="color:#888; font-size:13px;">Loading...</p>';
  try {
    const res = await window.apiFetch('/comments');
    const data = await res.json();
    const comments = data.comments || [];
    if (comments.length === 0) {
      adminTestimonials.innerHTML = '<p style="color:#888; font-size:13px;">No testimonials yet. They will appear here once visitors post them.</p>';
      return;
    }
    const featuredCount = comments.filter(function(c) { return c.featured; }).length;
    if (testiCount) testiCount.textContent = 'Showing on homepage: ' + featuredCount + ' / 3';
    adminTestimonials.innerHTML = '';
    comments.forEach(function(c) {
      const row = document.createElement('div');
      row.className = 'admin-testi-row';
      const loc = c.location ? ' · ' + esc(c.location) : '';
      row.innerHTML =
        '<div class="admin-testi-info">' +
          '<span class="admin-photo-cat">' + esc(c.name) + loc + '</span>' +
          '<p class="admin-testi-text">' + esc(c.text) + '</p>' +
        '</div>' +
        '<div class="admin-testi-actions">' +
          '<button class="btn ' + (c.featured ? 'btn-ghost' : 'btn-edit') + '" data-id="' + c.id + '">' + (c.featured ? 'Remove from homepage' : 'Show on homepage') + '</button>' +
          '<button class="btn btn-delete" data-id="' + c.id + '">Delete</button>' +
        '</div>';
      adminTestimonials.appendChild(row);
    });
    adminTestimonials.querySelectorAll('.btn-delete').forEach(function(btn) {
      btn.addEventListener('click', deleteTestimonial);
    });
    adminTestimonials.querySelectorAll('.btn-edit, .btn-ghost').forEach(function(btn) {
      btn.addEventListener('click', toggleFeatured);
    });
  } catch (err) {
    adminTestimonials.innerHTML = '<p style="color:#c44; font-size:13px;">Failed to load testimonials.</p>';
  }
}

async function toggleFeatured(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  const makeFeatured = btn.textContent.indexOf('Show on homepage') !== -1;
  btn.disabled = true;
  try {
    const res = await window.apiFetch('/comments/' + id, {
      method: 'PUT',
      headers: Object.assign(authHeaders(), { 'Content-Type': 'application/json' }),
      body: JSON.stringify({ featured: makeFeatured }),
    });
    const data = await res.json();
    if (res.status === 401) {
      alert('Session expired. Please log in again.');
      showLogin();
      return;
    }
    if (!res.ok) {
      alert(data.message || 'Update failed');
      loadAdminTestimonials();
      return;
    }
    loadAdminTestimonials();
  } catch (err) {
    alert('Network error');
    loadAdminTestimonials();
  }
}

async function deleteTestimonial(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.id;
  if (!confirm('Delete this testimonial?')) return;
  btn.disabled = true;
  btn.textContent = '...';
  try {
    const res = await window.apiFetch('/comments/' + id, {
      method: 'DELETE',
      headers: authHeaders(),
    });
    const data = await res.json();
    if (res.status === 401) {
      alert('Session expired. Please log in again.');
      showLogin();
      return;
    }
    if (!res.ok) {
      alert(data.message || 'Delete failed');
      btn.disabled = false;
      btn.textContent = 'Delete';
      return;
    }
    loadAdminTestimonials();
  } catch (err) {
    alert('Network error');
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
}

// ==================== HOMEPAGE CONTENT EDITOR ====================
// Current site text. Used to prefill the editor so the boxes are never
// blank (even before the backend responds).
const ADMIN_DEFAULTS = {
  nav: {
    home: 'Home', about: 'About', portfolio: 'Portfolio', films: 'Cinematic Films',
    packages: 'Packages', testimonials: 'Testimonials', contact: 'Contact',
  },
  hero: {
    tag: 'Wedding Photography & Cinematography · Rewa, MP',
    heading1: 'Stories',
    heading2: 'Worth Replaying',
    sub: 'In Films turns your wedding day into a cinematic film and a lifetime of photographs — shot with intention, edited with restraint, remembered forever.',
    locations: 'Based in Rewa · Shooting across Indore · Mumbai · Punjab · & beyond',
    cta1: 'Book Your Date',
    cta2: 'Watch Our Films',
  },
  about: {
    label: 'Scene 01 — The Studio',
    heading: 'A Rewa-based crew, chasing weddings across India',
    lede: 'In Films is a wedding photography and cinematography studio based in Rewa, Madhya Pradesh, serving couples across the country.',
    p1: 'We specialise in timeless photographs and cinematic wedding films that capture genuine emotion over posed perfection — the shaky laugh during the vows, the father\'s hand on his daughter\'s shoulder, the first look no one rehearsed.',
    p2: 'Every frame is shot on professional Lumix cameras and cut together with the same patience a film editor gives a feature — because a wedding, like a film, deserves a real edit, not a template.',
    statNum: '3',
    statLabel: 'States Covered This Season',
    why: [
      'Experienced wedding crew',
      'Cinematic storytelling',
      'High-end Lumix cameras',
      'Destination wedding coverage',
      'Fast, dependable delivery',
      'Personalised planning',
    ],
  },
  services: {
    label: 'Scene 02 — What We Shoot',
    heading: 'Coverage for every chapter of the wedding',
    text: 'From the first haldi splash to the last dance, In Films builds a coverage plan around how your two families actually celebrate.',
    items: [
      { title: 'Wedding Photography', text: 'Full-day documentation of every ceremony, in natural light and natural colour.' },
      { title: 'Wedding Cinematography', text: 'A cinematic film of your wedding, cut like a short story with a beginning and an end.' },
      { title: 'Pre-Wedding Shoots', text: 'Location-led shoots designed around you as a couple, not a template pose list.' },
      { title: 'Engagement Photography', text: 'Relaxed, candid coverage of the ring ceremony and the moments around it.' },
      { title: 'Candid Photography', text: 'Unposed, in-between moments shot quietly from the edge of the room.' },
      { title: 'Traditional Photography', text: 'Classic, well-lit ceremony and family portraits for the album your parents will keep.' },
      { title: 'Bridal & Groom Portraits', text: 'Dedicated portrait sessions that give the day\'s main characters their close-up.' },
      { title: 'Wedding Reels', text: 'Short, shareable highlight reels cut for Instagram, ready within days.' },
      { title: 'Event & Product Coverage', text: 'Sangeet, receptions and jewellery or product shoots, covered with the same eye.' },
    ],
  },
  equipment: {
    label: 'Scene 03 — Behind the Lens',
    heading: 'Shot on professional Panasonic Lumix bodies',
    items: [
      { name: 'Panasonic Lumix S1', tag: 'Full-Frame Cinema' },
      { name: 'Panasonic Lumix S1R', tag: 'High-Res Portraits' },
      { name: 'Panasonic Lumix S5IIX', tag: 'Hybrid Video Body' },
    ],
  },
  films: {
    label: 'Scene 04 — Cinematic Films',
    heading: 'Wedding films, cut like short stories',
    text: 'Every wedding gets a highlight film with its own pace and score — not a stock template stretched over your footage. Full films are linked on our YouTube channel.',
    cta: 'See Full Films on YouTube',
  },
  packages: {
    label: 'Scene 05 — Packages',
    heading: 'Coverage built around your wedding, not a price list',
    text: 'Every wedding is different, so every quote is custom — these three starting points show how coverage typically scales. Reach out for exact pricing.',
    cards: [
      { name: 'Essential', badge: '', sub: 'Single-Day Coverage', bullets: ['One-day photography', 'Candid + traditional coverage', 'Edited high-resolution photos', 'Instagram-ready reel'], cta: 'Enquire' },
      { name: 'Signature', badge: 'Most Booked', sub: 'Full Wedding Film + Photos', bullets: ['Multi-day photo + film coverage', 'Cinematic wedding film', 'Candid, traditional & portrait sets', 'Highlight reel + full film', 'Priority delivery'], cta: 'Enquire' },
      { name: 'Destination', badge: '', sub: 'Travel & Multi-Event', bullets: ['Coverage outside Madhya Pradesh', 'Pre-wedding + wedding + reception', 'Full crew travel included', 'Complete cinematic film'], cta: 'Enquire' },
    ],
    note: 'Jewellery/product shoots and album printing available on request.',
  },
  testimonials: {
    label: 'Scene 06 — Testimonials',
    heading: 'In the couples\' own words',
    seeAll: 'See All Testimonials',
    formTitle: 'Shared your wedding with us? Write a testimonial',
  },
  contact: {
    label: 'Scene 07 — Get In Touch',
    heading: 'Let\'s talk about your wedding date',
    text: 'Tell us your date and city and we\'ll walk you through coverage options — most couples hear back within a day.',
    ig: 'DM us @infilms9862',
    yt: 'Watch us on YouTube',
    location: 'Rewa, Madhya Pradesh, India',
  },
  footer: {
    tagline: 'Wedding photography & cinematography, based in Rewa — shooting across India.',
    ig: 'IG',
    yt: 'YT',
    copyright: '© 2026 In Films. All rights reserved.',
    cities: 'Rewa · Indore · Mumbai · Punjab',
  },
  portfolio: {
    hero1: 'Recent',
    hero2: 'Frames',
    heroText: 'A mix of weddings, pre-wedding shoots and engagements from real couples across India.',
    galleryLabel: 'The Gallery',
    galleryHeading: 'Browse by category',
    galleryText: 'Filter by category to see how each kind of shoot is treated differently.',
    filterAll: 'All',
    moreLabel: 'Full Gallery',
    moreHeading: 'Want to see more?',
    moreText: 'Browse the complete collection of our recent work — full albums from weddings, pre-weddings and engagements.',
    moreCta: 'Tap to See More →',
  },
  comments: {
    hero1: 'In their',
    hero2: 'Own Words',
    heroText: 'Every testimonial here is from a real couple. Read the full list — and if we shot your wedding, add your own.',
    writeLabel: 'Add Your Testimonial',
    writeHeading: 'Shared your big day with us?',
    writeText: 'Tell others what it was like. It takes a minute.',
    nameLabel: 'Your name',
    namePlaceholder: 'e.g. Aditi Sharma',
    emailLabel: 'Email (for your testimonial)',
    emailPlaceholder: 'e.g. you@example.com',
    locationLabel: 'City / location',
    locationPlaceholder: 'e.g. Rewa, Madhya Pradesh',
    textLabel: 'Your testimonial',
    textPlaceholder: 'What was your experience like?',
    submitBtn: 'Submit Testimonial',
    allLabel: 'All Testimonials',
    allHeading: 'What couples say',
  },
  booking: {
    label: 'Book Your Shoot',
    heading: 'Reserve your date',
    text: 'Tell us when you need us and a little about the day — we\'ll confirm availability and lock in your date.',
    nameLabel: 'Your name',
    namePlaceholder: 'e.g. Aditi Sharma',
    phoneLabel: 'Phone number',
    phonePlaceholder: 'e.g. +91 98765 43210',
    emailLabel: 'Email (so we can find you)',
    emailPlaceholder: 'e.g. you@example.com',
    locationLabel: 'City / location',
    locationPlaceholder: 'e.g. Rewa, Madhya Pradesh',
    dateFromLabel: 'Preferred photoshoot — from',
    dateToLabel: 'to',
    descLabel: 'What do you need?',
    descPlaceholder: 'A short note about your wedding or shoot...',
    submitBtn: 'Book Appointment',
  },
};

const siteSchema = [
  { key: 'nav', title: 'Navigation', fields: [
    { key: 'home', label: 'Home link', type: 'text' },
    { key: 'about', label: 'About link', type: 'text' },
    { key: 'portfolio', label: 'Portfolio link', type: 'text' },
    { key: 'films', label: 'Cinematic Films link', type: 'text' },
    { key: 'packages', label: 'Packages link', type: 'text' },
    { key: 'testimonials', label: 'Testimonials link', type: 'text' },
    { key: 'contact', label: 'Contact link', type: 'text' },
  ]},
  { key: 'hero', title: 'Hero', fields: [
    { key: 'tag', label: 'Tagline', type: 'text' },
    { key: 'heading1', label: 'Heading — line 1', type: 'text' },
    { key: 'heading2', label: 'Heading — line 2 (gold)', type: 'text' },
    { key: 'sub', label: 'Sub paragraph', type: 'textarea' },
    { key: 'locations', label: 'Locations line', type: 'text' },
    { key: 'cta1', label: 'Button 1 (Book Your Date)', type: 'text' },
    { key: 'cta2', label: 'Button 2 (Watch Our Films)', type: 'text' },
  ]},
  { key: 'about', title: 'About (Scene 01)', fields: [
    { key: 'label', label: 'Scene label', type: 'text' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'lede', label: 'Intro paragraph', type: 'textarea' },
    { key: 'p1', label: 'Paragraph 2', type: 'textarea' },
    { key: 'p2', label: 'Paragraph 3', type: 'textarea' },
    { key: 'statNum', label: 'Stat — number', type: 'text' },
    { key: 'statLabel', label: 'Stat — label', type: 'text' },
  ]},
  { key: 'services', title: 'Services (Scene 02)', fields: [
    { key: 'label', label: 'Scene label', type: 'text' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'text', label: 'Intro paragraph', type: 'textarea' },
  ]},
  { key: 'equipment', title: 'Equipment (Scene 03)', fields: [
    { key: 'label', label: 'Scene label', type: 'text' },
    { key: 'heading', label: 'Heading', type: 'text' },
  ]},
  { key: 'films', title: 'Cinematic Films (Scene 04)', fields: [
    { key: 'label', label: 'Scene label', type: 'text' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'text', label: 'Intro paragraph', type: 'textarea' },
    { key: 'cta', label: 'YouTube button text', type: 'text' },
  ]},
  { key: 'packages', title: 'Packages (Scene 05)', fields: [
    { key: 'label', label: 'Scene label', type: 'text' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'text', label: 'Intro paragraph', type: 'textarea' },
    { key: 'note', label: 'Note under the cards', type: 'text' },
  ]},
  { key: 'testimonials', title: 'Testimonials (Scene 06)', fields: [
    { key: 'label', label: 'Scene label', type: 'text' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'seeAll', label: '"See All Testimonials" button', type: 'text' },
    { key: 'formTitle', label: '"Write a testimonial" heading', type: 'text' },
  ]},
  { key: 'contact', title: 'Contact (Scene 07)', fields: [
    { key: 'label', label: 'Scene label', type: 'text' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'text', label: 'Intro paragraph', type: 'textarea' },
    { key: 'ig', label: 'Instagram line', type: 'text' },
    { key: 'yt', label: 'YouTube line', type: 'text' },
    { key: 'location', label: 'Location line', type: 'text' },
    { key: 'address', label: 'Full address', type: 'textarea', rows: 2 },
    { key: 'directions', label: 'Get Directions link text', type: 'text' },
  ]},
  { key: 'footer', title: 'Footer', fields: [
    { key: 'tagline', label: 'Footer tagline', type: 'text' },
    { key: 'ig', label: 'Footer IG link', type: 'text' },
    { key: 'yt', label: 'Footer YT link', type: 'text' },
    { key: 'copyright', label: 'Copyright line', type: 'text' },
    { key: 'cities', label: 'Cities line', type: 'text' },
  ]},
  { key: 'portfolio', title: 'Portfolio Page', fields: [
    { key: 'hero1', label: 'Page heading — line 1', type: 'text' },
    { key: 'hero2', label: 'Page heading — line 2 (gold)', type: 'text' },
    { key: 'heroText', label: 'Intro paragraph', type: 'textarea' },
    { key: 'galleryLabel', label: 'Gallery — scene label', type: 'text' },
    { key: 'galleryHeading', label: 'Gallery — heading', type: 'text' },
    { key: 'galleryText', label: 'Gallery — paragraph', type: 'textarea' },
    { key: 'filterAll', label: 'Filter: All', type: 'text' },
    { key: 'moreLabel', label: '"See more" — scene label', type: 'text' },
    { key: 'moreHeading', label: '"See more" — heading', type: 'text' },
    { key: 'moreText', label: '"See more" — paragraph', type: 'textarea' },
    { key: 'moreCta', label: '"See more" — button', type: 'text' },
  ]},
  { key: 'comments', title: 'Testimonials Page', fields: [
    { key: 'hero1', label: 'Page heading — line 1', type: 'text' },
    { key: 'hero2', label: 'Page heading — line 2 (gold)', type: 'text' },
    { key: 'heroText', label: 'Intro paragraph', type: 'textarea' },
    { key: 'writeLabel', label: 'Write section — scene label', type: 'text' },
    { key: 'writeHeading', label: 'Write section — heading', type: 'text' },
    { key: 'writeText', label: 'Write section — paragraph', type: 'textarea' },
    { key: 'nameLabel', label: 'Form: name label', type: 'text' },
    { key: 'namePlaceholder', label: 'Form: name placeholder', type: 'text' },
    { key: 'emailLabel', label: 'Form: email label', type: 'text' },
    { key: 'emailPlaceholder', label: 'Form: email placeholder', type: 'text' },
    { key: 'locationLabel', label: 'Form: location label', type: 'text' },
    { key: 'locationPlaceholder', label: 'Form: location placeholder', type: 'text' },
    { key: 'textLabel', label: 'Form: testimonial label', type: 'text' },
    { key: 'textPlaceholder', label: 'Form: testimonial placeholder', type: 'text' },
    { key: 'submitBtn', label: 'Form: submit button', type: 'text' },
    { key: 'allLabel', label: 'All testimonials — scene label', type: 'text' },
    { key: 'allHeading', label: 'All testimonials — heading', type: 'text' },
  ]},
  { key: 'booking', title: 'Book Appointment Section', fields: [
    { key: 'label', label: 'Scene label', type: 'text' },
    { key: 'heading', label: 'Heading', type: 'text' },
    { key: 'text', label: 'Intro paragraph', type: 'textarea' },
    { key: 'nameLabel', label: 'Form: name label', type: 'text' },
    { key: 'namePlaceholder', label: 'Form: name placeholder', type: 'text' },
    { key: 'phoneLabel', label: 'Form: phone label', type: 'text' },
    { key: 'phonePlaceholder', label: 'Form: phone placeholder', type: 'text' },
    { key: 'emailLabel', label: 'Form: email label', type: 'text' },
    { key: 'emailPlaceholder', label: 'Form: email placeholder', type: 'text' },
    { key: 'locationLabel', label: 'Form: location label', type: 'text' },
    { key: 'locationPlaceholder', label: 'Form: location placeholder', type: 'text' },
    { key: 'dateFromLabel', label: 'Form: date "from" label', type: 'text' },
    { key: 'dateToLabel', label: 'Form: date "to" label', type: 'text' },
    { key: 'descLabel', label: 'Form: description label', type: 'text' },
    { key: 'descPlaceholder', label: 'Form: description placeholder', type: 'text' },
    { key: 'submitBtn', label: 'Form: submit button', type: 'text' },
  ]},
];

function siteEditorDefault(path) {
  const val = pathGet(ADMIN_DEFAULTS, path);
  return val == null ? '' : val;
}

function siteEditorInput(path, type, rows) {
  const def = siteEditorDefault(path);
  const attrs = 'data-site-field="' + path + '" data-default="' + esc(def) + '"';
  return type === 'textarea'
    ? '<textarea ' + attrs + ' rows="' + (rows || 3) + '"></textarea>'
    : '<input ' + attrs + ' type="text">';
}

function siteEditorField(path, label, type, rows) {
  return '<div class="form-group"><label>' + esc(label) + '</label>' + siteEditorInput(path, type, rows) + '</div>';
}

function siteEditorSubHead(text) {
  return '<div class="site-sub-head">' + esc(text) + '</div>';
}

function buildSiteEditor() {
  const wrap = document.getElementById('siteEditorFields');
  if (!wrap) return;
  let html = '';
  siteSchema.forEach(function(group) {
    html += '<div class="site-group">';
    html += '<button type="button" class="site-group-toggle">' + esc(group.title) + ' <span>▾</span></button>';
    html += '<div class="site-group-body">';
    group.fields.forEach(function(f) {
      html += siteEditorField(group.key + '.' + f.key, f.label, f.type, f.rows);
    });

    if (group.key === 'about') {
      html += '<div class="site-group-note">The 6 feature bullets shown next to the about text.</div>';
      for (let i = 0; i < 6; i++) {
        html += siteEditorSubHead('Feature bullet ' + (i + 1));
        html += siteEditorField('about.why.' + i, 'Bullet text', 'text');
      }
    }

    if (group.key === 'services') {
      html += '<div class="site-group-note">The 9 coverage cards below each have a heading and a paragraph.</div>';
      for (let i = 0; i < 9; i++) {
        html += siteEditorSubHead('Service Card ' + (i + 1));
        html += siteEditorField('services.items.' + i + '.title', 'Card heading', 'text');
        html += siteEditorField('services.items.' + i + '.text', 'Card paragraph', 'textarea', 2);
      }
    }

    if (group.key === 'equipment') {
      html += '<div class="site-group-note">The 3 cameras listed behind the lens.</div>';
      for (let i = 0; i < 3; i++) {
        html += siteEditorSubHead('Camera ' + (i + 1));
        html += siteEditorField('equipment.items.' + i + '.name', 'Camera name', 'text');
        html += siteEditorField('equipment.items.' + i + '.tag', 'Tag line', 'text');
      }
    }

    if (group.key === 'packages') {
      html += '<div class="site-group-note">The 3 package cards. Add or clear the badge text as needed.</div>';
      for (let i = 0; i < 3; i++) {
        html += siteEditorSubHead('Package Card ' + (i + 1));
        html += siteEditorField('packages.cards.' + i + '.name', 'Package name', 'text');
        html += siteEditorField('packages.cards.' + i + '.badge', 'Badge (leave blank for none)', 'text');
        html += siteEditorField('packages.cards.' + i + '.sub', 'Card heading', 'text');
        (ADMIN_DEFAULTS.packages.cards[i].bullets).forEach(function(b, j) {
          html += siteEditorField('packages.cards.' + i + '.bullets.' + j, 'Bullet ' + (j + 1), 'text');
        });
        html += siteEditorField('packages.cards.' + i + '.cta', 'Button text', 'text');
      }
    }

    html += '</div></div>';
  });
  wrap.innerHTML = html;
  wrap.querySelectorAll('.site-group-toggle').forEach(function(btn) {
    btn.addEventListener('click', function() {
      const body = btn.nextElementSibling;
      const hidden = body.style.display === 'none' || body.style.display === '';
      body.style.display = hidden ? 'block' : 'none';
      btn.querySelector('span').textContent = hidden ? '▾' : '▸';
    });
  });
  // Open the Hero section by default so the current homepage text is visible first.
  Array.prototype.forEach.call(wrap.querySelectorAll('.site-group'), function(g) {
    const title = g.querySelector('.site-group-toggle');
    if (title && title.textContent.indexOf('Hero') !== -1) {
      g.querySelector('.site-group-body').style.display = 'block';
      title.querySelector('span').textContent = '▾';
    }
  });
}

function pathGet(obj, path) {
  return String(path).split('.').reduce(function(o, k) { return o == null ? o : o[k]; }, obj);
}

function fillSiteEditor(site) {
  const inputs = document.querySelectorAll('[data-site-field]');
  Array.prototype.forEach.call(inputs, function(input) {
    const val = pathGet(site, input.getAttribute('data-site-field'));
    if (val == null) {
      input.value = input.getAttribute('data-default') || '';
    } else {
      input.value = val;
    }
  });
}

function pathSet(obj, path, val) {
  const parts = String(path).split('.');
  let cur = obj;
  parts.forEach(function(p, i) {
    if (i === parts.length - 1) {
      cur[p] = val;
      return;
    }
    const isArr = /^\d+$/.test(parts[i + 1]);
    if (cur[p] == null) cur[p] = isArr ? [] : {};
    cur = cur[p];
  });
}

function collectSiteEditor() {
  const out = {};
  const inputs = document.querySelectorAll('[data-site-field]');
  Array.prototype.forEach.call(inputs, function(input) {
    pathSet(out, input.getAttribute('data-site-field'), input.value.trim());
  });
  return out;
}

const siteSaveBtn = document.getElementById('siteSaveBtn');
const siteMsg = document.getElementById('siteMsg');

async function loadSiteContent() {
  if (!document.getElementById('siteEditorFields')) return;
  buildSiteEditor();
  try {
    const res = await window.apiFetch('/site');
    const site = await res.json();
    fillSiteEditor(site);
  } catch (err) {
    msg(siteMsg, 'Could not load current content.', false);
  }
}

if (siteSaveBtn) {
  siteSaveBtn.addEventListener('click', async function() {
    siteSaveBtn.disabled = true;
    siteSaveBtn.textContent = 'Saving...';
    msg(siteMsg, '', false);
    try {
      const payload = collectSiteEditor();
      const res = await window.apiFetch('/site', {
        method: 'PUT',
        headers: Object.assign(authHeaders(), { 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.status === 401) {
        msg(siteMsg, 'Session expired. Please log in again.', false);
        showLogin();
        return;
      }
      if (!res.ok) {
        msg(siteMsg, data.message || 'Save failed', false);
        return;
      }
      msg(siteMsg, 'Content saved. Your homepage is updated.', true);
    } catch (err) {
      msg(siteMsg, 'Network error', false);
    } finally {
      siteSaveBtn.disabled = false;
      siteSaveBtn.textContent = 'Save Content';
    }
  });
}

// Start the dashboard if a token is already saved (must run after all the
// const element lookups above so nothing hits the false-dead-zone).
if (token) {
  showDashboard();
}