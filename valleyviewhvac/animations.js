/* Valley View HVAC — interactions + estimator */
(function () {
  'use strict';

  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal, .stagger').forEach((el) => io.observe(el));

  const toggle = document.querySelector('.mobile-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (toggle && menu) {
    let scrim = document.querySelector('.mobile-menu-scrim');
    if (!scrim) {
      scrim = document.createElement('div');
      scrim.className = 'mobile-menu-scrim';
      scrim.setAttribute('aria-hidden', 'true');
      document.body.appendChild(scrim);
    }
    const set = (o) => {
      menu.classList.toggle('open', o);
      scrim.classList.toggle('open', o);
      toggle.classList.toggle('is-open', o);
      toggle.setAttribute('aria-expanded', o ? 'true' : 'false');
      menu.setAttribute('aria-hidden', o ? 'false' : 'true');
      document.body.classList.toggle('menu-open', o);
    };
    toggle.addEventListener('click', () => set(!menu.classList.contains('open')));
    scrim.addEventListener('click', () => set(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) set(false); });
    // Close (X) button inside the drawer
    menu.querySelectorAll('.mm-close').forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); set(false); }));
    // Close on link navigation (not on group toggles)
    menu.querySelectorAll('a[href]').forEach((a) => a.addEventListener('click', () => set(false)));
    // Group toggles (Residential, Commercial, About)
    menu.querySelectorAll('.mm-group').forEach((btn) => {
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        const key = btn.getAttribute('data-mm-group');
        const sub = menu.querySelector(`.mm-sub[data-mm-member="${key}"]`);
        const nowOpen = btn.getAttribute('aria-expanded') !== 'true';
        btn.setAttribute('aria-expanded', nowOpen ? 'true' : 'false');
        if (sub) sub.classList.toggle('is-open', nowOpen);
      });
    });
    // Close menu on resize beyond breakpoint so state doesn't get stuck
    let rtid;
    window.addEventListener('resize', () => {
      clearTimeout(rtid);
      rtid = setTimeout(() => { if (window.innerWidth > 980 && menu.classList.contains('open')) set(false); }, 120);
    });
  }

  document.querySelectorAll('.ticker-track, .showcase-track').forEach((track) => {
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    const wrap = document.createElement('div');
    const isShow = track.classList.contains('showcase-track');
    const dur = isShow ? 55 : 40;
    wrap.style.cssText = `display:flex; gap:${isShow ? '1rem' : '3rem'}; width:max-content; animation:slideLeft ${dur}s linear infinite;`;
    track.parentNode.insertBefore(wrap, track);
    wrap.appendChild(track); wrap.appendChild(clone);
    track.style.animation = 'none'; clone.style.animation = 'none';
  });

  const counters = document.querySelectorAll('[data-count]');
  if (counters.length) {
    const cIO = new IntersectionObserver((entries) => {
      entries.forEach((en) => {
        if (!en.isIntersecting) return;
        cIO.unobserve(en.target);
        const to = parseFloat(en.target.dataset.count);
        const suffix = en.target.dataset.suffix || '';
        const dur = 1400, start = performance.now();
        const tick = (t) => {
          const p = Math.min(1, (t - start) / dur);
          const eased = 1 - Math.pow(1 - p, 3);
          const val = to * eased;
          en.target.textContent = (val % 1 === 0 ? Math.floor(val) : val.toFixed(1)).toLocaleString() + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else en.target.textContent = to.toLocaleString() + suffix;
        };
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    counters.forEach((c) => cIO.observe(c));
  }

  /* Estimator --------------------------------------------- */
  const est = document.getElementById('estForm');
  if (!est) return;

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const flash = (input, msg) => {
    let err = input.parentNode.querySelector('.est-err');
    if (!err) { err = document.createElement('span'); err.className = 'est-err'; input.parentNode.appendChild(err); }
    err.textContent = msg;
    input.style.borderColor = '#d94e00';
    input.addEventListener('input', () => { err.textContent = ''; input.style.borderColor = ''; }, { once: true });
  };

  /* Salem / mid-Willamette primary zones */
  const PRIMARY_ZIPS = new Set([
    '97301','97302','97303','97304','97305','97306','97307','97308','97309','97317',
    '97321','97322','97324','97352','97371','97373','97381','97385','97071','97325',
    '97002','97026','97032','97128','97132','97137','97392'
  ]);
  const BASES = {
    'ac-install':   [4800, 9500],
    'furnace':      [3800, 8200],
    'heat-pump':    [5500, 14500],
    'ductless':     [3200, 9800],
    'repair':       [180, 1200],
    'maintenance':  [149, 399],
    'duct':         [450, 3200],
    'iaq':          [300, 2400]
  };
  const LABELS = {
    'ac-install': 'AC install / replace',
    'furnace': 'Furnace install / replace',
    'heat-pump': 'Heat pump install',
    'ductless': 'Ductless mini-split',
    'repair': 'System repair',
    'maintenance': 'Tune-up / maintenance',
    'duct': 'Duct cleaning / sealing',
    'iaq': 'Indoor air quality upgrade'
  };

  const step1 = est.querySelector('[data-step="1"]');
  const step2 = est.querySelector('[data-step="2"]');
  const result = est.querySelector('[data-step="result"]');
  const goBtn = est.querySelector('#estGo');
  const backBtn = est.querySelector('#estBack');
  const show = (which) => {
    [step1, step2, result].forEach((el) => { if (el) el.hidden = true; });
    which.hidden = false;
    const y = est.getBoundingClientRect().top + scrollY - 80;
    scrollTo({ top: y, behavior: 'smooth' });
  };

  goBtn && goBtn.addEventListener('click', () => {
    const f = est.elements;
    let ok = true;
    if (!f.name.value.trim()) { flash(f.name, 'Required'); ok = false; }
    if (!f.phone.value.trim() || f.phone.value.replace(/\D/g, '').length < 7) { flash(f.phone, 'Valid phone'); ok = false; }
    if (!emailRe.test(f.email.value.trim())) { flash(f.email, 'Valid email'); ok = false; }
    if (f.street && !f.street.value.trim()) { flash(f.street, 'Required'); ok = false; }
    if (f.city && !f.city.value.trim()) { flash(f.city, 'Required'); ok = false; }
    if (f.state && !f.state.value.trim()) { flash(f.state, 'Required'); ok = false; }
    if (f.zip && (!f.zip.value.trim() || f.zip.value.replace(/\D/g, '').length !== 5)) { flash(f.zip, 'Valid 5-digit ZIP'); ok = false; }
    if (!ok) return;
    show(step2);
  });
  backBtn && backBtn.addEventListener('click', () => show(step1));

  est.addEventListener('submit', (e) => {
    e.preventDefault();
    const jobSel = est.elements.job;
    if (!jobSel.value) { flash(jobSel, 'Pick a job'); return; }
    const size = est.elements.size.value || 'medium';
    const property = est.elements.property.value || 'residential';
    const discount = est.elements.discount && est.elements.discount.value !== 'none';
    const zip = (est.elements.zip.value || '').trim();

    let [lo, hi] = BASES[jobSel.value];
    const sizeM = { small: 0.75, medium: 1.0, large: 1.45, xlarge: 1.85 }[size] || 1;
    lo *= sizeM; hi *= sizeM;
    const propM = { residential: 1.0, commercial: 1.35 }[property] || 1;
    lo *= propM; hi *= propM;
    if (discount) { lo *= 0.9; hi *= 0.9; }
    const outOfArea = zip.length === 5 && !PRIMARY_ZIPS.has(zip);
    if (outOfArea) { lo += 100; hi += 150; }
    lo = Math.round(lo / 25) * 25; hi = Math.round(hi / 25) * 25;

    const fmt = (n) => `$${n.toLocaleString('en-US')}`;
    est.querySelector('.est-range').textContent = `${fmt(lo)} – ${fmt(hi)}`;
    const f = est.elements;
    const addr = [f.street && f.street.value.trim(), f.unit && f.unit.value.trim(), f.city && f.city.value.trim(), f.state && f.state.value.trim(), zip].filter(Boolean).join(', ');
    est.querySelector('.est-summary').textContent =
      `${LABELS[jobSel.value]} · ${property} · ${size}${discount ? ' · 10% community discount applied' : ''}${outOfArea ? ' · out-of-area travel' : ''}. 10-year equipment / 2-year workmanship warranty. Final price confirmed at free in-home estimate at ${addr || 'your address'}.`;
    show(result);
  });

  const demo = document.querySelector('form[data-demo]');
  if (demo) {
    demo.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = demo.querySelector('.demo-confirm');
      if (msg) {
        msg.textContent = `Thanks! A Valley View technician will reach out within one business day.`;
        msg.style.opacity = '1';
        setTimeout(() => demo.reset(), 400);
        setTimeout(() => { msg.style.opacity = '0'; }, 8000);
      }
    });
  }
})();

/* ============================================================
   VV TESTIMONIAL CAROUSEL
   ============================================================ */
(function(){
  document.querySelectorAll('[data-vv-carousel]').forEach(function(car){
    var track = car.querySelector('.vv-car-track');
    var prev = car.querySelector('.vv-car-prev');
    var next = car.querySelector('.vv-car-next');
    var dotsHost = car.querySelector('[data-vv-dots]');
    var slides = track ? track.querySelectorAll('.vv-car-slide') : [];
    if (!track || !slides.length) return;

    function slideStep(){
      var first = slides[0];
      if (!first) return 420;
      var rect = first.getBoundingClientRect();
      var gap = parseFloat(getComputedStyle(track).gap) || 24;
      return rect.width + gap;
    }

    function go(dir){
      var step = slideStep();
      track.scrollBy({ left: dir * step, behavior: 'smooth' });
    }

    if (prev) prev.addEventListener('click', function(){ go(-1); });
    if (next) next.addEventListener('click', function(){ go(1); });

    // Dots
    if (dotsHost){
      slides.forEach(function(_, i){
        var d = document.createElement('button');
        d.type = 'button';
        d.className = 'vv-car-dot';
        d.setAttribute('aria-label', 'Go to review ' + (i+1));
        d.addEventListener('click', function(){
          track.scrollTo({ left: i * slideStep(), behavior: 'smooth' });
        });
        dotsHost.appendChild(d);
      });
      var dots = dotsHost.querySelectorAll('.vv-car-dot');
      function syncDots(){
        var step = slideStep();
        var idx = Math.round(track.scrollLeft / step);
        dots.forEach(function(d, i){ d.classList.toggle('active', i === idx); });
      }
      track.addEventListener('scroll', function(){
        clearTimeout(track._sd);
        track._sd = setTimeout(syncDots, 60);
      }, { passive: true });
      syncDots();
    }

    // Keyboard
    car.setAttribute('tabindex', '0');
    car.addEventListener('keydown', function(e){
      if (e.key === 'ArrowLeft') go(-1);
      if (e.key === 'ArrowRight') go(1);
    });

    // Auto-advance every 6s, pause on hover/touch
    var autoplay = setInterval(function(){
      var step = slideStep();
      var maxScroll = track.scrollWidth - track.clientWidth;
      if (track.scrollLeft + step > maxScroll - 4) {
        track.scrollTo({ left: 0, behavior: 'smooth' });
      } else {
        go(1);
      }
    }, 6000);
    car.addEventListener('mouseenter', function(){ clearInterval(autoplay); });
    car.addEventListener('mouseleave', function(){
      clearInterval(autoplay);
      autoplay = setInterval(function(){
        var step = slideStep();
        var maxScroll = track.scrollWidth - track.clientWidth;
        if (track.scrollLeft + step > maxScroll - 4) {
          track.scrollTo({ left: 0, behavior: 'smooth' });
        } else { go(1); }
      }, 6000);
    });
  });
})();
