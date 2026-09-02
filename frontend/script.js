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
// API base URL. When frontend and backend are deployed separately,
// change API_BASE to your deployed backend URL (e.g. https://api.example.com/api).
const API_BASE = window.location.origin && window.location.origin !== 'null'
  ? window.location.origin + '/api'
  : 'http://localhost:5000/api';

const gallery = document.getElementById('gallery');
const galleryLoading = document.getElementById('galleryLoading');
const filterBtns = document.querySelectorAll('.filter-btn');

let photos = [];
let currentFilter = 'all';
let lbIndex = 0;

async function loadGallery() {
  if (!gallery) return;
  if (galleryLoading) galleryLoading.textContent = 'Loading portfolio...';
  try {
    const res = await fetch(API_BASE + '/photos');
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
    const img = document.createElement('img');
    img.src = p.url;
    img.alt = p.category || 'portfolio photo';
    img.loading = 'lazy';
    item.appendChild(img);
    gallery.appendChild(item);
  });
}

// Filter
if (filterBtns.length) {
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      currentFilter = btn.dataset.filter;
      renderGallery();
      const visibleImgs = gallery.querySelectorAll('.g-item');
      // keep photo count but toggle visibility by re-rendering
      // (renderGallery already handles the display logic above)
    });
  });
}

// Re-render visibility only (avoid rebuild for smaller churn)
// NOTE: renderGallery above rebinds lightbox listeners via delegation (on gallery), so safe.

// ================= LIGHTBOX =================
const lightbox = document.getElementById('lightbox');
const lbImg = document.getElementById('lbImg');
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
  lbImg.src = p.url;
}

function closeLightbox() {
  if (!lightbox) return;
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

// Fire gallery load when page contains a gallery element
if (gallery) loadGallery();
