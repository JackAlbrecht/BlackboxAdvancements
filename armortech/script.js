/* ARMOR TECH - futuristic interactions + estimator */
(function () {
  /* LOADER */
  var loader = document.querySelector('[data-loader]');
  function dismissLoader(){ if(loader){ loader.classList.add('gone'); setTimeout(function(){ if(loader&&loader.parentNode) loader.parentNode.removeChild(loader); }, 1400); } }
  if (document.readyState === 'complete') dismissLoader();
  else window.addEventListener('load', dismissLoader);
  setTimeout(dismissLoader, 2800);

  /* CURSOR */
  var cursor = document.querySelector('[data-cursor]');
  if (cursor && window.matchMedia('(hover:hover)').matches) {
    var cx=0, cy=0, tx=0, ty=0;
    window.addEventListener('mousemove', function(e){ tx=e.clientX; ty=e.clientY; });
    (function raf(){ cx+=(tx-cx)*0.18; cy+=(ty-cy)*0.18; cursor.style.transform='translate('+cx+'px,'+cy+'px) translate(-50%,-50%)'; requestAnimationFrame(raf); })();
  } else if (cursor) cursor.style.display='none';

  /* SCROLL PROGRESS */
  var bar = document.querySelector('[data-scroll-bar]');
  if (bar) window.addEventListener('scroll', function(){ var h=document.documentElement; var p=(h.scrollTop/(h.scrollHeight-h.clientHeight))*100; bar.style.setProperty('--p', p+'%'); }, { passive:true });

  /* HEADER SCROLLED */
  var hdr = document.querySelector('header.site');
  if (hdr) window.addEventListener('scroll', function(){ hdr.classList.toggle('scrolled', window.scrollY>20); }, { passive:true });

  /* MOBILE NAV */
  var toggle = document.querySelector('[data-menu-toggle]'), links = document.querySelector('[data-nav-links]');
  if (toggle && links) toggle.addEventListener('click', function(){ var o=links.classList.toggle('open'); toggle.setAttribute('aria-expanded', o?'true':'false'); toggle.textContent=o?'Close':'Menu'; });

  /* MARQUEE SEAMLESS */
  document.querySelectorAll('.anno-track, .stripe-track, .b-marquee-track').forEach(function(t){
    if (t.dataset.duped) return;
    Array.prototype.slice.call(t.children).forEach(function(n){ var c=n.cloneNode(true); c.setAttribute('aria-hidden','true'); t.appendChild(c); });
    t.dataset.duped='1';
  });

  /* SCROLL REVEAL — guaranteed-to-fire with RAF fallback */
  function firstReveal(){
    document.querySelectorAll('[data-reveal],[data-stagger]').forEach(function(el){
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight * 0.92) el.classList.add('visible');
    });
  }
  // Immediate pass so anything above-the-fold shows without waiting for scroll
  requestAnimationFrame(function(){ requestAnimationFrame(firstReveal); });

  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); } });
    }, { rootMargin:'-6% 0px -4% 0px', threshold: 0.01 });
    document.querySelectorAll('[data-reveal],[data-stagger]').forEach(function(el){ io.observe(el); });
  } else {
    document.querySelectorAll('[data-reveal],[data-stagger]').forEach(function(el){ el.classList.add('visible'); });
  }

  /* COUNTER ANIMATION on stats */
  function animateCounter(el){
    var target = parseFloat(el.dataset.count), duration = 1400, start = null;
    function step(ts){ if(!start) start = ts; var p = Math.min((ts-start)/duration, 1); var eased = 1 - Math.pow(1-p, 3); var v = target * eased; el.textContent = (target % 1 === 0) ? Math.floor(v).toLocaleString() : v.toFixed(1); if (p < 1) requestAnimationFrame(step); else el.textContent = (target % 1 === 0) ? target.toLocaleString() : target.toFixed(1); }
    requestAnimationFrame(step);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function(entries){
      entries.forEach(function(e){ if (e.isIntersecting) { animateCounter(e.target); cio.unobserve(e.target); } });
    }, { threshold: 0.3 });
    document.querySelectorAll('[data-count]').forEach(function(el){ cio.observe(el); });
  }

  /* SPOTLIGHT FOLLOW */
  document.querySelectorAll('[data-spotlight], .bento-cell, .pin-step, .area').forEach(function(el){
    el.addEventListener('mousemove', function(ev){
      var r = el.getBoundingClientRect();
      el.style.setProperty('--mx', ((ev.clientX - r.left) / r.width * 100) + '%');
      el.style.setProperty('--my', ((ev.clientY - r.top) / r.height * 100) + '%');
    });
  });

  /* MAGNETIC BUTTONS */
  document.querySelectorAll('.btn, .nav-cta, .area, .hs-card, .hs-arrow').forEach(function(b){
    b.addEventListener('mousemove', function(ev){
      var r = b.getBoundingClientRect();
      var dx = (ev.clientX - (r.left + r.width/2)) * 0.12;
      var dy = (ev.clientY - (r.top + r.height/2)) * 0.12;
      b.style.setProperty('--tx', dx + 'px'); b.style.setProperty('--ty', dy + 'px');
      b.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
    });
    b.addEventListener('mouseleave', function(){ b.style.transform = ''; });
  });

  /* CLICK RIPPLE on every clickable element */
  function addRipple(e){
    var el = e.currentTarget, r = el.getBoundingClientRect();
    var rip = document.createElement('span'); rip.className = 'ripple';
    var size = Math.max(r.width, r.height) * 2;
    rip.style.cssText = 'position:absolute;left:'+((e.clientX-r.left)-size/2)+'px;top:'+((e.clientY-r.top)-size/2)+'px;width:'+size+'px;height:'+size+'px;border-radius:50%;background:radial-gradient(circle,rgba(255,107,26,.55),transparent 60%);pointer-events:none;transform:scale(0);animation:ripple-go .65s ease-out forwards;z-index:20;mix-blend-mode:screen';
    if (getComputedStyle(el).position === 'static') el.style.position = 'relative';
    var prevOverflow = el.style.overflow; el.style.overflow = 'hidden';
    el.appendChild(rip);
    setTimeout(function(){ if(rip.parentNode) rip.parentNode.removeChild(rip); el.style.overflow = prevOverflow; }, 680);
  }
  document.querySelectorAll('.btn, .nav-cta, .nav-links a, .area, .hs-card, .est-opt, .est-next, .est-back, .m-phone, footer a, .crumb a, .bento-cell a').forEach(function(el){
    el.addEventListener('click', addRipple);
  });
  if (!document.getElementById('ripple-kf')) {
    var s = document.createElement('style'); s.id = 'ripple-kf';
    s.textContent = '@keyframes ripple-go{to{transform:scale(1);opacity:0}} @keyframes burst-go{to{transform:scale(1.18);opacity:0}}';
    document.head.appendChild(s);
  }

  /* YEAR */
  document.querySelectorAll('[data-year]').forEach(function(el){ el.textContent = new Date().getFullYear(); });

  /* ============================================================
     ESTIMATOR
     ============================================================ */
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
    finish:    { 'solid':1.00, 'flake':1.10, 'metallic':1.28, 'stone':1.18 },
    condition: { 'new':0.92, 'good':1.00, 'repair':1.18, 'major':1.40 },
    timing:    { 'asap':1.06, 'month':1.00, 'flexible':0.97 }
  };
  var state = { step:1, project:null, size:null, condition:null, finish:null, timing:null,
    contact:{name:'',email:'',phone:'',address:''} };
  var stepEls = est.querySelectorAll('.est-step');
  var progressDots = est.querySelectorAll('.est-progress .dot');
  var TOTAL_STEPS = stepEls.length;

  function burst(el){
    var b=document.createElement('span');
    b.style.cssText='position:absolute;inset:0;border-radius:inherit;border:2px solid var(--cyan);opacity:1;transform:scale(1);animation:burst-go .55s ease-out forwards;pointer-events:none';
    if (getComputedStyle(el).position==='static') el.style.position='relative';
    el.appendChild(b);
    setTimeout(function(){ if(b.parentNode) b.parentNode.removeChild(b); }, 600);
  }

  function showStep(n, opts){
    state.step=n;
    stepEls.forEach(function(s){ s.classList.toggle('active', parseInt(s.dataset.step,10)===n); });
    progressDots.forEach(function(d,i){ d.classList.toggle('active', i<n); });
    if (n===2) updateSizeStep();
    if (opts && opts.scroll) {
      try { var top = est.getBoundingClientRect().top + window.scrollY - 90;
        if (Math.abs(window.scrollY - top) > 120) window.scrollTo({ top: top, behavior:'smooth' }); } catch(e){}
    }
  }

  function updateSizeStep(){
    var step=est.querySelector('[data-step="2"]'); if(!step||!state.project) return;
    var q=step.querySelector('.est-question'), opts=step.querySelector('.est-options');
    var labels={
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
    var cfg=labels[state.project]; if(!cfg) return;
    q.textContent=cfg.q;
    opts.innerHTML=cfg.options.map(function(o){
      return '<div class="est-opt" data-val="'+o.v+'"><span class="em">'+o.em+'</span><span class="ttl">'+o.ttl+'</span><span class="desc">'+o.desc+'</span></div>';
    }).join('');
    attachOptionHandlers(opts,'size');
    opts.querySelectorAll('.est-opt').forEach(function(el){ el.addEventListener('click', addRipple); });
  }

  function attachOptionHandlers(container, field){
    container.querySelectorAll('.est-opt').forEach(function(opt){
      opt.addEventListener('click', function(){
        container.querySelectorAll('.est-opt').forEach(function(o){ o.classList.remove('selected'); });
        opt.classList.add('selected');
        burst(opt);
        state[field] = opt.dataset.val;
        setTimeout(function(){ if (state.step < TOTAL_STEPS) showStep(state.step + 1, {scroll:true}); }, 380);
      });
    });
  }

  var s1 = est.querySelector('[data-step="1"] .est-options');
  if (s1) attachOptionHandlers(s1, 'project');
  var fmap = { '3':'condition', '4':'finish', '5':'timing' };
  ['3','4','5'].forEach(function(n){
    var s = est.querySelector('[data-step="'+n+'"] .est-options');
    if (s) attachOptionHandlers(s, fmap[n]);
  });
  est.querySelectorAll('.est-back').forEach(function(b){
    b.addEventListener('click', function(){ if (state.step>1) showStep(state.step-1, {scroll:true}); });
  });

  function computePrice(){
    if (!state.project||!state.size) return null;
    var proj = PRICING.project[state.project]; if (!proj) return null;
    var r = proj.sizes[state.size]; if (!r) return null;
    var m = (PRICING.finish[state.finish]||1)*(PRICING.condition[state.condition]||1)*(PRICING.timing[state.timing]||1);
    return { low: Math.round(r[0]*m/25)*25, high: Math.round(r[1]*m/25)*25 };
  }
  function projectSummary(){
    var p = { garage:'Garage floor', epoxy:'Seamless epoxy', bathtub:'Bathtub refinishing', countertop:'Countertop refinishing', tile:'Tile refinishing', chip:'Chip repair' }[state.project] || 'Resurfacing';
    var parts=[p]; if(state.size) parts.push(state.size); if(state.finish) parts.push(state.finish+' finish'); if(state.condition) parts.push(state.condition+' condition');
    return parts.join(' \u00B7 ');
  }
  function scrambleTo(el, text, dur){
    if (!el) return;
    var steps=18, i=0;
    var int=setInterval(function(){
      if (i>=steps) { el.textContent=text; clearInterval(int); return; }
      var out='';
      for (var j=0; j<text.length; j++) {
        var c=text[j];
        if (j<Math.floor((i/steps)*text.length)) out+=c;
        else if (c>='0'&&c<='9') out+=Math.floor(Math.random()*10);
        else out+=c;
      }
      el.textContent=out; i++;
    }, dur/steps);
  }

  var form = est.querySelector('[data-est-contact]');
  var result = est.querySelector('[data-est-result]');
  var intro = est.querySelector('[data-est-intro]');
  var thanks = est.querySelector('[data-est-thanks]');

  if (form) {
    form.addEventListener('submit', function(e){
      e.preventDefault();
      var fd = new FormData(form);
      state.contact.name = (fd.get('name')||'').toString();
      state.contact.email = (fd.get('email')||'').toString();
      state.contact.phone = (fd.get('phone')||'').toString();
      state.contact.address = (fd.get('address')||'').toString();
      var r = computePrice();
      if (intro) intro.style.display='none';
      form.style.display='none';
      if (result) result.style.display='block';
      if (r) {
        var lo=est.querySelector('[data-result-low]'), hi=est.querySelector('[data-result-high]'), sm=est.querySelector('[data-result-summary]');
        scrambleTo(lo, '$'+r.low.toLocaleString(), 900);
        scrambleTo(hi, '$'+r.high.toLocaleString(), 900);
        if (sm) sm.textContent = projectSummary();
      }
      if (thanks && state.contact.name) {
        var nm = thanks.querySelector('[data-thanks-name]');
        if (nm) nm.textContent = state.contact.name.split(' ')[0];
      }
      var rs = r ? ('$'+r.low.toLocaleString()+' - $'+r.high.toLocaleString()) : 'unknown';
      var body = ['Hi Armor Tech,','','Name: '+state.contact.name,'Phone: '+state.contact.phone,'Email: '+state.contact.email,'Address: '+state.contact.address,'','Project: '+state.project+' / '+state.size,'Finish: '+state.finish+' / Condition: '+state.condition+' / Timing: '+state.timing,'Range: '+rs].join('\n');
      try { window.location.href = 'mailto:info@armortechresurfacing.com?subject='+encodeURIComponent('Estimate: '+(state.contact.name||'New lead'))+'&body='+encodeURIComponent(body); } catch(e){}
    });
  }

  showStep(1);
})();
