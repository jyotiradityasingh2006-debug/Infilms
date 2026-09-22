// Shared API endpoint helper. Determines which backend the frontend talks to:
//   1. Local development (file:// or localhost) -> http://localhost:5000/api
//   2. Same origin /api when the page is served by the backend itself
//   3. Fallback -> the deployed backend (https://infilms.onrender.com/api)
// The working base is probed once with GET /api/test, so the frontend can be
// hosted on any static host (e.g. Netlify) and still reach a working backend.
// Include this script BEFORE the other page scripts.
(function () {
  var p = window.location;
  var isLocal = p.protocol === 'file:' || p.hostname === 'localhost' || p.hostname === '127.0.0.1';
  var LOCAL = 'http://localhost:5000/api';
  var DEPLOYED = window.INFILMS_API_URL || 'https://infilms.onrender.com/api';

  window.API_BASE = window.API_BASE || (isLocal ? LOCAL : p.origin + '/api');

  var _basePromise = null;

  function apiBase() {
    if (_basePromise) return _basePromise;

    var candidates = [window.API_BASE];
    if (candidates[0] !== DEPLOYED) candidates.push(DEPLOYED);

    _basePromise = (async function () {
      for (var i = 0; i < candidates.length; i++) {
        try {
          var res = await fetch(candidates[i] + '/test', { cache: 'no-store' });
          if (res.ok) {
            window.API_BASE = candidates[i];
            return candidates[i];
          }
        } catch (err) {
          // Try the next candidate.
        }
      }
      return window.API_BASE;
    })();

    return _basePromise;
  }

  // Drop-in replacement for fetch() for API calls. Resolves the backend base
  // once (probing /api/test) then forwards the request.
  window.apiFetch = function (path, init) {
    return apiBase().then(function (base) {
      return fetch(base + path, init);
    });
  };

  // Resolve early so window.API_BASE is correct for any direct reads.
  apiBase();
})();