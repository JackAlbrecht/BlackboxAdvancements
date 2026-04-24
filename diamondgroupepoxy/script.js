/* ============================================================
   Diamond Group Epoxy Floors — main script
   ============================================================ */
(function () {
  'use strict';

  /* ---------- Helpers ---------- */
  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const on = (el, ev, fn, opts) => el && el.addEventListener(ev, fn, opts);

  document.documentElement.classList.remove('no-js');
  document.documentElement.classList.add('js');

  /* ---------- Current year ---------- */
  const yr = $('#year'); if (yr) yr.textContent = new Date().getFullYear();

  /* ---------- Nav: scrolled state + mobile toggle ---------- */
  const nav = $('#nav');
  const navToggle = $('#navToggle');
  if (nav) {
    const onScroll = () => nav.classList.toggle('is-scrolled', window.scrollY > 16);
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true });
  }
  if (navToggle) {
    on(navToggle, 'click', () => nav.classList.toggle('is-open'));
    $$('.nav-links a').forEach(a => on(a, 'click', () => nav.classList.remove('is-open')));
  }

  /* ---------- Scroll-reveal observer ---------- */
  const revealables = $$('.reveal, .reveal-scale, .reveal-children');
  if ('IntersectionObserver' in window && revealables.length) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('in');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '-10% 0px -8% 0px', threshold: 0.08 });
    revealables.forEach(el => {
      // skip hero (already `.in` in HTML for instant load)
      if (!el.classList.contains('in')) io.observe(el);
    });
  }

  /* ---------- Cursor spotlight ---------- */
  const spotlight = $('#spotlight');
  if (spotlight && window.matchMedia('(pointer:fine)').matches) {
    let raf = null, x = 0, y = 0, tx = 0, ty = 0;
    const render = () => {
      x += (tx - x) * 0.18; y += (ty - y) * 0.18;
      spotlight.style.transform = `translate(${x}px, ${y}px) translate(-50%, -50%)`;
      raf = requestAnimationFrame(render);
    };
    window.addEventListener('mousemove', (e) => {
      tx = e.clientX; ty = e.clientY;
      spotlight.style.opacity = 1;
      if (!raf) render();
    });
    window.addEventListener('mouseleave', () => { spotlight.style.opacity = 0; });
  }

  /* ---------- Service card mouse-tracking highlight ---------- */
  $$('.service-card').forEach(card => {
    on(card, 'mousemove', (e) => {
      const r = card.getBoundingClientRect();
      card.style.setProperty('--x', ((e.clientX - r.left) / r.width * 100) + '%');
      card.style.setProperty('--y', ((e.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ---------- Load copy.json then populate testimonials, areas, FAQ ---------- */
  async function loadCopy() {
    try {
      const res = await fetch('_copy.json', { cache: 'force-cache' });
      if (!res.ok) throw new Error('copy fetch failed');
      return await res.json();
    } catch (e) {
      console.warn('[diamond] copy.json not loaded', e);
      return null;
    }
  }

  function renderTestimonials(list) {
    const root = $('#testimonials');
    if (!root || !list) return;
    root.innerHTML = list.map(t => {
      const initial = (t.name || '?')[0];
      const starsHtml = Array.from({length: t.stars || 5}, () => '<i class="ph-fill ph-star"></i>').join('');
      return `
        <article class="testimonial">
          <div class="stars" aria-label="${t.stars || 5} stars">${starsHtml}</div>
          <blockquote>“${t.quote}”</blockquote>
          <div class="author">
            <div class="avatar">${initial}</div>
            <div>
              <div class="name">${t.name}</div>
              <div class="meta">${t.city}</div>
            </div>
          </div>
        </article>`;
    }).join('');
  }

  function renderAreas(areas) {
    const root = $('#areasGrid');
    if (!root || !areas) return;
    const slugs = Object.keys(areas);
    root.innerHTML = slugs.map(slug => {
      const a = areas[slug];
      return `
        <a href="areas/${slug}.html" class="area-pill">
          <span class="name">${a.city}</span>
          <span class="arrow"><i class="ph-bold ph-arrow-up-right"></i></span>
        </a>`;
    }).join('');
  }

  function renderFAQ(items) {
    const root = $('#faqList');
    if (!root || !items) return;
    root.innerHTML = items.map(({q, a}) => `
      <details class="faq-item">
        <summary>${q}<span class="icon"><i class="ph-bold ph-plus"></i></span></summary>
        <div class="answer"><p>${a}</p></div>
      </details>
    `).join('');
    // toggle classes for border highlight
    $$('.faq-item').forEach(d => {
      d.addEventListener('toggle', () => d.classList.toggle('open', d.open));
    });
  }

  loadCopy().then(copy => {
    if (!copy) return;
    window.__diamondCopy = copy;
    renderTestimonials(copy.testimonials);
    renderAreas(copy.areas);
    renderFAQ(copy.faq);
    // Re-observe newly added reveal children
    const newRev = $$('.testimonial-grid, .areas-grid, .faq-list');
    if ('IntersectionObserver' in window) {
      const io2 = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          if (e.isIntersecting) { e.target.classList.add('in'); io2.unobserve(e.target); }
        });
      }, { rootMargin: '-10% 0px -8% 0px', threshold: 0.08 });
      newRev.forEach(el => io2.observe(el));
    } else {
      newRev.forEach(el => el.classList.add('in'));
    }
  });

  /* ---------- Estimator ---------- */
  const est = {
    space: null, system: null, sqft: null, price: null,
    step: 1,
    PRICE_MULT: { flake: 7, metallic: 11, quartz: 9, solid: 5.5, 'grind-seal': 4.5, polyaspartic: 8 },
    SPACE_SQFT: { '1-car': 250, '2-car': 450, '3-car': 700, shop: 600, basement: 500, commercial: 1500 },
  };

  const estForm = $('form.estimator');
  if (estForm) {
    // Option clicks
    $$('#estimator .opt').forEach(btn => {
      on(btn, 'click', (e) => {
        e.preventDefault();
        const container = btn.closest('[data-field]');
        if (!container) return;
        const field = container.dataset.field;
        container.querySelectorAll('.opt').forEach(o => o.classList.remove('selected'));
        btn.classList.add('selected');
        est[field] = btn.dataset.value;
        if (field === 'space') est.sqft = est.SPACE_SQFT[btn.dataset.value] || null;
      });
    });

    // Next button
    $$('[data-next]').forEach(nb => {
      on(nb, 'click', (e) => {
        e.preventDefault();
        if (!validateStep(est.step)) return;
        if (est.step < 4) goStep(est.step + 1);
        else submitLead();
      });
    });
    // Back button
    $$('[data-back]').forEach(bb => {
      on(bb, 'click', (e) => { e.preventDefault(); if (est.step > 1) goStep(est.step - 1); });
    });

    // sqft input: auto-fill if user picked a standard space
    const sqftInput = $('#sqft');
    if (sqftInput) {
      const syncSqft = () => { if (est.sqft && !sqftInput.value) sqftInput.value = est.sqft; };
      on(sqftInput, 'input', () => { est.sqft = parseInt(sqftInput.value, 10) || null; });
      // when we reach step 3, prefill
      const pre = () => syncSqft();
      $$('[data-next]').forEach(b => on(b, 'click', () => setTimeout(pre, 80)));
    }

    on($('#estRestart'), 'click', (e) => {
      e.preventDefault();
      est.space = null; est.system = null; est.sqft = null; est.price = null;
      $$('#estimator .opt').forEach(o => o.classList.remove('selected'));
      $('#sqft').value = ''; $('#leadName').value = ''; $('#leadPhone').value = '';
      $('#leadEmail').value = ''; $('#leadCity').value = '';
      $('#estResult').classList.remove('active');
      goStep(1);
    });
  }

  function validateStep(n) {
    if (n === 1 && !est.space)  { flash('Pick a space to continue.'); return false; }
    if (n === 2 && !est.system) { flash('Pick a system to continue.'); return false; }
    if (n === 3) {
      const v = parseInt($('#sqft').value, 10);
      if (!v || v < 100) { flash('Enter a square footage (min 100).'); return false; }
      est.sqft = v;
    }
    return true;
  }

  function goStep(n) {
    est.step = n;
    $$('.est-step').forEach(s => s.classList.toggle('active', parseInt(s.dataset.step,10) === n));
    const bars = $$('#estProgress > div');
    bars.forEach((b, i) => {
      b.classList.remove('active', 'done');
      if (i < n - 1) b.classList.add('done');
      else if (i === n - 1) b.classList.add('active');
    });
  }

  function computePrice() {
    const mult = est.PRICE_MULT[est.system] || 7;
    const sqft = est.sqft || 450;
    // Real-world Portland-metro pricing. Add minimums + mobilization fee for small jobs.
    const base = sqft * mult;
    const low  = Math.max(Math.round(base * 0.9 / 50) * 50, 1800);
    const high = Math.round(base * 1.15 / 50) * 50;
    est.price = { low, high };
    return est.price;
  }

  function submitLead() {
    const p = computePrice();
    $('#estPrice').textContent = `$${fmt(p.low)} – $${fmt(p.high)}`;
    // Hide steps
    $$('.est-step').forEach(s => s.classList.remove('active'));
    $('#estResult').classList.add('active');
    // Progress bar all done
    $$('#estProgress > div').forEach(b => { b.classList.remove('active'); b.classList.add('done'); });

    // POST lead to backend (best-effort — fail silent)
    const payload = {
      name: $('#leadName').value.trim(),
      phone: $('#leadPhone').value.trim(),
      email: $('#leadEmail').value.trim(),
      city: $('#leadCity').value.trim(),
      space: est.space, system: est.system, sqft: est.sqft,
      priceLow: p.low, priceHigh: p.high,
      source: 'diamondgroup-estimator', ts: new Date().toISOString(),
    };
    try {
      navigator.sendBeacon && navigator.sendBeacon('/api/diamond-lead',
        new Blob([JSON.stringify(payload)], { type: 'application/json' })
      );
    } catch(e) {}
    // Also save locally so the client can always see the last lead
    try { localStorage.setItem('diamond:lastLead', JSON.stringify(payload)); } catch(e) {}

    // Scroll result into view
    $('#estResult').scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  function fmt(n){ return n.toLocaleString('en-US'); }

  /* ---------- Flash toast ---------- */
  let toastTimer = null;
  function flash(msg) {
    let t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.style.cssText = 'position:fixed;top:22px;left:50%;transform:translateX(-50%) translateY(-140%);z-index:200;padding:.75rem 1.1rem;border-radius:999px;background:rgba(7,8,12,.92);color:var(--diamond);border:1px solid var(--line-strong);font-size:.9rem;font-weight:500;box-shadow:var(--shadow);transition:transform .4s var(--ease);backdrop-filter:blur(12px)';
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.style.transform = 'translateX(-50%) translateY(0)';
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.style.transform = 'translateX(-50%) translateY(-140%)'; }, 2400);
  }

  /* ---------- Gallery lightbox ---------- */
  const lb = $('#lightbox'); const lbImg = $('#lightboxImg'); const lbClose = $('#lightboxClose');
  $$('#gallery figure').forEach(fig => {
    on(fig, 'click', () => {
      const img = fig.querySelector('img'); if (!img) return;
      lbImg.src = img.src; lbImg.alt = img.alt;
      lb.classList.add('active');
      document.body.style.overflow = 'hidden';
    });
  });
  if (lbClose) on(lbClose, 'click', closeLb);
  if (lb) on(lb, 'click', (e) => { if (e.target === lb) closeLb(); });
  on(document, 'keydown', (e) => { if (e.key === 'Escape') closeLb(); });
  function closeLb(){ if (!lb) return; lb.classList.remove('active'); document.body.style.overflow = ''; }

  /* ---------- AI Chat widget (rule-based + Vapi hand-off) ---------- */
  const chatWidget = $('#chatWidget');
  const chatToggle = $('#chatToggle');
  const chatInput  = $('#chatInput');
  const chatSend   = $('#chatSend');
  const chatMsgs   = $('#chatMessages');
  const chatBadge  = chatToggle && chatToggle.querySelector('.chat-badge');

  if (chatToggle) {
    on(chatToggle, 'click', () => {
      chatWidget.classList.toggle('is-open');
      if (chatWidget.classList.contains('is-open')) {
        chatBadge && (chatBadge.style.display = 'none');
        setTimeout(() => chatInput && chatInput.focus(), 200);
      }
    });
  }
  $$('#chatQuick button').forEach(b => on(b, 'click', () => ask(b.dataset.q)));
  if (chatSend) on(chatSend, 'click', () => ask(chatInput.value));
  if (chatInput) on(chatInput, 'keydown', (e) => { if (e.key === 'Enter') ask(chatInput.value); });

  function ask(q) {
    if (!q || !q.trim()) return;
    addMsg('user', q);
    chatInput.value = '';
    showTyping();
    setTimeout(() => {
      hideTyping();
      addMsg('bot', answerFor(q));
    }, 650 + Math.random() * 500);
  }
  function addMsg(who, text) {
    const div = document.createElement('div');
    div.className = 'chat-msg ' + who;
    div.innerHTML = text;
    chatMsgs.appendChild(div);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }
  let typingEl = null;
  function showTyping() {
    typingEl = document.createElement('div');
    typingEl.className = 'chat-msg bot chat-typing';
    typingEl.innerHTML = '<span></span><span></span><span></span>';
    chatMsgs.appendChild(typingEl);
    chatMsgs.scrollTop = chatMsgs.scrollHeight;
  }
  function hideTyping(){ if (typingEl) { typingEl.remove(); typingEl = null; } }

  function answerFor(q) {
    const Q = q.toLowerCase();
    if (/(price|cost|quote|\$|expensive|cheap|how much)/i.test(Q)) {
      if (/2.?car/i.test(Q))        return 'A typical 2-car garage (~450 sqft) in the Portland metro runs <strong>$2,800–$5,200</strong> depending on system — flake is ~$2,800-3,400, metallic ~$4,200-5,200. Want a written quote? Scroll up to the <a href="#estimator" style="color:var(--ice)">60-second estimator</a> or call <a href="tel:5035017295" style="color:var(--ice)">503-501-7295</a>.';
      if (/3.?car/i.test(Q))        return 'A 3-car garage (~700 sqft) runs roughly <strong>$4,400–$8,000</strong> depending on system and slab condition. Open the <a href="#estimator" style="color:var(--ice)">estimator</a> for a more accurate number, or call <a href="tel:5035017295" style="color:var(--ice)">503-501-7295</a>.';
      if (/1.?car/i.test(Q))        return 'A 1-car garage (~250 sqft) runs <strong>$1,800–$2,900</strong>. That includes diamond-grind prep, the full flake or metallic system, and our 10-year warranty. Fire up the <a href="#estimator" style="color:var(--ice)">estimator</a> for a live price.';
      if (/commercial|warehouse|shop|industrial/i.test(Q)) return 'Commercial pricing runs <strong>$4.50–$12 per sqft</strong> depending on system (grind-and-seal is cheapest, polyaspartic top end). We do off-hours installs and volume discounts above 3,000 sqft — call <a href="tel:5035017295" style="color:var(--ice)">503-501-7295</a> to scope the job.';
      return 'Pricing depends on system and square footage — flake starts around $6.50/sqft, metallic around $10/sqft. Use the <a href="#estimator" style="color:var(--ice)">estimator</a> above for a real-world range, or call <a href="tel:5035017295" style="color:var(--ice)">503-501-7295</a>.';
    }
    if (/(install|how long|time|day|hours|finish|dry|cure)/i.test(Q)) {
      return 'Every residential floor we install is a <strong>one-day install</strong>. We arrive early, diamond-grind the slab, apply the basecoat + flake or metallic, and topcoat with polyaspartic — all before you get home. You can walk on it that evening and park a car on it within 24 hours.';
    }
    if (/(warranty|guarantee|last|durab)/i.test(Q)) {
      return '<strong>10-year written warranty</strong> on every residential floor, 5-year on commercial. The floor itself is built to last 20+ years — the warranty just gives you the paperwork. Moisture delamination, hot-tire peel, and UV chalking are all covered.';
    }
    if (/(lake oswego|west linn|portland|beaverton|tigard|hillsboro|vancouver|tualatin|sherwood|clackamas|happy valley|gresham|wilsonville|oregon city|canby|newberg|dundee|bethany|aloha|milwaukie|my area|service area)/i.test(Q)) {
      return 'Yes — we install across the entire Portland metro plus Vancouver WA. Washington, Multnomah, Clackamas, Yamhill, and Clark counties. See our <a href="#areas" style="color:var(--ice)">full area list</a> above, or call <a href="tel:5035017295" style="color:var(--ice)">503-501-7295</a> to confirm your address.';
    }
    if (/(metallic|3d|showroom|mirror|gloss)/i.test(Q)) {
      return 'Metallic is our showroom system — reflective mica pigments hand-worked into a 100% solids epoxy, topcoated with UV-stable polyaspartic. Every floor is one of a kind. Runs about <strong>$9–$12 per sqft</strong>. See <a href="services/metallic-epoxy.html" style="color:var(--ice)">the full metallic page</a>.';
    }
    if (/(flake|chip|vinyl|broadcast)/i.test(Q)) {
      return 'Flake (chip) is our most popular residential system — full-broadcast vinyl chips, diamond-ground prep, polyaspartic topcoat. Slip-resistant, hot-tire proof, 10-year warranty. Around <strong>$6.50–$8 per sqft</strong>. <a href="services/flake-floors.html" style="color:var(--ice)">Full details here</a>.';
    }
    if (/(quartz|kitchen|brewery|vet|food)/i.test(Q)) {
      return 'Quartz is our commercial-spec system — graded quartz aggregate broadcast into epoxy, sealed with chemical-resistant topcoat. Sanitary, slip-rated, USDA-compliant. <a href="services/quartz-floors.html" style="color:var(--ice)">See quartz details</a>.';
    }
    if (/(polyurea|polyaspartic|epoxy.*differ|stronger|uv)/i.test(Q)) {
      return 'Short version: polyaspartic is <strong>4× stronger than epoxy</strong>, UV-stable (no yellowing), and cures in 1–2 hours vs. epoxy\'s 24. We use 100% solids epoxy as the basecoat and polyaspartic as the topcoat — best of both.';
    }
    if (/(hello|hi|hey|howdy)/i.test(Q)) {
      return 'Hey there 👋 — ask me anything about pricing, warranty, installation, or what system fits your space. Or jump straight to the <a href="#estimator" style="color:var(--ice)">estimator</a> if you already know what you want.';
    }
    if (/(call|phone|talk|speak|human)/i.test(Q)) {
      return 'Easiest: tap <a href="tel:5035017295" style="color:var(--ice)"><strong>503-501-7295</strong></a>. Or use the <strong>“Talk to Diamond”</strong> pill at the top-right of the page to get on a live AI voice call right now — it can answer questions and schedule the in-home quote.';
    }
    if (/(book|schedule|appointment|in.home|quote|estimate)/i.test(Q)) {
      return 'Two ways: (1) fill out the <a href="#estimator" style="color:var(--ice)">60-second estimator</a> above and we\'ll text a written quote within the hour, or (2) call <a href="tel:5035017295" style="color:var(--ice)">503-501-7295</a> to schedule a free in-home visit.';
    }
    // fallback
    return "That's a good one — easiest is to tap the <strong>“Talk to Diamond”</strong> voice AI at the top-right and ask live, or call <a href=\"tel:5035017295\" style=\"color:var(--ice)\"><strong>503-501-7295</strong></a> and a human will pick up. In the meantime, try asking about <em>pricing</em>, <em>warranty</em>, <em>install time</em>, or <em>service area</em>.";
  }

  /* ---------- Smooth-scroll internal anchors ---------- */
  $$('a[href^="#"]').forEach(a => {
    on(a, 'click', (e) => {
      const id = a.getAttribute('href');
      if (id.length <= 1) return;
      const el = document.querySelector(id);
      if (!el) return;
      e.preventDefault();
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      history.replaceState(null, '', id);
    });
  });

  /* ---------- Reveal-children: stagger the immediate children individually on top-of-page ---------- */
  // (already handled via IntersectionObserver above)

  /* ---------- Konami: /diamond gives the secret testimonial ---------- */
  // (harmless easter-egg hook for future)

})();
