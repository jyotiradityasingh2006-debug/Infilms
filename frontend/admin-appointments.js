// Appointments: every booking, with the couple's photos and testimonial
// attached when the emails match.
(function () {
  var Shell = window.AdminShell;
  if (!Shell.requireAuth()) return;

  var adminAppointments = document.getElementById('adminAppointments');
  var apptCount = document.getElementById('apptCount');

  function apptDate(iso) {
    if (!iso) return '';
    var d = new Date(iso);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  }

  async function loadAppointments() {
    try {
      var res = await window.apiFetch('/appointments', { headers: Shell.authHeaders() });
      if (res.status === 401) {
        Shell.sessionExpired();
        return;
      }
      var data = await res.json();
      var appointments = data.appointments || [];
      if (apptCount) {
        apptCount.textContent = appointments.length
          ? appointments.length + (appointments.length === 1 ? ' booking' : ' bookings')
          : 'No bookings yet';
      }
      if (appointments.length === 0) {
        adminAppointments.innerHTML = '<p class="mini-empty">No appointments yet. They will appear here once visitors book a date.</p>';
        return;
      }
      adminAppointments.innerHTML = '';
      appointments.forEach(function (a) {
        var row = document.createElement('div');
        row.className = 'admin-testi-row';
        var loc = a.location ? ' · ' + Shell.esc(a.location) : '';
        var desc = a.description
          ? '<p class="admin-testi-text" style="margin-top:6px;">' + Shell.esc(a.description) + '</p>'
          : '';
        var emailLine = a.email
          ? '<p class="admin-testi-text" style="color:#999; font-size:12px; margin-top:2px;">Email: ' + Shell.esc(a.email) + '</p>'
          : '';
        var phoneLine = a.phone
          ? '<p class="admin-testi-text" style="color:#999; font-size:12px; margin-top:2px;">Phone: ' + Shell.esc(a.phone) + '</p>'
          : '';
        // A single-day booking is stored with from == to, so collapse it into
        // one date instead of showing the same day twice.
        var sameDay = a.dateFrom && a.dateFrom === a.dateTo;
        var datesLine = a.dateFrom
          ? '<p class="admin-testi-text" style="color:#cbbd8d; font-size:13px; margin-top:4px;">Preferred shoot: ' +
              '<strong>' + Shell.esc(a.dateFrom) + '</strong>' +
              (sameDay ? ' (single day)' : ' to ' + (a.dateTo ? '<strong>' + Shell.esc(a.dateTo) + '</strong>' : 'Not given')) +
            '</p>'
          : '';
        var photosHtml = (a.photos && a.photos.length)
          ? '<div class="appt-photos">' +
              a.photos.map(function (p) {
                return '<img src="' + Shell.esc(p.url) + '" alt="' + Shell.esc(p.category || 'photo') + '" loading="lazy" title="' + Shell.esc(p.category || 'photo') + '">';
              }).join('') +
              '<span class="admin-photo-cat">+' + a.photos.length + '</span>' +
            '</div>'
          : '';
        var testiHtml = '';
        if (a.testimonial && a.testimonial.text) {
          testiHtml =
            '<button class="btn btn-edit" data-testi="' + a.id + '" style="margin-top:10px;">Show Testimonial</button>' +
            '<div class="appt-testi-box" id="testi-box-' + a.id + '" style="display:none;">' +
              '<p>&ldquo;' + Shell.esc(a.testimonial.text) + '&rdquo;</p>' +
              '<p class="appt-testi-who">&mdash; ' + Shell.esc(a.testimonial.name) +
                (a.testimonial.location ? ', ' + Shell.esc(a.testimonial.location) : '') + '</p>' +
            '</div>';
        }
        row.innerHTML =
          '<div class="admin-testi-info">' +
            '<span class="admin-photo-cat"><strong>' + Shell.esc(a.name) + '</strong>' + loc + '</span>' +
            datesLine +
            '<p class="admin-testi-text" style="color:#999; font-size:12px; margin-top:2px;">Requested on ' + Shell.esc(apptDate(a.createdAt)) + '</p>' +
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
      adminAppointments.innerHTML = '<p class="mini-empty">Failed to load appointments.</p>';
    }
  }

  async function deleteAppointment(e) {
    var btn = e.currentTarget;
    var id = btn.dataset.id;
    if (!confirm('Delete this appointment?')) return;
    btn.disabled = true;
    btn.textContent = '...';
    try {
      var res = await window.apiFetch('/appointments/' + id, {
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
      loadAppointments();
    } catch (err) {
      alert('Network error');
      btn.disabled = false;
      btn.textContent = 'Delete';
    }
  }

  loadAppointments();
})();
