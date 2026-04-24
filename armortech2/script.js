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
      garage:     { sizes:{ '1car':[1800,3000], '2car':[2800,4800], '3car':[4000,6800], '4car':[5500,9500] } },
      epoxy:      { sizes:{ '500':[1500,3000], '1000':[3000,6000], '2500':[6500,13000], '5000':[12000,24000] } },
      bathtub:    { sizes:{ 'tub':[450,750], 'surround':[750,1200], 'tile':[1100,1800], 'full':[1600,2800] } },
      countertop: { sizes:{ '10':[600,1100], '20':[1100,1900], '30':[1700,2900], '40':[2300,3900] } },
      tile:       { sizes:{ '50':[350,650], '150':[900,1600], '300':[1700,2900], '500':[2700,4500] } },
      chip:       { sizes:{ 'single':[120,220], 'few':[220,450], 'vanity':[400,700], 'fulltub':[600,1000] } }
    },
    scope:     { 'walls': 1.00, 'walls-ceil': 1.10, 'full-trim': 1.20 },
    condition: { 'new': 0.92, 'good': 1.00, 'repairs': 1.18, 'major': 1.40 },
    colors:    { 'one': 1.00, 'two': 1.08, 'multi': 1.18 }
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
      garage:{q:'Garage size?',options:[
        {v:'1car',ttl:'1-car',desc:'~240 sqft',em:'\u{1F697}'},
        {v:'2car',ttl:'2-car',desc:'~440 sqft',em:'\u{1F697}\u{1F697}'},
        {v:'3car',ttl:'3-car',desc:'~640 sqft',em:'\u{1F3E0}'},
        {v:'4car',ttl:'4-car+',desc:'800+ sqft',em:'\u{1F3DB}'}]},
      epoxy:{q:'Square footage?',options:[
        {v:'500',ttl:'<500',desc:'Small',em:'\u{1F4D0}'},
        {v:'1000',ttl:'500-1000',desc:'Mid',em:'\u{1F4D0}'},
        {v:'2500',ttl:'1000-2500',desc:'Commercial',em:'\u{1F3ED}'},
        {v:'5000',ttl:'2500+',desc:'Large',em:'\u{1F3D7}'}]},
      bathtub:{q:'Scope?',options:[
        {v:'tub',ttl:'Tub only',desc:'Single tub',em:'\u{1F6C1}'},
        {v:'surround',ttl:'Tub + surround',desc:'Tub + walls',em:'\u{1F6BF}'},
        {v:'tile',ttl:'Tub + shower',desc:'Combo',em:'\u{1F6BF}'},
        {v:'full',ttl:'Full bath',desc:'Tub + tile',em:'\u{1F3E0}'}]},
      countertop:{q:'Linear footage?',options:[
        {v:'10',ttl:'~10 ft',desc:'Small',em:'\u{1F9F1}'},
        {v:'20',ttl:'~20 ft',desc:'Avg kitchen',em:'\u{1F3E0}'},
        {v:'30',ttl:'~30 ft',desc:'Large',em:'\u{1F3E1}'},
        {v:'40',ttl:'40 ft+',desc:'Island',em:'\u{1F3DB}'}]},
      tile:{q:'Tile surface?',options:[
        {v:'50',ttl:'<50 sqft',desc:'Tub surround',em:'\u{1F6BF}'},
        {v:'150',ttl:'50-150',desc:'Small bath',em:'\u{1F9F1}'},
        {v:'300',ttl:'150-300',desc:'Medium',em:'\u{1F3E0}'},
        {v:'500',ttl:'300+',desc:'Whole room',em:'\u{1F3D8}'}]},
      chip:{q:'How much?',options:[
        {v:'single',ttl:'Single chip',desc:'One spot',em:'\u{1F527}'},
        {v:'few',ttl:'Few spots',desc:'2-5',em:'\u{1F528}'},
        {v:'vanity',ttl:'Whole vanity',desc:'Counter',em:'\u{1F3E0}'},
        {v:'fulltub',ttl:'Full tub',desc:'Entire tub',em:'\u{1F6C1}'}]}
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
        'Hi Armor Tech Resurfacing team,', '',
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
        window.location.href = 'mailto:info@armortechresurfacing.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
      } catch (err) {}
    });
  }

  showStep(1); // initial render, no scroll
})();
