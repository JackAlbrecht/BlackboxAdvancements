/* PALMER'S CONCRETE COATINGS - interactions, carousels, estimator */
(function () {
  'use strict';

  // ---------- Sticky header shadow ----------
  var header = document.querySelector('header.site');
  if (header) {
    var onScrollHdr = function () { header.classList.toggle('scrolled', window.scrollY > 8); };
    onScrollHdr();
    window.addEventListener('scroll', onScrollHdr, { passive: true });
  }

  // ---------- Scroll progress bar ----------
  var bar = document.querySelector('.scroll-bar > div');
  if (bar) {
    var onScrollBar = function () {
      var h = document.documentElement;
      var pct = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      bar.style.width = Math.min(100, Math.max(0, pct)) + '%';
    };
    onScrollBar();
    window.addEventListener('scroll', onScrollBar, { passive: true });
  }

  // ---------- Mobile nav ----------
  var toggle = document.querySelector('[data-menu-toggle]');
  var links  = document.querySelector('[data-nav-links]');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  // ---------- Marquee dup ----------
  document.querySelectorAll('.anno-track, .stripe-track').forEach(function (track) {
    if (track.dataset.duped) return;
    Array.prototype.slice.call(track.children).forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
    track.dataset.duped = '1';
  });

  // ---------- Reveal observer ----------
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '-8% 0px -5% 0px' });
    document.querySelectorAll('[data-reveal],[data-reveal-fade]').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal],[data-reveal-fade]').forEach(function (el) { el.classList.add('visible'); });
  }

  // ---------- Year tag ----------
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ---------- Animated counters ----------
  var counters = document.querySelectorAll('[data-counter]');
  if (counters.length && 'IntersectionObserver' in window) {
    var cIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var el = e.target;
        cIo.unobserve(el);
        var target = parseFloat(el.getAttribute('data-counter'));
        var dur = parseFloat(el.getAttribute('data-dur') || '1500');
        var prefix = el.getAttribute('data-prefix') || '';
        var suffix = el.getAttribute('data-suffix') || '';
        var t0 = performance.now();
        var tick = function (now) {
          var p = Math.min(1, (now - t0) / dur);
          var eased = 1 - Math.pow(1 - p, 3);
          var v = target * eased;
          el.textContent = prefix + (target % 1 === 0 ? Math.round(v).toLocaleString() : v.toFixed(1)) + suffix;
          if (p < 1) requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      });
    }, { rootMargin: '0px 0px -20% 0px' });
    counters.forEach(function (c) { cIo.observe(c); });
  }

  // ---------- Tilt cards ----------
  document.querySelectorAll('.tilt').forEach(function (el) {
    el.addEventListener('mousemove', function (e) {
      var rect = el.getBoundingClientRect();
      var x = (e.clientX - rect.left) / rect.width - 0.5;
      var y = (e.clientY - rect.top) / rect.height - 0.5;
      el.style.transform = 'perspective(900px) rotateY(' + (x * 6) + 'deg) rotateX(' + (-y * 5) + 'deg) translateY(-4px)';
    });
    el.addEventListener('mouseleave', function () {
      el.style.transform = '';
    });
  });

  // ---------- Before/After slider ----------
  document.querySelectorAll('[data-ba]').forEach(function (slider) {
    var beforeEl = slider.querySelector('.ba-before');
    var handle   = slider.querySelector('.ba-handle');
    var setPct = function (pct) {
      pct = Math.max(2, Math.min(98, pct));
      if (beforeEl) beforeEl.style.clipPath = 'inset(0 ' + (100 - pct) + '% 0 0)';
      if (handle)   handle.style.left = pct + '%';
    };
    setPct(50);
    var dragging = false;
    var doMove = function (clientX) {
      var rect = slider.getBoundingClientRect();
      setPct(((clientX - rect.left) / rect.width) * 100);
    };
    slider.addEventListener('mousedown', function (e) { dragging = true; doMove(e.clientX); });
    window.addEventListener('mouseup',   function () { dragging = false; });
    window.addEventListener('mousemove', function (e) { if (dragging) doMove(e.clientX); });
    slider.addEventListener('touchstart', function (e) { dragging = true; doMove(e.touches[0].clientX); }, { passive: true });
    window.addEventListener('touchend',   function () { dragging = false; });
    window.addEventListener('touchmove',  function (e) { if (dragging) doMove(e.touches[0].clientX); }, { passive: true });
  });

  // ---------- Testimonial Carousel ----------
  document.querySelectorAll('[data-tcarousel]').forEach(function (root) {
    var track  = root.querySelector('.t-track');
    var slides = root.querySelectorAll('.t-slide');
    var prev   = root.querySelector('[data-tprev]');
    var next   = root.querySelector('[data-tnext]');
    var dotsW  = root.querySelector('.t-dots');
    if (!track || !slides.length) return;
    var idx = 0, total = slides.length;
    if (dotsW) {
      for (var i = 0; i < total; i++) {
        var d = document.createElement('div');
        d.className = 'td' + (i === 0 ? ' active' : '');
        d.setAttribute('data-i', i);
        dotsW.appendChild(d);
      }
    }
    var dots = root.querySelectorAll('.t-dots .td');
    var go = function (n) {
      idx = (n + total) % total;
      track.style.transform = 'translateX(-' + (idx * 100) + '%)';
      dots.forEach(function (d, i) { d.classList.toggle('active', i === idx); });
    };
    if (prev) prev.addEventListener('click', function () { go(idx - 1); restart(); });
    if (next) next.addEventListener('click', function () { go(idx + 1); restart(); });
    dots.forEach(function (d) { d.addEventListener('click', function () { go(parseInt(d.getAttribute('data-i'), 10)); restart(); }); });
    var auto = setInterval(function () { go(idx + 1); }, 6500);
    var restart = function () { clearInterval(auto); auto = setInterval(function () { go(idx + 1); }, 6500); };
    // Pause on hover
    root.addEventListener('mouseenter', function () { clearInterval(auto); });
    root.addEventListener('mouseleave', function () { restart(); });
  });

  // ---------- Gallery Carousel ----------
  document.querySelectorAll('[data-gcarousel]').forEach(function (root) {
    var track  = root.querySelector('.g-track');
    var slides = root.querySelectorAll('.g-slide');
    var prev   = root.querySelector('[data-gprev]');
    var next   = root.querySelector('[data-gnext]');
    if (!track || !slides.length) return;
    var idx = 0;
    var perView = function () { return window.innerWidth < 540 ? 1 : (window.innerWidth < 900 ? 2 : 3); };
    var maxIdx = function () { return Math.max(0, slides.length - perView()); };
    var go = function (n) {
      idx = Math.max(0, Math.min(maxIdx(), n));
      var slideW = slides[0].getBoundingClientRect().width + 20;
      track.style.transform = 'translateX(-' + (idx * slideW) + 'px)';
    };
    if (prev) prev.addEventListener('click', function () { go(idx - 1); });
    if (next) next.addEventListener('click', function () { go(idx + 1); });
    window.addEventListener('resize', function () { go(idx); });
    // Auto-advance
    setInterval(function () {
      if (idx >= maxIdx()) go(0); else go(idx + 1);
    }, 5500);
  });

  // ===============================================================
  // ESTIMATOR — Concrete Coatings (Palmer's)
  // Gated: contact info BEFORE ballpark reveal
  // ===============================================================
  var est = document.querySelector('[data-estimator]');
  if (!est) return;

  // Pricing model (per-square-foot ranges including labor + materials)
  // Multipliers compound: finish * condition * color
  var PRICING = {
    project: {
      'garage-epoxy':   { perSqftLow: 5,  perSqftHigh: 9,  base: 250 },
      'epoxy-coating':  { perSqftLow: 6,  perSqftHigh: 11, base: 250 },
      'concrete-floor': { perSqftLow: 7,  perSqftHigh: 14, base: 350 },
      'concrete-stain': { perSqftLow: 3,  perSqftHigh: 7,  base: 200 },
      'concrete-color': { perSqftLow: 3,  perSqftHigh: 6,  base: 200 },
      'seal-coating':   { perSqftLow: 1.5,perSqftHigh: 3.5,base: 150 }
    },
    sizeRanges: {
      'small':  { low: 200,  high: 400  }, // 1 car / small slab
      'medium': { low: 400,  high: 700  }, // 2 car / patio
      'large':  { low: 700,  high: 1200 }, // 3 car / shop
      'xl':     { low: 1200, high: 2500 }, // warehouse / big shop
      'xxl':    { low: 2500, high: 6000 }
    },
    finish: {
      'solid':    1.00,
      'flake':    1.18,
      'metallic': 1.42,
      'quartz':   1.55
    },
    condition: {
      'new':     0.90,
      'good':    1.00,
      'repairs': 1.22,
      'major':   1.50
    },
    colors: {
      'standard': 1.00,
      'custom':   1.10,
      'multi':    1.20
    }
  };

  var SIZE_LABELS = {
    'small':  '1-car garage / small slab (~300 sqft)',
    'medium': '2-car garage / patio (~500 sqft)',
    'large':  '3-car garage / shop (~900 sqft)',
    'xl':     'Warehouse / large shop (~1800 sqft)',
    'xxl':    'Commercial / big facility (4000+ sqft)'
  };

  var PROJECT_LABELS = {
    'garage-epoxy':   'Garage Floor Epoxy',
    'epoxy-coating':  'Epoxy Floor Coating',
    'concrete-floor': 'Concrete Floor Installation',
    'concrete-stain': 'Concrete Staining',
    'concrete-color': 'Concrete Coloring',
    'seal-coating':   'Seal Coating'
  };

  var FINISH_LABELS = {
    'solid':    'Solid color',
    'flake':    'Decorative flake / chip',
    'metallic': 'Metallic',
    'quartz':   'Quartz / broadcast'
  };

  var state = {
    step: 1,
    project: null, size: null, finish: null, condition: null, colors: null,
    contact: { name: '', email: '', phone: '', address: '' }
  };
  var stepEls = est.querySelectorAll('.est-step');
  var progressDots = est.querySelectorAll('.est-progress .dot');
  var TOTAL_STEPS = stepEls.length;

  function showStep(n, opts) {
    state.step = n;
    stepEls.forEach(function (s) { s.classList.toggle('active', parseInt(s.dataset.step, 10) === n); });
    progressDots.forEach(function (d, i) {
      d.classList.toggle('active', i === n - 1);
      d.classList.toggle('done',   i < n - 1);
    });
    if (opts && opts.scroll) {
      try {
        var estTop = est.getBoundingClientRect().top + window.scrollY - 80;
        if (Math.abs(window.scrollY - estTop) > 120) window.scrollTo({ top: estTop, behavior: 'smooth' });
      } catch (e) {}
    }
  }

  function attachOptionHandlers(container, field) {
    container.querySelectorAll('.est-opt').forEach(function (opt) {
      opt.addEventListener('click', function () {
        container.querySelectorAll('.est-opt').forEach(function (o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
        state[field] = opt.dataset.val;
        setTimeout(function () {
          if (state.step < TOTAL_STEPS) showStep(state.step + 1, { scroll: true });
        }, 320);
      });
    });
  }

  // Wire up step option handlers
  ['1', '2', '3', '4', '5'].forEach(function (n) {
    var s = est.querySelector('[data-step="' + n + '"] .est-options');
    if (!s) return;
    var field = { '1': 'project', '2': 'size', '3': 'finish', '4': 'condition', '5': 'colors' }[n];
    attachOptionHandlers(s, field);
  });

  // Back buttons
  est.querySelectorAll('.est-back').forEach(function (b) {
    b.addEventListener('click', function () { if (state.step > 1) showStep(state.step - 1, { scroll: true }); });
  });

  function computePrice() {
    if (!state.project || !state.size) return null;
    var proj = PRICING.project[state.project];
    var sz = PRICING.sizeRanges[state.size];
    if (!proj || !sz) return null;
    // Range = perSqft * size range
    var low  = proj.perSqftLow  * sz.low  + proj.base;
    var high = proj.perSqftHigh * sz.high + proj.base;
    var mult = (PRICING.finish[state.finish] || 1)
             * (PRICING.condition[state.condition] || 1)
             * (PRICING.colors[state.colors] || 1);
    low  = Math.round(low  * mult / 50) * 50;
    high = Math.round(high * mult / 50) * 50;
    return { low: low, high: high };
  }

  function projectSummary() {
    var parts = [];
    if (state.project) parts.push(PROJECT_LABELS[state.project] || state.project);
    if (state.size)    parts.push(SIZE_LABELS[state.size] || state.size);
    if (state.finish)  parts.push(FINISH_LABELS[state.finish] || state.finish);
    if (state.condition) parts.push(state.condition + ' prep');
    if (state.colors)  parts.push(state.colors + ' color');
    return parts.join(' \u00B7 ');
  }

  // CONTACT GATE — must submit before ballpark reveals
  var contactForm = est.querySelector('[data-est-contact]');
  var resultBlock = est.querySelector('[data-est-result]');
  var formIntro   = est.querySelector('[data-est-intro]');
  var thanksBlock = est.querySelector('[data-est-thanks]');
  var revealBtn   = est.querySelector('[data-reveal-btn]');

  // Disable reveal button until all required fields are filled
  function checkFormValid() {
    if (!contactForm || !revealBtn) return;
    var ok = true;
    contactForm.querySelectorAll('input[required]').forEach(function (inp) {
      if (!inp.value || (inp.type === 'email' && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(inp.value))) ok = false;
    });
    revealBtn.disabled = !ok;
  }
  if (contactForm) {
    contactForm.querySelectorAll('input').forEach(function (inp) {
      inp.addEventListener('input', checkFormValid);
      inp.addEventListener('change', checkFormValid);
    });
    checkFormValid();
  }

  if (contactForm) {
    contactForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var fd = new FormData(contactForm);
      state.contact.name    = (fd.get('name')    || '').toString();
      state.contact.email   = (fd.get('email')   || '').toString();
      state.contact.phone   = (fd.get('phone')   || '').toString();
      state.contact.address = (fd.get('address') || '').toString();

      var result = computePrice();
      if (result) {
        var lowEl  = est.querySelector('[data-result-low]');
        var highEl = est.querySelector('[data-result-high]');
        var sumEl  = est.querySelector('[data-result-summary]');
        if (lowEl)  lowEl.textContent  = '$' + result.low.toLocaleString();
        if (highEl) highEl.textContent = '$' + result.high.toLocaleString();
        if (sumEl)  sumEl.textContent  = projectSummary();
      }

      if (formIntro)   formIntro.style.display = 'none';
      contactForm.style.display = 'none';
      if (resultBlock) resultBlock.style.display = 'block';

      if (thanksBlock && state.contact.name) {
        var nameSpan = thanksBlock.querySelector('[data-thanks-name]');
        if (nameSpan) nameSpan.textContent = state.contact.name.split(' ')[0];
      }

      var rangeStr = result ? ('$' + result.low.toLocaleString() + ' - $' + result.high.toLocaleString()) : 'unknown';
      var body = [
        "Hi Precision Epoxy Floor team,", '',
        'A new estimate request came in via your website:', '',
        'Name: '    + state.contact.name,
        'Phone: '   + state.contact.phone,
        'Email: '   + state.contact.email,
        'Address: ' + state.contact.address, '',
        'Project: '   + (PROJECT_LABELS[state.project] || state.project),
        'Size: '      + (SIZE_LABELS[state.size]       || state.size),
        'Finish: '    + (FINISH_LABELS[state.finish]   || state.finish),
        'Condition: ' + state.condition + ' prep',
        'Colors: '    + state.colors,
        'Ballpark range: ' + rangeStr, '',
        'Please follow up to schedule the on-site walkthrough.'
      ].join('\n');
      var subject = 'Estimate Request: ' + (state.contact.name || 'New lead');
      try {
        // Phone is the easier follow-up for Palmer's; mailto fallback for record
        window.location.href = 'mailto:info@precisionepoxyfloorllc.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      } catch (err) {}
    });
  }

  showStep(1);
})();

/* =============================================================
   Palmer's — 21st.dev-style enhancements
   Dropdown nav · animated counters · magnetic buttons · spotlight
   · scale/stagger reveals · area-card mouse-follow
   ============================================================= */
(function() {
  'use strict';

  var $  = function(s, r){ return (r||document).querySelector(s); };
  var $$ = function(s, r){ return Array.prototype.slice.call((r||document).querySelectorAll(s)); };

  /* ---------- Dropdown nav (Service Areas) ---------- */
  $$('[data-dd]').forEach(function(dd) {
    var btn = dd.querySelector('[data-dd-toggle]');
    var panel = dd.querySelector('[data-dd-panel]');
    if (!btn || !panel) return;

    var isMobile = function() { return window.matchMedia('(max-width: 1080px)').matches; };
    var openTimer, closeTimer;

    function open() {
      dd.classList.add('is-open');
      btn.setAttribute('aria-expanded', 'true');
    }
    function close() {
      dd.classList.remove('is-open');
      btn.setAttribute('aria-expanded', 'false');
    }

    // Click toggle (required for mobile + touch)
    btn.addEventListener('click', function(e) {
      e.preventDefault();
      if (dd.classList.contains('is-open')) close(); else open();
    });

    // Desktop hover
    dd.addEventListener('mouseenter', function() {
      if (isMobile()) return;
      clearTimeout(closeTimer);
      openTimer = setTimeout(open, 60);
    });
    dd.addEventListener('mouseleave', function() {
      if (isMobile()) return;
      clearTimeout(openTimer);
      closeTimer = setTimeout(close, 120);
    });

    // Close on outside click
    document.addEventListener('click', function(e) {
      if (!dd.contains(e.target) && dd.classList.contains('is-open')) close();
    });
    // Close on escape
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && dd.classList.contains('is-open')) { close(); btn.focus(); }
    });
  });

  /* ---------- Reveal observers for new data-reveal-scale / data-reveal-stagger ---------- */
  if ('IntersectionObserver' in window) {
    var io2 = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io2.unobserve(e.target);
        }
      });
    }, { rootMargin: '-8% 0px -6% 0px', threshold: 0.1 });
    $$('[data-reveal-scale],[data-reveal-stagger]').forEach(function(el) { io2.observe(el); });
  } else {
    $$('[data-reveal-scale],[data-reveal-stagger]').forEach(function(el) { el.classList.add('in'); });
  }

  /* ---------- Animated number counters ---------- */
  function countUp(el) {
    var target = parseFloat(el.dataset.count || el.textContent);
    if (!target || isNaN(target)) return;
    var suffix = el.dataset.suffix || '';
    var duration = 1600;
    var start = null;
    function tick(ts) {
      if (!start) start = ts;
      var p = Math.min(1, (ts - start) / duration);
      var eased = 1 - Math.pow(1 - p, 3);
      var val = target * eased;
      el.textContent = (target >= 100 ? Math.round(val).toLocaleString() : val.toFixed(1).replace(/\.0$/, ''));
      if (suffix) el.innerHTML += '<span class="plus">' + suffix + '</span>';
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }
  if ('IntersectionObserver' in window) {
    var ioCount = new IntersectionObserver(function(entries) {
      entries.forEach(function(e) {
        if (e.isIntersecting) {
          countUp(e.target);
          ioCount.unobserve(e.target);
        }
      });
    }, { threshold: 0.4 });
    $$('[data-count]').forEach(function(el) { ioCount.observe(el); });
  }

  /* ---------- Magnetic buttons ---------- */
  $$('.magnet').forEach(function(btn) {
    var strength = parseFloat(btn.dataset.magnet || 0.35);
    btn.addEventListener('mousemove', function(e) {
      var r = btn.getBoundingClientRect();
      var x = e.clientX - r.left - r.width / 2;
      var y = e.clientY - r.top - r.height / 2;
      btn.style.transform = 'translate(' + (x * strength) + 'px, ' + (y * strength) + 'px)';
    });
    btn.addEventListener('mouseleave', function() { btn.style.transform = ''; });
  });

  /* ---------- Area card radial mouse-follow ---------- */
  $$('.area-card, .bento-item').forEach(function(card) {
    card.addEventListener('mousemove', function(e) {
      var r = card.getBoundingClientRect();
      card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ---------- Cursor spotlight (desktop only) ---------- */
  if (window.matchMedia('(pointer:fine)').matches && !$('.pc-spot')) {
    var spot = document.createElement('div');
    spot.className = 'pc-spot';
    document.body.appendChild(spot);
    var raf, tx = 0, ty = 0, cx = 0, cy = 0;
    var render = function() {
      cx += (tx - cx) * 0.14; cy += (ty - cy) * 0.14;
      spot.style.transform = 'translate(' + cx + 'px, ' + cy + 'px) translate(-50%, -50%)';
      raf = requestAnimationFrame(render);
    };
    window.addEventListener('mousemove', function(e) {
      tx = e.clientX; ty = e.clientY;
      spot.style.opacity = '1';
      if (!raf) render();
    });
    window.addEventListener('mouseleave', function() { spot.style.opacity = '0'; });
  }

  /* ---------- Testimonial marquee: duplicate children for seamless loop ---------- */
  $$('.tm-track').forEach(function(track) {
    if (track.dataset.duped) return;
    Array.prototype.slice.call(track.children).forEach(function(node) {
      var clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
    track.dataset.duped = '1';
  });

})();
