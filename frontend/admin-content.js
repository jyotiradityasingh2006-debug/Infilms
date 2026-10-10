// Homepage + site content editor. Every field maps to a path in the site
// document (e.g. hero.heading1) that the public pages read.
(function () {
  var Shell = window.AdminShell;
  if (!Shell.requireAuth()) return;

  // Current site text. Used to prefill the editor so the boxes are never blank
  // (even before the backend responds).
  var ADMIN_DEFAULTS = {
    nav: {
      home: 'Home', about: 'About', portfolio: 'Portfolio', films: 'Films',
      packages: 'Packages', testimonials: 'Reviews', contact: 'Contact',
    },
    hero: {
      tag: 'Wedding Photography & Cinematography · Rewa, MP',
      heading1: 'Stories',
      heading2: 'Worth Replaying',
      sub: 'In Films turns your wedding day into a cinematic film and a lifetime of photographs — shot with intention, edited with restraint, remembered forever.',
      locations: 'Based in Rewa · Shooting across Indore · Mumbai · Punjab · & beyond',
      cta1: 'Book Your Date',
      cta2: 'Watch Our Films',
    },
    about: {
      image: 'https://res.cloudinary.com/igittitk/image/upload/v1787245175/P1368438copy_copy_2792x4184.jpg',
      imageAlt: 'Bridal portrait shot by In Films',
      label: 'Scene 01 — The Studio',
      heading: 'A Rewa-based crew, chasing weddings across India',
      lede: 'In Films is a wedding photography and cinematography studio based in Rewa, Madhya Pradesh, serving couples across the country.',
      p1: 'We specialise in timeless photographs and cinematic wedding films that capture genuine emotion over posed perfection — the shaky laugh during the vows, the father\'s hand on his daughter\'s shoulder, the first look no one rehearsed.',
      p2: 'Every frame is shot on professional Lumix cameras and cut together with the same patience a film editor gives a feature — because a wedding, like a film, deserves a real edit, not a template.',
      statNum: '3',
      statLabel: 'States Covered This Season',
      why: [
        'Experienced wedding crew',
        'Cinematic storytelling',
        'High-end Lumix cameras',
        'Destination wedding coverage',
        'Fast, dependable delivery',
        'Personalised planning',
      ],
    },
    services: {
      label: 'Scene 02 — What We Shoot',
      heading: 'Coverage for every chapter of the wedding',
      text: 'From the first haldi splash to the last dance, In Films builds a coverage plan around how your two families actually celebrate.',
      items: [
        { title: 'Wedding Photography', text: 'Full-day documentation of every ceremony, in natural light and natural colour.' },
        { title: 'Wedding Cinematography', text: 'A cinematic film of your wedding, cut like a short story with a beginning and an end.' },
        { title: 'Pre-Wedding Shoots', text: 'Location-led shoots designed around you as a couple, not a template pose list.' },
        { title: 'Engagement Photography', text: 'Relaxed, candid coverage of the ring ceremony and the moments around it.' },
        { title: 'Candid Photography', text: 'Unposed, in-between moments shot quietly from the edge of the room.' },
        { title: 'Traditional Photography', text: 'Classic, well-lit ceremony and family portraits for the album your parents will keep.' },
        { title: 'Bridal & Groom Portraits', text: 'Dedicated portrait sessions that give the day\'s main characters their close-up.' },
        { title: 'Wedding Reels', text: 'Short, shareable highlight reels cut for Instagram, ready within days.' },
        { title: 'Event & Product Coverage', text: 'Sangeet, receptions and jewellery or product shoots, covered with the same eye.' },
      ],
    },
    equipment: {
      label: 'Scene 03 — Behind the Lens',
      heading: 'Shot on professional Panasonic Lumix bodies',
      items: [
        { name: 'Panasonic Lumix S1', tag: 'Full-Frame Cinema' },
        { name: 'Panasonic Lumix S1R', tag: 'High-Res Portraits' },
        { name: 'Panasonic Lumix S5IIX', tag: 'Hybrid Video Body' },
      ],
    },
    films: {
      label: 'Scene 04 — Cinematic Films',
      heading: 'Wedding films, cut like short stories',
      text: 'Every wedding gets a highlight film with its own pace and score — not a stock template stretched over your footage. Full films are linked on our YouTube channel.',
      cta: 'See Full Films on YouTube',
    },
    packages: {
      label: 'Scene 05 — Packages',
      heading: 'Coverage built around your wedding, not a price list',
      text: 'Every wedding is different, so every quote is custom — these three starting points show how coverage typically scales. Reach out for exact pricing.',
      cards: [
        { name: 'Essential', badge: '', sub: 'Single-Day Coverage', bullets: ['One-day photography', 'Candid + traditional coverage', 'Edited high-resolution photos', 'Instagram-ready reel'], cta: 'Enquire' },
        { name: 'Signature', badge: 'Most Booked', sub: 'Full Wedding Film + Photos', bullets: ['Multi-day photo + film coverage', 'Cinematic wedding film', 'Candid, traditional & portrait sets', 'Highlight reel + full film', 'Priority delivery'], cta: 'Enquire' },
        { name: 'Destination', badge: '', sub: 'Travel & Multi-Event', bullets: ['Coverage outside Madhya Pradesh', 'Pre-wedding + wedding + reception', 'Full crew travel included', 'Complete cinematic film'], cta: 'Enquire' },
      ],
      note: 'Jewellery/product shoots and album printing available on request.',
    },
    testimonials: {
      label: 'Scene 06 — Testimonials',
      heading: 'In the couples\' own words',
      seeAll: 'See All Testimonials',
      formTitle: 'Shared your wedding with us? Write a testimonial',
    },
    contact: {
      label: 'Scene 07 — Get In Touch',
      heading: 'Let\'s talk about your wedding date',
      text: 'Tell us your date and city and we\'ll walk you through coverage options — most couples hear back within a day.',
      ig: 'DM us @infilms9862',
      yt: 'Watch us on YouTube',
      location: 'Rewa, Madhya Pradesh, India',
    },
    footer: {
      tagline: 'Wedding photography & cinematography, based in Rewa — shooting across India.',
      ig: 'IG',
      yt: 'YT',
      copyright: '© 2026 In Films. All rights reserved.',
      cities: 'Rewa · Indore · Mumbai · Punjab',
    },
    portfolio: {
      hero1: 'Recent',
      hero2: 'Frames',
      heroText: 'A mix of weddings, pre-wedding shoots and engagements from real couples across India.',
      galleryLabel: 'The Gallery',
      galleryHeading: 'Browse by category',
      galleryText: 'Filter by category to see how each kind of shoot is treated differently.',
      filterAll: 'All',
      moreLabel: 'Full Gallery',
      moreHeading: 'Want to see more?',
      moreText: 'Browse the complete collection of our recent work — full albums from weddings, pre-weddings and engagements.',
      moreCta: 'Tap to See More →',
    },
    comments: {
      hero1: 'In their',
      hero2: 'Own Words',
      heroText: 'Every testimonial here is from a real couple. Read the full list — and if we shot your wedding, add your own.',
      writeLabel: 'Add Your Testimonial',
      writeHeading: 'Shared your big day with us?',
      writeText: 'Tell others what it was like. It takes a minute.',
      nameLabel: 'Your name',
      namePlaceholder: 'e.g. Aditi Sharma',
      emailLabel: 'Email (for your testimonial)',
      emailPlaceholder: 'e.g. you@example.com',
      locationLabel: 'City / location',
      locationPlaceholder: 'e.g. Rewa, Madhya Pradesh',
      textLabel: 'Your testimonial',
      textPlaceholder: 'What was your experience like?',
      submitBtn: 'Submit Testimonial',
      allLabel: 'All Testimonials',
      allHeading: 'What couples say',
    },
    booking: {
      label: 'Book Your Shoot',
      heading: 'Reserve your date',
      text: 'Tell us when you need us and a little about the day — we\'ll confirm availability and lock in your date.',
      nameLabel: 'Your name',
      namePlaceholder: 'e.g. Aditi Sharma',
      phoneLabel: 'Phone number',
      phonePlaceholder: 'e.g. +91 98765 43210',
      emailLabel: 'Email (so we can find you)',
      emailPlaceholder: 'e.g. you@example.com',
      locationLabel: 'City / location',
      locationPlaceholder: 'e.g. Rewa, Madhya Pradesh',
      navCta: 'Book Your Date',
      dateFromLabel: 'Shoot date — from',
      dateToLabel: 'to (leave empty for one day)',
      descLabel: 'What do you need?',
      descPlaceholder: 'A short note about your wedding or shoot...',
      submitBtn: 'Book Appointment',
    },
  };

  var siteSchema = [
    { key: 'nav', title: 'Navigation', fields: [
      { key: 'home', label: 'Home link', type: 'text' },
      { key: 'about', label: 'About link', type: 'text' },
      { key: 'portfolio', label: 'Portfolio link', type: 'text' },
      { key: 'films', label: 'Cinematic Films link', type: 'text' },
      { key: 'packages', label: 'Packages link', type: 'text' },
      { key: 'testimonials', label: 'Testimonials link', type: 'text' },
      { key: 'contact', label: 'Contact link', type: 'text' },
    ]},
    { key: 'hero', title: 'Hero', fields: [
      { key: 'tag', label: 'Tagline', type: 'text' },
      { key: 'heading1', label: 'Heading — line 1', type: 'text' },
      { key: 'heading2', label: 'Heading — line 2 (gold)', type: 'text' },
      { key: 'sub', label: 'Sub paragraph', type: 'textarea' },
      { key: 'locations', label: 'Locations line', type: 'text' },
      { key: 'cta1', label: 'Button 1 (Book Your Date)', type: 'text' },
      { key: 'cta2', label: 'Button 2 (Watch Our Films)', type: 'text' },
    ]},
    { key: 'about', title: 'About (Scene 01)', fields: [
      { key: 'image', label: 'Photo behind the "States Covered" card', type: 'image' },
      { key: 'imageAlt', label: 'Photo alt text (for screen readers & SEO)', type: 'text' },
      { key: 'label', label: 'Scene label', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'lede', label: 'Intro paragraph', type: 'textarea' },
      { key: 'p1', label: 'Paragraph 2', type: 'textarea' },
      { key: 'p2', label: 'Paragraph 3', type: 'textarea' },
      { key: 'statNum', label: 'Stat — number', type: 'text' },
      { key: 'statLabel', label: 'Stat — label', type: 'text' },
    ]},
    { key: 'services', title: 'Services (Scene 02)', fields: [
      { key: 'label', label: 'Scene label', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text', label: 'Intro paragraph', type: 'textarea' },
    ]},
    { key: 'equipment', title: 'Equipment (Scene 03)', fields: [
      { key: 'label', label: 'Scene label', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
    ]},
    { key: 'films', title: 'Cinematic Films (Scene 04)', fields: [
      { key: 'label', label: 'Scene label', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text', label: 'Intro paragraph', type: 'textarea' },
      { key: 'cta', label: 'YouTube button text', type: 'text' },
    ]},
    { key: 'packages', title: 'Packages (Scene 05)', fields: [
      { key: 'label', label: 'Scene label', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text', label: 'Intro paragraph', type: 'textarea' },
      { key: 'note', label: 'Note under the cards', type: 'text' },
    ]},
    { key: 'testimonials', title: 'Testimonials (Scene 06)', fields: [
      { key: 'label', label: 'Scene label', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'seeAll', label: '"See All Testimonials" button', type: 'text' },
      { key: 'formTitle', label: '"Write a testimonial" heading', type: 'text' },
    ]},
    { key: 'contact', title: 'Contact (Scene 07)', fields: [
      { key: 'label', label: 'Scene label', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text', label: 'Intro paragraph', type: 'textarea' },
      { key: 'ig', label: 'Instagram line', type: 'text' },
      { key: 'yt', label: 'YouTube line', type: 'text' },
      { key: 'location', label: 'Location line', type: 'text' },
      { key: 'address', label: 'Full address', type: 'textarea', rows: 2 },
      { key: 'directions', label: 'Get Directions link text', type: 'text' },
    ]},
    { key: 'footer', title: 'Footer', fields: [
      { key: 'tagline', label: 'Footer tagline', type: 'text' },
      { key: 'ig', label: 'Footer IG link', type: 'text' },
      { key: 'yt', label: 'Footer YT link', type: 'text' },
      { key: 'copyright', label: 'Copyright line', type: 'text' },
      { key: 'cities', label: 'Cities line', type: 'text' },
    ]},
    { key: 'portfolio', title: 'Portfolio Page', fields: [
      { key: 'hero1', label: 'Page heading — line 1', type: 'text' },
      { key: 'hero2', label: 'Page heading — line 2 (gold)', type: 'text' },
      { key: 'heroText', label: 'Intro paragraph', type: 'textarea' },
      { key: 'galleryLabel', label: 'Gallery — scene label', type: 'text' },
      { key: 'galleryHeading', label: 'Gallery — heading', type: 'text' },
      { key: 'galleryText', label: 'Gallery — paragraph', type: 'textarea' },
      { key: 'filterAll', label: 'Filter: All', type: 'text' },
      { key: 'moreLabel', label: '"See more" — scene label', type: 'text' },
      { key: 'moreHeading', label: '"See more" — heading', type: 'text' },
      { key: 'moreText', label: '"See more" — paragraph', type: 'textarea' },
      { key: 'moreCta', label: '"See more" — button', type: 'text' },
    ]},
    { key: 'comments', title: 'Testimonials Page', fields: [
      { key: 'hero1', label: 'Page heading — line 1', type: 'text' },
      { key: 'hero2', label: 'Page heading — line 2 (gold)', type: 'text' },
      { key: 'heroText', label: 'Intro paragraph', type: 'textarea' },
      { key: 'writeLabel', label: 'Write section — scene label', type: 'text' },
      { key: 'writeHeading', label: 'Write section — heading', type: 'text' },
      { key: 'writeText', label: 'Write section — paragraph', type: 'textarea' },
      { key: 'nameLabel', label: 'Form: name label', type: 'text' },
      { key: 'namePlaceholder', label: 'Form: name placeholder', type: 'text' },
      { key: 'emailLabel', label: 'Form: email label', type: 'text' },
      { key: 'emailPlaceholder', label: 'Form: email placeholder', type: 'text' },
      { key: 'locationLabel', label: 'Form: location label', type: 'text' },
      { key: 'locationPlaceholder', label: 'Form: location placeholder', type: 'text' },
      { key: 'textLabel', label: 'Form: testimonial label', type: 'text' },
      { key: 'textPlaceholder', label: 'Form: testimonial placeholder', type: 'text' },
      { key: 'submitBtn', label: 'Form: submit button', type: 'text' },
      { key: 'allLabel', label: 'All testimonials — scene label', type: 'text' },
      { key: 'allHeading', label: 'All testimonials — heading', type: 'text' },
    ]},
    { key: 'booking', title: 'Book Appointment Section', fields: [
      { key: 'label', label: 'Scene label', type: 'text' },
      { key: 'heading', label: 'Heading', type: 'text' },
      { key: 'text', label: 'Intro paragraph', type: 'textarea' },
      { key: 'nameLabel', label: 'Form: name label', type: 'text' },
      { key: 'namePlaceholder', label: 'Form: name placeholder', type: 'text' },
      { key: 'phoneLabel', label: 'Form: phone label', type: 'text' },
      { key: 'phonePlaceholder', label: 'Form: phone placeholder', type: 'text' },
      { key: 'emailLabel', label: 'Form: email label', type: 'text' },
      { key: 'emailPlaceholder', label: 'Form: email placeholder', type: 'text' },
      { key: 'locationLabel', label: 'Form: location label', type: 'text' },
      { key: 'locationPlaceholder', label: 'Form: location placeholder', type: 'text' },
      { key: 'navCta', label: 'Header "Book" button text', type: 'text' },
      { key: 'dateFromLabel', label: 'Form: date "from" label', type: 'text' },
      { key: 'dateToLabel', label: 'Form: date "to" label', type: 'text' },
      { key: 'descLabel', label: 'Form: description label', type: 'text' },
      { key: 'descPlaceholder', label: 'Form: description placeholder', type: 'text' },
      { key: 'submitBtn', label: 'Form: submit button', type: 'text' },
    ]},
  ];

  var editorWrap = document.getElementById('siteEditorFields');
  var siteSaveBtn = document.getElementById('siteSaveBtn');
  var siteMsg = document.getElementById('siteMsg');
  var siteSearch = document.getElementById('siteSearch');
  var siteExpandBtn = document.getElementById('siteExpandBtn');
  var siteCollapseBtn = document.getElementById('siteCollapseBtn');

  function siteEditorDefault(path) {
    var val = pathGet(ADMIN_DEFAULTS, path);
    return val == null ? '' : val;
  }

  function siteEditorInput(path, type, rows) {
    var def = siteEditorDefault(path);
    var attrs = 'data-site-field="' + path + '" data-default="' + Shell.esc(def) + '"';
    return type === 'textarea'
      ? '<textarea ' + attrs + ' rows="' + (rows || 3) + '"></textarea>'
      : '<input ' + attrs + ' type="text">';
  }

  function siteEditorImageField(path, label) {
    var def = siteEditorDefault(path);
    return '<div class="form-group site-img-field">' +
      '<label>' + Shell.esc(label) + '</label>' +
      '<div class="site-img-row">' +
        '<div class="site-img-preview-box"><img class="site-img-preview" src="' + Shell.esc(def) + '" alt=""><span class="site-img-empty">No photo set</span></div>' +
        '<div class="site-img-side">' +
          '<input type="text" data-site-field="' + path + '" data-default="' + Shell.esc(def) + '" placeholder="Paste an image URL, or upload a file">' +
          '<div class="site-img-buttons">' +
            '<button type="button" class="btn btn-ghost site-img-pick">Upload Photo</button>' +
            '<button type="button" class="btn btn-ghost site-img-clear">Remove</button>' +
          '</div>' +
          '<input type="file" accept="image/*" class="site-img-file" hidden>' +
          '<div class="site-img-status"></div>' +
        '</div>' +
      '</div>' +
    '</div>';
  }

  function siteEditorField(path, label, type, rows) {
    if (type === 'image') return siteEditorImageField(path, label);
    return '<div class="form-group"><label>' + Shell.esc(label) + '</label>' + siteEditorInput(path, type, rows) + '</div>';
  }

  function siteEditorSubHead(text) {
    return '<div class="site-sub-head">' + Shell.esc(text) + '</div>';
  }

  // Open state lives on the group as a class so the first tap always toggles.
  // Reading an inline style instead would see "" on load (CSS does the hiding)
  // and swallow that first tap.
  function setGroupOpen(group, open) {
    var toggle = group.querySelector('.site-group-toggle');
    if (!toggle) return;
    group.classList.toggle('is-open', !!open);
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    toggle.querySelector('span').textContent = open ? '▾' : '▸';
  }

  function isGroupOpen(group) {
    return group.classList.contains('is-open');
  }

  function buildSiteEditor() {
    if (!editorWrap) return;
    var html = '';
    siteSchema.forEach(function (group) {
      html += '<div class="site-group" data-title="' + Shell.esc(group.title.toLowerCase()) + '">';
      html += '<button type="button" class="site-group-toggle" aria-expanded="false">' + Shell.esc(group.title) + ' <span>▸</span></button>';
      html += '<div class="site-group-body">';
      group.fields.forEach(function (f) {
        html += siteEditorField(group.key + '.' + f.key, f.label, f.type, f.rows);
      });

      if (group.key === 'about') {
        html += '<div class="site-group-note">The 6 feature bullets shown next to the about text.</div>';
        for (var i = 0; i < 6; i++) {
          html += siteEditorSubHead('Feature bullet ' + (i + 1));
          html += siteEditorField('about.why.' + i, 'Bullet text', 'text');
        }
      }

      if (group.key === 'services') {
        html += '<div class="site-group-note">The 9 coverage cards below each have a heading and a paragraph.</div>';
        for (var s = 0; s < 9; s++) {
          html += siteEditorSubHead('Service Card ' + (s + 1));
          html += siteEditorField('services.items.' + s + '.title', 'Card heading', 'text');
          html += siteEditorField('services.items.' + s + '.text', 'Card paragraph', 'textarea', 2);
        }
      }

      if (group.key === 'equipment') {
        html += '<div class="site-group-note">The 3 cameras listed behind the lens.</div>';
        for (var c = 0; c < 3; c++) {
          html += siteEditorSubHead('Camera ' + (c + 1));
          html += siteEditorField('equipment.items.' + c + '.name', 'Camera name', 'text');
          html += siteEditorField('equipment.items.' + c + '.tag', 'Tag line', 'text');
        }
      }

      if (group.key === 'packages') {
        html += '<div class="site-group-note">The 3 package cards. Add or clear the badge text as needed.</div>';
        for (var p = 0; p < 3; p++) {
          html += siteEditorSubHead('Package Card ' + (p + 1));
          html += siteEditorField('packages.cards.' + p + '.name', 'Package name', 'text');
          html += siteEditorField('packages.cards.' + p + '.badge', 'Badge (leave blank for none)', 'text');
          html += siteEditorField('packages.cards.' + p + '.sub', 'Card heading', 'text');
          ADMIN_DEFAULTS.packages.cards[p].bullets.forEach(function (b, j) {
            html += siteEditorField('packages.cards.' + p + '.bullets.' + j, 'Bullet ' + (j + 1), 'text');
          });
          html += siteEditorField('packages.cards.' + p + '.cta', 'Button text', 'text');
        }
      }

      html += '</div></div>';
    });
    editorWrap.innerHTML = html;
    bindSiteImageFields();
    editorWrap.querySelectorAll('.site-group-toggle').forEach(function (btn) {
      btn.addEventListener('click', function () {
        setGroupOpen(btn.closest('.site-group'), !isGroupOpen(btn.closest('.site-group')));
      });
    });
    // Open the Hero section by default so the homepage text is visible first.
    Array.prototype.forEach.call(editorWrap.querySelectorAll('.site-group'), function (group) {
      var title = group.querySelector('.site-group-toggle');
      if (title && title.textContent.indexOf('Hero') !== -1) setGroupOpen(group, true);
    });
  }

  function pathGet(obj, path) {
    return String(path).split('.').reduce(function (o, k) { return o == null ? o : o[k]; }, obj);
  }

  function fillSiteEditor(site) {
    var inputs = document.querySelectorAll('[data-site-field]');
    Array.prototype.forEach.call(inputs, function (input) {
      var val = pathGet(site, input.getAttribute('data-site-field'));
      input.value = val == null ? (input.getAttribute('data-default') || '') : val;
    });
    syncSiteImagePreviews();
  }

  function siteImageFieldFor(el) {
    return el && el.closest ? el.closest('.site-img-field') : null;
  }

  function setSiteImage(wrap, url) {
    var input = wrap.querySelector('[data-site-field]');
    var img = wrap.querySelector('.site-img-preview');
    if (input) input.value = url || '';
    if (img) img.src = url || '';
    if (wrap) wrap.classList.toggle('is-empty', !url);
  }

  function syncSiteImagePreviews() {
    Array.prototype.forEach.call(document.querySelectorAll('.site-img-field'), function (wrap) {
      var input = wrap.querySelector('[data-site-field]');
      var img = wrap.querySelector('.site-img-preview');
      var url = input ? input.value.trim() : '';
      if (img && url) img.src = url;
      wrap.classList.toggle('is-empty', !url);
    });
  }

  async function uploadSiteImage(wrap, file) {
    var status = wrap.querySelector('.site-img-status');
    var pick = wrap.querySelector('.site-img-pick');
    var siteImgMsg = document.getElementById('siteMsg');
    if (status) status.textContent = 'Uploading...';
    if (pick) pick.disabled = true;
    var fd = new FormData();
    fd.append('image', file);
    try {
      var res = await window.apiFetch('/site/upload-image', {
        method: 'POST',
        headers: Shell.authHeaders(),
        body: fd,
      });
      if (res.status === 401) {
        Shell.msg(siteImgMsg, 'Session expired. Please log in again.', false);
        Shell.sessionExpired();
        return;
      }
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        if (status) status.textContent = data.message || 'Upload failed';
        return;
      }
      setSiteImage(wrap, data.url);
      if (status) status.textContent = 'Uploaded. Remember to press Save Content.';
    } catch (err) {
      if (status) status.textContent = 'Upload failed — check your connection';
    } finally {
      if (pick) pick.disabled = false;
    }
  }

  function bindSiteImageFields() {
    if (!editorWrap) return;
    editorWrap.addEventListener('click', function (ev) {
      var pick = ev.target.closest('.site-img-pick');
      if (pick) {
        var pWrap = siteImageFieldFor(pick);
        if (pWrap) pWrap.querySelector('.site-img-file').click();
        return;
      }
      var clear = ev.target.closest('.site-img-clear');
      if (clear) {
        var cWrap = siteImageFieldFor(clear);
        if (!cWrap) return;
        setSiteImage(cWrap, '');
        var status = cWrap.querySelector('.site-img-status');
        if (status) status.textContent = 'Photo removed. Press Save Content to apply.';
      }
    });
    editorWrap.addEventListener('change', function (ev) {
      var fileInput = ev.target.closest('.site-img-file');
      if (fileInput && fileInput.files && fileInput.files[0]) {
        uploadSiteImage(siteImageFieldFor(fileInput), fileInput.files[0]);
        fileInput.value = '';
        return;
      }
      var urlInput = ev.target.closest('.site-img-field [data-site-field]');
      if (urlInput) syncSiteImagePreviews();
    });
  }

  function pathSet(obj, path, val) {
    var parts = String(path).split('.');
    var cur = obj;
    parts.forEach(function (p, i) {
      if (i === parts.length - 1) {
        cur[p] = val;
        return;
      }
      var isArr = /^\d+$/.test(parts[i + 1]);
      if (cur[p] == null) cur[p] = isArr ? [] : {};
      cur = cur[p];
    });
  }

  function collectSiteEditor() {
    var out = {};
    var inputs = document.querySelectorAll('[data-site-field]');
    Array.prototype.forEach.call(inputs, function (input) {
      pathSet(out, input.getAttribute('data-site-field'), input.value.trim());
    });
    return out;
  }

  function filterGroups(term) {
    var groups = editorWrap.querySelectorAll('.site-group');
    var needle = term.trim().toLowerCase();
    Array.prototype.forEach.call(groups, function (group) {
      var title = (group.getAttribute('data-title') || '').toLowerCase();
      var match = !needle || title.indexOf(needle) !== -1;
      group.style.display = match ? '' : 'none';
      if (match && needle) setGroupOpen(group, true);
    });
  }

  if (siteSearch) {
    siteSearch.addEventListener('input', function () { filterGroups(siteSearch.value); });
  }

  if (siteExpandBtn) {
    siteExpandBtn.addEventListener('click', function () {
      Array.prototype.forEach.call(editorWrap.querySelectorAll('.site-group'), function (group) {
        if (group.style.display === 'none') return;
        setGroupOpen(group, true);
      });
    });
  }

  if (siteCollapseBtn) {
    siteCollapseBtn.addEventListener('click', function () {
      Array.prototype.forEach.call(editorWrap.querySelectorAll('.site-group'), function (group) {
        setGroupOpen(group, false);
      });
    });
  }

  async function loadSiteContent() {
    buildSiteEditor();
    try {
      var res = await window.apiFetch('/site');
      var site = await res.json();
      fillSiteEditor(site);
    } catch (err) {
      Shell.msg(siteMsg, 'Could not load current content.', false);
    }
  }

  siteSaveBtn.addEventListener('click', async function () {
    siteSaveBtn.disabled = true;
    siteSaveBtn.textContent = 'Saving...';
    Shell.msg(siteMsg, '', false);
    try {
      var payload = collectSiteEditor();
      var res = await window.apiFetch('/site', {
        method: 'PUT',
        headers: Shell.authHeaders({ 'Content-Type': 'application/json' }),
        body: JSON.stringify(payload),
      });
      if (res.status === 401) {
        Shell.msg(siteMsg, 'Session expired. Please log in again.', false);
        Shell.sessionExpired();
        return;
      }
      var data = await res.json();
      if (!res.ok) {
        Shell.msg(siteMsg, data.message || 'Save failed', false);
        return;
      }
      Shell.msg(siteMsg, 'Content saved. Your site is updated.', true);
    } catch (err) {
      Shell.msg(siteMsg, 'Network error', false);
    } finally {
      siteSaveBtn.disabled = false;
      siteSaveBtn.textContent = 'Save Content';
    }
  });

  loadSiteContent();
})();
