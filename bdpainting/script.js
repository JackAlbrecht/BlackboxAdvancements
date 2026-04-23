/* B&D PAINTING — interactions + estimator logic */
(function () {
  // ---------- Mobile nav ----------
  const toggle = document.querySelector('[data-menu-toggle]');
  const links  = document.querySelector('[data-nav-links]');
  if (toggle && links) {
    toggle.addEventListener('click', () => {
      const open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  // ---------- Marquee seamless loop (duplicate children) ----------
  document.querySelectorAll('.anno-track, .stripe-track').forEach(track => {
    if (track.dataset.duped) return;
    const originals = Array.from(track.children);
    originals.forEach(node => {
      const clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
    track.dataset.duped = '1';
  });

  // ---------- Scroll reveal ----------
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { rootMargin: '-10% 0px -5% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(el => io.observe(el));
  }

  // ---------- Year ----------
  document.querySelectorAll('[data-year]').forEach(el => {
    el.textContent = new Date().getFullYear();
  });

  // =============================================================
  // ESTIMATOR — multi-step painting price calculator
  // =============================================================
  const est = document.querySelector('[data-estimator]');
  if (!est) return;

  // Pricing model (Yakima market ranges)
  // Values are per-unit ranges [low, high] that get summed/multiplied per answer.
  const PRICING = {
    project: {
      interior: {
        base: 0,
        unit: 'room',
        sizes: {
          '1':   [400, 800],
          '2-3': [1200, 2400],
          '4-6': [2400, 4800],
          'whole': [4500, 9500]
        }
      },
      exterior: {
        base: 0,
        unit: 'home',
        sizes: {
          'small':  [2800, 5200],
          'medium': [4500, 8500],
          'large':  [7500, 14500],
          'xl':     [11000, 20000]
        }
      },
      cabinets: {
        base: 600,
        unit: 'door',
        sizes: {
          '10':  [900, 1600],
          '20':  [1700, 3000],
          '30':  [2600, 4500],
          '40+': [3800, 6500]
        }
      },
      commercial: {
        base: 0,
        unit: 'sqft',
        sizes: {
          '2000':  [2500, 5000],
          '5000':  [6000, 12000],
          '10000': [12000, 22000],
          '25000': [25000, 50000]
        }
      },
      drywall: {
        base: 0,
        unit: 'scope',
        sizes: {
          'patch': [200, 500],
          'room':  [550, 1200],
          'multi': [1200, 2800],
          'whole': [2800, 6500]
        }
      }
    },
    scope: {
      'walls':       1.00,
      'walls-ceil':  1.22,
      'full-trim':   1.45
    },
    condition: {
      'new':     0.90,
      'good':    1.00,
      'repairs': 1.15,
      'major':   1.32
    },
    colors: {
      'one':   1.00,
      'two':   1.06,
      'multi': 1.12
    }
  };

  // State
  const state = {
    step: 1,
    project: null,
    size: null,
    scope: null,
    condition: null,
    colors: null,
    contact: { name: '', email: '', phone: '', address: '' }
  };

  const stepEls = est.querySelectorAll('.est-step');
  const progressDots = est.querySelectorAll('.est-progress .dot');
  const TOTAL_STEPS = stepEls.length;

  function showStep(n) {
    state.step = n;
    stepEls.forEach(s => s.classList.toggle('active', parseInt(s.dataset.step, 10) === n));
    progressDots.forEach((d, i) => d.classList.toggle('active', i < n));
    // Update size step label based on project
    if (n === 2) updateSizeStep();
    // Update result on final step
    if (n === 6) renderResult();
  }

  function updateSizeStep() {
    const sizeStep = est.querySelector('[data-step="2"]');
    if (!sizeStep) return;
    const q = sizeStep.querySelector('.est-question');
    const opts = sizeStep.querySelector('.est-options');
    if (!state.project) return;

    const labels = {
      interior: {
        q: 'How many rooms?',
        options: [
          { v: '1',     ttl: '1 room',         desc: 'Single room',       em: '🛋️' },
          { v: '2-3',   ttl: '2–3 rooms',      desc: 'Couple of rooms',   em: '🏠' },
          { v: '4-6',   ttl: '4–6 rooms',      desc: 'Most of the house', em: '🏡' },
          { v: 'whole', ttl: 'Whole house',    desc: '7+ rooms',          em: '🏘️' }
        ]
      },
      exterior: {
        q: 'How big is the home?',
        options: [
          { v: 'small',  ttl: 'Small',   desc: '1 story, <1500 sqft', em: '🏠' },
          { v: 'medium', ttl: 'Medium',  desc: '1–2 story, 1500–2500', em: '🏡' },
          { v: 'large',  ttl: 'Large',   desc: '2 story, 2500–4000',   em: '🏘️' },
          { v: 'xl',     ttl: 'X-Large', desc: '4000+ sqft',           em: '🏛️' }
        ]
      },
      cabinets: {
        q: 'How many cabinet doors + drawers?',
        options: [
          { v: '10',  ttl: '~10',  desc: 'Small kitchen',        em: '🗄️' },
          { v: '20',  ttl: '~20',  desc: 'Avg kitchen',          em: '🪑' },
          { v: '30',  ttl: '~30',  desc: 'Large kitchen',        em: '🏠' },
          { v: '40+', ttl: '40+',  desc: 'Kitchen + bath, etc.', em: '🏡' }
        ]
      },
      commercial: {
        q: 'How much square footage?',
        options: [
          { v: '2000',  ttl: 'Up to 2k',   desc: 'Small office/retail', em: '🏢' },
          { v: '5000',  ttl: '2k–5k',     desc: 'Mid-size space',      em: '🏬' },
          { v: '10000', ttl: '5k–10k',    desc: 'Large facility',      em: '🏭' },
          { v: '25000', ttl: '10k+',      desc: 'Warehouse / multi-tenant', em: '🏗️' }
        ]
      },
      drywall: {
        q: 'What\'s the scope?',
        options: [
          { v: 'patch', ttl: 'Patch',      desc: 'Small spot repairs', em: '🔧' },
          { v: 'room',  ttl: 'One room',   desc: 'Walls + ceiling',    em: '🧱' },
          { v: 'multi', ttl: 'Multi-room', desc: '2–3 rooms',          em: '🏠' },
          { v: 'whole', ttl: 'Whole home', desc: 'Extensive repair',   em: '🏡' }
        ]
      }
    };

    const cfg = labels[state.project];
    if (!cfg) return;
    q.textContent = cfg.q;
    opts.innerHTML = cfg.options.map(o => `
      <div class="est-opt" data-val="${o.v}">
        <span class="em">${o.em}</span>
        <span class="ttl">${o.ttl}</span>
        <span class="desc">${o.desc}</span>
      </div>
    `).join('');
    attachOptionHandlers(opts, 'size');
  }

  function attachOptionHandlers(container, field) {
    container.querySelectorAll('.est-opt').forEach(opt => {
      opt.addEventListener('click', () => {
        container.querySelectorAll('.est-opt').forEach(o => o.classList.remove('selected'));
        opt.classList.add('selected');
        state[field] = opt.dataset.val;
        // auto-advance after short delay
        const nextBtn = est.querySelector(`[data-step="${state.step}"] .est-next`);
        if (nextBtn) nextBtn.disabled = false;
        setTimeout(() => {
          if (state.step < TOTAL_STEPS - 1) showStep(state.step + 1);
        }, 320);
      });
    });
  }

  // Attach step 1 options (static)
  const step1Opts = est.querySelector('[data-step="1"] .est-options');
  if (step1Opts) attachOptionHandlers(step1Opts, 'project');

  // Attach static steps (3, 4, 5) options
  ['3', '4', '5'].forEach(n => {
    const s = est.querySelector(`[data-step="${n}"] .est-options`);
    if (!s) return;
    const field = { '3': 'scope', '4': 'condition', '5': 'colors' }[n];
    attachOptionHandlers(s, field);
  });

  // Back / Next buttons
  est.querySelectorAll('.est-back').forEach(b => {
    b.addEventListener('click', () => {
      if (state.step > 1) showStep(state.step - 1);
    });
  });
  est.querySelectorAll('.est-next').forEach(b => {
    b.addEventListener('click', () => {
      if (state.step < TOTAL_STEPS) showStep(state.step + 1);
    });
  });

  // Final step: compute result + contact capture
  function renderResult() {
    const { project, size, scope, condition, colors } = state;
    if (!project || !size) return;
    const proj = PRICING.project[project];
    const sizeRange = proj.sizes[size];
    if (!sizeRange) return;
    let [low, high] = sizeRange;
    low  += proj.base;
    high += proj.base;
    const scopeMult = PRICING.scope[scope] || 1;
    const condMult  = PRICING.condition[condition] || 1;
    const colorMult = PRICING.colors[colors] || 1;
    const mult = scopeMult * condMult * colorMult;
    low  = Math.round(low  * mult / 50) * 50;   // round to nearest $50
    high = Math.round(high * mult / 50) * 50;

    const lowEl  = est.querySelector('[data-result-low]');
    const highEl = est.querySelector('[data-result-high]');
    const summaryEl = est.querySelector('[data-result-summary]');
    if (lowEl)  lowEl.textContent  = '$' + low.toLocaleString();
    if (highEl) highEl.textContent = '$' + high.toLocaleString();
    if (summaryEl) {
      const projLabel = {
        interior: 'Interior painting',
        exterior: 'Exterior painting',
        cabinets: 'Cabinet refinishing',
        commercial: 'Commercial painting',
        drywall: 'Drywall + repair'
      }[project];
      const scopeLabel = {
        'walls': 'walls only',
        'walls-ceil': 'walls + ceilings',
        'full-trim': 'walls + ceilings + trim'
      }[scope];
      summaryEl.textContent = `${projLabel} · ${scopeLabel} · ${size} · ${condition} prep`;
    }
  }

  // Contact form submit (step 6) — opens an email prefilled with the estimate
  const contactForm = est.querySelector('[data-est-contact]');
  if (contactForm) {
    contactForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const fd = new FormData(contactForm);
      state.contact.name    = fd.get('name')    || '';
      state.contact.email   = fd.get('email')   || '';
      state.contact.phone   = fd.get('phone')   || '';
      state.contact.address = fd.get('address') || '';

      const lowEl  = est.querySelector('[data-result-low]');
      const highEl = est.querySelector('[data-result-high]');
      const range  = (lowEl ? lowEl.textContent : '') + ' – ' + (highEl ? highEl.textContent : '');

      const body = encodeURIComponent(
`Hi B&D Painting team,

I just used the online estimator and wanted to schedule a free estimate.

Name: ${state.contact.name}
Phone: ${state.contact.phone}
Email: ${state.contact.email}
Address: ${state.contact.address}

Project: ${state.project}
Size: ${state.size}
Scope: ${state.scope}
Condition: ${state.condition}
Colors: ${state.colors}

Online ballpark range: ${range}

Please reach out to schedule a free on-site estimate. Thanks!`
      );
      const subject = encodeURIComponent(`Free Estimate Request — ${state.contact.name}`);
      window.location.href = `mailto:bndpainting@yahoo.com?subject=${subject}&body=${body}`;

      // Also show a "thanks" message
      const thanks = est.querySelector('[data-est-thanks]');
      if (thanks) thanks.style.display = 'block';
      contactForm.style.display = 'none';
    });
  }

  // Initial
  showStep(1);
})();
