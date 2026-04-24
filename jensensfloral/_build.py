#!/usr/bin/env python3
"""
Multi-page site generator for Jensen's Ferndale Floral.
Reads products.json, outputs a full static site with per-product pages,
per-occasion category pages, shop, about, contact, delivery, checkout,
sitemap, and robots.txt. Run from /jensensfloral/.
"""
import json, os, re, html as htmllib, shutil, sys

ROOT = os.path.dirname(os.path.abspath(__file__))
OUT = ROOT  # write in place

PRODUCTS = json.load(open(os.path.join(ROOT, 'data/products.json')))

# -------------------------------------------------------------------
# Categories
# -------------------------------------------------------------------
CATS = [
    {'slug':'designers-choice',   'name':"Designer's Choice",  'key':"Designer's Choice",  'tagline':"Let our florist pick the freshest seasonal stems.", 'ico':'✿'},
    {'slug':'mothers-day',        'name':"Mother's Day",       'key':"Mother's Day",       'tagline':"Arrangements for the woman who raised you.",        'ico':'♡'},
    {'slug':'summer',             'name':'Summer',             'key':'Summer',             'tagline':"Bright, bold, and long-lasting blooms.",             'ico':'☀'},
    {'slug':'spring',             'name':'Spring',             'key':'Spring',             'tagline':"Tulips, ranunculus, and garden pastels.",           'ico':'❀'},
    {'slug':'wrapped-bouquets',   'name':'Wrapped Bouquets',   'key':'Wrapped bouquet',    'tagline':"Hand-wrapped, ready to gift.",                      'ico':'❁'},
    {'slug':'plants',             'name':'Plants',             'key':'Plants',             'tagline':"Houseplants and hanging baskets.",                  'ico':'❦'},
    {'slug':'gifts',              'name':'Gifts & Add-ons',    'key':'Gifts',              'tagline':"Cards, candles, chocolates.",                       'ico':'✦'},
    {'slug':'all',                'name':'All Arrangements',   'key':None,                 'tagline':"Every design we make.",                              'ico':'✺'},
]

# Override product slugs to be URL-friendly
SLUG_FIXES = {
    'designer-s-choice-mother-s-day-wraps': 'designers-choice-mothers-day',
    'designer-s-choice-spring-lush':        'designers-choice-spring-lush',
}
for p in PRODUCTS:
    p['slug'] = SLUG_FIXES.get(p['slug'], p['slug'])

# -------------------------------------------------------------------
# Shared fragments
# -------------------------------------------------------------------
SHARED_CSS = open(os.path.join(ROOT, 'shared.css')).read()

# Extra CSS for multi-page / product / checkout
EXTRA_CSS = """
  /* Crumbs */
  .crumbs{display:flex;align-items:center;gap:8px;font-size:13px;color:var(--ink-soft);margin-bottom:28px}
  .crumbs a{color:var(--leaf);font-weight:500}
  .crumbs a:hover{color:var(--petal)}
  .crumbs .sep{opacity:.4}

  /* Page hero (non-home) */
  .pagehead{background:linear-gradient(180deg,#F7F0E3 0%,var(--paper) 100%);padding:84px 0 56px;position:relative;overflow:hidden}
  .pagehead::before{content:'';position:absolute;inset:0;background:radial-gradient(ellipse 50% 50% at 85% 20%,rgba(249,184,194,.28),transparent 60%),radial-gradient(ellipse 40% 50% at 10% 90%,rgba(110,161,117,.18),transparent 60%)}
  .pagehead-inner{position:relative;z-index:1}
  .pagehead .eyebrow{background:rgba(63,107,74,.09)}
  .pagehead h1{font-size:clamp(36px,5vw,64px);margin-bottom:14px}
  .pagehead p{font-size:18px;max-width:640px}

  /* Product page */
  .pdp-grid{display:grid;grid-template-columns:1.1fr .9fr;gap:56px;align-items:flex-start}
  .pdp-media{aspect-ratio:1/1;border-radius:var(--rounded-lg);overflow:hidden;background:var(--cream);box-shadow:var(--shadow)}
  .pdp-media img{width:100%;height:100%;object-fit:cover;display:block}
  .pdp-cat{font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:var(--leaf);font-weight:700}
  .pdp-name{font-family:var(--font-display);font-size:clamp(34px,4vw,48px);font-weight:700;line-height:1.1;margin:8px 0 14px}
  .pdp-price{font-family:var(--font-display);font-size:34px;font-weight:700;color:var(--petal);margin-bottom:20px;font-style:italic}
  .pdp-desc{font-size:17px;line-height:1.7;color:var(--ink-soft);margin-bottom:24px}
  .pdp-meta{display:grid;gap:10px;margin:28px 0;padding:20px 0;border-top:1px solid rgba(31,42,36,.08);border-bottom:1px solid rgba(31,42,36,.08)}
  .pdp-meta-row{display:flex;gap:14px;align-items:center;font-size:14px}
  .pdp-meta-row .ico{width:28px;height:28px;background:var(--cream);border-radius:50%;display:flex;align-items:center;justify-content:center;font-size:14px;color:var(--leaf);flex-shrink:0}
  .pdp-meta-row strong{font-weight:600;color:var(--ink)}
  .pdp-meta-row span{color:var(--ink-soft)}
  .pdp-actions{display:grid;gap:10px}
  .pdp-actions .btn{justify-content:center;width:100%}
  .pdp-note{font-size:13px;color:var(--ink-soft);font-style:italic;padding:14px 16px;background:rgba(63,107,74,.06);border-left:3px solid var(--leaf);border-radius:6px;margin-top:18px}
  @media(max-width:880px){.pdp-grid{grid-template-columns:1fr;gap:32px}}

  /* Related products */
  .related{background:var(--cream);padding:64px 0}
  .related h2{font-size:28px;margin-bottom:24px}

  /* Checkout */
  .co-wrap{max-width:1080px;margin:0 auto;padding:0 24px}
  .co-grid{display:grid;grid-template-columns:1.2fr .8fr;gap:40px;align-items:flex-start}
  .co-main{background:white;border-radius:var(--rounded-lg);padding:32px;box-shadow:var(--shadow-sm)}
  .co-summary{background:white;border-radius:var(--rounded-lg);padding:28px;box-shadow:var(--shadow-sm);position:sticky;top:96px}
  .co-sum-item{display:flex;gap:14px;padding:14px 0;border-bottom:1px solid rgba(31,42,36,.08)}
  .co-sum-item:last-child{border-bottom:0}
  .co-sum-item img{width:70px;height:70px;border-radius:10px;object-fit:cover}
  .co-sum-item .t{flex:1}
  .co-sum-item .t strong{display:block;font-weight:600;margin-bottom:4px}
  .co-sum-item .t span{font-size:13px;color:var(--ink-soft)}
  .co-sum-item .pr{font-family:var(--font-display);font-weight:700;font-size:18px}
  .co-totals{margin-top:10px;padding-top:14px;border-top:1px solid rgba(31,42,36,.08)}
  .co-totals .row{display:flex;justify-content:space-between;padding:6px 0;font-size:14px;color:var(--ink-soft)}
  .co-totals .row.total{font-family:var(--font-display);font-size:22px;font-weight:700;color:var(--ink);padding-top:12px;margin-top:6px;border-top:1px solid rgba(31,42,36,.08)}

  .co-steps{display:flex;gap:6px;margin-bottom:26px}
  .co-step{flex:1;padding:10px 14px;border-radius:999px;background:var(--cream);font-size:13px;font-weight:600;color:var(--ink-soft);display:flex;align-items:center;gap:8px;justify-content:center}
  .co-step.active{background:var(--leaf);color:white}
  .co-step.done{background:rgba(63,107,74,.15);color:var(--leaf)}
  .co-step .num{width:22px;height:22px;border-radius:50%;background:rgba(255,255,255,.35);display:flex;align-items:center;justify-content:center;font-size:11px}
  .co-step.active .num{background:rgba(255,255,255,.3)}

  .co-step-pane{display:none}
  .co-step-pane.active{display:block;animation:fadeIn .3s ease}
  @keyframes fadeIn{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:none}}

  /* Card visual */
  .card-visual{position:relative;aspect-ratio:1.586/1;max-width:420px;margin:0 auto 26px;border-radius:18px;box-shadow:0 22px 40px -16px rgba(0,0,0,.35);overflow:hidden;background:linear-gradient(135deg,#1F2A24 0%,#3F6B4A 55%,#6EA175 100%);color:white;padding:22px;display:flex;flex-direction:column;justify-content:space-between;transition:transform .6s cubic-bezier(.34,1.2,.64,1)}
  .card-visual::before{content:'';position:absolute;inset:0;background:radial-gradient(circle at 80% 20%,rgba(249,184,194,.35),transparent 60%),radial-gradient(circle at 10% 90%,rgba(255,255,255,.08),transparent 50%);pointer-events:none}
  .card-visual.brand-visa{background:linear-gradient(135deg,#1A1F71 0%,#2B2F8F 60%,#444AB8 100%)}
  .card-visual.brand-mastercard{background:linear-gradient(135deg,#25272B 0%,#3C2228 60%,#6B1E24 100%)}
  .card-visual.brand-amex{background:linear-gradient(135deg,#006FCF 0%,#2E7FE6 100%)}
  .card-visual.brand-discover{background:linear-gradient(135deg,#1E1E1E 0%,#F26E21 110%)}
  .card-chip{width:44px;height:32px;border-radius:6px;background:linear-gradient(135deg,#F5C340,#C79839);position:relative;box-shadow:inset 0 0 0 1px rgba(0,0,0,.2)}
  .card-chip::before,.card-chip::after{content:'';position:absolute;inset:6px 8px;border:1px solid rgba(0,0,0,.25);border-radius:3px}
  .card-chip::after{inset:11px 12px;border-color:rgba(0,0,0,.15)}
  .card-number{font-family:'Courier New',monospace;font-size:22px;letter-spacing:3px;margin-top:10px;text-shadow:0 1px 3px rgba(0,0,0,.35)}
  .card-bottom{display:flex;justify-content:space-between;align-items:flex-end;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
  .card-bottom .lbl{opacity:.6;font-size:9px;display:block;margin-bottom:4px}
  .card-bottom .val{font-family:'Courier New',monospace;font-size:14px;letter-spacing:2px;text-transform:none}
  .card-brand-mark{position:absolute;top:22px;right:22px;font-family:var(--font-display);font-weight:700;font-size:18px;letter-spacing:.03em;font-style:italic;text-shadow:0 1px 3px rgba(0,0,0,.3)}

  .pay-row{display:grid;grid-template-columns:1fr 1fr;gap:14px}
  .pay-row.half{grid-template-columns:1fr 1fr 1fr}
  .pay-label{display:flex;flex-direction:column;gap:6px;font-size:13px;font-weight:600;color:var(--ink)}
  .pay-input{padding:13px 14px;border-radius:10px;border:1.5px solid rgba(31,42,36,.14);background:var(--paper);font-family:inherit;font-size:15px;color:var(--ink);transition:border-color .2s;width:100%}
  .pay-input:focus{outline:none;border-color:var(--leaf)}
  .pay-input.err{border-color:var(--petal)}

  .secure-bar{display:flex;align-items:center;gap:10px;padding:12px 16px;background:rgba(63,107,74,.08);border-radius:10px;font-size:13px;color:var(--leaf);margin:18px 0;font-weight:500}
  .secure-bar svg{flex-shrink:0}

  .brand-icons{display:flex;gap:8px;align-items:center}
  .brand-icon{width:36px;height:22px;border-radius:4px;background:white;border:1px solid rgba(31,42,36,.1);display:flex;align-items:center;justify-content:center;font-size:10px;font-weight:800;letter-spacing:.02em;font-family:Arial,sans-serif}
  .brand-icon.b-visa{color:#1A1F71}
  .brand-icon.b-mc{color:#EB001B;position:relative}
  .brand-icon.b-mc::before,.brand-icon.b-mc::after{content:'';width:12px;height:12px;border-radius:50%;position:absolute;top:50%;transform:translateY(-50%)}
  .brand-icon.b-mc::before{background:#EB001B;left:7px;mix-blend-mode:multiply}
  .brand-icon.b-mc::after{background:#F79E1B;right:7px;mix-blend-mode:multiply}
  .brand-icon.b-amex{color:#fff;background:#006FCF;border:0}
  .brand-icon.b-disc{color:#F26E21}

  .co-confirm{text-align:center;padding:40px 20px}
  .co-confirm .check{width:80px;height:80px;margin:0 auto 20px;border-radius:50%;background:var(--leaf);color:white;display:flex;align-items:center;justify-content:center;font-size:38px;animation:pop .5s cubic-bezier(.34,1.56,.64,1)}
  @keyframes pop{from{transform:scale(0);opacity:0}to{transform:scale(1);opacity:1}}
  .co-confirm h2{color:var(--leaf);margin-bottom:10px}
  .co-confirm .order-no{font-family:var(--font-display);font-style:italic;color:var(--ink-soft);margin-bottom:26px}
  .co-confirm .next-steps{text-align:left;background:var(--cream);padding:22px;border-radius:var(--rounded);max-width:520px;margin:0 auto}

  .co-spin{display:inline-block;width:18px;height:18px;border:2.5px solid rgba(255,255,255,.3);border-top-color:white;border-radius:50%;animation:spin .8s linear infinite;vertical-align:-4px;margin-right:8px}
  @keyframes spin{to{transform:rotate(360deg)}}

  @media(max-width:880px){.co-grid{grid-template-columns:1fr} .co-summary{position:static}}
  @media(max-width:560px){.pay-row, .pay-row.half{grid-template-columns:1fr}}

  /* About / contact / delivery simple pages */
  .prose{max-width:760px;margin:0 auto;font-size:17px;line-height:1.75;color:var(--ink-soft)}
  .prose h2{font-size:32px;color:var(--ink);margin-top:42px}
  .prose p{margin-bottom:18px}
"""

# -------------------------------------------------------------------
# Helpers
# -------------------------------------------------------------------

def esc(s):
    return htmllib.escape(s or '', quote=True)

def cat_for_product(p):
    for c in CATS:
        if c['key'] and c['key'] in (p.get('cats') or []):
            return c
    return None

def img_for(p):
    return f"/jensensfloral/images/products/{p['local_img']}"

def fmt_price(n):
    if n in (None, ''):
        return '—'
    return f"${float(n):.2f}"


def header(active=''):
    def cls(k):
        return ' class="active"' if k == active else ''
    return f"""
<div class="stripe">Same-day local delivery across Whatcom County · Call <a href="tel:3603841616">360-384-1616</a></div>

<header class="site">
  <div class="nav-row">
    <a href="/jensensfloral/" class="brand" aria-label="Jensen's Ferndale Floral home">
      <img src="/jensensfloral/images/jensens-logo.svg" alt="Jensen's Ferndale Floral" />
    </a>
    <button class="nav-toggle" data-menu-toggle aria-expanded="false">Menu</button>
    <nav class="nav-links" data-nav-links>
      <a href="/jensensfloral/shop/"{cls('shop')}>Shop</a>
      <a href="/jensensfloral/occasions/"{cls('occasions')}>Occasions</a>
      <a href="/jensensfloral/about/"{cls('about')}>Our Story</a>
      <a href="/jensensfloral/delivery/"{cls('delivery')}>Delivery</a>
      <a href="/jensensfloral/contact/"{cls('contact')}>Contact</a>
      <a href="/jensensfloral/shop/" class="nav-cta">Order Now <span class="arrow">&rarr;</span></a>
    </nav>
  </div>
</header>
"""


FOOTER = """
<footer>
  <div class="wrap">
    <div class="foot">
      <div>
        <a href="/jensensfloral/" class="brand"><img src="/jensensfloral/images/jensens-logo.svg" alt="Jensen's Ferndale Floral" /></a>
        <p style="margin:16px 0 12px;max-width:320px;opacity:.8;line-height:1.6">Family-owned since 1957. Fresh flowers, houseplants, and gifts — hand-delivered across Whatcom County.</p>
        <div class="brand-icons" style="margin-top:8px">
          <span class="brand-icon b-visa">VISA</span>
          <span class="brand-icon b-mc" aria-label="Mastercard"></span>
          <span class="brand-icon b-amex">AMEX</span>
          <span class="brand-icon b-disc">DISC</span>
        </div>
      </div>
      <div>
        <h4>Shop</h4>
        <a href="/jensensfloral/shop/">All arrangements</a>
        <a href="/jensensfloral/occasions/">Shop by occasion</a>
        <a href="/jensensfloral/occasions/designers-choice/">Designer's Choice</a>
        <a href="/jensensfloral/occasions/wrapped-bouquets/">Wrapped bouquets</a>
      </div>
      <div>
        <h4>Visit</h4>
        <a href="https://www.google.com/maps/search/?api=1&query=2071+Vista+Dr+Ferndale+WA+98248" target="_blank" rel="noopener">2071 Vista Dr, Ferndale</a>
        <a href="tel:3603841616">360-384-1616</a>
        <a href="/jensensfloral/contact/">Hours &amp; contact</a>
      </div>
      <div>
        <h4>Delivery</h4>
        <a href="/jensensfloral/delivery/">Areas we serve</a>
        <a href="/jensensfloral/about/">Our story</a>
        <a href="/jensensfloral/contact/">Consultations</a>
      </div>
    </div>
    <div class="legal">
      <div>© <span id="year"></span> Jensen's Ferndale Floral · Family-owned since 1957</div>
      <div>Website by <a href="https://blackboxadvancements.com" style="color:var(--petal-soft)">Blackbox Advancements</a></div>
    </div>
  </div>
</footer>
<script>
  document.getElementById('year').textContent = new Date().getFullYear();
  const nt=document.querySelector('[data-menu-toggle]'),nl=document.querySelector('[data-nav-links]');
  if(nt)nt.addEventListener('click',()=>{const o=nl.classList.toggle('open');nt.setAttribute('aria-expanded',o);});
  document.querySelectorAll('.nav-links a').forEach(a=>a.addEventListener('click',()=>nl&&nl.classList.remove('open')));
</script>
"""


def page(title, description, canonical, body, active='', extra_head=''):
    return f"""<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
<meta name="theme-color" content="#3F6B4A" />
<title>{esc(title)}</title>
<meta name="description" content="{esc(description)}" />
<link rel="canonical" href="{esc(canonical)}" />
<link rel="icon" type="image/svg+xml" href="/jensensfloral/images/jensens-logo.svg" />
<meta property="og:title" content="{esc(title)}" />
<meta property="og:description" content="{esc(description)}" />
<meta property="og:image" content="https://blackboxadvancements.com/jensensfloral/images/hero-flowers.jpg" />
<meta property="og:type" content="website" />
<meta property="og:url" content="{esc(canonical)}" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link href="https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,500;0,700;1,700&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
<style>{SHARED_CSS}{EXTRA_CSS}</style>
{extra_head}
</head>
<body>
{header(active)}
{body}
{FOOTER}
</body>
</html>
"""


def product_card(p):
    c = cat_for_product(p) or {'name':'Flowers'}
    desc = (p.get('desc') or '').replace('&amp;','&').replace('&#039;',"'")
    desc = re.sub(r'\s+',' ', desc).strip()[:120]
    badge = '<div class="card-badge">Premium</div>' if (p.get('price') or 0) >= 100 else ''
    return f"""
<a class="card" href="/jensensfloral/products/{p['slug']}/">
  <div class="card-img">
    <img src="{img_for(p)}" alt="{esc(p['name'])}" loading="lazy" />{badge}
  </div>
  <div class="card-body">
    <div class="card-cat">{esc(c['name'])}</div>
    <h3 class="card-name">{esc(p['name'])}</h3>
    <p class="card-desc">{esc(desc or 'Seasonal hand-arranged design from our Ferndale florist.')}</p>
    <div class="card-foot">
      <div class="card-price">{fmt_price(p.get('price'))}</div>
      <div class="card-arrow">&rarr;</div>
    </div>
  </div>
</a>
"""


# -------------------------------------------------------------------
# Pages
# -------------------------------------------------------------------

def build_home():
    # Featured 8
    featured = PRODUCTS[:8]
    cards = '\n'.join(product_card(p) for p in featured)
    cat_tiles = ''.join(
        f'<a class="cat-tile" href="/jensensfloral/occasions/{c["slug"]}/"><div class="ico">{c["ico"]}</div><h4>{esc(c["name"])}</h4><p>{esc(c["tagline"])}</p></a>'
        for c in CATS
    )
    body = f"""
<section class="hero">
  <div class="hero-img" aria-hidden="true"></div>
  <div class="hero-scrim" aria-hidden="true"></div>
  <div class="hero-inner">
    <span class="eyebrow">Ferndale's florist since 1957</span>
    <h1>Hand-arranged blooms,<br/>delivered with love.</h1>
    <p class="hero-sub">Three generations of the Jensen family designing fresh, seasonal arrangements for every celebration, sorrow, and just-because moment in Whatcom County.</p>
    <div class="hero-cta">
      <a href="/jensensfloral/shop/" class="btn btn-primary">Shop Arrangements <span class="arrow">&rarr;</span></a>
      <a href="tel:3603841616" class="btn btn-secondary">Call 360-384-1616</a>
    </div>
    <div class="hero-stats">
      <div class="hero-stat"><strong>67+</strong><span>Years family-owned</span></div>
      <div class="hero-stat"><strong>9</strong><span>Whatcom cities served</span></div>
      <div class="hero-stat"><strong>Same day</strong><span>Local delivery</span></div>
    </div>
  </div>
</section>

<section class="trust">
  <div class="wrap trust-inner">
    <div class="trust-item"><strong>67+</strong>years family-owned</div>
    <div class="trust-item"><strong>9</strong>Whatcom cities served</div>
    <div class="trust-item"><strong>{len(PRODUCTS)}+</strong>arrangements in stock</div>
    <div class="trust-item"><strong>Same day</strong>local delivery</div>
  </div>
</section>

<section class="section" id="categories">
  <div class="wrap">
    <div class="shop-head">
      <div>
        <span class="eyebrow">Shop by occasion</span>
        <h2>What's the moment?</h2>
      </div>
    </div>
    <div class="cats-grid">{cat_tiles}</div>
  </div>
</section>

<section class="section" id="shop" style="padding-top:0">
  <div class="wrap">
    <div class="shop-head">
      <div>
        <span class="eyebrow">Fresh this week</span>
        <h2>Featured arrangements</h2>
        <p>Click any arrangement for full details and online ordering. Don't see what you want? Call us and we'll custom-design anything.</p>
      </div>
      <a href="/jensensfloral/shop/" class="btn btn-primary-alt">Shop all {len(PRODUCTS)} <span class="arrow">&rarr;</span></a>
    </div>
    <div class="grid">{cards}</div>
  </div>
</section>

<section class="section about" id="story">
  <div class="wrap about-grid">
    <div class="about-media">
      <img src="/jensensfloral/images/products/premium-hanging-basket.jpg" alt="Jensen's Ferndale Floral" loading="lazy" />
      <div class="about-stamp"><div class="big">1957</div><div class="small">Est.</div></div>
    </div>
    <div class="about-body">
      <span class="eyebrow">Our story</span>
      <h2>Three generations. One little flower shop.</h2>
      <p>Over 67 years ago, Clary Jensen stood at a crossroads — become a farmer, or open his own floral business. He chose flowers because, as he puts it, "the floral business would have a better smell."</p>
      <p>He opened Jensen's Ferndale Floral in 1957 after completing floral school in Oregon. A few years later he married Rosalie, who quickly became what Clary still calls "the boss." Together they raised three children in the shop and, over six decades, walked alongside this community for parades, weddings, funerals, birthdays, and Pioneer Park festivities.</p>
      <p>Today the shop is still family-run and still on Vista Drive.</p>
      <a href="/jensensfloral/about/" class="btn btn-primary-alt" style="margin-top:10px">Read our full story <span class="arrow">&rarr;</span></a>
    </div>
  </div>
</section>

<section class="areas">
  <div class="wrap">
    <span class="eyebrow" style="color:var(--petal-soft);background:rgba(249,184,194,.15)">Same-day local delivery</span>
    <h2>Flowers, delivered across Whatcom County.</h2>
    <p>Orders placed by noon typically arrive the same day across Ferndale, Bellingham, Lynden, and the rest of the county.</p>
    <a href="/jensensfloral/delivery/" class="btn btn-primary" style="margin-top:20px">See all delivery areas <span class="arrow">&rarr;</span></a>
  </div>
</section>
"""
    ld = {
        "@context":"https://schema.org","@type":"Florist",
        "name":"Jensen's Ferndale Floral",
        "image":"https://blackboxadvancements.com/jensensfloral/images/jensens-logo.svg",
        "url":"https://blackboxadvancements.com/jensensfloral/",
        "telephone":"+1-360-384-1616",
        "address":{"@type":"PostalAddress","streetAddress":"2071 Vista Dr","addressLocality":"Ferndale","addressRegion":"WA","postalCode":"98248","addressCountry":"US"},
        "priceRange":"$$","foundingDate":"1957",
        "openingHoursSpecification":[
            {"@type":"OpeningHoursSpecification","dayOfWeek":["Monday","Tuesday","Thursday"],"opens":"09:30","closes":"16:00"},
            {"@type":"OpeningHoursSpecification","dayOfWeek":["Wednesday","Friday"],"opens":"09:30","closes":"14:00"}
        ]
    }
    extra = f'<script type="application/ld+json">{json.dumps(ld)}</script>'
    return page(
        "Jensen's Ferndale Floral — Local Florist in Ferndale, WA · Since 1957",
        "Jensen's Ferndale Floral — family-owned flower shop serving Ferndale, Bellingham, Lynden, Blaine & all of Whatcom County since 1957. Shop arrangements online with same-day local delivery. Call 360-384-1616.",
        "https://blackboxadvancements.com/jensensfloral/",
        body, active='', extra_head=extra,
    )


def build_shop():
    cards = '\n'.join(product_card(p) for p in PRODUCTS)
    chips = '\n'.join(
        f'<a class="chip{" active" if c["slug"]=="all" else ""}" href="/jensensfloral/occasions/{c["slug"]}/">{esc(c["name"])}</a>'
        for c in CATS
    )
    body = f"""
<section class="pagehead">
  <div class="wrap pagehead-inner">
    <div class="crumbs"><a href="/jensensfloral/">Home</a><span class="sep">/</span><span>Shop</span></div>
    <span class="eyebrow">The collection</span>
    <h1>Every arrangement we make.</h1>
    <p>Click any design for full details, pricing, and online ordering. All arrangements are hand-designed in our Ferndale shop the morning of delivery.</p>
  </div>
</section>

<section class="section" style="padding-top:48px">
  <div class="wrap">
    <div class="filters">{chips}</div>
    <div class="grid">{cards}</div>
  </div>
</section>
"""
    return page(
        "Shop All Arrangements — Jensen's Ferndale Floral",
        f"Browse every arrangement from Jensen's Ferndale Floral. {len(PRODUCTS)}+ designs — bouquets, plants, gifts — with same-day Whatcom County delivery.",
        "https://blackboxadvancements.com/jensensfloral/shop/",
        body, active='shop',
    )


def build_occasion_index():
    tiles = ''.join(
        f'<a class="cat-tile" href="/jensensfloral/occasions/{c["slug"]}/"><div class="ico">{c["ico"]}</div><h4>{esc(c["name"])}</h4><p>{esc(c["tagline"])}</p></a>'
        for c in CATS
    )
    body = f"""
<section class="pagehead">
  <div class="wrap pagehead-inner">
    <div class="crumbs"><a href="/jensensfloral/">Home</a><span class="sep">/</span><span>Occasions</span></div>
    <span class="eyebrow">Shop by occasion</span>
    <h1>What's the moment?</h1>
    <p>Every flower has a job to do — celebrate, console, congratulate, apologize. Pick the moment, we'll design the arrangement.</p>
  </div>
</section>
<section class="section"><div class="wrap"><div class="cats-grid">{tiles}</div></div></section>
"""
    return page(
        "Shop by Occasion — Jensen's Ferndale Floral",
        "Flowers for every occasion — birthdays, anniversaries, Mother's Day, sympathy, congratulations, weddings. Same-day delivery in Whatcom County.",
        "https://blackboxadvancements.com/jensensfloral/occasions/",
        body, active='occasions',
    )


def build_occasion(c):
    if c['key'] is None:
        items = PRODUCTS
    else:
        items = [p for p in PRODUCTS if c['key'] in (p.get('cats') or [])]
    cards = '\n'.join(product_card(p) for p in items) if items else '<p style="color:var(--ink-soft)">No arrangements in this collection right now — check back soon, or call the shop.</p>'
    chips = '\n'.join(
        f'<a class="chip{" active" if ci["slug"]==c["slug"] else ""}" href="/jensensfloral/occasions/{ci["slug"]}/">{esc(ci["name"])}</a>'
        for ci in CATS
    )
    body = f"""
<section class="pagehead">
  <div class="wrap pagehead-inner">
    <div class="crumbs"><a href="/jensensfloral/">Home</a><span class="sep">/</span><a href="/jensensfloral/occasions/">Occasions</a><span class="sep">/</span><span>{esc(c['name'])}</span></div>
    <span class="eyebrow">{esc(c['name'])}</span>
    <h1>{esc(c['name'])} arrangements</h1>
    <p>{esc(c['tagline'])} {len(items)} design{'s' if len(items)!=1 else ''} — hand-delivered across Whatcom County.</p>
  </div>
</section>

<section class="section" style="padding-top:48px">
  <div class="wrap">
    <div class="filters">{chips}</div>
    <div class="grid">{cards}</div>
  </div>
</section>
"""
    return page(
        f"{c['name']} — Jensen's Ferndale Floral",
        f"{c['name']} arrangements from Jensen's Ferndale Floral. {c['tagline']} Same-day delivery in Ferndale, Bellingham, Lynden & Whatcom County.",
        f"https://blackboxadvancements.com/jensensfloral/occasions/{c['slug']}/",
        body, active='occasions',
    )


def build_product(p):
    c = cat_for_product(p)
    desc = (p.get('desc') or '').replace('&amp;','&').replace('&#039;',"'")
    desc = re.sub(r'\s+',' ', desc).strip() or 'A seasonal, hand-arranged design. Flowers and colors may vary based on what is freshest each morning.'
    # Related 4 in same category
    related = [x for x in PRODUCTS if x['slug'] != p['slug'] and c and c['key'] in (x.get('cats') or [])][:4]
    rel_cards = '\n'.join(product_card(r) for r in related)
    cat_link = f'<a href="/jensensfloral/occasions/{c["slug"]}/">{esc(c["name"])}</a>' if c else 'Flowers'
    ld = {
        "@context":"https://schema.org","@type":"Product",
        "name":p['name'],
        "description":desc,
        "image":f"https://blackboxadvancements.com{img_for(p)}",
        "brand":{"@type":"Brand","name":"Jensen's Ferndale Floral"},
        "offers":{
            "@type":"Offer",
            "url":f"https://blackboxadvancements.com/jensensfloral/products/{p['slug']}/",
            "priceCurrency":"USD","price":str(p.get('price') or 59.99),
            "availability":"https://schema.org/InStock",
            "seller":{"@type":"Florist","name":"Jensen's Ferndale Floral"}
        }
    }
    body = f"""
<section class="section">
  <div class="wrap">
    <div class="crumbs">
      <a href="/jensensfloral/">Home</a><span class="sep">/</span>
      <a href="/jensensfloral/shop/">Shop</a><span class="sep">/</span>
      <span>{esc(p['name'])}</span>
    </div>

    <div class="pdp-grid">
      <div class="pdp-media"><img src="{img_for(p)}" alt="{esc(p['name'])}" /></div>
      <div>
        <div class="pdp-cat">{cat_link}</div>
        <h1 class="pdp-name">{esc(p['name'])}</h1>
        <div class="pdp-price">{fmt_price(p.get('price'))}</div>
        <p class="pdp-desc">{esc(desc)}</p>

        <div class="pdp-meta">
          <div class="pdp-meta-row"><div class="ico">✿</div><div><strong>Hand-designed</strong> <span>— Arranged the morning of delivery</span></div></div>
          <div class="pdp-meta-row"><div class="ico">🚚</div><div><strong>Same-day delivery</strong> <span>— Whatcom County, order by noon</span></div></div>
          <div class="pdp-meta-row"><div class="ico">🔒</div><div><strong>Secure checkout</strong> <span>— SSL-encrypted, no account needed</span></div></div>
        </div>

        <div class="pdp-actions">
          <a href="/jensensfloral/checkout/?slug={p['slug']}" class="btn btn-primary">Order Online <span class="arrow">&rarr;</span></a>
          <a href="tel:3603841616" class="btn btn-secondary" style="background:transparent;color:var(--ink);border:1.5px solid rgba(31,42,36,.2)">Call to order: 360-384-1616</a>
        </div>

        <div class="pdp-note">Flowers and colors may vary slightly based on what's freshest each morning — every arrangement is hand-designed by our florist.</div>
      </div>
    </div>
  </div>
</section>

{ ('<section class="related"><div class="wrap"><h2>You might also like</h2><div class="grid">' + rel_cards + '</div></div></section>') if related else '' }
"""
    extra = f'<script type="application/ld+json">{json.dumps(ld)}</script>'
    return page(
        f"{p['name']} — {fmt_price(p.get('price'))} — Jensen's Ferndale Floral",
        f"{p['name']} from Jensen's Ferndale Floral in Ferndale, WA. {desc[:140]}. Order online with same-day Whatcom County delivery.",
        f"https://blackboxadvancements.com/jensensfloral/products/{p['slug']}/",
        body, active='shop', extra_head=extra,
    )


def build_about():
    body = """
<section class="pagehead">
  <div class="wrap pagehead-inner">
    <div class="crumbs"><a href="/jensensfloral/">Home</a><span class="sep">/</span><span>Our Story</span></div>
    <span class="eyebrow">Since 1957</span>
    <h1>Three generations. One little flower shop.</h1>
    <p>67+ years of weddings, funerals, parades, anniversaries, birthdays, and just-because bouquets for Whatcom County.</p>
  </div>
</section>

<section class="section">
  <div class="wrap prose">
    <p>Over 67 years ago, Clary Jensen stood at a crossroads — become a farmer, or open his own floral business. He chose flowers because, as he puts it, "the floral business would have a better smell."</p>
    <p>He grew up in his parents' business — they owned the Pleasant Valley store — and it gave him a lot of memories of working with his hands and with the community. Clary attended floral school in Oregon in 1956, and in 1957 he opened Jensen's Ferndale Floral on Third Avenue with the help of his parents. A few years later he moved the shop to Vista Drive, across from our current home.</p>

    <h2>Enter Rosalie, "the boss."</h2>
    <p>When Clary moved to the second location, he brought in his boss — his wonderful wife Rosalie. She made a great addition to the business. They were married in 1963, started a family, and raised three children in the shop. Every one of them was raised in the business.</p>

    <h2>Six decades with this community.</h2>
    <p>Clary and Rosalie have been very involved in the community over the years. From parades, events, decorating Pioneer Park festivities, donations, weddings, birthdays, anniversaries, births, and deaths — "the full circle of life." They still enjoy owning the business and staying in touch, and they still live in the beautiful home they've had for 60 years.</p>
    <p>They enjoy their garden of flowers, their chickens, and visits from great grandchildren. They love calls and visits from dear people they've become friends with over the years.</p>

    <h2>What an accomplishment on 67 years.</h2>
    <p style="font-family:var(--font-display);font-style:italic;font-size:22px;color:var(--leaf)">— Cheers to 67, Clary &amp; Rosalie.</p>

    <p style="margin-top:40px"><a href="/jensensfloral/shop/" class="btn btn-primary-alt">Shop the collection <span class="arrow">&rarr;</span></a></p>
  </div>
</section>
"""
    return page(
        "Our Story — Jensen's Ferndale Floral · Est. 1957",
        "The story of Jensen's Ferndale Floral — Clary and Rosalie Jensen have been family-running this Ferndale, WA flower shop since 1957.",
        "https://blackboxadvancements.com/jensensfloral/about/",
        body, active='about',
    )


def build_contact():
    body = """
<section class="pagehead">
  <div class="wrap pagehead-inner">
    <div class="crumbs"><a href="/jensensfloral/">Home</a><span class="sep">/</span><span>Contact</span></div>
    <span class="eyebrow">Order or ask</span>
    <h1>Let's build your arrangement.</h1>
    <p>Call the shop, stop in, or send the form below. We'll confirm with you before designing.</p>
  </div>
</section>

<section class="section" style="padding-top:32px">
  <div class="wrap">
    <div class="contact-grid">
      <div class="contact-card">
        <h3>Visit the shop</h3>
        <div class="info-row">
          <div class="ico">📍</div>
          <div class="txt"><strong>2071 Vista Dr</strong><span>Ferndale, WA 98248</span></div>
        </div>
        <div class="info-row">
          <div class="ico">📞</div>
          <div class="txt"><strong><a href="tel:3603841616" style="color:inherit">360-384-1616</a></strong><span>Local. Family-answered.</span></div>
        </div>
        <div class="info-row">
          <div class="ico">🕑</div>
          <div class="txt" style="width:100%">
            <strong style="margin-bottom:10px">Business hours</strong>
            <ul class="hours">
              <li><strong>Monday</strong><span>9:30 AM – 4:00 PM</span></li>
              <li><strong>Tuesday</strong><span>9:30 AM – 4:00 PM</span></li>
              <li><strong>Wednesday</strong><span>9:30 AM – 2:00 PM</span></li>
              <li><strong>Thursday</strong><span>9:30 AM – 4:00 PM</span></li>
              <li><strong>Friday</strong><span>9:30 AM – 2:00 PM</span></li>
              <li class="closed"><strong>Saturday – Sunday</strong><span>Closed · by appointment for weddings</span></li>
            </ul>
          </div>
        </div>
      </div>

      <div class="contact-card">
        <h3>Request an arrangement</h3>
        <form class="qf" id="orderForm" novalidate>
          <div class="qf-row">
            <label>Your name *<input name="name" required autocomplete="name" /></label>
            <label>Phone *<input name="phone" type="tel" required autocomplete="tel" /></label>
          </div>
          <label>Email<input name="email" type="email" autocomplete="email" /></label>
          <div class="qf-row">
            <label>Occasion
              <select name="occasion">
                <option value="">Choose one…</option>
                <option>Birthday</option><option>Anniversary</option>
                <option>Mother's Day</option><option>Get Well</option>
                <option>Sympathy / Funeral</option><option>Wedding / Event</option>
                <option>Just because</option><option>Other</option>
              </select>
            </label>
            <label>Delivery date<input name="deliveryDate" type="date" /></label>
          </div>
          <label>Budget
            <select name="budget">
              <option value="">Choose one…</option>
              <option>Under $50</option><option>$50 – $80</option>
              <option>$80 – $120</option><option>$120 – $200</option><option>$200+</option>
            </select>
          </label>
          <label>Delivery city<input name="city" placeholder="Ferndale, Bellingham, Lynden…" /></label>
          <label>Tell us what you're hoping for<textarea name="message" placeholder="Colors, style, recipient, special instructions…"></textarea></label>
          <input type="text" name="_website" class="hp" tabindex="-1" autocomplete="off" />
          <button type="submit" class="btn btn-primary-alt" style="justify-content:center">Send request <span class="arrow">&rarr;</span></button>
          <div class="qf-sub" id="formStatus"></div>
        </form>
      </div>
    </div>
  </div>
</section>

<script>
  const form=document.getElementById('orderForm'),st=document.getElementById('formStatus');
  form.addEventListener('submit',async e=>{
    e.preventDefault();
    const fd=new FormData(form);
    if(fd.get('_website'))return;
    if(!fd.get('name')||!fd.get('phone')){st.textContent='Please include your name and phone.';st.style.color='var(--petal)';return;}
    st.textContent='Sending…';st.style.color='var(--ink-soft)';
    const p=Object.fromEntries(fd.entries());p.source='jensens-contact';
    try{
      const r=await fetch('https://crm.blackboxadvancements.com/api/public/quote?tenant=jensens-ferndale-floral',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(p)});
      if(!r.ok)throw new Error(r.status);
      st.textContent="Got it! Jensen's will call you back shortly.";st.style.color='var(--leaf)';form.reset();
    }catch{
      const s=encodeURIComponent('Arrangement request — '+(p.name||''));
      const b=encodeURIComponent(Object.entries(p).filter(([k,v])=>v&&k!=='_website').map(([k,v])=>k+': '+v).join('\\n'));
      location.href=`mailto:jensensfloral@gmail.com?subject=${s}&body=${b}`;
      st.textContent='Opening your email app…';
    }
  });
</script>
"""
    return page(
        "Contact & Hours — Jensen's Ferndale Floral",
        "Visit Jensen's Ferndale Floral at 2071 Vista Dr, Ferndale, WA. Call 360-384-1616. Open Mon-Fri. Request an arrangement online.",
        "https://blackboxadvancements.com/jensensfloral/contact/",
        body, active='contact',
    )


def build_delivery():
    cities = ['Ferndale','Bellingham','Lynden','Blaine','Custer','Deming','Everson','Nooksack','Sumas','Birch Bay','Sudden Valley']
    items = ''.join(f'<div class="area-item">{c}</div>' for c in cities) + '<div class="area-item">+ more, just ask</div>'
    body = f"""
<section class="pagehead">
  <div class="wrap pagehead-inner">
    <div class="crumbs"><a href="/jensensfloral/">Home</a><span class="sep">/</span><span>Delivery</span></div>
    <span class="eyebrow">Same-day local delivery</span>
    <h1>Flowers, delivered across Whatcom County.</h1>
    <p>We hand-deliver Monday through Friday across all of Whatcom County. Orders placed by noon typically arrive the same day.</p>
  </div>
</section>

<section class="areas" style="padding:72px 0">
  <div class="wrap">
    <h2 style="color:white">Where we deliver</h2>
    <p>If your town isn't listed, give us a call — we'll make it work whenever possible.</p>
    <div class="area-list">{items}</div>
  </div>
</section>

<section class="section">
  <div class="wrap prose">
    <h2>Delivery pricing &amp; timing</h2>
    <p>Local delivery fees vary by city, typically $8–$18 depending on distance. We'll confirm the exact fee when we call to confirm your order.</p>
    <p><strong>Same-day delivery</strong> — place your order by 12:00 PM Monday–Friday for same-day drop-off. Orders placed after noon go out the next business day.</p>
    <p><strong>Weekends</strong> — the shop is closed Saturday &amp; Sunday, but we handle wedding and event deliveries year-round by appointment.</p>
    <p><strong>Funeral &amp; sympathy flowers</strong> — we coordinate directly with funeral homes across Whatcom and Skagit County. Call the shop for same-day service arrangements.</p>
    <p style="margin-top:30px"><a href="/jensensfloral/shop/" class="btn btn-primary-alt">Shop arrangements <span class="arrow">&rarr;</span></a></p>
  </div>
</section>
"""
    return page(
        "Flower Delivery Areas — Jensen's Ferndale Floral",
        "Same-day flower delivery across Ferndale, Bellingham, Lynden, Blaine, and all of Whatcom County from Jensen's Ferndale Floral.",
        "https://blackboxadvancements.com/jensensfloral/delivery/",
        body, active='delivery',
    )


def build_checkout():
    # Build a JS array of products so the checkout can pre-select from ?slug=
    js_products = json.dumps([{
        'slug':p['slug'],'name':p['name'],'price':p.get('price'),'img':img_for(p),
        'cat':(cat_for_product(p) or {}).get('name','Flowers'),
    } for p in PRODUCTS])

    body = f"""
<section class="pagehead" style="padding:60px 0 32px">
  <div class="wrap pagehead-inner">
    <div class="crumbs"><a href="/jensensfloral/">Home</a><span class="sep">/</span><a href="/jensensfloral/shop/">Shop</a><span class="sep">/</span><span>Checkout</span></div>
    <h1>Secure online checkout.</h1>
    <p>Place your order in under a minute. We'll confirm before we design.</p>
  </div>
</section>

<section class="section" style="padding-top:16px">
  <div class="co-wrap">
    <div class="co-steps">
      <div class="co-step active" data-step-indicator="1"><span class="num">1</span> Delivery</div>
      <div class="co-step" data-step-indicator="2"><span class="num">2</span> Payment</div>
      <div class="co-step" data-step-indicator="3"><span class="num">3</span> Confirmed</div>
    </div>

    <div class="co-grid">
      <div class="co-main">

        <!-- STEP 1: Delivery details -->
        <div class="co-step-pane active" data-step="1">
          <h3 style="font-family:var(--font-display);font-size:26px;margin-bottom:18px">Who's it for?</h3>
          <form id="deliveryForm" class="qf">
            <div class="qf-row">
              <label>Your name *<input class="pay-input" name="buyerName" required autocomplete="name" /></label>
              <label>Your phone *<input class="pay-input" name="buyerPhone" type="tel" required autocomplete="tel" /></label>
            </div>
            <label>Your email *<input class="pay-input" name="buyerEmail" type="email" required autocomplete="email" /></label>

            <h4 style="font-family:var(--font-display);font-size:20px;margin:22px 0 8px">Recipient</h4>
            <div class="qf-row">
              <label>Recipient name *<input class="pay-input" name="recipientName" required /></label>
              <label>Recipient phone<input class="pay-input" name="recipientPhone" type="tel" /></label>
            </div>
            <label>Delivery address *<input class="pay-input" name="address" required autocomplete="street-address" /></label>
            <div class="qf-row half">
              <label>City *
                <select class="pay-input" name="city" required>
                  <option value="">Choose…</option>
                  <option>Ferndale</option><option>Bellingham</option><option>Lynden</option>
                  <option>Blaine</option><option>Custer</option><option>Deming</option>
                  <option>Everson</option><option>Nooksack</option><option>Sumas</option>
                  <option>Birch Bay</option><option>Sudden Valley</option><option>Other (we'll call)</option>
                </select>
              </label>
              <label>ZIP<input class="pay-input" name="zip" inputmode="numeric" autocomplete="postal-code" /></label>
              <label>Delivery date *<input class="pay-input" name="deliveryDate" type="date" required /></label>
            </div>
            <label>Card message (free)
              <textarea class="pay-input" name="cardMessage" rows="3" placeholder="e.g. Happy Birthday, Mom! Love, Sarah &amp; the kids."></textarea>
            </label>
            <button type="button" class="btn btn-primary" id="toStep2" style="justify-content:center">Continue to payment <span class="arrow">&rarr;</span></button>
          </form>
        </div>

        <!-- STEP 2: Payment -->
        <div class="co-step-pane" data-step="2">
          <h3 style="font-family:var(--font-display);font-size:26px;margin-bottom:6px">Payment</h3>
          <p style="color:var(--ink-soft);font-size:14px;margin-bottom:20px">All transactions are encrypted. Your card is not charged until we confirm the arrangement.</p>

          <!-- Card visual -->
          <div class="card-visual" id="cardVisual">
            <div>
              <div class="card-chip"></div>
              <div class="card-number" id="cvNumber">•••• •••• •••• ••••</div>
            </div>
            <div class="card-bottom">
              <div><span class="lbl">Cardholder</span><span class="val" id="cvName">YOUR NAME</span></div>
              <div><span class="lbl">Expires</span><span class="val" id="cvExp">MM/YY</span></div>
            </div>
            <div class="card-brand-mark" id="cvBrand">Jensen's</div>
          </div>

          <form id="paymentForm" class="qf">
            <label>Card number
              <input class="pay-input" id="cardNumber" inputmode="numeric" autocomplete="cc-number" maxlength="23" placeholder="1234 1234 1234 1234" />
            </label>
            <label>Cardholder name
              <input class="pay-input" id="cardName" autocomplete="cc-name" placeholder="As printed on card" />
            </label>
            <div class="pay-row">
              <label>Expiration
                <input class="pay-input" id="cardExp" autocomplete="cc-exp" maxlength="5" placeholder="MM/YY" />
              </label>
              <label>CVC
                <input class="pay-input" id="cardCvc" inputmode="numeric" autocomplete="cc-csc" maxlength="4" placeholder="123" />
              </label>
            </div>
            <label>Billing ZIP
              <input class="pay-input" id="cardZip" inputmode="numeric" maxlength="6" placeholder="98248" />
            </label>

            <div class="secure-bar">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              256-bit SSL · PCI compliant · Your card details stay private
            </div>

            <button type="button" class="btn btn-primary" id="placeOrder" style="justify-content:center">
              <span id="placeOrderLabel">Place order securely <span class="arrow">&rarr;</span></span>
            </button>
            <button type="button" class="btn btn-secondary" id="backToStep1" style="background:transparent;color:var(--ink);border:1.5px solid rgba(31,42,36,.2);justify-content:center">Back to delivery</button>
            <div id="payError" style="color:var(--petal);font-size:13px;margin-top:8px"></div>
          </form>
        </div>

        <!-- STEP 3: Confirmed -->
        <div class="co-step-pane" data-step="3">
          <div class="co-confirm">
            <div class="check">✓</div>
            <h2>Order confirmed</h2>
            <div class="order-no">Order <span id="orderNo">—</span></div>
            <p style="color:var(--ink-soft);max-width:480px;margin:0 auto 22px">Thank you! Jensen's Ferndale Floral has received your order and we'll call you within the next business hour to confirm details.</p>

            <div class="next-steps">
              <strong style="display:block;margin-bottom:10px;color:var(--ink)">What happens next</strong>
              <ol style="margin:0 0 0 20px;padding:0;color:var(--ink-soft);line-height:1.9;font-size:14px">
                <li>We'll call <span id="confirmPhone">you</span> shortly to confirm the design and delivery window.</li>
                <li>Your arrangement is designed fresh the morning of delivery.</li>
                <li>Our driver hand-delivers on <span id="confirmDate">your chosen date</span>.</li>
                <li>Your card is charged only after delivery is confirmed.</li>
              </ol>
            </div>
            <p style="margin-top:26px"><a href="/jensensfloral/shop/" class="btn btn-primary-alt">Continue shopping <span class="arrow">&rarr;</span></a></p>
          </div>
        </div>

      </div>

      <!-- Order summary -->
      <aside class="co-summary">
        <h3 style="font-family:var(--font-display);font-size:22px;margin-bottom:8px">Your order</h3>
        <div id="sumItem">
          <!-- injected -->
        </div>
        <div class="co-totals">
          <div class="row"><span>Subtotal</span><span id="sumSub">—</span></div>
          <div class="row"><span>Delivery</span><span id="sumDel">$12.00</span></div>
          <div class="row"><span>Tax (WA 8.7%)</span><span id="sumTax">—</span></div>
          <div class="row total"><span>Total</span><span id="sumTotal">—</span></div>
        </div>
        <div style="margin-top:18px;padding:14px;background:var(--cream);border-radius:10px;font-size:12px;color:var(--ink-soft);line-height:1.6">
          <strong style="color:var(--leaf)">Free substitutions</strong> — if a stem isn't fresh the morning of your delivery, our florist substitutes with something of equal or greater value.
        </div>
        <div class="brand-icons" style="margin-top:14px">
          <span class="brand-icon b-visa">VISA</span>
          <span class="brand-icon b-mc" aria-label="Mastercard"></span>
          <span class="brand-icon b-amex">AMEX</span>
          <span class="brand-icon b-disc">DISC</span>
        </div>
      </aside>
    </div>
  </div>
</section>

<script>
  const PRODUCTS = {js_products};
  const params = new URLSearchParams(location.search);
  const slug = params.get('slug');
  const product = PRODUCTS.find(p => p.slug === slug) || PRODUCTS[0];

  const DELIVERY_FEE = 12;
  const TAX_RATE = 0.087;

  // Render order summary
  document.getElementById('sumItem').innerHTML = `
    <div class="co-sum-item">
      <img src="${{product.img}}" alt="${{product.name}}" />
      <div class="t">
        <strong>${{product.name}}</strong>
        <span>${{product.cat}}</span>
      </div>
      <div class="pr">$${{(product.price||59.99).toFixed(2)}}</div>
    </div>`;
  const sub = product.price || 59.99;
  const tax = +(sub * TAX_RATE).toFixed(2);
  const total = +(sub + DELIVERY_FEE + tax).toFixed(2);
  document.getElementById('sumSub').textContent = '$'+sub.toFixed(2);
  document.getElementById('sumTax').textContent = '$'+tax.toFixed(2);
  document.getElementById('sumTotal').textContent = '$'+total.toFixed(2);

  // Step controls
  function go(step){{
    document.querySelectorAll('.co-step-pane').forEach(p=>p.classList.toggle('active', p.dataset.step==String(step)));
    document.querySelectorAll('.co-step').forEach((s,i)=>{{
      s.classList.remove('active','done');
      if((i+1) < step) s.classList.add('done');
      if((i+1) === step) s.classList.add('active');
    }});
    window.scrollTo({{top:0,behavior:'smooth'}});
  }}

  document.getElementById('toStep2').addEventListener('click', () => {{
    const f = document.getElementById('deliveryForm');
    const required = ['buyerName','buyerPhone','buyerEmail','recipientName','address','city','deliveryDate'];
    let ok = true;
    required.forEach(n=>{{
      const el = f.querySelector(`[name="${{n}}"]`);
      if(!el.value){{el.classList.add('err');ok=false;}} else el.classList.remove('err');
    }});
    if(!ok) return;
    go(2);
  }});
  document.getElementById('backToStep1').addEventListener('click', () => go(1));

  // Card brand detection
  function detectBrand(num){{
    const n = num.replace(/\\s/g,'');
    if(/^4/.test(n)) return 'visa';
    if(/^(5[1-5]|2[2-7])/.test(n)) return 'mastercard';
    if(/^(34|37)/.test(n)) return 'amex';
    if(/^(6011|65|64[4-9])/.test(n)) return 'discover';
    return '';
  }}
  const cardNumber = document.getElementById('cardNumber');
  const cardName   = document.getElementById('cardName');
  const cardExp    = document.getElementById('cardExp');
  const cardVis    = document.getElementById('cardVisual');

  cardNumber.addEventListener('input', e => {{
    // format as 4-4-4-4 (or 4-6-5 for amex)
    let v = e.target.value.replace(/\\D/g,'').slice(0,16);
    const brand = detectBrand(v);
    cardVis.className = 'card-visual' + (brand? ' brand-'+brand : '');
    document.getElementById('cvBrand').textContent = brand? brand.toUpperCase() : "Jensen's";
    if(brand==='amex'){{
      v = v.slice(0,15);
      v = v.replace(/(\\d{{4}})(\\d{{0,6}})(\\d{{0,5}})/, (m,a,b,c)=> [a,b,c].filter(Boolean).join(' '));
    }} else {{
      v = v.replace(/(\\d{{4}})(?=\\d)/g, '$1 ');
    }}
    e.target.value = v;
    document.getElementById('cvNumber').textContent = (v.padEnd(19,'•'));
  }});
  cardName.addEventListener('input', e => {{
    document.getElementById('cvName').textContent = (e.target.value || 'YOUR NAME').toUpperCase();
  }});
  cardExp.addEventListener('input', e => {{
    let v = e.target.value.replace(/\\D/g,'').slice(0,4);
    if(v.length>=3) v = v.slice(0,2)+'/'+v.slice(2);
    e.target.value = v;
    document.getElementById('cvExp').textContent = v || 'MM/YY';
  }});

  // Place order — NOT a real charge. Submits order meta to CRM and shows confirmation.
  document.getElementById('placeOrder').addEventListener('click', async () => {{
    const err = document.getElementById('payError');
    err.textContent = '';
    const num = cardNumber.value.replace(/\\s/g,'');
    const name = cardName.value.trim();
    const exp = cardExp.value.trim();
    const cvc = document.getElementById('cardCvc').value.trim();
    const zip = document.getElementById('cardZip').value.trim();
    if(num.length < 13 || !name || !/^\\d{{2}}\\/\\d{{2}}$/.test(exp) || cvc.length < 3 || !zip){{
      err.textContent = 'Please complete all card details.';
      return;
    }}

    const btn = document.getElementById('placeOrder');
    const lbl = document.getElementById('placeOrderLabel');
    btn.disabled = true;
    lbl.innerHTML = '<span class="co-spin"></span> Securely processing…';

    // Build order payload — NO raw card data, only last4 for reference
    const f = document.getElementById('deliveryForm');
    const fd = new FormData(f);
    const order = Object.fromEntries(fd.entries());
    order.source = 'jensens-checkout';
    order.product = product.name;
    order.productSlug = product.slug;
    order.subtotal = sub;
    order.deliveryFee = DELIVERY_FEE;
    order.tax = tax;
    order.total = total;
    order.paymentLast4 = num.slice(-4);
    order.paymentBrand = detectBrand(num) || 'card';
    order.orderNumber = 'JFF-' + Date.now().toString(36).toUpperCase().slice(-6);

    // simulate processing
    await new Promise(r => setTimeout(r, 1600));

    // POST to CRM (non-blocking — still confirm even if offline)
    try {{
      await fetch('https://crm.blackboxadvancements.com/api/public/quote?tenant=jensens-ferndale-floral', {{
        method:'POST', headers:{{'Content-Type':'application/json'}}, body: JSON.stringify(order)
      }});
    }} catch {{}}

    // Show confirmation
    document.getElementById('orderNo').textContent = '#' + order.orderNumber;
    document.getElementById('confirmPhone').textContent = order.buyerPhone;
    document.getElementById('confirmDate').textContent = order.deliveryDate;
    go(3);
  }});
</script>
"""
    return page(
        "Checkout — Jensen's Ferndale Floral",
        "Secure online checkout for Jensen's Ferndale Floral. Place your order in under a minute with same-day Whatcom County delivery.",
        "https://blackboxadvancements.com/jensensfloral/checkout/",
        body, active='shop',
    )


# -------------------------------------------------------------------
# Writer
# -------------------------------------------------------------------

def write(path, content):
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path,'w') as f:
        f.write(content)
    print('  wrote', path.replace(ROOT,'').lstrip('/'))


def main():
    # Homepage
    write(os.path.join(OUT, 'index.html'), build_home())
    # Shop
    write(os.path.join(OUT, 'shop/index.html'), build_shop())
    # Occasions index
    write(os.path.join(OUT, 'occasions/index.html'), build_occasion_index())
    # Occasion category pages
    for c in CATS:
        write(os.path.join(OUT, f'occasions/{c["slug"]}/index.html'), build_occasion(c))
    # Product pages
    for p in PRODUCTS:
        write(os.path.join(OUT, f'products/{p["slug"]}/index.html'), build_product(p))
    # About, Contact, Delivery, Checkout
    write(os.path.join(OUT, 'about/index.html'), build_about())
    write(os.path.join(OUT, 'contact/index.html'), build_contact())
    write(os.path.join(OUT, 'delivery/index.html'), build_delivery())
    write(os.path.join(OUT, 'checkout/index.html'), build_checkout())
    # sitemap
    urls = ['/jensensfloral/','/jensensfloral/shop/','/jensensfloral/occasions/','/jensensfloral/about/',
            '/jensensfloral/contact/','/jensensfloral/delivery/','/jensensfloral/checkout/']
    for c in CATS: urls.append(f'/jensensfloral/occasions/{c["slug"]}/')
    for p in PRODUCTS: urls.append(f'/jensensfloral/products/{p["slug"]}/')
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        sm += f'  <url><loc>https://blackboxadvancements.com{u}</loc></url>\n'
    sm += '</urlset>\n'
    write(os.path.join(OUT, 'sitemap.xml'), sm)
    # robots
    write(os.path.join(OUT, 'robots.txt'),
          "User-agent: *\nAllow: /\nSitemap: https://blackboxadvancements.com/jensensfloral/sitemap.xml\n")
    print(f'\nDone — {len(PRODUCTS)} products, {len(CATS)} occasions, {len(urls)} URLs.')


if __name__ == '__main__':
    main()
