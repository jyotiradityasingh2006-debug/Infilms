// Testimonials: feature up to 3 on the homepage, delete the rest.
(function () {
  var Shell = window.AdminShell;
  if (!Shell.requireAuth()) return;

  var adminTestimonials = document.getElementById('adminTestimonials');
  var testiCount = document.getElementById('testiCount');

  function postedDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  // A testimonial written before star ratings existed has no value, so it
  // falls back to 5 the same way the API does.
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

  async function loadTestimonials() {
    try {
      var res = await window.apiFetch('/comments');
      if (res.status === 401) {
        Shell.sessionExpired();
        return;
      }
      var data = await res.json();
      var comments = data.comments || [];
      var featuredCount = comments.filter(function (c) { return c.featured; }).length;
      if (testiCount) {
        testiCount.textContent = comments.length
          ? comments.length + ' total · showing on homepage: ' + featuredCount + ' / 3'
          : 'No testimonials yet';
      }
      if (comments.length === 0) {
        adminTestimonials.innerHTML = '<p class="mini-empty">No testimonials yet. They will appear here once visitors post them.</p>';
        return;
      }
      adminTestimonials.innerHTML = '';
      comments.forEach(function (c) {
        var row = document.createElement('div');
        row.className = 'admin-testi-row';
        var loc = c.location ? ' · ' + Shell.esc(c.location) : '';
        var appt = c.appointment
          ? '<p class="admin-testi-text" style="color:#cbbd8d; font-size:12px; margin-top:4px;">Linked booking: ' +
              Shell.esc(c.appointment.name) +
              (c.appointment.location ? ' · ' + Shell.esc(c.appointment.location) : '') +
              (c.appointment.dateFrom
                ? ' &mdash; ' + Shell.esc(c.appointment.dateFrom) +
                  (c.appointment.dateTo && c.appointment.dateTo !== c.appointment.dateFrom
                    ? ' to ' + Shell.esc(c.appointment.dateTo)
                    : ' (single day)')
                : '') +
            '</p>'
          : '';
        var photosHtml = (c.photos && c.photos.length)
          ? '<div class="appt-photos">' +
              c.photos.map(function (p) {
                return '<img src="' + Shell.esc(p.url) + '" alt="' + Shell.esc(p.category || 'photo') + '" loading="lazy" title="' + Shell.esc(p.category || 'photo') + '">';
              }).join('') +
              '<span class="admin-photo-cat">+' + c.photos.length + '</span>' +
            '</div>'
          : '';
        var featureBtn =
          '<button class="btn ' + (c.featured ? 'btn-ghost' : 'btn-edit') + '" data-feat="' + c.id + '">' +
            (c.featured ? 'Remove from homepage' : 'Show on homepage') +
          '</button>';
        row.innerHTML =
          '<div class="admin-testi-info">' +
            '<span class="admin-photo-cat"><strong>' + Shell.esc(c.name) + '</strong>' + loc + (c.featured ? ' <span style="color:#cbbd8d;">&#9733;</span>' : '') + '</span>' +
            '<p class="admin-testi-text" style="color:#999; font-size:12px; margin-top:2px;">Posted on ' + Shell.esc(postedDate(c.createdAt)) + '</p>' +
            starsHtml(c.rating) +
            '<p class="admin-testi-text">' + Shell.esc(c.text) + '</p>' +
            appt +
            photosHtml +
          '</div>' +
          '<div class="admin-testi-actions">' +
            featureBtn +
            '<button class="btn btn-delete" data-id="' + c.id + '">Delete</button>' +
          '</div>';
        adminTestimonials.appendChild(row);
      });
      adminTestimonials.querySelectorAll('.btn-delete').forEach(function (btn) {
        btn.addEventListener('click', deleteTestimonial);
      });
      adminTestimonials.querySelectorAll('[data-feat]').forEach(function (btn) {
        btn.addEventListener('click', toggleFeatured);
      });
    } catch (err) {
      adminTestimonials.innerHTML = '<p class="mini-empty">Failed to load testimonials.</p>';
    }
  }

  async function toggleFeatured(e) {
    var btn = e.currentTarget;
    var id = btn.dataset.feat;
    var makeFeatured = btn.textContent.indexOf('Show on homepage') !== -1;
    btn.disabled = true;
    try {
      var res = await window.apiFetch('/comments/' + id, {
        method: 'PUT',
        headers: Shell.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({ featured: makeFeatured }),
      });
      var data = await res.json();
      if (res.status === 401) {
        Shell.sessionExpired();
        return;
      }
      if (!res.ok) {
        alert(data.message || 'Update failed');
        loadTestimonials();
        return;
      }
      loadTestimonials();
    } catch (err) {
      alert('Network error');
      loadTestimonials();
    }
  }

  async function deleteTestimonial(e) {
    var btn = e.currentTarget;
    var id = btn.dataset.id;
    if (!confirm('Delete this testimonial?')) return;
    btn.disabled = true;
    btn.textContent = '...';
    try {
      var res = await window.apiFetch('/comments/' + id, {
        method: 'DELETE',
        headers: Shell.authHeaders(),
      });
      var data = await res.json();
      if (res.status === 401) {
        Shell.sessionExpired();
        return;
      }
      if (!res.ok) {
        alert(data.message || 'Delete failed');
        btn.disabled = false;
        btn.textContent = 'Delete';
        return;
      }
      loadTestimonials();
    } catch (err) {
      alert('Network error');
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  }

  loadTestimonials();
})();
