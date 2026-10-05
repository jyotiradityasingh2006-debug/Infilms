// Admin dashboard: sign in, then show counts, section shortcuts and the most
// recent uploads / booked dates. Every edit lives on its own page.
(function () {
  var Shell = window.AdminShell;

  var loginSection = document.getElementById('loginSection');
  var dashboardSection = document.getElementById('dashboardSection');
  var loginForm = document.getElementById('loginForm');
  var passwordInput = document.getElementById('passwordInput');
  var loginBtn = document.getElementById('loginBtn');
  var loginMsg = document.getElementById('loginMsg');

  var statPhotos = document.getElementById('statPhotos');
  var statFilms = document.getElementById('statFilms');
  var statCategories = document.getElementById('statCategories');
  var statHero = document.getElementById('statHero');
  var statHeroSub = document.getElementById('statHeroSub');
  var statTestimonials = document.getElementById('statTestimonials');
  var statTestimonialsSub = document.getElementById('statTestimonialsSub');
  var statAppointments = document.getElementById('statAppointments');
  var statAppointmentsSub = document.getElementById('statAppointmentsSub');
  var recentMedia = document.getElementById('recentMedia');
  var upcomingAppointments = document.getElementById('upcomingAppointments');

  // Card copy for the "manage your site" grid.
  var QUICK_SECTIONS = [
    {
      idx: '01', href: 'admin-photos.html', label: 'Photos & Films',
      text: 'Upload new work, attach photos to a couple, and delete anything that should not be public.',
    },
    {
      idx: '02', href: 'admin-categories.html', label: 'Categories',
      text: 'Add, rename or remove the filter buttons visitors use to browse the portfolio.',
    },
    {
      idx: '03', href: 'admin-hero.html', label: 'Hero Photos',
      text: 'Choose the up to 5 photos that rotate behind the big heading on your homepage.',
    },
    {
      idx: '04', href: 'admin-testimonials.html', label: 'Testimonials',
      text: 'Read what couples wrote, feature the best three, and clear out spam.',
    },
    {
      idx: '05', href: 'admin-appointments.html', label: 'Appointments',
      text: 'Every booking with the couple’s photos and testimonial already linked in.',
    },
    {
      idx: '06', href: 'admin-content.html', label: 'Site Content',
      text: 'Edit every heading and paragraph across the homepage, portfolio and booking form.',
    },
    {
      idx: '07', href: 'admin-settings.html', label: 'Settings',
      text: 'Change the admin password and see which browser is currently signed in.',
    },
  ];

  function showDashboard() {
    Shell.hide(loginSection);
    Shell.show(dashboardSection);
    loadStats();
  }

  function showLogin() {
    Shell.show(loginSection);
    Shell.hide(dashboardSection);
    Shell.setToken(null);
  }

  function authHeaders() {
    return Shell.authHeaders();
  }

  loginForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    var pw = passwordInput.value.trim();
    if (!pw) return;
    loginBtn.disabled = true;
    loginBtn.textContent = 'Logging in...';
    Shell.msg(loginMsg, '', false);
    try {
      const res = await window.apiFetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ password: pw }),
      });
      let data = {};
      try {
        data = await res.json();
      } catch (err) {
        data = {};
      }
      if (!res.ok) {
        if (typeof data.message === 'string' && data.message.length) {
          Shell.msg(loginMsg, data.message, false);
        } else {
          Shell.msg(loginMsg, 'Admin API not reachable. Open this page through the backend at http://localhost:5000 (npm start in the backend folder) — not a plain file server.', false);
        }
        return;
      }
      Shell.setToken(data.token);
      passwordInput.value = '';
      showDashboard();
    } catch (err) {
      console.error('Login error:', err);
      Shell.msg(loginMsg, 'Network error: ' + (err && err.message), false);
    } finally {
      loginBtn.disabled = false;
      loginBtn.textContent = 'Log In';
    }
  });

  async function loadStats() {
    Shell.renderQuickLinks('quickLinks', QUICK_SECTIONS);
    await Promise.all([loadMediaStats(), loadHeroStat(), loadTestimonialStat(), loadAppointmentStats()]);
  }

  async function loadMediaStats() {
    try {
      const res = await window.apiFetch('/photos');
      const data = await res.json();
      const photos = data.photos || [];
      const images = photos.filter(function (p) { return p.type !== 'video'; });
      const videos = photos.filter(function (p) { return p.type === 'video'; });
      statPhotos.textContent = images.length;
      statFilms.textContent = videos.length;
      renderRecentMedia(photos.slice(0, 8));
      await loadCategoryStat(photos);
    } catch (err) {
      statPhotos.textContent = '0';
      statFilms.textContent = '0';
      statCategories.textContent = '0';
      recentMedia.innerHTML = '<p class="mini-empty">Could not load your uploads.</p>';
    }
  }

  async function loadCategoryStat(photos) {
    try {
      const res = await window.apiFetch('/categories');
      const data = await res.json();
      const categories = data.categories || [];
      statCategories.textContent = categories.length;
      if (!categories.length) return;
      var perCategory = {};
      categories.forEach(function (c) { perCategory[c.key] = 0; });
      var uncategorised = 0;
      photos.forEach(function (p) {
        if (p.type === 'video') return;
        if (Object.prototype.hasOwnProperty.call(perCategory, p.category)) perCategory[p.category]++;
        else uncategorised++;
      });
      var parts = categories.map(function (c) { return c.name + ' ' + perCategory[c.key]; });
      if (uncategorised) parts.push('Shared ' + uncategorised);
      var sub = document.getElementById('statPhotosSub');
      if (sub && parts.length) sub.textContent = parts.slice(0, 3).join(' · ');
    } catch (err) {
      statCategories.textContent = '0';
    }
  }

  function renderRecentMedia(photos) {
    if (!photos.length) {
      recentMedia.innerHTML = '<p class="mini-empty">Nothing uploaded yet — add your first photo to fill the gallery.</p>';
      return;
    }
    recentMedia.innerHTML = '';
    photos.forEach(function (p) {
      var tile = document.createElement('div');
      tile.className = 't';
      tile.innerHTML = (p.type === 'video'
        ? '<video src="' + Shell.esc(p.url) + '" muted loop playsinline preload="metadata"></video>'
        : '<img src="' + Shell.esc(p.url) + '" alt="" loading="lazy">') +
        '<span class="flag">' + (p.type === 'video' ? 'Film' : 'Photo') + '</span>';
      recentMedia.appendChild(tile);
    });
    recentMedia.querySelectorAll('video').forEach(function (vid) {
      vid.addEventListener('mouseenter', function () { vid.play().catch(function () {}); });
      vid.addEventListener('mouseleave', function () { vid.pause(); });
    });
  }

  async function loadHeroStat() {
    try {
      const res = await window.apiFetch('/hero-images');
      const data = await res.json();
      const images = Array.isArray(data.images) ? data.images : [];
      const max = typeof data.max === 'number' ? data.max : 5;
      statHero.textContent = images.length + ' / ' + max;
      statHeroSub.textContent = images.length
        ? 'Rotating behind the homepage heading'
        : 'None yet — the heading sits on a plain background';
    } catch (err) {
      statHero.textContent = '—';
    }
  }

  async function loadTestimonialStat() {
    try {
      const res = await window.apiFetch('/comments');
      const data = await res.json();
      const comments = data.comments || [];
      const featured = comments.filter(function (c) { return c.featured; }).length;
      statTestimonials.textContent = comments.length;
      statTestimonialsSub.textContent = 'Showing on homepage: ' + featured + ' / 3';
    } catch (err) {
      statTestimonials.textContent = '—';
    }
  }

  function parseShootDate(value) {
    if (!value) return null;
    var d = new Date(value + 'T00:00:00');
    return isNaN(d.getTime()) ? null : d;
  }

  function monthLabel(date) {
    return date.toLocaleDateString('en-IN', { month: 'short' });
  }

  function renderUpcoming(appointments) {
    var today = new Date();
    today.setHours(0, 0, 0, 0);
    var upcoming = appointments
      .map(function (a) { return { appt: a, date: parseShootDate(a.dateFrom) }; })
      .filter(function (row) { return row.date && row.date >= today; })
      .sort(function (a, b) { return a.date - b.date; })
      .slice(0, 4);

    if (!upcoming.length) {
      upcomingAppointments.innerHTML = '<p class="mini-empty">No upcoming dates booked. New bookings will show up here.</p>';
      return;
    }
    upcomingAppointments.innerHTML = '';
    upcoming.forEach(function (row) {
      var a = row.appt;
      var el = document.createElement('div');
      el.className = 'mini-row';
      var where = a.location ? ' · ' + Shell.esc(a.location) : '';
      var range = a.dateTo && a.dateTo !== a.dateFrom ? ' to ' + Shell.esc(a.dateTo) : '';
      el.innerHTML =
        '<div class="mr-date"><b>' + row.date.getDate() + '</b><span>' + monthLabel(row.date) + '</span></div>' +
        '<div class="mr-info">' +
          '<div class="mr-name">' + Shell.esc(a.name) + '</div>' +
          '<div class="mr-meta">' + Shell.esc(a.dateFrom || '') + range + where + '</div>' +
        '</div>';
      upcomingAppointments.appendChild(el);
    });
  }

  async function loadAppointmentStats() {
    try {
      const res = await window.apiFetch('/appointments', { headers: authHeaders() });
      if (res.status === 401) {
        Shell.sessionExpired();
        return;
      }
      const data = await res.json();
      const appointments = data.appointments || [];
      statAppointments.textContent = appointments.length;
      statAppointmentsSub.textContent = appointments.length
        ? 'Booked shoot dates'
        : 'No bookings yet';
      renderUpcoming(appointments);
    } catch (err) {
      statAppointments.textContent = '—';
      upcomingAppointments.innerHTML = '<p class="mini-empty">Could not load appointments.</p>';
    }
  }

  // A saved token skips the login card and goes straight to the overview.
  if (Shell.token()) showDashboard();
})();
