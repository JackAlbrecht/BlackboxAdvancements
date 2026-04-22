/* JEKK CARDS — tiny interaction script */
(function () {
  // Mobile nav
  const toggle = document.querySelector('[data-menu-toggle]');
  const links  = document.querySelector('[data-nav-links]');
  toggle && toggle.addEventListener('click', () => {
    const open = links.classList.toggle('open');
    toggle.setAttribute('aria-expanded', open);
  });

  // Close nav on link click (mobile)
  document.querySelectorAll('[data-nav-links] a').forEach(a => {
    a.addEventListener('click', () => links && links.classList.remove('open'));
  });

  // Reveal on scroll
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // Count up
  const counters = document.querySelectorAll('[data-count]');
  const cio = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (!e.isIntersecting) return;
      const el = e.target;
      const end = parseFloat(el.dataset.count);
      const suffix = el.dataset.suffix || '';
      const decimals = (String(end).split('.')[1] || '').length;
      const dur = 1400;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const eased = 1 - Math.pow(1 - p, 3);
        const val = end * eased;
        el.textContent = val.toFixed(decimals).replace(/\B(?=(\d{3})+(?!\d))/g, ',') + suffix;
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      cio.unobserve(el);
    });
  }, { threshold: 0.35 });
  counters.forEach(el => cio.observe(el));

  // Newsletter stub
  document.querySelectorAll('.nl-form').forEach(f => {
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const input = f.querySelector('input');
      if (!input || !input.value) return;
      input.value = '';
      const btn = f.querySelector('button');
      if (btn) { const old = btn.textContent; btn.textContent = 'Subscribed ✓'; setTimeout(() => btn.textContent = old, 2400); }
    });
  });

  // Contact form stub
  const cf = document.querySelector('[data-contact-form]');
  cf && cf.addEventListener('submit', (e) => {
    e.preventDefault();
    const ok = document.querySelector('[data-contact-ok]');
    if (ok) ok.style.display = 'block';
    cf.reset();
  });

  // Current year
  document.querySelectorAll('[data-year]').forEach(el => el.textContent = new Date().getFullYear());
})();
