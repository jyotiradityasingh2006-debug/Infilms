// Hero background photos: the slideshow behind the homepage heading. The order
// here is the order visitors see, capped at the server's max.
(function () {
  var Shell = window.AdminShell;
  if (!Shell.requireAuth()) return;

  var heroList = document.getElementById('heroList');
  var heroCount = document.getElementById('heroCount');
  var heroUploadForm = document.getElementById('heroUploadForm');
  var heroFileInput = document.getElementById('heroFileInput');
  var heroUrlInput = document.getElementById('heroUrlInput');
  var heroUploadBtn = document.getElementById('heroUploadBtn');
  var heroAddUrlBtn = document.getElementById('heroAddUrlBtn');
  var heroMsg = document.getElementById('heroMsg');

  var heroImages = [];
  var heroMax = 5;

  function authHeaders(extra) {
    return Shell.authHeaders(extra);
  }

  function renderHeroImages() {
    if (heroCount) heroCount.textContent = heroImages.length + ' / ' + heroMax + ' in rotation';

    var atLimit = heroImages.length >= heroMax;
    if (heroUploadBtn) {
      heroUploadBtn.disabled = atLimit;
      heroUploadBtn.textContent = atLimit ? 'Limit reached' : 'Upload';
    }
    if (heroAddUrlBtn) heroAddUrlBtn.disabled = atLimit;
    if (heroFileInput) heroFileInput.disabled = atLimit;

    if (heroImages.length === 0) {
      heroList.innerHTML = '<p class="mini-empty">No background photos yet. Until you add one, the homepage heading sits on a plain dark background.</p>';
      return;
    }

    heroList.innerHTML = '';
    heroImages.forEach(function (img, i) {
      var row = document.createElement('div');
      row.className = 'hero-row';
      row.innerHTML =
        '<img src="' + Shell.esc(img.url) + '" alt="" loading="lazy">' +
        '<div class="hero-row-info">' +
          '<span class="admin-photo-cat">Position ' + (i + 1) + ' of ' + heroImages.length + '</span>' +
          '<input type="url" class="hero-url-input" data-index="' + i + '" value="' + Shell.esc(img.url) + '">' +
        '</div>' +
        '<div class="hero-row-actions">' +
          '<button class="btn btn-edit" data-move="-1" data-index="' + i + '"' + (i === 0 ? ' disabled' : '') + ' title="Move earlier">&uarr;</button>' +
          '<button class="btn btn-edit" data-move="1" data-index="' + i + '"' + (i === heroImages.length - 1 ? ' disabled' : '') + ' title="Move later">&darr;</button>' +
          '<button class="btn btn-delete" data-index="' + i + '">Remove</button>' +
        '</div>';
      heroList.appendChild(row);
    });
  }

  async function loadHeroImages() {
    try {
      var res = await window.apiFetch('/hero-images');
      var data = await res.json();
      heroImages = Array.isArray(data.images) ? data.images : [];
      if (typeof data.max === 'number') heroMax = data.max;
      renderHeroImages();
    } catch (err) {
      heroList.innerHTML = '<p class="mini-empty">Failed to load background photos.</p>';
    }
  }

  // Persists the list as-is. Called after add/remove/reorder/link edits.
  async function saveHeroList(quiet) {
    try {
      var res = await window.apiFetch('/hero-images', {
        method: 'PUT',
        headers: authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ images: heroImages }),
      });
      if (res.status === 401) {
        Shell.msg(heroMsg, 'Session expired. Please log in again.', false);
        Shell.sessionExpired();
        return false;
      }
      var data = await res.json();
      if (!res.ok) {
        Shell.msg(heroMsg, data.message || 'Save failed', false);
        renderHeroImages();
        return false;
      }
      heroImages = Array.isArray(data.images) ? data.images : heroImages;
      if (typeof data.max === 'number') heroMax = data.max;
      renderHeroImages();
      if (!quiet) Shell.msg(heroMsg, 'Saved. Your homepage heading now uses these photos.', true);
      return true;
    } catch (err) {
      Shell.msg(heroMsg, 'Network error', false);
      return false;
    }
  }

  function moveHeroImage(index, dir) {
    var target = index + dir;
    if (target < 0 || target >= heroImages.length) return;
    var moved = heroImages.splice(index, 1)[0];
    heroImages.splice(target, 0, moved);
    renderHeroImages();
    saveHeroList(true);
  }

  async function removeHeroImage(index, btn) {
    var img = heroImages[index];
    if (!img) return;
    if (!confirm('Remove this background photo from the homepage heading?')) return;
    btn.disabled = true;
    btn.textContent = '...';
    try {
      var res = await window.apiFetch('/hero-images/' + index, { method: 'DELETE', headers: authHeaders() });
      if (res.status === 401) {
        Shell.msg(heroMsg, 'Session expired. Please log in again.', false);
        Shell.sessionExpired();
        return;
      }
      var data = await res.json();
      if (!res.ok) {
        Shell.msg(heroMsg, data.message || 'Remove failed', false);
        renderHeroImages();
        return;
      }
      heroImages = Array.isArray(data.images) ? data.images : [];
      if (typeof data.max === 'number') heroMax = data.max;
      renderHeroImages();
      Shell.msg(heroMsg, 'Background photo removed.', true);
    } catch (err) {
      Shell.msg(heroMsg, 'Network error', false);
      renderHeroImages();
    }
  }

  // Only http(s) links are accepted — the URL is used as a CSS background.
  function validHeroUrl(value) {
    return /^https?:\/\/\S+$/.test(String(value || '').trim());
  }

  heroList.addEventListener('click', function (e) {
    var btn = e.target.closest('button');
    if (!btn || btn.disabled) return;
    var index = parseInt(btn.getAttribute('data-index'), 10);
    if (isNaN(index)) return;
    if (btn.hasAttribute('data-move')) {
      moveHeroImage(index, parseInt(btn.getAttribute('data-move'), 10));
      return;
    }
    removeHeroImage(index, btn);
  });

  // Editing the link in place saves on blur / Enter, so the list is never
  // half-typed when the visitor refreshes the homepage.
  heroList.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var input = e.target.closest('.hero-url-input');
    if (input) input.blur();
  });
  heroList.addEventListener('focusout', function (e) {
    var input = e.target.closest('.hero-url-input');
    if (!input) return;
    var index = parseInt(input.getAttribute('data-index'), 10);
    var value = input.value.trim();
    if (isNaN(index) || !heroImages[index]) return;
    if (value === heroImages[index].url) return;
    if (!validHeroUrl(value)) {
      Shell.msg(heroMsg, 'That does not look like a valid http(s) image link — keeping the previous one.', false);
      input.value = heroImages[index].url;
      return;
    }
    heroImages[index].url = value;
    saveHeroList(true);
  });

  heroUploadForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var files = Array.from(heroFileInput.files);
    var url = heroUrlInput.value.trim();
    if (files.length === 0 && !url) return;

    if (heroImages.length >= heroMax) {
      Shell.msg(heroMsg, 'You can keep ' + heroMax + ' background photos. Remove one first.', false);
      return;
    }

    heroUploadBtn.disabled = true;
    heroUploadBtn.textContent = 'Uploading...';
    Shell.msg(heroMsg, '', false);
    try {
      if (url) {
        if (!validHeroUrl(url)) {
          Shell.msg(heroMsg, 'Enter a full image link starting with https://', false);
          return;
        }
        heroImages.push({ url: url, public_id: '' });
        var ok = await saveHeroList(true);
        if (!ok) return;
        heroUrlInput.value = '';
        Shell.msg(heroMsg, 'Background photo added.', true);
      } else {
        var fd = new FormData();
        files.forEach(function (f) { fd.append('images', f); });
        var res = await window.apiFetch('/hero-images', { method: 'POST', headers: authHeaders(), body: fd });
        if (res.status === 401) {
          Shell.msg(heroMsg, 'Session expired. Please log in again.', false);
          Shell.sessionExpired();
          return;
        }
        var data = await res.json();
        if (!res.ok) {
          Shell.msg(heroMsg, data.message || 'Upload failed', false);
          return;
        }
        heroImages = Array.isArray(data.images) ? data.images : heroImages;
        if (typeof data.max === 'number') heroMax = data.max;
        var skipped = files.length - (data.added || 0);
        Shell.msg(heroMsg, skipped > 0
          ? (data.added || 0) + ' uploaded. ' + skipped + ' skipped — the limit is ' + heroMax + ' photos.'
          : (data.added || 0) + ' background photo(s) uploaded.', true);
      }
      heroFileInput.value = '';
      renderHeroImages();
    } catch (err) {
      Shell.msg(heroMsg, 'Network error', false);
    } finally {
      heroUploadBtn.disabled = false;
      heroUploadBtn.textContent = heroImages.length >= heroMax ? 'Limit reached' : 'Upload';
    }
  });

  heroAddUrlBtn.addEventListener('click', function () {
    if (!heroUrlInput.value.trim()) {
      heroUrlInput.focus();
      return;
    }
    heroUploadForm.dispatchEvent(new Event('submit', { cancelable: true }));
  });

  loadHeroImages();
})();
