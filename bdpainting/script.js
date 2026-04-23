/* B&D PAINTING — interactions + estimator logic */
(function () {
  // Mobile nav
  var toggle = document.querySelector('[data-menu-toggle]');
  var links  = document.querySelector('[data-nav-links]');
  if (toggle && links) {
    toggle.addEventListener('click', function () {
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  // Marquee seamless loop
  document.querySelectorAll('.anno-track, .stripe-track').forEach(function (track) {
    if (track.dataset.duped) return;
    Array.prototype.slice.call(track.children).forEach(function (node) {
      var clone = node.cloneNode(true);
      clone.setAttribute('aria-hidden', 'true');
      track.appendChild(clone);
    });
    track.dataset.duped = '1';
  });

  // Scroll reveal
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
      });
    }, { rootMargin: '-10% 0px -5% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function (el) { io.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function (el) { el.classList.add('visible'); });
  }

  // Year
  document.querySelectorAll('[data-year]').forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });

  // ESTIMATOR
  var est = document.querySelector('[data-estimator]');
  if (!est) return;

  var PRICING = {
    project: {
      interior:   { base: 0,   sizes: { '1': [400,800], '2-3': [1200,2400], '4-6': [2400,4800], 'whole': [4500,9500] } },
      exterior:   { base: 0,   sizes: { 'small': [2800,5200], 'medium': [4500,8500], 'large': [7500,14500], 'xl': [11000,20000] } },
      cabinets:   { base: 600, sizes: { '10': [900,1600], '20': [1700,3000], '30': [2600,4500], '40+': [3800,6500] } },
      commercial: { base: 0,   sizes: { '2000': [2500,5000], '5000': [6000,12000], '10000': [12000,22000], '25000': [25000,50000] } },
      drywall:    { base: 0,   sizes: { 'patch': [200,500], 'room': [550,1200], 'multi': [1200,2800], 'whole': [2800,6500] } }
    },
    scope:     { 'walls': 1.00, 'walls-ceil': 1.25, 'full-trim': 1.55 },
    condition: { 'new': 0.88, 'good': 1.00, 'repairs': 1.20, 'major': 1.42 },
    colors:    { 'one': 1.00, 'two': 1.10, 'multi': 1.22 }
  };

  var state = { step: 1, project: null, size: null, scope: null, condition: null, colors: null,
    contact: { name: '', email: '', phone: '', address: '' } };
  var stepEls = est.querySelectorAll('.est-step');
  var progressDots = est.querySelectorAll('.est-progress .dot');
  var TOTAL_STEPS = stepEls.length;

  function showStep(n) {
    state.step = n;
    stepEls.forEach(function (s) { s.classList.toggle('active', parseInt(s.dataset.step, 10) === n); });
    progressDots.forEach(function (d, i) { d.classList.toggle('active', i < n); });
    if (n === 2) updateSizeStep();
    try {
      var estTop = est.getBoundingClientRect().top + window.scrollY - 80;
      if (Math.abs(window.scrollY - estTop) > 120) window.scrollTo({ top: estTop, behavior: 'smooth' });
    } catch (e) {}
  }

  function updateSizeStep() {
    var sizeStep = est.querySelector('[data-step="2"]');
    if (!sizeStep || !state.project) return;
    var q = sizeStep.querySelector('.est-question');
    var opts = sizeStep.querySelector('.est-options');
    var labels = {
      interior: { q: 'How many rooms?', options: [
        { v: '1',     ttl: '1 room',      desc: 'Single room',       em: '\u{1F6CB}' },
        { v: '2-3',   ttl: '2-3 rooms',   desc: 'Couple of rooms',   em: '\u{1F3E0}' },
        { v: '4-6',   ttl: '4-6 rooms',   desc: 'Most of the house', em: '\u{1F3E1}' },
        { v: 'whole', ttl: 'Whole house', desc: '7+ rooms',          em: '\u{1F3D8}' }
      ]},
      exterior: { q: 'How big is the home?', options: [
        { v: 'small',  ttl: 'Small',   desc: '1 story, <1500 sqft',   em: '\u{1F3E0}' },
        { v: 'medium', ttl: 'Medium',  desc: '1-2 story, 1500-2500',  em: '\u{1F3E1}' },
        { v: 'large',  ttl: 'Large',   desc: '2 story, 2500-4000',    em: '\u{1F3D8}' },
        { v: 'xl',     ttl: 'X-Large', desc: '4000+ sqft',            em: '\u{1F3DB}' }
      ]},
      cabinets: { q: 'How many cabinet doors + drawers?', options: [
        { v: '10',  ttl: '~10',  desc: 'Small kitchen',        em: '\u{1F5C4}' },
        { v: '20',  ttl: '~20',  desc: 'Avg kitchen',          em: '\u{1FA91}' },
        { v: '30',  ttl: '~30',  desc: 'Large kitchen',        em: '\u{1F3E0}' },
        { v: '40+', ttl: '40+',  desc: 'Kitchen + bath, etc.', em: '\u{1F3E1}' }
      ]},
      commercial: { q: 'How much square footage?', options: [
        { v: '2000',  ttl: 'Up to 2k', desc: 'Small office/retail',      em: '\u{1F3E2}' },
        { v: '5000',  ttl: '2k-5k',    desc: 'Mid-size space',           em: '\u{1F3EC}' },
        { v: '10000', ttl: '5k-10k',   desc: 'Large facility',           em: '\u{1F3ED}' },
        { v: '25000', ttl: '10k+',     desc: 'Warehouse / multi-tenant', em: '\u{1F3D7}' }
      ]},
      drywall: { q: "What's the scope?", options: [
        { v: 'patch', ttl: 'Patch',      desc: 'Small spot repairs', em: '\u{1F527}' },
        { v: 'room',  ttl: 'One room',   desc: 'Walls + ceiling',    em: '\u{1F9F1}' },
        { v: 'multi', ttl: 'Multi-room', desc: '2-3 rooms',          em: '\u{1F3E0}' },
        { v: 'whole', ttl: 'Whole home', desc: 'Extensive repair',   em: '\u{1F3E1}' }
      ]}
    };
    var cfg = labels[state.project];
    if (!cfg) return;
    q.textContent = cfg.q;
    opts.innerHTML = cfg.options.map(function (o) {
      return '<div class="est-opt" data-val="' + o.v + '"><span class="em">' + o.em +
             '</span><span class="ttl">' + o.ttl + '</span><span class="desc">' + o.desc + '</span></div>';
    }).join('');
    attachOptionHandlers(opts, 'size');
  }

  function attachOptionHandlers(container, field) {
    container.querySelectorAll('.est-opt').forEach(function (opt) {
      opt.addEventListener('click', function () {
        container.querySelectorAll('.est-opt').forEach(function (o) { o.classList.remove('selected'); });
        opt.classList.add('selected');
        state[field] = opt.dataset.val;
        setTimeout(function () {
          if (state.step < TOTAL_STEPS) showStep(state.step + 1);
        }, 320);
      });
    });
  }

  var step1Opts = est.querySelector('[data-step="1"] .est-options');
  if (step1Opts) attachOptionHandlers(step1Opts, 'project');
  ['3', '4', '5'].forEach(function (n) {
    var s = est.querySelector('[data-step="' + n + '"] .est-options');
    if (!s) return;
    var field = { '3': 'scope', '4': 'condition', '5': 'colors' }[n];
    attachOptionHandlers(s, field);
  });

  est.querySelectorAll('.est-back').forEach(function (b) {
    b.addEventListener('click', function () { if (state.step > 1) showStep(state.step - 1); });
  });

  function computePrice() {
    if (!state.project || !state.size) return null;
    var proj = PRICING.project[state.project];
    if (!proj) return null;
    var range = proj.sizes[state.size];
    if (!range) return null;
    var low = range[0] + proj.base, high = range[1] + proj.base;
    var mult = (PRICING.scope[state.scope] || 1) * (PRICING.condition[state.condition] || 1) * (PRICING.colors[state.colors] || 1);
    low  = Math.round(low  * mult / 50) * 50;
    high = Math.round(high * mult / 50) * 50;
    return { low: low, high: high };
  }

  function projectSummary() {
    var projLabel = { interior: 'Interior painting', exterior: 'Exterior painting',
      cabinets: 'Cabinet refinishing', commercial: 'Commercial painting', drywall: 'Drywall + repair'
    }[state.project] || 'Painting';
    var scopeLabel = { 'walls': 'walls only', 'walls-ceil': 'walls + ceilings', 'full-trim': 'walls + ceilings + trim' }[state.scope] || '';
    var parts = [projLabel];
    if (state.size) parts.push(state.size);
    if (scopeLabel) parts.push(scopeLabel);
    if (state.condition) parts.push(state.condition + ' prep');
    return parts.join(' \u00B7 ');
  }

  var contactForm = est.querySelector('[data-est-contact]');
  var resultBlock = est.querySelector('[data-est-result]');
  var formIntro   = est.querySelector('[data-est-intro]');
  var thanksBlock = est.querySelector('[data-est-thanks]');

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
        'Hi B&D Painting team,', '',
        'A new estimate request came in via your website:', '',
        'Name: ' + state.contact.name,
        'Phone: ' + state.contact.phone,
        'Email: ' + state.contact.email,
        'Address: ' + state.contact.address, '',
        'Project: ' + state.project + ' / ' + state.size,
        'Scope: ' + state.scope + ' / ' + state.condition + ' prep / ' + state.colors + ' color(s)',
        'Ballpark range: ' + rangeStr, '',
        'Please follow up to schedule a free on-site estimate.'
      ].join('\n');
      var subject = 'Estimate Request: ' + (state.contact.name || 'New lead');
      try {
        window.location.href = 'mailto:bndpainting@yahoo.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      } catch (err) {}
    });
  }

  showStep(1);
})();
