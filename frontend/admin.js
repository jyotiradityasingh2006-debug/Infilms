// API base URL for the deployed backend.
const API_BASE = 'https://infilms.onrender.com/api';
const API = API_BASE;

let token = localStorage.getItem('admin_token') || null;

const loginSection = document.getElementById('loginSection');
const dashboardSection = document.getElementById('dashboardSection');
const loginForm = document.getElementById('loginForm');
const passwordInput = document.getElementById('passwordInput');
const loginBtn = document.getElementById('loginBtn');
const loginMsg = document.getElementById('loginMsg');
const logoutBtn = document.getElementById('logoutBtn');
const uploadForm = document.getElementById('uploadForm');
const categorySelect = document.getElementById('categorySelect');
const fileInput = document.getElementById('fileInput');
const uploadBtn = document.getElementById('uploadBtn');
const uploadMsg = document.getElementById('uploadMsg');
const adminPhotos = document.getElementById('adminPhotos');

function show(el) { el.style.display = ''; }
function hide(el) { el.style.display = 'none'; }

function msg(el, text, ok) {
  el.textContent = text;
  el.className = 'admin-msg ' + (ok ? 'msg-ok' : 'msg-err');
}

function showDashboard() {
  hide(loginSection);
  show(dashboardSection);
  loadAdminPhotos();
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
    const res = await fetch(API + '/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ password: pw }),
    });
    const data = await res.json();
    if (!res.ok) {
      msg(loginMsg, data.message || 'Login failed', false);
      return;
    }
    token = data.token;
    localStorage.setItem('admin_token', token);
    passwordInput.value = '';
    showDashboard();
  } catch (err) {
    msg(loginMsg, 'Network error', false);
  } finally {
    loginBtn.disabled = false;
    loginBtn.textContent = 'Log In';
  }
});

logoutBtn.addEventListener('click', function() {
  showLogin();
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
    try {
      const res = await fetch(API + '/photos', {
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
    msg(uploadMsg, succeeded ? 'Photo uploaded successfully!' : 'Upload failed.', succeeded > 0);
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
    const res = await fetch(API + '/photos');
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
      card.innerHTML =
        '<img src="' + p.url + '" alt="" loading="lazy">' +
        '<div class="admin-photo-info">' +
          '<span class="admin-photo-cat">' + p.category + '</span>' +
          '<span class="admin-photo-id">' + p.public_id + '</span>' +
          '<button class="btn btn-delete" data-pid="' + p.public_id + '">Delete</button>' +
        '</div>';
      adminPhotos.appendChild(card);
    });
    adminPhotos.querySelectorAll('.btn-delete').forEach(function(btn) {
      btn.addEventListener('click', handleDelete);
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
    const res = await fetch(API + '/photos/' + pid, {
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

if (token) {
  showDashboard();
}
