// Shared admin helpers: session handling, small DOM utilities, and the logout
// button that every admin page shows. Load AFTER apiBase.js and BEFORE the
// page's own script.
(function () {
  var TOKEN_KEY = 'admin_token';

  function token() {
    try {
      return localStorage.getItem(TOKEN_KEY) || null;
    } catch (err) {
      return null;
    }
  }

  function setToken(value) {
    try {
      if (value) localStorage.setItem(TOKEN_KEY, value);
      else localStorage.removeItem(TOKEN_KEY);
    } catch (err) {
      // Private mode: the session simply won't survive a refresh.
    }
  }

  function authHeaders(extra) {
    var headers = { 'Authorization': 'Bearer ' + (token() || '') };
    if (extra) {
      Object.keys(extra).forEach(function (key) { headers[key] = extra[key]; });
    }
    return headers;
  }

  // Every admin page other than the sign-in card needs a live session.
  function requireAuth() {
    if (token()) return true;
    window.location.replace('admin.html');
    return false;
  }

  function logout() {
    setToken(null);
    window.location.replace('admin.html');
  }

  // Called whenever the API answers 401 on an admin page.
  function sessionExpired() {
    setToken(null);
    window.location.replace('admin.html');
  }

  function esc(value) {
    var div = document.createElement('div');
    div.textContent = value == null ? '' : String(value);
    return div.innerHTML;
  }

  function msg(el, text, ok) {
    if (!el) return;
    el.textContent = text;
    el.className = 'admin-msg ' + (ok ? 'msg-ok' : 'msg-err');
  }

  function show(el) { if (el) el.style.display = ''; }
  function hide(el) { if (el) el.style.display = 'none'; }

  // Renders the "jump to a section" cards on the dashboard. The dashboard is
  // the only place that lists every section, so each page links back here.
  function renderQuickLinks(hostId, sections) {
    var host = document.getElementById(hostId);
    if (!host) return;
    host.innerHTML = sections.map(function (section) {
      return '<a class="quick-card" href="' + section.href + '">' +
        '<span class="qc-idx">' + section.idx + '</span>' +
        '<h4>' + esc(section.label) + '</h4>' +
        '<p>' + esc(section.text) + '</p>' +
        '<span class="qc-go">Open &rarr;</span>' +
      '</a>';
    }).join('');
  }

  // Every page has one #adminLogoutBtn in its top row. Scripts load at the end
  // of <body>, so the element is normally already there; the DOMContentLoaded
  // fallback covers the case where this file is loaded in <head>.
  function bindLogout() {
    var btn = document.getElementById('adminLogoutBtn');
    if (btn && !btn.dataset.bound) {
      btn.dataset.bound = '1';
      btn.addEventListener('click', logout);
    }
  }
  bindLogout();
  document.addEventListener('DOMContentLoaded', bindLogout);

  window.AdminShell = {
    token: token,
    setToken: setToken,
    authHeaders: authHeaders,
    requireAuth: requireAuth,
    logout: logout,
    sessionExpired: sessionExpired,
    esc: esc,
    msg: msg,
    show: show,
    hide: hide,
    renderQuickLinks: renderQuickLinks,
  };
})();
