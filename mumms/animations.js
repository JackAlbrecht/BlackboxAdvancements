/* Mumm's LLC — interactions + estimator */
(function () {
  'use strict';

  /* Reveal on scroll */
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
  document.querySelectorAll('.reveal, .stagger').forEach((el) => io.observe(el));

  /* Mobile menu */
  const toggle = document.querySelector('.mobile-toggle');
  const menu = document.querySelector('.mobile-menu');
  if (toggle && menu) {
    let scrim = document.querySelector('.mobile-menu-scrim');
    if (!scrim) { scrim = document.createElement('div'); scrim.className = 'mobile-menu-scrim'; scrim.setAttribute('aria-hidden', 'true'); document.body.appendChild(scrim); }
    const set = (o) => { menu.classList.toggle('open', o); scrim.classList.toggle('open', o); toggle.classList.toggle('is-open', o); toggle.setAttribute('aria-expanded', o ? 'true' : 'false'); menu.setAttribute('aria-hidden', o ? 'false' : 'true'); document.body.classList.toggle('menu-open', o); };
    toggle.addEventListener('click', () => set(!menu.classList.contains('open')));
    scrim.addEventListener('click', () => set(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.classList.contains('open')) set(false); });
    menu.querySelectorAll('.mm-close').forEach((btn) => btn.addEventListener('click', (e) => { e.preventDefault(); set(false); }));
    menu.querySelectorAll('a[href]').forEach((a) => a.addEventListener('click', () => set(false)));
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
    let rtid;
    window.addEventListener('resize', () => { clearTimeout(rtid); rtid = setTimeout(() => { if (window.innerWidth > 980 && menu.classList.contains('open')) set(false); }, 120); });
  }

  /* Duplicate ticker / showcase tracks for infinite scroll */
  document.querySelectorAll('.ticker-track, .showcase-track').forEach((track) => {
    const clone = track.cloneNode(true);
    clone.setAttribute('aria-hidden', 'true');
    const wrap = document.createElement('div');
    const isShow = track.classList.contains('showcase-track');
    const dur = isShow ? 55 : 40;
    wrap.style.cssText = `display:flex; gap:${isShow ? '1rem' : '3rem'}; width:max-content; animation:slideLeft ${dur}s linear infinite;`;
    track.parentNode.insertBefore(wrap, track);
    wrap.appendChild(track);
    wrap.appendChild(clone);
    track.style.animation = 'none';
    clone.style.animation = 'none';
  });

  /* Counter animation */
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

  /* ===== Estimator ===== */
  const est = document.getElementById('estForm');
  if (!est) return;

  const emailRe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const flash = (input, msg) => {
    let err = input.parentNode.querySelector('.est-err');
    if (!err) { err = document.createElement('span'); err.className = 'est-err'; input.parentNode.appendChild(err); }
    err.textContent = msg;
    input.style.borderColor = '#b8860b';
    input.addEventListener('input', () => { err.textContent = ''; input.style.borderColor = ''; }, { once: true });
  };

  /* Bellingham / Whatcom primary ZIPs */
  const PRIMARY_ZIPS = new Set([
    '98225','98226','98227','98228','98229',
    '98230','98231','98232','98233','98235','98236','98237','98238','98240',
    '98244','98247','98248','98260','98262','98264','98266','98276',
    '98281','98283','98284','98295','98296'
  ]);

  const BASES = {
    'furnace':      [3500, 8500],
    'ac-install':   [4200, 9000],
    'heat-pump':    [5000, 14000],
    'ductless':     [3000, 9500],
    'gas-piping':   [800, 4500],
    'ventilation':  [1200, 5000],
    'full-system':  [8000, 22000]
  };

  const LABELS = {
    'furnace':      'Furnace install / replace',
    'ac-install':   'AC install / replace',
    'heat-pump':    'Heat pump install',
    'ductless':     'Ductless mini-split',
    'gas-piping':   'Gas piping',
    'ventilation':  'Ventilation system',
    'full-system':  'Full HVAC system'
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
    const zip = (est.elements.zip.value || '').trim();

    let [lo, hi] = BASES[jobSel.value];
    const sizeM = { small: 0.75, medium: 1.0, large: 1.45, xlarge: 1.85 }[size] || 1;
    lo *= sizeM; hi *= sizeM;

    const propM = { residential: 1.0, 'new-construction': 1.1, commercial: 1.35 }[property] || 1;
    lo *= propM; hi *= propM;

    const outOfArea = zip.length === 5 && !PRIMARY_ZIPS.has(zip);
    if (outOfArea) { lo += 150; hi += 200; }

    lo = Math.round(lo / 25) * 25;
    hi = Math.round(hi / 25) * 25;

    const fmt = (n) => `$${n.toLocaleString('en-US')}`;
    est.querySelector('.est-range').textContent = `${fmt(lo)} – ${fmt(hi)}`;

    const f = est.elements;
    const addr = [f.street && f.street.value.trim(), f.city && f.city.value.trim(), f.state && f.state.value.trim(), zip].filter(Boolean).join(', ');

    est.querySelector('.est-summary').textContent =
      `${LABELS[jobSel.value]} · ${property} · ${size}` +
      `${outOfArea ? ' · out-of-area travel included' : ''}` +
      `. Final price confirmed at your free on-site evaluation at ${addr || 'your address'}.`;

    show(result);
  });

  /* Contact demo form */
  const demo = document.querySelector('form[data-demo]');
  if (demo) {
    demo.addEventListener('submit', (e) => {
      e.preventDefault();
      const msg = demo.querySelector('.demo-confirm');
      if (msg) {
        msg.textContent = `Thanks! A Mumm's technician will reach out within one business day.`;
        msg.style.opacity = '1';
        setTimeout(() => demo.reset(), 400);
        setTimeout(() => { msg.style.opacity = '0'; }, 8000);
      }
    });
  }
})();
