const token = localStorage.getItem('admin_token');

function authHeaders() {
  return { 'Authorization': 'Bearer ' + token };
}

function esc(s) {
  const div = document.createElement('div');
  div.textContent = s == null ? '' : String(s);
  return div.innerHTML;
}

function postedDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const adminTestimonials = document.getElementById('adminTestimonials');
const testiCount = document.getElementById('testiCount');

async function loadTestimonials() {
  if (!adminTestimonials) return;
  adminTestimonials.innerHTML = '<p style="color:#888; font-size:13px;">Loading...</p>';
  try {
    const res = await window.apiFetch('/comments');
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.replace('admin.html');
      return;
    }
    const data = await res.json();
    const comments = data.comments || [];
    const featuredCount = comments.filter(function (c) { return c.featured; }).length;
    if (testiCount) testiCount.textContent = 'Showing on homepage: ' + featuredCount + ' / 3';
    if (comments.length === 0) {
      adminTestimonials.innerHTML = '<p style="color:#888; font-size:13px;">No testimonials yet. They will appear here once visitors post them.</p>';
      return;
    }
    adminTestimonials.innerHTML = '';
    comments.forEach(function (c) {
      const row = document.createElement('div');
      row.className = 'admin-testi-row';
      const loc = c.location ? ' · ' + esc(c.location) : '';
      const appt = c.appointment
        ? '<p class="admin-testi-text" style="color:#cbbd8d; font-size:12px; margin-top:4px;">Linked booking: ' +
            esc(c.appointment.name) +
            (c.appointment.location ? ' · ' + esc(c.appointment.location) : '') +
            (c.appointment.dateFrom ? ' &mdash; ' + esc(c.appointment.dateFrom) + ' to ' + esc(c.appointment.dateTo || c.appointment.dateFrom) : '') +
          '</p>'
        : '';
      const photosHtml = (c.photos && c.photos.length)
        ? '<div class="appt-photos">' +
            c.photos.map(function (p) {
              return '<img src="' + esc(p.url) + '" alt="' + esc(p.category || 'photo') + '" loading="lazy" title="' + esc(p.category || 'photo') + '">';
            }).join('') +
            '<span class="admin-photo-cat">+' + c.photos.length + '</span>' +
          '</div>'
        : '';
      const featureBtn =
        '<button class="btn ' + (c.featured ? 'btn-ghost' : 'btn-edit') + '" data-feat="' + c.id + '">' +
          (c.featured ? 'Remove from homepage' : 'Show on homepage') +
        '</button>';
      row.innerHTML =
        '<div class="admin-testi-info">' +
          '<span class="admin-photo-cat"><strong>' + esc(c.name) + '</strong>' + loc + (c.featured ? ' <span style="color:#cbbd8d;">&#9733;</span>' : '') + '</span>' +
          '<p class="admin-testi-text" style="color:#999; font-size:12px; margin-top:2px;">Posted on ' + esc(postedDate(c.createdAt)) + '</p>' +
          '<p class="admin-testi-text">' + esc(c.text) + '</p>' +
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
    adminTestimonials.innerHTML = '<p style="color:#c44; font-size:13px;">Failed to load testimonials.</p>';
  }
}

async function toggleFeatured(e) {
  const btn = e.currentTarget;
  const id = btn.dataset.feat;
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
      localStorage.removeItem('admin_token');
      window.location.replace('admin.html');
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
      localStorage.removeItem('admin_token');
      window.location.replace('admin.html');
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

if (!token) {
  window.location.replace('admin.html');
} else {
  loadTestimonials();
}