/* ARMOR TECH - futuristic interactions + estimator */
(function () {
  /* ---------- LOADER ---------- */
  var loader = document.querySelector('[data-loader]');
  function dismissLoader(){ if(loader){ loader.classList.add('gone'); setTimeout(function(){ if(loader&&loader.parentNode) loader.parentNode.removeChild(loader); }, 1400); } }
  if (document.readyState === 'complete') dismissLoader();
  else window.addEventListener('load', dismissLoader);
  setTimeout(dismissLoader, 2800); // safety

  /* ---------- CURSOR GLOW ---------- */
  var cursor = document.querySelector('[data-cursor]');
  if (cursor && window.matchMedia('(hover:hover)').matches) {
    var cx = 0, cy = 0, tx = 0, ty = 0;
    window.addEventListener('mousemove', function(e){ tx = e.clientX; ty = e.clientY; });
    (function raf(){
      cx += (tx - cx) * 0.18; cy += (ty - cy) * 0.18;
      cursor.style.transform = 'translate('+cx+'px,'+cy+'px) translate(-50%,-50%)';
      requestAnimationFrame(raf);
    })();
  } else if (cursor) { cursor.style.display='none'; }

  /* ---------- SCROLL PROGRESS ---------- */
  var bar = document.querySelector('[data-scroll-bar]');
  if (bar) {
    window.addEventListener('scroll', function(){
      var h = document.documentElement;
      var p = (h.scrollTop / (h.scrollHeight - h.clientHeight)) * 100;
      bar.style.setProperty('--p', p + '%');
    }, { passive: true });
  }

  /* ---------- STICKY HEADER SHADOW ---------- */
  var hdr = document.querySelector('header.site');
  if (hdr) window.addEventListener('scroll', function(){ hdr.classList.toggle('scrolled', window.scrollY > 20); }, { passive: true });

  /* ---------- MOBILE NAV ---------- */
  var toggle = document.querySelector('[data-menu-toggle]');
  var links  = document.querySelector('[data-nav-links]');
  if (toggle && links) {
    toggle.addEventListener('click', function(){
      var open = links.classList.toggle('open');
      toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
      toggle.textContent = open ? 'Close' : 'Menu';
    });
  }

  /* ---------- MARQUEE SEAMLESS ---------- */
  document.querySelectorAll('.anno-track, .stripe-track').forEach(function(track){
    if (track.dataset.duped) return;
    Array.prototype.slice.call(track.children).forEach(function(node){
      var c = node.cloneNode(true); c.setAttribute('aria-hidden','true'); track.appendChild(c);
    });
    track.dataset.duped = '1';
  });

  /* ---------- SCROLL REVEAL ---------- */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if(e.isIntersecting){ e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { rootMargin:'-8% 0px -4% 0px' });
    document.querySelectorAll('[data-reveal]').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal]').forEach(function(el){ el.classList.add('visible'); });
  }

  /* ---------- SPOTLIGHT FOLLOW on svc + proc-item ---------- */
  document.querySelectorAll('[data-spotlight]').forEach(function(el){
    el.addEventListener('mousemove', function(ev){
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((ev.clientX - r.left) / r.width * 100) + '%');
      el.style.setProperty('--my', ((ev.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* ---------- MAGNETIC BUTTONS ---------- */
  document.querySelectorAll('.btn, .nav-cta, .area-chip').forEach(function(b){
    b.addEventListener('mousemove', function(ev){
      var r = b.getBoundingClientRect();
      var dx = (ev.clientX - (r.left + r.width/2)) * 0.18;
      var dy = (ev.clientY - (r.top + r.height/2)) * 0.18;
      b.style.transform = 'translate('+dx+'px,'+dy+'px)';
    });
    b.addEventListener('mouseleave', function(){ b.style.transform = ''; });
  });

  /* ---------- CLICK RIPPLE on every button + link ---------- */
  function addRipple(e){
    var el = e.currentTarget;
    var r = el.getBoundingClientRect();
    var rip = document.createElement('span');
    rip.className = 'ripple';
    var size = Math.max(r.width, r.height) * 2;
    rip.style.cssText = 'position:absolute;left:'+((e.clientX-r.left)-size/2)+'px;top:'+((e.clientY-r.top)-size/2)+'px;width:'+size+'px;height:'+size+'px;border-radius:50%;background:radial-gradient(circle,rgba(0,240,255,.55),transparent 60%);pointer-events:none;transform:scale(0);animation:ripple-go .65s ease-out forwards;z-index:20;mix-blend-mode:screen';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var prevOverflow = el.style.overflow;
    el.style.overflow = 'hidden';
    el.appendChild(rip);
    setTimeout(function(){ if(rip.parentNode) rip.parentNode.removeChild(rip); el.style.overflow = prevOverflow; }, 680);
  }
  document.querySelectorAll('.btn, .nav-cta, .nav-links a, .area-chip, .est-opt, .est-next, .est-back, .m-phone, footer a, .crumb a').forEach(function(el){
    el.addEventListener('click', addRipple);
  });
  // inject ripple keyframes once
  if (!document.getElementById('ripple-kf')) {
    var style = document.createElement('style');
    style.id = 'ripple-kf';
    style.textContent = '@keyframes ripple-go{to{transform:scale(1);opacity:0}}';
    document.head.appendChild(style);
  }

  /* ---------- YEAR ---------- */
  document.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = new Date().getFullYear(); });

  /* ============================================================
     ESTIMATOR
     ============================================================ */
  var est = document.querySelector('[data-estimator]');
  if (!est) return;

  var PRICING = {
    project: {
      garage:     { sizes: { '1car': [1800,3000], '2car': [2800,4800], '3car': [4000,6800], '4car': [5500,9500] } },
      epoxy:      { sizes: { '500': [1500,3000], '1000': [3000,6000], '2500': [6500,13000], '5000': [12000,24000] } },
      bathtub:    { sizes: { 'tub': [450,750], 'surround': [750,1200], 'tile': [1100,1800], 'full': [1600,2800] } },
      countertop: { sizes: { '10': [600,1100], '20': [1100,1900], '30': [1700,2900], '40': [2300,3900] } },
      tile:       { sizes: { '50': [350,650], '150': [900,1600], '300': [1700,2900], '500': [2700,4500] } },
      chip:       { sizes: { 'single': [120,220], 'few': [220,450], 'vanity': [400,700], 'fulltub': [600,1000] } }
    },
    finish:    { 'solid': 1.00, 'flake': 1.10, 'metallic': 1.28, 'stone': 1.18 },
    condition: { 'new': 0.92, 'good': 1.00, 'repair': 1.18, 'major': 1.40 },
    timing:    { 'asap': 1.06, 'month': 1.00, 'flexible': 0.97 }
  };

  var state = { step:1, project:null, size:null, condition:null, finish:null, timing:null,
    contact:{name:'',email:'',phone:'',address:''} };
  var stepEls = est.querySelectorAll('.est-step');
  var progressDots = est.querySelectorAll('.est-progress .dot');
  var TOTAL_STEPS = stepEls.length;

  function burst(el){
    var b = document.createElement('span');
    b.style.cssText = 'position:absolute;inset:0;border-radius:inherit;border:2px solid var(--cyan);opacity:1;transform:scale(1);animation:burst-go .55s ease-out forwards;pointer-events:none';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    el.appendChild(b);
    setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); }, 600);
  }
  if (!document.getElementById('burst-kf')) {
    var s2 = document.createElement('style'); s2.id = 'burst-kf';
    s2.textContent = '@keyframes burst-go{to{transform:scale(1.12);opacity:0}}';
    document.head.appendChild(s2);
  }

  function showStep(n, opts) {
    state.step = n;
    stepEls.forEach(function(s){ s.classList.toggle('active', parseInt(s.dataset.step,10) === n); });
    progressDots.forEach(function(d,i){ d.classList.toggle('active', i < n); });
    if (n === 2) updateSizeStep();
    if (opts && opts.scroll) {
      try {
        var estTop = est.getBoundingClientRect().top + window.scrollY - 80;
        if (Math.abs(window.scrollY - estTop) > 120) window.scrollTo({ top: estTop, behavior: 'smooth' });
      } catch(e){}
    }
  }

  function updateSizeStep() {
    var step = est.querySelector('[data-step="2"]');
    if (!step || !state.project) return;
    var q = step.querySelector('.est-question'), opts = step.querySelector('.est-options');
    var labels = {
      garage:  { q:'How big is the garage?',   options:[
        { v:'1car',ttl:'1-car',desc:'~240 sqft',em:'\u{1F697}' },
        { v:'2car',ttl:'2-car',desc:'~440 sqft',em:'\u{1F697}\u{1F697}' },
        { v:'3car',ttl:'3-car',desc:'~640 sqft',em:'\u{1F3E0}' },
        { v:'4car',ttl:'4-car+',desc:'800+ sqft',em:'\u{1F3DB}' }
      ]},
      epoxy:   { q:'How many square feet?',    options:[
        { v:'500',ttl:'Up to 500',desc:'Small shop',em:'\u{1F4D0}' },
        { v:'1000',ttl:'500-1000',desc:'Mid-size',em:'\u{1F4D0}' },
        { v:'2500',ttl:'1000-2500',desc:'Commercial',em:'\u{1F3ED}' },
        { v:'5000',ttl:'2500+',desc:'Large facility',em:'\u{1F3D7}' }
      ]},
      bathtub: { q:'Whats the scope?',          options:[
        { v:'tub',ttl:'Tub only',desc:'Single tub',em:'\u{1F6C1}' },
        { v:'surround',ttl:'Tub + surround',desc:'Tub + walls',em:'\u{1F6BF}' },
        { v:'tile',ttl:'Tub + shower',desc:'Full combo',em:'\u{1F6BF}' },
        { v:'full',ttl:'Full bath',desc:'Tub + tile + vanity',em:'\u{1F3E0}' }
      ]},
      countertop:{ q:'How much linear footage?', options:[
        { v:'10',ttl:'~10 ft',desc:'Vanity / small',em:'\u{1F9F1}' },
        { v:'20',ttl:'~20 ft',desc:'Avg kitchen',em:'\u{1F3E0}' },
        { v:'30',ttl:'~30 ft',desc:'Large kitchen',em:'\u{1F3E1}' },
        { v:'40',ttl:'40 ft+',desc:'Kitchen + island',em:'\u{1F3DB}' }
      ]},
      tile:    { q:'How much tile surface?',    options:[
        { v:'50',ttl:'Up to 50',desc:'Tub surround',em:'\u{1F6BF}' },
        { v:'150',ttl:'50-150',desc:'Small bath',em:'\u{1F9F1}' },
        { v:'300',ttl:'150-300',desc:'Medium room',em:'\u{1F3E0}' },
        { v:'500',ttl:'300+',desc:'Whole room',em:'\u{1F3D8}' }
      ]},
      chip:    { q:'How much to repair?',        options:[
        { v:'single',ttl:'Single chip',desc:'One spot',em:'\u{1F527}' },
        { v:'few',ttl:'Few spots',desc:'2-5 chips',em:'\u{1F528}' },
        { v:'vanity',ttl:'Whole vanity',desc:'Countertop',em:'\u{1F3E0}' },
        { v:'fulltub',ttl:'Full tub',desc:'Entire tub',em:'\u{1F6C1}' }
      ]}
    };
    var cfg = labels[state.project]; if (!cfg) return;
    q.textContent = cfg.q;
    opts.innerHTML = cfg.options.map(function(o){
      return '<div class="est-opt" data-val="'+o.v+'"><span class="em">'+o.em+'</span><span class="ttl">'+o.ttl+'</span><span class="desc">'+o.desc+'</span></div>';
    }).join('');
    attachOptionHandlers(opts, 'size');
    // re-attach ripple
    opts.querySelectorAll('.est-opt').forEach(function(el){ el.addEventListener('click', addRipple); });
  }

  function attachOptionHandlers(container, field) {
    container.querySelectorAll('.est-opt').forEach(function(opt){
      opt.addEventListener('click', function(){
        container.querySelectorAll('.est-opt').forEach(function(o){ o.classList.remove('selected'); });
        opt.classList.add('selected');
        burst(opt);
        state[field] = opt.dataset.val;
        setTimeout(function(){
          if (state.step < TOTAL_STEPS) showStep(state.step + 1, {scroll:true});
        }, 380);
      });
    });
  }

  var step1Opts = est.querySelector('[data-step="1"] .est-options');
  if (step1Opts) attachOptionHandlers(step1Opts, 'project');
  var fieldMap = { '3':'condition', '4':'finish', '5':'timing' };
  ['3','4','5'].forEach(function(n){
    var s = est.querySelector('[data-step="'+n+'"] .est-options');
    if (s) attachOptionHandlers(s, fieldMap[n]);
  });

  est.querySelectorAll('.est-back').forEach(function(b){
    b.addEventListener('click', function(){ if (state.step > 1) showStep(state.step - 1, {scroll:true}); });
  });

  function computePrice() {
    if (!state.project || !state.size) return null;
    var proj = PRICING.project[state.project]; if (!proj) return null;
    var range = proj.sizes[state.size]; if (!range) return null;
    var mult = (PRICING.finish[state.finish] || 1) * (PRICING.condition[state.condition] || 1) * (PRICING.timing[state.timing] || 1);
    return { low: Math.round(range[0]*mult/25)*25, high: Math.round(range[1]*mult/25)*25 };
  }

  function projectSummary() {
    var projLabel = { garage:'Garage floor', epoxy:'Seamless epoxy', bathtub:'Bathtub refinishing', countertop:'Countertop refinishing', tile:'Tile refinishing', chip:'Chip repair' }[state.project] || 'Resurfacing';
    var parts = [projLabel];
    if (state.size) parts.push(state.size);
    if (state.finish) parts.push(state.finish + ' finish');
    if (state.condition) parts.push(state.condition + ' condition');
    return parts.join(' \u00B7 ');
  }

  // Number scramble animation for price reveal
  function scrambleTo(el, finalText, duration){
    if (!el) return;
    var chars = '0123456789';
    var steps = 16;
    var i = 0;
    var interval = setInterval(function(){
      if (i >= steps) { el.textContent = finalText; clearInterval(interval); return; }
      var out = '';
      for (var j = 0; j < finalText.length; j++) {
        var fc = finalText[j];
        if (j < Math.floor((i/steps)*finalText.length)) { out += fc; }
        else if (fc >= '0' && fc <= '9') { out += chars[Math.floor(Math.random()*10)]; }
        else { out += fc; }
      }
      el.textContent = out;
      i++;
    }, duration / steps);
  }

  var contactForm = est.querySelector('[data-est-contact]');
  var resultBlock = est.querySelector('[data-est-result]');
  var formIntro   = est.querySelector('[data-est-intro]');
  var thanksBlock = est.querySelector('[data-est-thanks]');

  if (contactForm) {
    contactForm.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(contactForm);
      state.contact.name    = (fd.get('name')    || '').toString();
      state.contact.email   = (fd.get('email')   || '').toString();
      state.contact.phone   = (fd.get('phone')   || '').toString();
      state.contact.address = (fd.get('address') || '').toString();

      var result = computePrice();
      if (formIntro) formIntro.style.display = 'none';
      contactForm.style.display = 'none';
      if (resultBlock) resultBlock.style.display = 'block';

      if (result) {
        var lowEl  = est.querySelector('[data-result-low]');
        var highEl = est.querySelector('[data-result-high]');
        var sumEl  = est.querySelector('[data-result-summary]');
        scrambleTo(lowEl, '$' + result.low.toLocaleString(), 900);
        scrambleTo(highEl, '$' + result.high.toLocaleString(), 900);
        if (sumEl) sumEl.textContent = projectSummary();
      }
      if (thanksBlock && state.contact.name) {
        var nameSpan = thanksBlock.querySelector('[data-thanks-name]');
        if (nameSpan) nameSpan.textContent = state.contact.name.split(' ')[0];
      }

      var rangeStr = result ? ('$' + result.low.toLocaleString() + ' - $' + result.high.toLocaleString()) : 'unknown';
      var body = [
        'Hi Armor Tech team,', '',
        'A new estimate request came in via your website:', '',
        'Name: ' + state.contact.name,
        'Phone: ' + state.contact.phone,
        'Email: ' + state.contact.email,
        'Address: ' + state.contact.address, '',
        'PROJECT: ' + state.project + ' / ' + state.size,
        'Finish: ' + state.finish + ' / Condition: ' + state.condition + ' / Timing: ' + state.timing,
        'Ballpark: ' + rangeStr, '',
        'Please follow up for a free on-site estimate.'
      ].join('\n');
      try { window.location.href = 'mailto:info@armortechresurfacing.com?subject=' + encodeURIComponent('Estimate Request: ' + (state.contact.name || 'New lead')) + '&body=' + encodeURIComponent(body); } catch (e) {}
    });
  }

  showStep(1);
})();
