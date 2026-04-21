// =====================================================================
// Blackbox Advancements — v3 interactive layer
// =====================================================================

(() => {
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------- Splash gate ----------
  const splash = document.querySelector('[data-splash]');
  const splashEnter = document.querySelector('[data-splash-enter]');
  const body = document.body;

  const SKIP_KEY = 'bb-splash-seen-v1';
  const urlHasSkip = new URLSearchParams(location.search).has('skip');
  const alreadySeen = sessionStorage.getItem(SKIP_KEY) === '1';
  const landingOnHash = location.hash && location.hash.length > 1;

  function dismissSplash(instant = false) {
    if (!splash) return;
    if (instant) splash.style.transition = 'opacity 0.25s';
    splash.classList.add('exit');
    body.classList.remove('has-splash');
    body.classList.add('splash-gone');
    sessionStorage.setItem(SKIP_KEY, '1');
    setTimeout(() => splash.remove(), instant ? 280 : 1000);
  }
  if (splash && (urlHasSkip || alreadySeen || landingOnHash)) {
    dismissSplash(true);
  }
  if (splashEnter) {
    splashEnter.addEventListener('click', () => dismissSplash(false));
  }
  // Keyboard: Enter or Space
  document.addEventListener('keydown', (e) => {
    if (splash && !splash.classList.contains('exit') && (e.key === 'Enter' || e.key === ' ')) {
      e.preventDefault();
      dismissSplash(false);
    }
  });

  // Magnetic effect on the ENTER button
  if (splashEnter && !prefersReducedMotion) {
    splashEnter.addEventListener('mousemove', (e) => {
      const rect = splashEnter.getBoundingClientRect();
      const x = e.clientX - rect.left - rect.width / 2;
      const y = e.clientY - rect.top - rect.height / 2;
      splashEnter.style.transform = `translate(${x * 0.12}px, ${y * 0.18}px) scale(1.02)`;
    });
    splashEnter.addEventListener('mouseleave', () => {
      splashEnter.style.transform = '';
    });
  }

  // ---------- Clock in splash footer ----------
  const timeEl = document.querySelector('[data-time]');
  if (timeEl) {
    const updateClock = () => {
      const d = new Date();
      const hh = String(d.getUTCHours()).padStart(2, '0');
      const mm = String(d.getUTCMinutes()).padStart(2, '0');
      const ss = String(d.getUTCSeconds()).padStart(2, '0');
      timeEl.textContent = `${hh}:${mm}:${ss} UTC`;
    };
    updateClock();
    setInterval(updateClock, 1000);
  }

  // ---------- Splash canvas: particle network (fallback when WebGL FX is unavailable) ----------
  const splashCanvas = document.querySelector('[data-splash-canvas]');
  const splashWebGL = document.querySelector('[data-splash-webgl]');
  const webGLSupported = (() => {
    try {
      const c = document.createElement('canvas');
      return !!(c.getContext('webgl2') || c.getContext('webgl'));
    } catch (e) { return false; }
  })();
  const webGLWillRun = !!splashWebGL && webGLSupported && !prefersReducedMotion;
  if (splashCanvas && !prefersReducedMotion && !webGLWillRun) {
    initParticleNetwork(splashCanvas, {
      count: 70,
      maxDist: 140,
      speed: 0.25,
      color: 'rgba(168, 85, 247, 0.6)',
      lineColor: 'rgba(168, 85, 247, 0.08)'
    });
  }

  // ---------- Hero canvas: quieter particle field ----------
  const heroCanvas = document.querySelector('[data-hero-canvas]');
  if (heroCanvas && !prefersReducedMotion) {
    initParticleNetwork(heroCanvas, {
      count: 40,
      maxDist: 160,
      speed: 0.15,
      color: 'rgba(168, 85, 247, 0.45)',
      lineColor: 'rgba(168, 85, 247, 0.06)'
    });
  }

  function initParticleNetwork(canvas, opts) {
    const ctx = canvas.getContext('2d');
    let w, h, dpr;
    let particles = [];
    let raf;

    function size() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      const rect = canvas.getBoundingClientRect();
      w = rect.width; h = rect.height;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function make() {
      particles = Array.from({ length: opts.count }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * opts.speed,
        vy: (Math.random() - 0.5) * opts.speed,
        r: Math.random() * 1.6 + 0.6
      }));
    }
    function tick() {
      ctx.clearRect(0, 0, w, h);
      for (const p of particles) {
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = opts.color;
        ctx.fill();
      }
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const a = particles[i], b = particles[j];
          const dx = a.x - b.x, dy = a.y - b.y;
          const d = Math.hypot(dx, dy);
          if (d < opts.maxDist) {
            ctx.beginPath();
            ctx.moveTo(a.x, a.y);
            ctx.lineTo(b.x, b.y);
            ctx.strokeStyle = opts.lineColor.replace(/[\d.]+\)$/g, (1 - d / opts.maxDist).toFixed(2) + ')');
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }
      raf = requestAnimationFrame(tick);
    }

    const ro = new ResizeObserver(() => { size(); make(); });
    ro.observe(canvas);
    size(); make(); tick();

    // pause when tab hidden
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) { cancelAnimationFrame(raf); } else { tick(); }
    });
  }

  // ---------- Reveal-on-scroll ----------
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.14 });
  document.querySelectorAll('.reveal').forEach((el) => revealObserver.observe(el));

  // ---------- Chart bars animate on reveal ----------
  const chart = document.querySelector('[data-chart]');
  if (chart) {
    const chartObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          const bars = chart.querySelectorAll('.bar');
          bars.forEach((bar, i) => setTimeout(() => bar.classList.add('visible'), i * 80));
          chartObserver.disconnect();
        }
      });
    }, { threshold: 0.18 });
    chartObserver.observe(chart);
  }

  // ---------- Savings card animate on reveal ----------
  const savings = document.querySelector('.savings-card');
  if (savings) {
    const so = new IntersectionObserver((entries) => {
      entries.forEach((e) => {
        if (e.isIntersecting) { savings.classList.add('visible'); so.disconnect(); }
      });
    }, { threshold: 0.2 });
    so.observe(savings);
  }

  // ---------- Count-up numbers ----------
  const counters = document.querySelectorAll('[data-count]');
  const countObs = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseFloat(el.getAttribute('data-count'));
      const dur = 1400;
      const t0 = performance.now();
      const step = (now) => {
        const p = Math.min(1, (now - t0) / dur);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(target * ease).toLocaleString();
        if (p < 1) requestAnimationFrame(step);
      };
      requestAnimationFrame(step);
      countObs.unobserve(el);
    });
  }, { threshold: 0.5 });
  counters.forEach((el) => countObs.observe(el));

  // ---------- Capability card cursor glow ----------
  if (!prefersReducedMotion) {
    document.querySelectorAll('.cap').forEach((card) => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const mx = ((e.clientX - rect.left) / rect.width) * 100;
        const my = ((e.clientY - rect.top) / rect.height) * 100;
        card.style.setProperty('--mx', mx + '%');
        card.style.setProperty('--my', my + '%');
      });
    });
  }

  // ---------- Tilt on hover (subtle) ----------
  if (!prefersReducedMotion && window.matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('[data-tilt]').forEach((el) => {
      el.addEventListener('mousemove', (e) => {
        const rect = el.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width - 0.5) * 2;
        const y = ((e.clientY - rect.top) / rect.height - 0.5) * 2;
        el.style.transform = `perspective(900px) rotateX(${-y * 2.4}deg) rotateY(${x * 2.4}deg) translateY(-4px)`;
      });
      el.addEventListener('mouseleave', () => { el.style.transform = ''; });
    });
  }

  // ---------- Nav menu toggle ----------
  const menuToggle = document.querySelector('[data-menu-toggle]');
  const navLinks = document.querySelector('[data-nav-links]');
  if (menuToggle && navLinks) {
    menuToggle.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(open));
    });
  }

  // ---------- Footer year ----------
  const year = document.querySelector('[data-year]');
  if (year) year.textContent = new Date().getFullYear();
})();
