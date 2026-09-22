window.API_BASE = window.API_BASE || (function() {
  var p = window.location;
  var isLocal = p.protocol === 'file:' || p.hostname === 'localhost' || p.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:5000/api' : p.origin + '/api';
})();

const apptForm = document.getElementById('appointmentForm');
const apptBtn = document.getElementById('apptSubmit');
const apptMsg = document.getElementById('apptMsg');

if (apptForm && apptBtn) {
  apptForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const nameEl = (document.getElementById('apptName') || {}).value || '';
    const phoneEl = (document.getElementById('apptPhone') || {}).value || '';
    const emailEl = (document.getElementById('apptEmail') || {}).value || '';
    const locEl = (document.getElementById('apptLocation') || {}).value || '';
    const dateFromEl = (document.getElementById('apptDateFrom') || {}).value || '';
    const dateToEl = (document.getElementById('apptDateTo') || {}).value || '';
    const descEl = (document.getElementById('apptDesc') || {}).value || '';
    const name = nameEl.trim();
    const phone = phoneEl.trim();
    const email = emailEl.trim();
    const location = locEl.trim();
    const dateFrom = dateFromEl.trim();
    const dateTo = dateToEl.trim();
    const description = descEl.trim();
    if (!name || !phone || !email || !dateFrom || !dateTo) return;
    if (dateTo < dateFrom) {
      apptMsg.className = 'admin-msg msg-err';
      apptMsg.textContent = '"To" date must be the same as or after the "from" date.';
      return;
    }
    apptBtn.disabled = true;
    apptBtn.textContent = 'Booking...';
    apptMsg.className = 'admin-msg';
    apptMsg.textContent = '';
    try {
      const res = await window.apiFetch('/appointments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name,
          phone: phone,
          email: email,
          location: location,
          dateFrom: dateFrom,
          dateTo: dateTo,
          description: description,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        apptMsg.className = 'admin-msg msg-err';
        apptMsg.textContent = data.message || 'Could not book. Please try again.';
        return;
      }
      apptMsg.className = 'admin-msg msg-ok';
      apptMsg.textContent = 'Thank you! Your appointment request has been sent. We\'ll confirm your date soon.';
      apptForm.reset();
    } catch (err) {
      apptMsg.className = 'admin-msg msg-err';
      apptMsg.textContent = 'Network error. Please try again.';
    } finally {
      apptBtn.disabled = false;
      apptBtn.textContent = 'Book Appointment';
    }
  });
}