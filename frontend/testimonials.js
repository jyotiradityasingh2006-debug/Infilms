window.API_BASE = window.API_BASE || (function() {
  var p = window.location;
  var isLocal = p.protocol === 'file:' || p.hostname === 'localhost' || p.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:5000/api' : p.origin + '/api';
})();

function testiEsc(s) {
  const div = document.createElement('div');
  div.textContent = s == null ? '' : String(s);
  return div.innerHTML;
}

const featuredGrid = document.getElementById('featuredComments');
const testiForm = document.getElementById('testimonialForm');
const testiBtn = document.getElementById('testimonialSubmit');
const testiMsg = document.getElementById('testimonialMsg');

// Ratings are clamped client-side too, so a tampered form still lands in range.
function ratingValue(form, name) {
  if (!form) return 5;
  const picked = form.querySelector('input[name="' + name + '"]:checked');
  var n = picked ? parseInt(picked.value, 10) : 5;
  if (!isFinite(n) || n < 1 || n > 5) return 5;
  return n;
}

function starsHtml(value) {
  var n = parseInt(value, 10);
  if (!isFinite(n) || n < 1) n = 5;
  if (n > 5) n = 5;
  var out = '<div class="stars" role="img" aria-label="Rated ' + n + ' out of 5">';
  for (var i = 1; i <= 5; i++) {
    out += i <= n ? '&#9733;' : '<span class="off">&#9733;</span>';
  }
  return out + '</div>';
}

async function loadFeatured() {
  if (!featuredGrid) return;
  try {
    const res = await window.apiFetch('/comments/featured');
    const data = await res.json();
    const list = (data.comments || []).slice(0, 3);
    featuredGrid.innerHTML = '';
    if (!list.length) {
      const p = document.createElement('p');
      p.style.cssText = 'grid-column:1/-1; color:#8f8f8f; font-size:14px; font-weight:300; text-align:center; padding:20px 0;';
      p.textContent = 'No testimonials yet — be the first!';
      featuredGrid.appendChild(p);
      return;
    }
    list.forEach(function (c) {
      const card = document.createElement('div');
      card.className = 'test-card';
      let loc = '';
      if (c.location) loc = '<div class="where">' + testiEsc(c.location) + '</div>';
      card.innerHTML =
        '<div class="scene-tag">Client Word</div>' +
        starsHtml(c.rating) +
        '<p>&ldquo;' + testiEsc(c.text) + '&rdquo;</p>' +
        '<div class="who">' + testiEsc(c.name) + '</div>' +
        loc;
      featuredGrid.appendChild(card);
    });
  } catch (err) {
    featuredGrid.innerHTML = '<p style="grid-column:1/-1; color:#8f8f8f; font-size:13px; text-align:center; padding:20px 0;">Unable to load testimonials.</p>';
  }
}

if (testiForm && testiBtn) {
  testiForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nameEl = document.getElementById('testiName');
    const textEl = document.getElementById('testiText');
    const locEl = document.getElementById('testiLocation');
    const emailEl = document.getElementById('testiEmail');
    const name = nameEl.value.trim();
    const text = textEl.value.trim();
    const location = locEl ? locEl.value.trim() : '';
    const email = emailEl ? emailEl.value.trim() : '';
    if (!name || !text) return;
    testiBtn.disabled = true;
    testiBtn.textContent = 'Submitting...';
    testiMsg.className = 'admin-msg';
    testiMsg.textContent = '';
    try {
      const res = await window.apiFetch('/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          text: text,
          location: location,
          email: email,
          rating: ratingValue(testiForm, 'testiRating'),
        }),
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
    } catch (err) {
      testiMsg.className = 'admin-msg msg-err';
      testiMsg.textContent = 'Network error. Please try again.';
    } finally {
      testiBtn.disabled = false;
      testiBtn.textContent = 'Submit Testimonial';
    }
  });
}

loadFeatured();