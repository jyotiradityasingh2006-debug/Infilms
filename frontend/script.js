// Header scroll state
const header = document.getElementById('siteHeader');
if (header) {
  window.addEventListener('scroll', () => {
    header.classList.toggle('scrolled', window.scrollY > 40);
  });
}

// Mobile menu
const menuBtn = document.getElementById('menuBtn');
const navLinks = document.getElementById('navLinks');
if (menuBtn && navLinks) {
  menuBtn.addEventListener('click', () => {
    navLinks.classList.toggle('open');
    menuBtn.classList.toggle('open');
    menuBtn.textContent = menuBtn.classList.contains('open') ? '✕' : '☰';
  });
  navLinks.querySelectorAll('a').forEach(a => a.addEventListener('click', () => {
    navLinks.classList.remove('open');
    menuBtn.classList.remove('open');
    menuBtn.textContent = '☰';
  }));
}

// Reveal on scroll
const revealEls = document.querySelectorAll('.reveal');
if (revealEls.length) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0, rootMargin: '0px 0px -60px 0px' });
  revealEls.forEach(el => io.observe(el));
}

// Frame counter (Index page only)
const scenes = document.querySelectorAll('section');
const fcNum = document.getElementById('fcNum');
if (scenes.length && fcNum) {
  const sceneObserver = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        const idx = Array.from(scenes).indexOf(e.target) + 1;
        fcNum.textContent = String(idx).padStart(2, '0');
      }
    });
  }, { threshold: 0.5 });
  scenes.forEach(s => sceneObserver.observe(s));
}

// ================= PORTFOLIO: DYNAMIC GALLERY =================
// API base URL for the deployed backend.
window.API_BASE = window.API_BASE || (function() {
  var p = window.location;
  var isLocal = p.protocol === 'file:' || p.hostname === 'localhost' || p.hostname === '127.0.0.1';
  return isLocal ? 'http://localhost:5000/api' : p.origin + '/api';
})();
const API_BASE = window.API_BASE;

const gallery = document.getElementById('gallery');
const galleryLoading = document.getElementById('galleryLoading');
const filterBar = document.getElementById('filterBar');

const FALLBACK_CATEGORIES = [
  { key: 'wedding', name: 'Weddings' },
  { key: 'prewedding', name: 'Pre-Wedding' },
  { key: 'engagement', name: 'Engagement' },
];

let photos = [];
let currentFilter = 'all';
let lbIndex = 0;

function bindFilterButtons() {
  if (!filterBar) return;
  const btns = filterBar.querySelectorAll('.filter-btn');
  Array.prototype.forEach.call(btns, function(btn) {
    btn.onclick = function() {
      Array.prototype.forEach.call(btns, function(b) { b.classList.remove('active'); });
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderGallery();
    };
  });
}

function renderFilterButtons(categories) {
  if (!filterBar) return;
  filterBar.innerHTML = '';
  const all = document.createElement('button');
  all.className = 'filter-btn active';
  all.dataset.filter = 'all';
  all.setAttribute('data-site', 'portfolio.filterAll');
  all.setAttribute('data-default', 'All');
  all.textContent = 'All';
  filterBar.appendChild(all);
  categories.forEach(function(c) {
    const btn = document.createElement('button');
    btn.className = 'filter-btn';
    btn.dataset.filter = c.key;
    btn.textContent = c.name || c.key;
    filterBar.appendChild(btn);
  });
  bindFilterButtons();
  if (window.applySiteContent) window.applySiteContent();
}

async function loadCategories() {
  if (!filterBar) return;
  let categories = FALLBACK_CATEGORIES.slice();
  try {
    const res = await window.apiFetch('/categories');
    if (res.ok) {
      const data = await res.json();
      if (data.categories && data.categories.length) categories = data.categories;
    }
  } catch (err) {
    // Fall back to the default categories.
  }
  renderFilterButtons(categories);
}

async function loadGallery() {
  if (!gallery) return;
  if (galleryLoading) galleryLoading.textContent = 'Loading portfolio...';
  try {
    const res = await window.apiFetch('/photos');
    if (!res.ok) throw new Error('Request failed');
    const data = await res.json();
    photos = data.photos || [];
    renderGallery();
  } catch (err) {
    if (galleryLoading) galleryLoading.textContent = 'Unable to load photos.';
  }
}

function renderGallery() {
  if (!gallery) return;
  if (galleryLoading) galleryLoading.remove();
  gallery.innerHTML = '';
  if (photos.length === 0) {
    const empty = document.createElement('p');
    empty.style.cssText = 'color:#888; font-size:13px; grid-column:1/-1; text-align:center; padding:40px 0;';
    empty.textContent = 'No photos yet.';
    gallery.appendChild(empty);
    return;
  }
  photos.forEach((p, i) => {
    const item = document.createElement('div');
    item.className = 'g-item';
    item.dataset.index = i;
    if (currentFilter !== 'all' && p.category !== currentFilter) {
      item.style.display = 'none';
    }
    if (p.type === 'video') {
      const vid = document.createElement('video');
      vid.src = p.url;
      vid.alt = 'portfolio film';
      vid.muted = true;
      vid.loop = true;
      vid.playsInline = true;
      vid.preload = 'metadata';
      item.appendChild(vid);
      item.addEventListener('mouseenter', () => { vid.play().catch(() => {}); });
      item.addEventListener('mouseleave', () => { vid.pause(); });
    } else {
      const img = document.createElement('img');
      img.src = p.url;
      img.alt = p.category || 'portfolio photo';
      img.loading = 'lazy';
      item.appendChild(img);
    }
    gallery.appendChild(item);
  });
}

// Lightbox is bound below via event delegation on the gallery element.

// ================= LIGHTBOX =================
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
const lbVideo = document.getElementById('lbVideo');
const lbClose = document.getElementById('lbClose');
const lbPrev = document.getElementById('lbPrev');
const lbNext = document.getElementById('lbNext');

function visiblePhotoIndices() {
  const indices = [];
  photos.forEach((p, i) => {
    if (currentFilter === 'all' || p.category === currentFilter) {
      indices.push(i);
    }
  });
  return indices;
}

function openLightbox(index) {
  if (!lightbox) return;
  const pool = visiblePhotoIndices();
  if (pool.length === 0) return;
  let target = pool.indexOf(index);
  if (target === -1) target = 0;
  lbIndex = pool[target];
  showLightboxImage();
  lightbox.classList.add('open');
  lightbox.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
}

function showLightboxImage() {
  const p = photos[lbIndex];
  if (!p) return;
  if (p.type === 'video' && lbVideo) {
    lbImg.style.display = 'none';
    lbVideo.style.display = '';
    lbVideo.src = p.url;
    lbVideo.play().catch(() => {});
  } else if (lbVideo) {
    lbVideo.pause();
    lbVideo.removeAttribute('src');
    lbVideo.style.display = 'none';
    lbImg.style.display = '';
    lbImg.src = p.url;
  } else {
    lbImg.src = p.url;
  }
}

function closeLightbox() {
  if (!lightbox) return;
  if (lbVideo) {
    lbVideo.pause();
  }
  lightbox.classList.remove('open');
  lightbox.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
}

function stepLightbox(dir) {
  const pool = visiblePhotoIndices();
  if (pool.length === 0) return;
  let pos = pool.indexOf(lbIndex);
  pos = (pos + dir + pool.length) % pool.length;
  lbIndex = pool[pos];
  showLightboxImage();
}

if (gallery) {
  gallery.addEventListener('click', (e) => {
    const item = e.target.closest('.g-item');
    if (item && item.dataset.index !== undefined) {
      openLightbox(parseInt(item.dataset.index, 10));
    }
  });
}

if (lbClose) lbClose.addEventListener('click', closeLightbox);
if (lbPrev) lbPrev.addEventListener('click', (e) => { e.stopPropagation(); stepLightbox(-1); });
if (lbNext) lbNext.addEventListener('click', (e) => { e.stopPropagation(); stepLightbox(1); });

if (lightbox) {
  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) closeLightbox();
  });
  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowLeft') stepLightbox(-1);
    if (e.key === 'ArrowRight') stepLightbox(1);
  });
}

// Fire gallery + categories load when page contains a gallery element
if (gallery) {
  loadCategories();
  loadGallery();
}
