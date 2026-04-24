#!/usr/bin/env python3
"""
Generate 20 area pages + 7 service pages for diamondgroupepoxy from _copy.json.
Run:  python3 _build_pages.py
"""
import json, os, html

ROOT = os.path.dirname(os.path.abspath(__file__))

def esc(s): return html.escape(s or '')

def head(title, desc, canonical_suffix, og_img='images/hero.webp'):
    return f'''<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <base href="/diamondgroupepoxy/">
  <meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
  <meta name="theme-color" content="#07080c">
  <title>{esc(title)}</title>
  <meta name="description" content="{esc(desc)}">
  <meta name="robots" content="index,follow,max-image-preview:large">
  <link rel="canonical" href="https://blackboxadvancements.com/diamondgroupepoxy/{canonical_suffix}">
  <meta property="og:type" content="website">
  <meta property="og:title" content="{esc(title)}">
  <meta property="og:description" content="{esc(desc)}">
  <meta property="og:image" content="{og_img}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600&display=swap">
  <script src="https://unpkg.com/@phosphor-icons/web@2.1.1"></script>
  <link rel="icon" type="image/png" href="images/logo.png">
  <link rel="stylesheet" href="styles.css">
</head>
<body>
  <div class="spotlight" id="spotlight"></div>

  <header class="nav" id="nav">
    <div class="container nav-inner">
      <a href="index.html" class="nav-logo">
        <img src="images/logo.png" alt="Diamond Group logo">
        <span>Diamond <em>Group</em></span>
      </a>
      <nav class="nav-links">
        <a href="index.html#services">Services</a>
        <a href="index.html#estimator">Estimator</a>
        <a href="index.html#gallery">Gallery</a>
        <a href="index.html#areas">Service Areas</a>
        <a href="index.html#reviews">Reviews</a>
        <a href="index.html#faq">FAQ</a>
      </nav>
      <div class="nav-cta">
        <a href="tel:5035017295" class="btn btn-ghost btn-sm hidden-sm"><i class="ph-fill ph-phone"></i> 503-501-7295</a>
        <a href="index.html#estimator" class="btn btn-primary btn-sm">Free Quote <i class="ph-bold ph-arrow-up-right"></i></a>
        <button class="nav-mobile-btn" id="navToggle" aria-label="Toggle menu"><i class="ph ph-list"></i></button>
      </div>
    </div>
  </header>
'''

FOOTER = '''
  <footer class="footer">
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <a href="index.html" class="nav-logo"><img src="images/logo.png" alt=""> <span>Diamond <em>Group</em></span></a>
          <p>Portland's premium epoxy flooring + concrete coating contractor. Locally owned in Beaverton. Licensed, bonded, insured in Oregon &amp; Washington.</p>
          <div class="social">
            <a href="#" aria-label="Facebook"><i class="ph-bold ph-facebook-logo"></i></a>
            <a href="#" aria-label="Instagram"><i class="ph-bold ph-instagram-logo"></i></a>
            <a href="#" aria-label="Google"><i class="ph-bold ph-google-logo"></i></a>
          </div>
        </div>
        <div class="footer-col">
          <h5>Services</h5>
          <a href="services/flake-floors.html">Flake Floors</a>
          <a href="services/metallic-epoxy.html">Metallic Epoxy</a>
          <a href="services/quartz-floors.html">Quartz Floors</a>
          <a href="services/concrete-coatings.html">Concrete Coatings</a>
          <a href="services/grind-seal.html">Grind &amp; Seal</a>
          <a href="services/solid-color.html">Solid Color</a>
          <a href="services/commercial-industrial.html">Commercial / Industrial</a>
        </div>
        <div class="footer-col">
          <h5>Service Areas</h5>
          <a href="areas/beaverton.html">Beaverton</a>
          <a href="areas/portland.html">Portland</a>
          <a href="areas/hillsboro.html">Hillsboro</a>
          <a href="areas/tigard.html">Tigard</a>
          <a href="areas/lake-oswego.html">Lake Oswego</a>
          <a href="areas/west-linn.html">West Linn</a>
          <a href="areas/happy-valley.html">Happy Valley</a>
          <a href="areas/vancouver-wa.html">Vancouver WA</a>
          <a href="index.html#areas">All 20 cities →</a>
        </div>
        <div class="footer-col">
          <h5>Contact</h5>
          <a href="tel:5035017295"><i class="ph-bold ph-phone"></i> 503-501-7295</a>
          <a href="mailto:diamondgrouppdx@gmail.com"><i class="ph-bold ph-envelope"></i> diamondgrouppdx@gmail.com</a>
          <a href="#"><i class="ph-bold ph-map-pin"></i> Beaverton, OR 97006</a>
          <a href="#"><i class="ph-bold ph-clock"></i> Mon–Sat · 7a–7p</a>
        </div>
      </div>
      <div class="footer-bottom">
        <span>© <span id="year">2026</span> Diamond Group Epoxy Floors. All rights reserved.</span>
        <span>Site by <a href="https://blackboxadvancements.com" style="color:var(--ice)">Blackbox Advancements</a></span>
      </div>
    </div>
  </footer>

  <!-- AI Chat widget (shared) -->
  <div class="chat-widget" id="chatWidget">
    <div class="chat-panel" id="chatPanel">
      <div class="chat-header">
        <div class="avatar">D</div>
        <div>
          <div class="name">Ask Diamond</div>
          <div class="status">Online • typically replies in a minute</div>
        </div>
      </div>
      <div class="chat-messages" id="chatMessages">
        <div class="chat-msg bot">👋 Hey! Ask me about pricing, warranty, install time, or whether we service your area.</div>
      </div>
      <div class="chat-quick" id="chatQuick">
        <button data-q="How much for a 2-car garage?">2-car garage price?</button>
        <button data-q="How long does install take?">Install time?</button>
        <button data-q="What's the warranty?">Warranty?</button>
      </div>
      <div class="chat-input">
        <input type="text" id="chatInput" placeholder="Ask anything…" autocomplete="off">
        <button id="chatSend" aria-label="Send"><i class="ph-bold ph-paper-plane-tilt"></i></button>
      </div>
    </div>
    <button class="chat-toggle" id="chatToggle" aria-label="Open AI chat">
      <i class="ph-fill ph-chat-circle-dots chat-icon-open"></i>
      <i class="ph-bold ph-x chat-icon-close"></i>
    </button>
  </div>

  <div class="lightbox" id="lightbox" role="dialog" aria-label="Image viewer">
    <button class="close" id="lightboxClose" aria-label="Close"><i class="ph-bold ph-x"></i></button>
    <img src="" alt="" id="lightboxImg">
  </div>

  <script src="../script.js" defer></script>
  <script src="../_diamond-voice.js" defer></script>
</body>
</html>
'''

CTA_BAND = '''
  <section style="padding-block:0">
    <div class="container">
      <div class="cta-band reveal-scale">
        <span class="eyebrow" style="justify-content:center">Ready to start?</span>
        <h2>Get a <span class="text-grad">price in 60 seconds.</span></h2>
        <p>Free in-home quote, same-day callback, one-day install. That's the whole sales pitch.</p>
        <div class="cluster">
          <a href="../index.html#estimator" class="btn btn-primary btn-lg">Start my estimate <i class="ph-bold ph-arrow-right"></i></a>
          <a href="tel:5035017295" class="btn btn-ghost btn-lg"><i class="ph-fill ph-phone"></i> 503-501-7295</a>
        </div>
      </div>
    </div>
  </section>
'''

def render_area(slug, a, other_areas, services):
    title = a.get('meta_title') or f"Epoxy Floors {a['city']} | Diamond Group"
    desc  = a.get('meta_description') or f"Premium epoxy floors in {a['city']}. One-day install, 10-year warranty. Call 503-501-7295."
    callouts_html = ''.join(f'<li><span class="check"><i class="ph-bold ph-check"></i></span>{esc(c)}</li>' for c in a.get('local_callouts',[]))
    # Pick 6 nearby areas to cross-link
    others = [s for s in other_areas if s != slug][:6]
    others_html = ''.join(
        f'<a href="{o}.html" class="area-pill"><span class="name">{esc(other_areas[o]["city"])}</span><span class="arrow"><i class="ph-bold ph-arrow-up-right"></i></span></a>'
        for o in others
    )
    services_html = ''.join(
        f'''<a href="../services/{slug_s}.html" class="service-card tilt">
          <div class="service-icon"><i class="ph-bold ph-{icon}"></i></div>
          <h3>{esc(data["title"])}</h3>
          <p>{esc(data["sub"])}</p>
          <span class="service-link">Explore {esc(data["title"].lower())} <i class="ph-bold ph-arrow-right"></i></span>
        </a>''' for slug_s, data, icon in services
    )

    return head(title, desc, f'areas/{slug}.html') + f'''
  <section class="page-hero">
    <div class="hero-bg"></div>
    <div class="hero-dot-grid"></div>
    <div class="container reveal-children in">
      <div class="breadcrumb"><a href="../index.html">Home</a> <i class="ph-bold ph-caret-right"></i> <a href="../index.html#areas">Service Areas</a> <i class="ph-bold ph-caret-right"></i> <span>{esc(a['city'])}</span></div>
      <span class="eyebrow" style="justify-content:center">Service area · {esc(a.get('county',''))}</span>
      <h1>{esc(a.get('h1') or f"Epoxy Floors in {a['city']}")}</h1>
      <p class="lead">{esc(a.get('intro_paragraph','')[:180])}…</p>
      <div class="cluster" style="justify-content:center;margin-top:1.5rem">
        <a href="../index.html#estimator" class="btn btn-primary btn-lg">Get {esc(a['city'])} quote <i class="ph-bold ph-arrow-right"></i></a>
        <a href="tel:5035017295" class="btn btn-ghost btn-lg"><i class="ph-fill ph-phone"></i> 503-501-7295</a>
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="split">
        <div class="body reveal">
          <span class="eyebrow">Why {esc(a['city'])}</span>
          <h2>Built for the way <span class="text-grad">{esc(a['city'])}</span> lives.</h2>
          <p class="mt-sm">{esc(a.get('intro_paragraph',''))}</p>
          <ul class="split-list">{callouts_html}</ul>
          <p class="mt-sm"><strong>{esc(a.get('service_list_blurb',''))}</strong></p>
          <a href="../index.html#estimator" class="btn btn-primary mt">{esc(a.get('cta','Start my quote'))} <i class="ph-bold ph-arrow-right"></i></a>
        </div>
        <div class="media reveal-scale">
          <img src="../images/IMG_7861-min-scaled.jpg" alt="Diamond Group epoxy floor installed in {esc(a['city'])}">
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="section-head center reveal">
        <span class="eyebrow">Systems we install in {esc(a['city'])}</span>
        <h2>Every coating, <span class="text-grad">one day.</span></h2>
      </div>
      <div class="services-grid reveal-children">{services_html}</div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="section-head center reveal">
        <span class="eyebrow">Nearby</span>
        <h2>Also installing in <span class="text-grad">these cities.</span></h2>
      </div>
      <div class="areas-grid reveal-children">{others_html}</div>
    </div>
  </section>

  {CTA_BAND}
''' + FOOTER


def render_service(slug, s, other_services, areas):
    title = f"{s['title']} Portland | Diamond Group Epoxy Floors"
    desc  = s.get('meta_description','') or title
    body  = ''.join(f'<p>{esc(p)}</p>' for p in s.get('body_paragraphs',[]))
    feats = ''.join(f'<li><span class="check"><i class="ph-bold ph-check"></i></span>{esc(f)}</li>' for f in s.get('features',[]))
    ideal = ''.join(f'<li><span class="check"><i class="ph-bold ph-check"></i></span>{esc(i)}</li>' for i in s.get('ideal_for',[]))
    faqs  = ''.join(f'<details class="faq-item"><summary>{esc(q["q"])}<span class="icon"><i class="ph-bold ph-plus"></i></span></summary><div class="answer"><p>{esc(q["a"])}</p></div></details>' for q in s.get('faq',[]))
    other_html = ''.join(
        f'''<a href="{slug_o}.html" class="service-card tilt">
          <div class="service-icon"><i class="ph-bold ph-{icon}"></i></div>
          <h3>{esc(data["title"])}</h3>
          <p>{esc(data["sub"])}</p>
          <span class="service-link">Explore <i class="ph-bold ph-arrow-right"></i></span>
        </a>''' for slug_o, data, icon in other_services
    )
    top_areas = ['beaverton','portland','hillsboro','tigard','lake-oswego','west-linn','happy-valley','vancouver-wa']
    areas_html = ''.join(
        f'<a href="../areas/{a}.html" class="area-pill"><span class="name">{esc(areas[a]["city"])}</span><span class="arrow"><i class="ph-bold ph-arrow-up-right"></i></span></a>'
        for a in top_areas if a in areas
    )

    hero_img = {
        'flake-floors':'../images/flakes-floors3.png',
        'metallic-epoxy':'../images/metallic-expoxy4.jpg',
        'quartz-floors':'../images/gallery-5.png',
        'concrete-coatings':'../images/IMG_8748-min-scaled.jpg',
        'grind-seal':'../images/IMG_8754-min-scaled.jpg',
        'solid-color':'../images/gallery-3.png',
        'commercial-industrial':'../images/IMG_6235-min-scaled.jpg',
    }.get(slug, '../images/hero.webp')

    return head(title, desc, f'services/{slug}.html') + f'''
  <section class="page-hero">
    <div class="hero-bg"></div>
    <div class="hero-dot-grid"></div>
    <div class="container reveal-children in">
      <div class="breadcrumb"><a href="../index.html">Home</a> <i class="ph-bold ph-caret-right"></i> <a href="../index.html#services">Services</a> <i class="ph-bold ph-caret-right"></i> <span>{esc(s['title'])}</span></div>
      <span class="eyebrow" style="justify-content:center">Service</span>
      <h1>{esc(s.get('h1') or s['title'])}</h1>
      <p class="lead">{esc(s.get('sub',''))}</p>
      <div class="cluster" style="justify-content:center;margin-top:1.5rem">
        <a href="../index.html#estimator" class="btn btn-primary btn-lg">Get a {esc(s['title'].lower())} quote <i class="ph-bold ph-arrow-right"></i></a>
        <a href="tel:5035017295" class="btn btn-ghost btn-lg"><i class="ph-fill ph-phone"></i> 503-501-7295</a>
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="split">
        <div class="media reveal-scale">
          <img src="{hero_img}" alt="{esc(s['title'])} by Diamond Group">
        </div>
        <div class="body reveal">
          <span class="eyebrow">About this system</span>
          <h2>{esc(s['title'])}, <span class="text-grad">done right.</span></h2>
          {body}
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="split">
        <div class="body reveal">
          <span class="eyebrow">Inside the system</span>
          <h2>What you're <span class="text-grad">getting.</span></h2>
          <ul class="split-list">{feats}</ul>
        </div>
        <div class="body reveal">
          <span class="eyebrow">Where it shines</span>
          <h2>Ideal for <span class="text-grad">these spaces.</span></h2>
          <ul class="split-list">{ideal}</ul>
        </div>
      </div>
    </div>
  </section>

  <section>
    <div class="container container-tight">
      <div class="section-head reveal">
        <span class="eyebrow">FAQ</span>
        <h2>{esc(s['title'])} <span class="text-grad">questions.</span></h2>
      </div>
      <div class="faq-list">{faqs}</div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">Other systems</span>
        <h2>Compare <span class="text-grad">the full lineup.</span></h2>
      </div>
      <div class="services-grid reveal-children">{other_html}</div>
    </div>
  </section>

  <section>
    <div class="container">
      <div class="section-head reveal">
        <span class="eyebrow">Where we install</span>
        <h2>{esc(s['title'])} across <span class="text-grad">the Portland metro.</span></h2>
      </div>
      <div class="areas-grid reveal-children">{areas_html}</div>
    </div>
  </section>

  {CTA_BAND}
''' + FOOTER


SERVICE_ICONS = {
    'flake-floors':'squares-four',
    'metallic-epoxy':'shooting-star',
    'quartz-floors':'diamond',
    'concrete-coatings':'shield-check',
    'grind-seal':'spiral',
    'solid-color':'paint-bucket',
    'commercial-industrial':'factory',
}


def main():
    with open(os.path.join(ROOT, '_copy.json')) as f:
        copy = json.load(f)

    os.makedirs(os.path.join(ROOT,'areas'), exist_ok=True)
    os.makedirs(os.path.join(ROOT,'services'), exist_ok=True)

    # Build area pages
    area_count = 0
    for slug, a in copy['areas'].items():
        services_for_area = [
            (sslug, sdata, SERVICE_ICONS.get(sslug, 'star'))
            for sslug, sdata in list(copy['services'].items())[:6]
        ]
        html_doc = render_area(slug, a, copy['areas'], services_for_area)
        path = os.path.join(ROOT, 'areas', f'{slug}.html')
        with open(path, 'w') as f: f.write(html_doc)
        area_count += 1
        print(f'  area: {slug}')

    # Build service pages
    service_slugs = list(copy['services'].keys())
    svc_count = 0
    for slug, s in copy['services'].items():
        other = [(sl, copy['services'][sl], SERVICE_ICONS.get(sl, 'star')) for sl in service_slugs if sl != slug][:6]
        html_doc = render_service(slug, s, other, copy['areas'])
        path = os.path.join(ROOT, 'services', f'{slug}.html')
        with open(path, 'w') as f: f.write(html_doc)
        svc_count += 1
        print(f'  service: {slug}')

    # Sitemap
    urls = []
    base = 'https://blackboxadvancements.com/diamondgroupepoxy'
    urls.append(f'{base}/')
    for slug in copy['services']: urls.append(f'{base}/services/{slug}.html')
    for slug in copy['areas']:    urls.append(f'{base}/areas/{slug}.html')
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        sm += f'  <url><loc>{u}</loc><changefreq>weekly</changefreq><priority>{"1.0" if u.endswith("/") else "0.8"}</priority></url>\n'
    sm += '</urlset>\n'
    with open(os.path.join(ROOT,'sitemap.xml'),'w') as f: f.write(sm)

    # Robots
    with open(os.path.join(ROOT,'robots.txt'),'w') as f:
        f.write('User-agent: *\nAllow: /\nSitemap: https://blackboxadvancements.com/diamondgroupepoxy/sitemap.xml\n')

    print(f'\nBuilt {area_count} area pages + {svc_count} service pages, plus sitemap + robots.')


if __name__ == '__main__':
    main()
