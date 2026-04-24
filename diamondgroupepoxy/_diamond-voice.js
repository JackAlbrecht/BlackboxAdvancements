/* ============================================================
   Diamond Group — Vapi voice AI widget
   Floating pill (top-right on home) + always-on bottom-right bubble
   Replace ASSISTANT_ID + PUBLIC_KEY once the assistant is created.
   ============================================================ */
(function () {
  'use strict';

  // PLACEHOLDERS — set from Vapi dashboard once the Diamond assistant is live.
  // Private key lives only on the server; public key is safe to ship.
  var ASSISTANT_ID = 'REPLACE_WITH_DIAMOND_ASSISTANT_ID';
  var PUBLIC_KEY   = 'REPLACE_WITH_VAPI_PUBLIC_KEY';

  var buttonConfig = {
    position: 'bottom-right',
    offset: '28px',
    width: '64px',
    height: '64px',
    idle: {
      color: '#7ee8fa',
      type: 'pill',
      title: 'Talk to Diamond',
      subtitle: 'Free quote — 24/7 voice AI',
      icon: 'https://unpkg.com/lucide-static@latest/icons/phone.svg'
    },
    loading: {
      color: '#3aa7d0',
      type: 'pill',
      title: 'Connecting…',
      subtitle: 'One sec',
      icon: 'https://unpkg.com/lucide-static@latest/icons/loader-2.svg'
    },
    active: {
      color: '#ff4d6d',
      type: 'pill',
      title: 'On call',
      subtitle: 'Tap to end',
      icon: 'https://unpkg.com/lucide-static@latest/icons/phone-off.svg'
    }
  };

  var vapiInstance = null;

  function injectHeroPill() {
    var path = window.location.pathname.replace(/\/+$/, '');
    var onHome = path === '/diamondgroupepoxy' || path === '/diamondgroupepoxy/index' || /\/diamondgroupepoxy$/.test(path) || path === '';
    if (!onHome) return;
    if (document.getElementById('voice-hero-pill')) return;

    var btn = document.createElement('button');
    btn.id = 'voice-hero-pill';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Talk to Diamond\'s 24/7 voice AI estimator');
    btn.innerHTML = '<span class="dot" aria-hidden="true"></span><span>Talk to Diamond now</span>';
    btn.addEventListener('click', function () {
      if (vapiInstance && typeof vapiInstance.start === 'function') {
        try { vapiInstance.start(ASSISTANT_ID); return; } catch (e) {}
      }
      // Fallback: click the floating widget button
      var widgetBtn = document.querySelector('[class*="vapi"], .vapi-btn, #vapi-support-btn');
      if (widgetBtn) widgetBtn.click();
      else window.location.href = 'tel:5035017295';
    });
    document.body.appendChild(btn);

    // Hide on scroll
    var hideAfter = 700;
    window.addEventListener('scroll', function () {
      if (window.scrollY > hideAfter) btn.classList.add('hidden');
      else btn.classList.remove('hidden');
    }, { passive: true });
  }

  function loadVapi() {
    // Short-circuit if the placeholders are still in place — keep the pill UX
    // (clicking it will fall back to tel: until the keys are wired up).
    if (PUBLIC_KEY.indexOf('REPLACE_') === 0) {
      console.warn('[diamond-voice] Vapi public key placeholder — widget will no-op until set');
      return;
    }
    var s = document.createElement('script');
    s.src = 'https://cdn.jsdelivr.net/gh/VapiAI/html-script-tag@latest/dist/assets/index.js';
    s.defer = true;
    s.async = true;
    s.onload = function () {
      try {
        vapiInstance = window.vapiSDK.run({
          apiKey: PUBLIC_KEY,
          assistant: ASSISTANT_ID,
          config: buttonConfig
        });
      } catch (e) {
        console.error('[diamond-voice] widget init failed', e);
      }
    };
    document.head.appendChild(s);
  }

  function init() { loadVapi(); injectHeroPill(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
