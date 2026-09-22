window.API_BASE = window.API_BASE || (function() {
  var p = window.location;
  var isLocal = p.protocol === 'file:' || p.hostname === 'localhost' || p.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:5000/api' : p.origin + '/api';
})();

function siteGetPath(obj, path) {
  return String(path).split('.').reduce(function (o, k) {
    return o == null ? o : o[k];
  }, obj);
}

async function applySiteContent() {
  try {
    const res = await window.apiFetch('/site');
    if (!res.ok) return;
    const site = await res.json();
    document.querySelectorAll('[data-site], [data-site-placeholder]').forEach(function (el) {
      const path = el.getAttribute('data-site') || el.getAttribute('data-site-placeholder');
      if (!path) return;
      const val = siteGetPath(site, path);
      if (val == null || typeof val !== 'string') return;
      const def = el.getAttribute('data-default') || '';
      if (val === def) return;
      if (el.getAttribute('data-site-placeholder') !== null) {
        el.placeholder = val;
      } else {
        el.textContent = val;
      }
    });
  } catch (err) {
    // Keep the default text already in the page.
  }
}

applySiteContent();