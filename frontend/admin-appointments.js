const token = localStorage.getItem('admin_token');

function authHeaders() {
  return { 'Authorization': 'Bearer ' + token };
}

function esc(s) {
  const div = document.createElement('div');
  div.textContent = s == null ? '' : String(s);
  return div.innerHTML;
}

function apptDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  if (isNaN(d.getTime())) return '';
  return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

const adminAppointments = document.getElementById('adminAppointments');
const apptCount = document.getElementById('apptCount');

async function loadAppointments() {
  if (!adminAppointments) return;
  adminAppointments.innerHTML = '<p style="color:#888; font-size:13px;">Loading...</p>';
  try {
    const res = await window.apiFetch('/appointments', { headers: authHeaders() });
    if (res.status === 401) {
      localStorage.removeItem('admin_token');
      window.location.replace('admin.html');
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
    appointments.forEach(function (a) {
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
      const photosHtml = (a.photos && a.photos.length)
        ? '<div class="appt-photos">' +
            a.photos.map(function (p) {
              return '<img src="' + esc(p.url) + '" alt="' + esc(p.category || 'photo') + '" loading="lazy" title="' + esc(p.category || 'photo') + '">';
            }).join('') +
            '<span class="admin-photo-cat">+' + a.photos.length + '</span>' +
          '</div>'
        : '';
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
          '<p class="admin-testi-text" style="color:#999; font-size:12px; margin-top:2px;">Requested on ' + esc(apptDate(a.createdAt)) + '</p>' +
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
    adminAppointments.querySelectorAll('.btn-delete').forEach(function (btn) {
      btn.addEventListener('click', deleteAppointment);
    });
    adminAppointments.querySelectorAll('[data-testi]').forEach(function (btn) {
      btn.addEventListener('click', function () {
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
    loadAppointments();
  } catch (err) {
    alert('Network error');
    btn.disabled = false;
    btn.textContent = 'Delete';
  }
}

if (!token) {
  window.location.replace('admin.html');
} else {
  loadAppointments();
}