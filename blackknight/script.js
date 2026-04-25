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
      repaint:    { base: 0, sizes:{ 'small':[2500,4500], 'mid':[4500,7500], 'full':[7500,12000], 'premium':[12000,18000] } },
      colorchange:{ base: 0, sizes:{ 'partial':[1500,3000], 'exterior':[3500,6500], 'full':[6500,11000], 'premium':[11000,17000] } },
      correction: { base: 0, sizes:{ 'single':[300,600], 'full':[800,1800], 'premium':[1800,3500], 'showroom':[3500,6000] } },
      motorcycle: { base: 0, sizes:{ 'tank':[400,800], 'fairings':[800,1800], 'full':[1500,3500], 'custom':[3500,7500] } },
      fleet:      { base: 0, sizes:{ '1':[1500,3500], '3':[4000,9000], '5':[7500,15000], '10':[15000,30000] } },
      touchup:    { base: 0, sizes:{ 'chip':[80,200], 'spot':[200,500], 'panel':[500,1200], 'multi':[1200,2500] } }
    },
    scope:     { 'walls': 1.00, 'walls-ceil': 1.08, 'full-trim': 1.18 },
    condition: { 'new': 0.92, 'good': 1.00, 'repairs': 1.15, 'major': 1.35 },
    colors:    { 'one': 1.00, 'two': 1.08, 'multi': 1.15 }
  };

  var state = { step: 1, project: null, size: null, scope: null, condition: null, colors: null,
    contact: { name: '', email: '', phone: '', address: '' } };
  var stepEls = est.querySelectorAll('.est-step');
  var progressDots = est.querySelectorAll('.est-progress .dot');
  var TOTAL_STEPS = stepEls.length;

  function showStep(n, opts) {
    state.step = n;
    stepEls.forEach(function (s) { s.classList.toggle('active', parseInt(s.dataset.step, 10) === n); });
    progressDots.forEach(function (d, i) { d.classList.toggle('active', i < n); });
    if (n === 2) updateSizeStep();
    if (opts && opts.scroll) {
      try {
        var estTop = est.getBoundingClientRect().top + window.scrollY - 80;
        if (Math.abs(window.scrollY - estTop) > 120) window.scrollTo({ top: estTop, behavior: 'smooth' });
      } catch (e) {}
    }
  }

  function updateSizeStep() {
    var sizeStep = est.querySelector('[data-step="2"]');
    if (!sizeStep || !state.project) return;
    var q = sizeStep.querySelector('.est-question');
    var opts = sizeStep.querySelector('.est-options');
    var labels = {
      repaint:{q:'Vehicle size?',options:[
        {v:'small',ttl:'Small car',desc:'Sedan / coupe',em:'\u{1F697}'},
        {v:'mid',ttl:'Mid-size',desc:'SUV / crossover',em:'\u{1F698}'},
        {v:'full',ttl:'Full size',desc:'Truck / van',em:'\u{1F69A}'},
        {v:'premium',ttl:'Premium',desc:'Luxury / exotic',em:'\u{1F3CE}'}]},
      colorchange:{q:'Scope?',options:[
        {v:'partial',ttl:'Partial',desc:'Panels / accents',em:'\u{1F3A8}'},
        {v:'exterior',ttl:'Exterior only',desc:'Skip jambs / engine',em:'\u{1F697}'},
        {v:'full',ttl:'Full exterior',desc:'Including jambs',em:'\u{1F680}'},
        {v:'premium',ttl:'Premium',desc:'Candy / metallic / pearl',em:'\u{1F48E}'}]},
      correction:{q:'Condition?',options:[
        {v:'single',ttl:'Single panel',desc:'Spot polish',em:'\u{2728}'},
        {v:'full',ttl:'Full car',desc:'1-stage polish',em:'\u{1F697}'},
        {v:'premium',ttl:'Premium',desc:'2-stage + sealant',em:'\u{1F31F}'},
        {v:'showroom',ttl:'Showroom',desc:'3-stage + ceramic',em:'\u{1F48E}'}]},
      motorcycle:{q:'Scope?',options:[
        {v:'tank',ttl:'Tank only',desc:'Fuel tank paint',em:'\u{1F3CD}'},
        {v:'fairings',ttl:'Fairings',desc:'Panels + tank',em:'\u{1F3CD}'},
        {v:'full',ttl:'Full bike',desc:'Complete repaint',em:'\u{1F3CD}'},
        {v:'custom',ttl:'Custom',desc:'Graphics / airbrush',em:'\u{1F3A8}'}]},
      fleet:{q:'Fleet size?',options:[
        {v:'1',ttl:'1 vehicle',desc:'Single unit',em:'\u{1F69A}'},
        {v:'3',ttl:'2-3 vehicles',desc:'Small fleet',em:'\u{1F69A}'},
        {v:'5',ttl:'4-5 vehicles',desc:'Mid fleet',em:'\u{1F69B}'},
        {v:'10',ttl:'6+ vehicles',desc:'Large fleet',em:'\u{1F69B}'}]},
      touchup:{q:'Scope?',options:[
        {v:'chip',ttl:'Rock chip',desc:'Small area',em:'\u{1F4CD}'},
        {v:'spot',ttl:'Spot repair',desc:'Scratch / scuff',em:'\u{1F527}'},
        {v:'panel',ttl:'Single panel',desc:'Door / fender',em:'\u{1F697}'},
        {v:'multi',ttl:'Multiple spots',desc:'Several areas',em:'\u{1F3A8}'}]}
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
          if (state.step < TOTAL_STEPS) showStep(state.step + 1, {scroll:true});
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
    b.addEventListener('click', function () { if (state.step > 1) showStep(state.step - 1, {scroll:true}); });
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
        'Hi Black Knight team,', '',
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

  showStep(1); // initial render, no scroll
})();
