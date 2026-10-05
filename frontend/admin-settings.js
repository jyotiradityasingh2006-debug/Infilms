// Settings: change the admin password and end the current session.
(function () {
  var Shell = window.AdminShell;
  if (!Shell.requireAuth()) return;

  var changePwdForm = document.getElementById('changePwdForm');
  var currentPwdInput = document.getElementById('currentPwdInput');
  var newPwdInput = document.getElementById('newPwdInput');
  var confirmPwdInput = document.getElementById('confirmPwdInput');
  var changePwdBtn = document.getElementById('changePwdBtn');
  var changePwdMsg = document.getElementById('changePwdMsg');

  changePwdForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    if (newPwdInput.value !== confirmPwdInput.value) {
      Shell.msg(changePwdMsg, 'New passwords do not match', false);
      return;
    }
    if (newPwdInput.value.length < 6) {
      Shell.msg(changePwdMsg, 'Use at least 6 characters', false);
      return;
    }
    changePwdBtn.disabled = true;
    changePwdBtn.textContent = 'Updating...';
    Shell.msg(changePwdMsg, '', false);
    try {
      var res = await window.apiFetch('/auth/change-password', {
        method: 'POST',
        headers: Shell.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify({
          currentPassword: currentPwdInput.value,
          newPassword: newPwdInput.value,
        }),
      });
      var data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }
      if (res.status === 401) {
        var m = data.message || '';
        if (m === 'Token expired' || m === 'Invalid token' || m === 'Missing token') {
          Shell.msg(changePwdMsg, 'Session expired. Please log in again.', false);
          Shell.sessionExpired();
          return;
        }
      }
      if (!res.ok) {
        Shell.msg(changePwdMsg, typeof data.message === 'string' && data.message ? data.message : 'Could not update password', false);
        return;
      }
      Shell.msg(changePwdMsg, 'Password updated successfully', true);
      currentPwdInput.value = '';
      newPwdInput.value = '';
      confirmPwdInput.value = '';
    } catch (err) {
      console.error('Password change error:', err);
      Shell.msg(changePwdMsg, 'Network error: ' + (err && err.message), false);
    } finally {
      changePwdBtn.disabled = false;
      changePwdBtn.textContent = 'Update Password';
    }
  });
})();
