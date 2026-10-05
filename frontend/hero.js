// ================= HERO BACKGROUND SLIDESHOW =================
// The photos behind the homepage heading are managed from the admin panel
// (GET /api/hero-images). They cross-fade every 5 seconds. When the admin has
// not set any photos, .hero keeps its plain dark gradient background, so the
// heading stays readable either way.
(function () {
  const heroBg = document.getElementById('heroBg');
  const heroDots = document.getElementById('heroDots');
  if (!heroBg) return;

  const SLIDE_MS = 5000;

  let slides = [];
  let urls = [];
  let index = 0;
  let timer = null;

  // Rotation is pointless on a single photo, and skipping it also stops a
  // pointless interval from running all session.
  function isRotationAllowed() {
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return false;
    }
    return document.visibilityState !== 'hidden';
  }

  function show(i) {
    index = (i + slides.length) % slides.length;
    slides.forEach((el, n) => el.classList.toggle('is-active', n === index));
    if (!heroDots) return;
    Array.prototype.forEach.call(heroDots.children, function (dot, n) {
      dot.classList.toggle('is-active', n === index);
      dot.setAttribute('aria-selected', n === index ? 'true' : 'false');
    });
  }

  function start() {
    stop();
    timer = setInterval(() => {
      if (isRotationAllowed()) show(index + 1);
    }, SLIDE_MS);
  }

  function stop() {
    if (timer) clearInterval(timer);
    timer = null;
  }

  function render(images) {
    heroBg.innerHTML = '';
    if (heroDots) heroDots.innerHTML = '';

    slides = [];
    urls = images
      .map(function (item) { return typeof item === 'string' ? item : item && item.url; })
      .filter(function (url) { return typeof url === 'string' && url.trim().length; })
      .map(function (url) { return url.trim(); });

    urls.forEach(function (url) {
      const el = document.createElement('div');
      el.className = 'hero-slide';
      el.style.backgroundImage = 'url("' + url.replace(/"/g, '%22') + '")';
      heroBg.appendChild(el);
      slides.push(el);
    });

    if (slides.length === 0) return;

    // Preload the first photo so the hero never flashes empty, then reveal it.
    const first = new Image();
    first.onload = first.onerror = function () {
      show(0);
      if (slides.length > 1) start();
    };
    first.src = urls[0];

    if (heroDots && slides.length > 1) {
      slides.forEach(function (_, n) {
        const dot = document.createElement('button');
        dot.type = 'button';
        dot.className = 'hero-dot';
        dot.setAttribute('role', 'tab');
        dot.setAttribute('aria-label', 'Background photo ' + (n + 1));
        dot.addEventListener('click', function () {
          show(n);
          start();
        });
        heroDots.appendChild(dot);
      });
    }
  }

  document.addEventListener('visibilitychange', function () {
    if (document.visibilityState === 'visible' && slides.length > 1) start();
  });

  (async function () {
    try {
      const res = await window.apiFetch('/hero-images');
      if (!res.ok) return;
      const data = await res.json();
      render(Array.isArray(data.images) ? data.images : []);
    } catch (err) {
      // No API or no photos: the CSS gradient background stays as it is.
    }
  })();
})();
