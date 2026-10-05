// Photos & Films: upload form plus a filterable grid of everything live in
// the portfolio. Category management lives on its own page.
(function () {
  var Shell = window.AdminShell;
  if (!Shell.requireAuth()) return;

  var uploadForm = document.getElementById('uploadForm');
  var mediaTypeSelect = document.getElementById('mediaTypeSelect');
  var categoryGroup = document.getElementById('categoryGroup');
  var customerGroup = document.getElementById('customerGroup');
  var categorySelect = document.getElementById('categorySelect');
  var customerSelect = document.getElementById('customerSelect');
  var fileInput = document.getElementById('fileInput');
  var fileInputHint = document.getElementById('fileInputHint');
  var uploadBtn = document.getElementById('uploadBtn');
  var uploadMsg = document.getElementById('uploadMsg');
  var adminPhotos = document.getElementById('adminPhotos');
  var filterBar = document.getElementById('filterBar');
  var photoCount = document.getElementById('photoCount');

  var lightbox = document.getElementById('lightbox');
  var lightboxBody = document.getElementById('lightboxBody');
  var lightboxCap = document.getElementById('lightboxCap');
  var lightboxClose = document.getElementById('lightboxClose');

  var VIDEO_ACCEPT = 'video/mp4,video/quicktime,video/x-m4v,video/webm,video/x-msvideo,video/mpeg,video/3gpp,video/3gpp2';
  var IMAGE_ACCEPT = 'image/jpeg,image/png,image/webp,image/gif,image/avif';

  var photos = [];
  var categories = [];
  var activeFilter = 'all';

  function authHeaders(extra) {
    return Shell.authHeaders(extra);
  }

  function formatDuration(sec) {
    var s = Math.round(Number(sec) || 0);
    if (!s) return '';
    var m = Math.floor(s / 60);
    var r = s % 60;
    return m + ':' + (r < 10 ? '0' + r : r);
  }

  function categoryNameOf(key) {
    var found = categories.find(function (c) { return c.key === key; });
    return found ? found.name : key;
  }

  // ==================== MEDIA TYPE TOGGLE ====================
  function setupMediaTypeToggle() {
    if (!mediaTypeSelect) return;
    mediaTypeSelect.addEventListener('change', function () {
      var isVideo = mediaTypeSelect.value === 'video';
      if (categoryGroup) categoryGroup.style.display = isVideo ? 'none' : '';
      if (customerGroup) customerGroup.style.display = isVideo ? 'none' : '';
      fileInput.accept = isVideo ? VIDEO_ACCEPT : IMAGE_ACCEPT;
      fileInput.multiple = !isVideo;
      fileInput.value = '';
      if (fileInputHint) {
        fileInputHint.textContent = isVideo
          ? 'Select one film (MP4/MOV/WebM/AVI, max 10 minutes).'
          : 'Select one or more images to upload at once.';
      }
    });
  }

  // ==================== UPLOAD ====================
  uploadForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var files = Array.from(fileInput.files);
    if (files.length === 0) return;
    uploadBtn.disabled = true;
    uploadMsg.className = 'admin-msg';
    uploadMsg.textContent = '';

    var succeeded = 0;
    var failed = 0;
    var lastError = '';

    for (var i = 0; i < files.length; i++) {
      uploadBtn.textContent = 'Uploading ' + (i + 1) + ' of ' + files.length + '...';
      var fd = new FormData();
      fd.append('image', files[i]);
      fd.append('category', categorySelect.value);
      if (customerSelect && customerSelect.value) fd.append('customer', customerSelect.value);
      try {
        var res = await window.apiFetch('/photos', {
          method: 'POST',
          headers: authHeaders(),
          body: fd,
        });
        if (res.status === 401) {
          Shell.msg(uploadMsg, 'Session expired. Please log in again.', false);
          Shell.sessionExpired();
          return;
        }
        if (!res.ok) {
          failed++;
          try {
            var err = await res.json();
            if (err && err.message) lastError = err.message;
          } catch (parseErr) {
            // Keep the last known error.
          }
        } else {
          succeeded++;
        }
      } catch (err) {
        failed++;
      }
    }

    fileInput.value = '';

    if (files.length === 1) {
      var label = mediaTypeSelect && mediaTypeSelect.value === 'video' ? 'Film' : 'Photo';
      Shell.msg(uploadMsg, succeeded ? label + ' uploaded successfully!' : (lastError || label + ' upload failed.'), succeeded > 0);
    } else {
      var parts = [];
      if (succeeded) parts.push(succeeded + ' uploaded');
      if (failed) parts.push(failed + ' failed');
      Shell.msg(uploadMsg, parts.join(', '), failed === 0);
    }

    uploadBtn.disabled = false;
    uploadBtn.textContent = 'Upload';
    loadPhotos();
  });

  // ==================== FILTERS ====================
  function filterList() {
    var list = [{ key: 'all', name: 'All' }];
    var videoCount = photos.filter(function (p) { return p.type === 'video'; }).length;
    if (videoCount) list.push({ key: '__video', name: 'Films (' + videoCount + ')' });
    categories.forEach(function (c) {
      var count = photos.filter(function (p) { return p.type !== 'video' && p.category === c.key; }).length;
      list.push({ key: c.key, name: c.name + ' (' + count + ')' });
    });
    return list;
  }

  function matchesFilter(p) {
    if (activeFilter === 'all') return true;
    if (activeFilter === '__video') return p.type === 'video';
    return p.type !== 'video' && p.category === activeFilter;
  }

  function renderFilters() {
    if (!filterBar) return;
    var list = filterList();
    if (list.length <= 1) {
      filterBar.innerHTML = '';
      return;
    }
    filterBar.innerHTML = '';
    list.forEach(function (item) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'chip' + (item.key === activeFilter ? ' active' : '');
      btn.textContent = item.name;
      btn.addEventListener('click', function () {
        activeFilter = item.key;
        renderFilters();
        renderPhotos();
      });
      filterBar.appendChild(btn);
    });
  }

  // ==================== GALLERY ====================
  function renderPhotos() {
    var visible = photos.filter(matchesFilter);
    if (photoCount) {
      photoCount.textContent = photos.length
        ? visible.length + ' of ' + photos.length + ' shown'
        : 'Nothing uploaded yet';
    }
    if (visible.length === 0) {
      adminPhotos.innerHTML = photos.length
        ? '<p class="mini-empty">Nothing in this filter yet.</p>'
        : '<p class="mini-empty">No photos uploaded yet. Use the form above to add your first one.</p>';
      return;
    }
    adminPhotos.innerHTML = '';
    visible.forEach(function (p) {
      var card = document.createElement('div');
      card.className = 'media-card';
      card.dataset.pid = p.public_id;
      var isVideo = p.type === 'video';
      var duration = isVideo && p.duration ? ' ' + formatDuration(p.duration) : '';
      var media = isVideo
        ? '<video src="' + Shell.esc(p.url) + '" muted loop playsinline preload="metadata"></video>'
        : '<img src="' + Shell.esc(p.url) + '" alt="" loading="lazy">';
      card.innerHTML =
        '<div class="m-thumb" data-preview="1">' + media +
          '<span class="m-flag">' + (isVideo ? 'Film' : Shell.esc(categoryNameOf(p.category))) + duration + '</span>' +
        '</div>' +
        '<div class="m-body">' +
          '<span class="m-name">' + (isVideo ? 'Cinematic film' : Shell.esc(categoryNameOf(p.category))) + '</span>' +
          '<span class="m-id" title="' + Shell.esc(p.public_id) + '">' + Shell.esc(p.public_id) + '</span>' +
          '<button class="btn btn-delete" data-pid="' + Shell.esc(p.public_id) + '">Delete</button>' +
        '</div>';
      adminPhotos.appendChild(card);
    });

    adminPhotos.querySelectorAll('[data-preview]').forEach(function (el) {
      el.addEventListener('click', function () {
        var card = el.closest('.media-card');
        var media = photos.find(function (p) { return p.public_id === card.dataset.pid; });
        if (media) openPreview(media);
      });
    });
    adminPhotos.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', handleDelete);
    });
    adminPhotos.querySelectorAll('video').forEach(function (vid) {
      vid.addEventListener('mouseenter', function () { vid.play().catch(function () {}); });
      vid.addEventListener('mouseleave', function () { vid.pause(); });
    });
  }

  function openPreview(p) {
    lightboxBody.innerHTML = p.type === 'video'
      ? '<video src="' + Shell.esc(p.url) + '" controls autoplay playsinline></video>'
      : '<img src="' + Shell.esc(p.url) + '" alt="">';
    lightboxCap.textContent = p.type === 'video'
      ? 'Film · ' + p.public_id
      : categoryNameOf(p.category) + ' · ' + p.public_id;
    lightbox.classList.add('open');
  }

  function closePreview() {
    lightbox.classList.remove('open');
    lightboxBody.innerHTML = '';
  }

  if (lightboxClose) lightboxClose.addEventListener('click', closePreview);
  if (lightbox) {
    lightbox.addEventListener('click', function (e) {
      if (e.target === lightbox) closePreview();
    });
  }
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closePreview();
  });

  async function handleDelete(e) {
    var btn = e.currentTarget;
    var pid = btn.dataset.pid;
    if (!confirm('Delete this item? It disappears from the public site straight away.')) return;
    btn.disabled = true;
    btn.textContent = '...';
    try {
      var res = await window.apiFetch('/photos/' + pid, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (res.status === 401) {
        Shell.sessionExpired();
        return;
      }
      var data = await res.json();
      if (!res.ok) {
        alert(data.message || 'Delete failed');
        btn.disabled = false;
        btn.textContent = 'Delete';
        return;
      }
      var card = btn.closest('.media-card');
      if (card) card.remove();
      photos = photos.filter(function (p) { return p.public_id !== pid; });
      renderFilters();
      renderPhotos();
    } catch (err) {
      alert('Network error');
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  }

  // ==================== LOADERS ====================
  async function loadPhotos() {
    try {
      var res = await window.apiFetch('/photos');
      var data = await res.json();
      photos = data.photos || [];
      renderFilters();
      renderPhotos();
    } catch (err) {
      adminPhotos.innerHTML = '<p class="mini-empty">Failed to load photos.</p>';
      if (photoCount) photoCount.textContent = 'Unavailable';
    }
  }

  async function loadCategories() {
    try {
      var res = await window.apiFetch('/categories');
      var data = await res.json();
      categories = data.categories || [];
      var previous = categorySelect.value;
      categorySelect.innerHTML = '<option value="">No category (shared gallery)</option>';
      categories.forEach(function (c) {
        var opt = document.createElement('option');
        opt.value = c.key;
        opt.textContent = c.name;
        categorySelect.appendChild(opt);
      });
      if (previous && categories.some(function (c) { return c.key === previous; })) {
        categorySelect.value = previous;
      }
    } catch (err) {
      categories = [];
    }
  }

  async function loadCustomers() {
    try {
      var res = await window.apiFetch('/appointments', { headers: authHeaders() });
      if (res.status === 401) {
        Shell.sessionExpired();
        return;
      }
      var data = await res.json();
      var appointments = data.appointments || [];
      var previous = customerSelect.value;
      customerSelect.innerHTML = '<option value="">Post in gallery only</option>';
      var seen = {};
      appointments.forEach(function (a) {
        if (!a.email || seen[a.email]) return;
        seen[a.email] = true;
        var opt = document.createElement('option');
        opt.value = a.email;
        opt.textContent = a.name + ' — ' + a.email;
        customerSelect.appendChild(opt);
      });
      if (previous && seen[previous]) customerSelect.value = previous;
    } catch (err) {
      // The customer list is a convenience — the upload still works without it.
    }
  }

  setupMediaTypeToggle();
  loadCategories().then(loadPhotos);
  loadCustomers();
})();
