window.API_BASE = window.API_BASE || (function() {
  var p = window.location;
  var isLocal = p.protocol === 'file:' || p.hostname === 'localhost' || p.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:5000/api' : p.origin + '/api';
})();

function cEsc(s) {
  const div = document.createElement('div');
  div.textContent = s == null ? '' : String(s);
  return div.innerHTML;
}

function cDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const testiList = document.getElementById('allTestiList');
const testiForm = document.getElementById('testiFormPage');
const testiBtn = document.getElementById('testiSubmitPage');
const testiMsg = document.getElementById('testiMsgPage');

async function loadAllTestimonials() {
  if (!testiList) return;
  try {
    const res = await window.apiFetch('/comments');
    const data = await res.json();
    const comments = data.comments || [];
    if (comments.length === 0) {
      testiList.innerHTML = '<p class="comment-empty">No testimonials yet — be the first to share yours above.</p>';
      return;
    }
    testiList.innerHTML = '';
    comments.forEach(function (c) {
      const item = document.createElement('div');
      item.className = 'comment-item';
      const monogram = cEsc(String(c.name).trim().charAt(0).toUpperCase() || '?');
      const loc = c.location ? '<div class="comment-date">' + cEsc(c.location) + '</div>' : '';
      const feat = c.featured ? '<span class="comment-feat">★ On homepage</span>' : '';
      const photosHtml = (c.photos && c.photos.length)
        ? '<div class="comment-photos-label">Photos from this couple\'s shoot</div>' +
          '<div class="comment-photos">' +
            c.photos.map(function (p) {
              return '<a class="comment-photo" href="' + cEsc(p.url) + '" target="_blank" rel="noopener" title="' + cEsc(p.category || 'photo') + '">' +
                '<img src="' + cEsc(p.url) + '" alt="' + cEsc(p.category || 'customer photo') + '" loading="lazy">' +
              '</a>';
            }).join('') +
          '</div>'
        : '';
      item.innerHTML =
        '<div class="comment-avatar">' + monogram + '</div>' +
        '<div class="comment-body">' +
          '<div class="comment-meta"><span class="comment-name">' + cEsc(c.name) + '</span>' +
          '<span class="comment-date">' + cEsc(cDate(c.createdAt)) + '</span>' +
          feat + '</div>' +
          loc +
          '<p class="comment-text">' + cEsc(c.text) + '</p>' +
          photosHtml +
        '</div>';
      testiList.appendChild(item);
    });
  } catch (err) {
    testiList.innerHTML = '<p style="color:#c44; font-size:13px;">Unable to load testimonials. Please try again later.</p>';
  }
}

if (testiForm && testiBtn) {
  testiForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nameEl = (document.getElementById('testiNamePage') || {}).value || '';
    const textEl = (document.getElementById('testiTextPage') || {}).value || '';
    const locEl = (document.getElementById('testiLocationPage') || {}).value || '';
    const emailEl = (document.getElementById('testiEmailPage') || {}).value || '';
    const name = nameEl.trim();
    const text = textEl.trim();
    const location = locEl.trim();
    const email = emailEl.trim();
    if (!name || !text) return;
    testiBtn.disabled = true;
    testiBtn.textContent = 'Submitting...';
    testiMsg.className = 'admin-msg';
    testiMsg.textContent = '';
    try {
      const res = await window.apiFetch('/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, text: text, location: location, email: email }),
      });
      const data = await res.json();
      if (!res.ok) {
        testiMsg.className = 'admin-msg msg-err';
        testiMsg.textContent = data.message || 'Could not submit. Please try again.';
        return;
      }
      testiMsg.className = 'admin-msg msg-ok';
      testiMsg.textContent = 'Thank you! Your testimonial has been submitted.';
      testiForm.reset();
      loadAllTestimonials();
    } catch (err) {
      testiMsg.className = 'admin-msg msg-err';
      testiMsg.textContent = 'Network error. Please try again.';
    } finally {
      testiBtn.disabled = false;
      testiBtn.textContent = 'Submit Testimonial';
    }
  });
}

loadAllTestimonials();