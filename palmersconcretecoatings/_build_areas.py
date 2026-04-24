#!/usr/bin/env python3
"""
Generate all 20 Palmer's service-area pages from the AREAS table below.
Also regenerates areas.html (grid of all 20).
Run:  python3 _build_areas.py
"""
import os, html

ROOT = os.path.dirname(os.path.abspath(__file__))

AREAS = [
    # slug, City, neighborhood/area hook, intro sentence, local-specific paragraph, hero image
    {"slug":"boring","name":"Boring","lat":"45.4310","lng":"-122.3753","hero":"garage-epoxy-1.jpg",
     "tagline":"right here at home.",
     "lead":"As a Boring-based contractor we cover every street in Boring and the surrounding Sandy Ridge, Cottrell, and Dover communities.",
     "why":"Our 14480 SE Orient Drive shop is in Boring, so every job within 10 minutes gets the fastest response times.",
     "detail":"Every Boring project gets the same four-step system: diamond grinding, full crack and spall repair, high-build base coat with decorative flake or quartz, and a UV-stable polyaspartic top coat. No acid-etch, no roll-on kits.",
     "callouts":["14480 SE Orient Drive shop — fastest response in town","Cottrell, Dover, and Sandy Ridge garages","Hobby shops + hay barns + 4-car detached garages"],
     "counties":"Clackamas County"},

    {"slug":"sandy","name":"Sandy","lat":"45.3970","lng":"-122.2617","hero":"garage-epoxy-2.jpg",
     "tagline":"for every Sandy garage.",
     "lead":"Eight minutes from our Boring shop. We cover Sandy proper, Bull Run, Brightwood, and the Mt Hood-corridor foothills.",
     "why":"Sandy's freeze-thaw cycles punish cheap coatings. Our polyaspartic system is rated for -40°F to 250°F and holds up to chain-and-salt winters.",
     "detail":"We've done everything from Sandy hobby garages to logging-truck bays out by Marmot Road. If your slab has moisture issues from the Cascade springline, we test for it and mitigate before we coat.",
     "callouts":["Bull Run + Brightwood foothill cabins","Marmot Road shops + logging bays","Sandy River-front property garages"],
     "counties":"Clackamas County"},

    {"slug":"gresham","name":"Gresham","lat":"45.5001","lng":"-122.4302","hero":"garage-epoxy-1.jpg",
     "tagline":"done right.",
     "lead":"From Centennial to Powell Valley, Rockwood to Kelly Creek — we install across every Gresham neighborhood.",
     "why":"Gresham's 1960s-80s housing stock means a lot of moisture-heavy slabs. We diamond-grind every one and mitigate before we ever open a pail.",
     "detail":"Gresham garage floors see everything — PDX-adjacent contractor fleets, suburban two-cars, and the oil-stained 80s originals that haven't been touched in forty years. We bring them all back to showroom.",
     "callouts":["Rockwood, Centennial, Kelly Creek garages","Gresham Station and Historic Downtown shops","Powell Valley + Orient Drive 2- and 3-car installs"],
     "counties":"Multnomah County"},

    {"slug":"damascus","name":"Damascus","lat":"45.4163","lng":"-122.4589","hero":"garage-epoxy-2.jpg",
     "tagline":"made tougher.",
     "lead":"Damascus is rural-meets-suburban, and the garages reflect it — 4-car barns, shop garages, and new-construction 3-car Pulte homes side by side.",
     "why":"Damascus has some of the biggest private shops in the metro. Our polyaspartic system is rated for fleet traffic, jack-stands, and drop-forge abuse.",
     "detail":"We've coated machine shops on Foster Road, hobby garages off Sunnyside, and every size of farm-equipment bay in between. Slab-on-grade or elevated, wet or dry, old or new — we've seen it.",
     "callouts":["Foster Road farm + machine shops","Sunnyside + Damascus Ridge new-construction 3-cars","Barton / Carver workshop garages"],
     "counties":"Clackamas County"},

    {"slug":"happy-valley","name":"Happy Valley","lat":"45.4465","lng":"-122.5122","hero":"garage-epoxy-1.jpg",
     "tagline":"in every Pulte and Toll home.",
     "lead":"Happy Valley is where Palmer's does the most new-construction work. We coat a lot of 3-car and 4-car garages in Scouter's Mountain, Altamont, and Rock Creek.",
     "why":"New slabs look great but still need prep. We diamond-grind every single floor — yes, even the ones poured last month.",
     "detail":"Happy Valley customers care about how the floor matches the kitchen, the cabinets, and the ride parked on it. We bring sample boards, we pour mock-ups, and we let you see it before we commit.",
     "callouts":["Scouter's Mountain and Altamont new-builds","Rock Creek custom-home 4-car installs","142nd Avenue + Sunnyside corridor commercial"],
     "counties":"Clackamas County"},

    {"slug":"clackamas","name":"Clackamas","lat":"45.4097","lng":"-122.5714","hero":"garage-epoxy-2.jpg",
     "tagline":"across every zip.",
     "lead":"Clackamas means Sunnyside, Clackamas Industrial, Jennings Lodge, and everywhere the Clackamas River runs through. We cover it all.",
     "why":"Clackamas has a lot of the metro's commercial and light-industrial slabs. Our 5-year commercial warranty is in writing, and our crews work off-hours if you need it.",
     "detail":"From a warehouse on 82nd to a car-collector's personal museum in Mount Scott Acres, Clackamas is where Palmer's mixes residential and commercial every single week.",
     "callouts":["Clackamas Industrial off 82nd","Mount Scott Acres collector garages","Sunnyside Road + Fred Meyer-corridor retail"],
     "counties":"Clackamas County"},

    {"slug":"portland","name":"Portland","lat":"45.5152","lng":"-122.6784","hero":"garage-epoxy-1.jpg",
     "tagline":"all five quadrants.",
     "lead":"Yes we come to Portland. SE, NE, N, SW, and yes even NW. From Laurelhurst carriage houses to Pearl District basement bars, we've coated every kind of Portland slab.",
     "why":"Portland's old slabs are the hardest in the metro — 1920s garages, 1950s basements, 70s cracked drives. We fix them all before we coat them.",
     "detail":"We've done Portland craftsman garages in Alberta, industrial shops in the Central Eastside, and polished-concrete floors in NW lofts. Every install gets the same four-step system.",
     "callouts":["Laurelhurst + Alberta craftsman garages","Central Eastside industrial shops","Pearl District + NW Portland lofts and basements"],
     "counties":"Multnomah County"},

    {"slug":"oregon-city","name":"Oregon City","lat":"45.3573","lng":"-122.6068","hero":"garage-epoxy-2.jpg",
     "tagline":"from the bluff to the river.",
     "lead":"Oregon City has everything from Hilltop ranches to South End new-construction to riverfront historics. Every one gets the Palmer's treatment.",
     "why":"Oregon City slabs run the gamut — some are 120 years old. We've seen rebar you could shake hands with, and we know how to coat around it.",
     "detail":"We work the Hilltop, the South End, Beavercreek Road, and down by the river. If it's got concrete, we can coat it.",
     "callouts":["Hilltop ranch homes and 2-car garages","South End + Park Place new-build 3-cars","Beavercreek Road corridor shops"],
     "counties":"Clackamas County"},

    {"slug":"milwaukie","name":"Milwaukie","lat":"45.4454","lng":"-122.6412","hero":"garage-epoxy-1.jpg",
     "tagline":"for every Island Station bungalow.",
     "lead":"Milwaukie is one of our highest-volume areas. From Island Station to Ardenwald to Lake Road commercial, we're here weekly.",
     "why":"Milwaukie's craftsman and ranch housing stock is famously moisture-heavy. We vapor-test every old-growth slab and mitigate before we ever prime.",
     "detail":"Ardenwald garages, Lake Road shops, Sellwood-adjacent bungalow basements — we've coated them all. We work quickly, we work clean, and we're gone by end of day.",
     "callouts":["Island Station + Ardenwald bungalow garages","Lake Road + McLoughlin commercial","Sellwood-adjacent basement floors"],
     "counties":"Clackamas County"},

    {"slug":"estacada","name":"Estacada","lat":"45.2887","lng":"-122.3356","hero":"garage-epoxy-2.jpg",
     "tagline":"out in the Clackamas River Valley.",
     "lead":"Estacada means rural garages, working shops, and river-property slabs. We drive the extra miles and we never charge for it.",
     "why":"Rural Estacada slabs see horses, ATVs, chainsaws, and mud. The polyaspartic topcoat we use is rated for every one of them.",
     "detail":"From river-front cabin garages to working-shop floors off Highway 211, Estacada is where we do some of our biggest and best installs.",
     "callouts":["Clackamas River property garages + sheds","Highway 211 working shops and barns","Rural 4+ car garages and hobby buildings"],
     "counties":"Clackamas County"},

    # ===== NEW 10 =====
    {"slug":"troutdale","name":"Troutdale","lat":"45.5393","lng":"-122.3873","hero":"garage-epoxy-1.jpg",
     "tagline":"gateway-to-the-Gorge garages.",
     "lead":"Troutdale is on our regular route — 15 minutes from the Boring shop, the first stop before the Gorge. We install throughout Troutdale proper, McMenamins Edgefield-adjacent neighborhoods, and up Crown Point Highway.",
     "why":"Troutdale gets wet. Really wet. The Sandy River moisture and the I-84 salt-spray corridor mean slabs need real mitigation, not a sprayed-on sealer. We diamond-grind, test for moisture, and coat only when the slab passes.",
     "detail":"We've done Troutdale 2-car garages in Beaver Creek, 3-car shops off Sweetbriar, and a handful of commercial floors near the outlets. Every install is one day, one crew, one written warranty.",
     "callouts":["Sweetbriar + Kibling Avenue 2- and 3-car garages","Crown Point Highway custom-home bays","Troutdale outlet + retail commercial slabs"],
     "counties":"Multnomah County"},

    {"slug":"fairview","name":"Fairview","lat":"45.5426","lng":"-122.4362","hero":"garage-epoxy-2.jpg",
     "tagline":"on the Columbia's edge.",
     "lead":"Fairview is small, tight, and we know every neighborhood in it. Halsey Street, Fairview Lake, and the new-construction waves east of 223rd all get the same treatment.",
     "why":"Fairview's newer housing stock means newer slabs — but that doesn't mean they don't need prep. We grind every one, we mitigate moisture, and we coat with polyaspartic rated for PNW humidity.",
     "detail":"Fairview Lake waterfront garages, Halsey craftsman 2-cars, and the row of new-build 3-car Toll Brothers jobs north of Multnomah Greenway all sit in our regular Troutdale-Gresham-Fairview loop.",
     "callouts":["Fairview Lake waterfront garage floors","Halsey Street craftsman garages","Multnomah Greenway new-construction 3-cars"],
     "counties":"Multnomah County"},

    {"slug":"wood-village","name":"Wood Village","lat":"45.5343","lng":"-122.4187","hero":"garage-epoxy-1.jpg",
     "tagline":"tight-knit, fast-turnaround.",
     "lead":"Wood Village is one of the smallest cities in the metro, but we install there often — typically bundled with Gresham and Troutdale routes. Town Center Boulevard on down to Wood Village Boulevard.",
     "why":"Tight-knit neighborhoods mean referrals spread fast. Every Wood Village job we do is one of our best because everyone on the block ends up seeing it.",
     "detail":"We've coated Wood Village 2-car garages, a handful of sunny-south-facing basement floors, and a small commercial bay off Halsey. Same one-day install, same written warranty.",
     "callouts":["Town Center Boulevard residential garages","Wood Village Boulevard shops + bays","Sunny-south basement-floor conversions"],
     "counties":"Multnomah County"},

    {"slug":"corbett","name":"Corbett","lat":"45.5087","lng":"-122.2432","hero":"garage-epoxy-2.jpg",
     "tagline":"out on the Gorge rim.",
     "lead":"Corbett is a drive for most contractors — for us it's a 25-minute haul and we do it gladly. Crown Point, Larch Mountain, Historic Columbia River Highway, we cover it all.",
     "why":"Corbett's basalt slabs and river-valley microclimate mean moisture is a constant. Our mitigating primer gets under every floor we coat up there, and our polyaspartic topcoat handles the damp year-round.",
     "detail":"We've done Corbett ridgeline view-home garages, barn slabs out near Larch Mountain, and the occasional vineyard building on the way to Dabney State Park. The views are unreal and so are the floors.",
     "callouts":["Crown Point + Larch Mountain ridge garages","Historic Columbia River Highway property slabs","Vineyard outbuildings + barn floors"],
     "counties":"Multnomah County"},

    {"slug":"beavercreek","name":"Beavercreek","lat":"45.3031","lng":"-122.5481","hero":"garage-epoxy-1.jpg",
     "tagline":"farm-country garages + shops.",
     "lead":"Beavercreek is where Clackamas County goes rural — big shops, hay barns, horse-property garages, and custom-home 4-car bays. We love the work out there.",
     "why":"Rural Beavercreek slabs are the biggest we install. Some of our favorite jobs this year were 1,800-sqft shop floors on Beavercreek Road.",
     "detail":"We coat farm shops, equestrian barn floors, RV bays, and the occasional 5-car collector garage tucked up a long gravel drive. Polyaspartic rated for livestock traffic, slip-rated, and warranty-backed.",
     "callouts":["Beavercreek Road farm + machine shops","Equestrian barn + tack-room floors","Custom-home 4- and 5-car collector garages"],
     "counties":"Clackamas County"},

    {"slug":"eagle-creek","name":"Eagle Creek","lat":"45.3401","lng":"-122.3484","hero":"garage-epoxy-2.jpg",
     "tagline":"deep in the foothills.",
     "lead":"Eagle Creek sits between Estacada and Boring, so we're there almost weekly. From Currinsville to Dover and all the way up George Road, we install every kind of garage and shop.",
     "why":"Eagle Creek properties are often on well water with higher mineral content — we account for it in the base coat prep so efflorescence doesn't telegraph through the finish.",
     "detail":"Working-shop floors, old barn conversions, 3-car new-build garages — Eagle Creek sees it all, and so do we.",
     "callouts":["Currinsville + Dover foothill garages","George Road farm-property shops","Eagle Fern Park-adjacent cabin and outbuilding floors"],
     "counties":"Clackamas County"},

    {"slug":"mulino","name":"Mulino","lat":"45.2201","lng":"-122.5792","hero":"garage-epoxy-1.jpg",
     "tagline":"south of Oregon City.",
     "lead":"Mulino is quiet, rural, and a lot of our farm work happens there. We cover Mulino proper, Union Mills, and the back roads off Highway 213.",
     "why":"Mulino farm slabs take a beating — tractor tires, horse traffic, welding spatter. Our polyaspartic topcoat is impact- and UV-rated for all of it.",
     "detail":"We've coated Mulino hay-barn floors, horse-arena entry slabs, shop floors off Highway 213, and a surprising number of custom-home 3-car garages tucked back in the hills.",
     "callouts":["Highway 213 farm + welding shop floors","Horse-arena entry and tack-room slabs","Custom-home 3-car garages in the Mulino hills"],
     "counties":"Clackamas County"},

    {"slug":"welches","name":"Welches","lat":"45.3451","lng":"-121.9553","hero":"garage-epoxy-2.jpg",
     "tagline":"Mt Hood Village floors.",
     "lead":"Welches is our favorite Mt Hood job site. Vacation cabins, full-time chalets, and the occasional resort-adjacent shop all need tough floors — we bring them.",
     "why":"Mt Hood freeze-thaw is brutal on concrete. Our polyaspartic system is rated down to -40°F and doesn't crack when the cabin goes unheated in January.",
     "detail":"We've done Welches cabin garages, Mt Hood Village full-time home shops, and the odd vacation-rental basement conversion. Same one-day install, same 10-year warranty.",
     "callouts":["Welches cabin + chalet garages","Mt Hood Village full-time-home shops","Vacation-rental basement conversions"],
     "counties":"Clackamas County (Mt Hood corridor)"},

    {"slug":"rhododendron","name":"Rhododendron","lat":"45.3226","lng":"-121.8824","hero":"garage-epoxy-1.jpg",
     "tagline":"up the mountain.",
     "lead":"Rhododendron is a 50-minute drive from the Boring shop, but we do it — often. Cabin garages, cabin shops, and the rare full-time-home slab all get the same attention as a Portland job.",
     "why":"Cabin floors need to survive months of zero heat. Our polyaspartic doesn't brittle-fail at low temps and it handles ski-boot salt, snow-melt, and wet gear with no problem.",
     "detail":"We've coated Zigzag-adjacent cabin garages, mid-mountain A-frame shops, and a handful of higher-elevation riverfront garages. If it's on the mountain, we'll drive it.",
     "callouts":["Zigzag + Rhododendron cabin garages","Mid-mountain A-frame shops","Ski-and-board household mudroom conversions"],
     "counties":"Clackamas County (Mt Hood corridor)"},

    {"slug":"government-camp","name":"Government Camp","lat":"45.3009","lng":"-121.7506","hero":"garage-epoxy-2.jpg",
     "tagline":"at the summit.",
     "lead":"Yes we drive to Government Camp. Resort-adjacent cabins, full-time homes, and the occasional Mt Hood Skibowl service floor. We bring the full system, the full crew, and the full warranty.",
     "why":"Government Camp sees 300+ inches of snow a year. The ski-boot salt, the snow-melt, and the single-digit overnight temps will destroy a bad coating in one season. Ours holds up for twenty.",
     "detail":"Cabin garages, service-shop bays, ski-storage mudrooms — if it's above 4,000 feet and it's concrete, we can coat it. Yes, even in October.",
     "callouts":["Ski-cabin garages + mudroom conversions","Skibowl + Timberline-adjacent service floors","Summit-elevation full-time-home shops"],
     "counties":"Clackamas County (Mt Hood summit)"},
]


def esc(s): return html.escape(s or '')

def area_page(a):
    title = f"Concrete Coatings in {a['name']}, OR | Palmer's Concrete Coatings"
    desc = f"Professional concrete coatings, garage floor epoxy, and sealing in {a['name']}, Oregon. 14+ years experience, OR CCB #250294, free ballpark estimate. Call 503-766-9199."
    callouts_html = ''.join(f'<li>{esc(c)}</li>' for c in a['callouts'])

    return f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>{esc(title)}</title>
<meta name="description" content="{esc(desc)}" />
<meta name="keywords" content="concrete coatings {esc(a['name'])} OR, garage floor epoxy {esc(a['name'])}, polyaspartic {esc(a['name'])}, epoxy floor {esc(a['name'])} Oregon" />
<link rel="canonical" href="https://blackboxadvancements.com/palmersconcretecoatings/areas/{a['slug']}.html" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="icon" type="image/svg+xml" href="/palmersconcretecoatings/images/favicon.svg" />
<link rel="stylesheet" href="/palmersconcretecoatings/style.css" />
<script type="application/ld+json">{{"@context":"https://schema.org","@type":"LocalBusiness","name":"Palmer's Concrete Coatings - {esc(a['name'])}","telephone":"+1-503-766-9199","url":"https://blackboxadvancements.com/palmersconcretecoatings/areas/{a['slug']}.html","image":"https://blackboxadvancements.com/palmersconcretecoatings/images/{a['hero']}","description":"Concrete coatings, garage floor epoxy, and sealing in {esc(a['name'])}, OR. Licensed OR CCB # 250294.","address":{{"@type":"PostalAddress","addressLocality":"{esc(a['name'])}","addressRegion":"OR","addressCountry":"US"}},"geo":{{"@type":"GeoCoordinates","latitude":"{a['lat']}","longitude":"{a['lng']}"}},"areaServed":{{"@type":"City","name":"{esc(a['name'])}"}}}}</script>
</head>
<body>
<div class="scroll-bar" aria-hidden="true"><div></div></div>
{{TOPBAR}}
{{HEADER_AREAS_ACTIVE}}

<section class="page-head">
  <div class="page-head-img" style="background-image:url('/palmersconcretecoatings/images/{a['hero']}')"></div>
  <div class="wrap">
    <div class="crumb"><a href="/palmersconcretecoatings/">Home</a> &rsaquo; <a href="/palmersconcretecoatings/areas.html">Service Areas</a> &rsaquo; {esc(a['name'])}</div>
    <h1>Concrete Coatings in <span class="italic">{esc(a['name'])}.</span></h1>
    <p class="lead">{esc(a['tagline'])} {esc(a['lead'])}</p>
    <div class="page-head-meta">
      <span class="mono-tag">{esc(a['counties'])}</span>
      <span class="mono-tag">OR CCB # 250294</span>
      <span class="mono-tag">Free estimate — 503-766-9199</span>
    </div>
  </div>
</section>

<section class="section"><div class="prose" data-reveal>
  <h2>Why {esc(a['name'])} homes <span class="italic">choose us.</span></h2>
  <p>{esc(a['why'])}</p>
  <p>{esc(a['detail'])}</p>
  <h3 style="margin-top:1.5em">What we see most in {esc(a['name'])}:</h3>
  <ul>{callouts_html}</ul>

  <h2 style="margin-top:1.4em">Services in {esc(a['name'])}.</h2>
  <ul>
    <li><a href="/palmersconcretecoatings/services/garage-floor-epoxy.html">Garage Floor Epoxy</a> — 1 to 5 car garages</li>
    <li><a href="/palmersconcretecoatings/services/epoxy-floor-coating.html">Epoxy Floor Coating</a> — basements, shops, retail</li>
    <li><a href="/palmersconcretecoatings/services/concrete-floor-install.html">Concrete Floor Installation &amp; Coating</a></li>
    <li><a href="/palmersconcretecoatings/services/concrete-staining.html">Concrete Staining</a></li>
    <li><a href="/palmersconcretecoatings/services/concrete-coloring.html">Concrete Coloring</a></li>
    <li><a href="/palmersconcretecoatings/services/seal-coating.html">Seal Coating</a></li>
  </ul>
</div></section>

<section class="section section-cream"><div class="wrap">
  <div class="callout" data-label="Get a {esc(a['name'])} estimate today">
    <p>Free, no-pressure walkthrough anywhere in {esc(a['name'])}. We arrive when we say we will. Call <a href="tel:+15037669199"><b>503-766-9199</b></a> or send a photo of your slab to <a href="mailto:palmersconcretecoatings@gmail.com"><b>palmersconcretecoatings@gmail.com</b></a>.</p>
    <a href="/palmersconcretecoatings/contact.html" class="callout-cta">Start my {esc(a['name'])} estimate <span class="arrow">&rarr;</span></a>
  </div>
</div></section>

<section class="section"><div class="wrap">
  <h2 class="section-title">Nearby <span class="italic">service areas.</span></h2>
  <div class="area-grid">{{AREA_CHIPS}}</div>
</div></section>

{{FOOTER}}
<div class="mobile-cta"><span>Free ballpark today?</span><a href="tel:+15037669199" class="m-phone">&#9742; Call</a></div>
<script src="/palmersconcretecoatings/script.js" defer></script>
</body>
</html>
'''


TOPBAR = '''<div class="topbar"><div class="row">
  <div class="tb-left">
    <span><span class="tb-dot"></span>Boring, OR</span>
    <span><span class="tb-dot"></span>Mon-Fri 7a-7p</span>
    <span><span class="tb-dot"></span>OR CCB # 250294</span>
  </div>
  <a href="tel:+15037669199" class="tb-phone">&#9742; 503-766-9199</a>
</div></div>'''


def header(active_page):
    """active_page in {home, services, gallery, areas, about}"""
    def cls(p): return ' class="active"' if p == active_page else ''
    # Build a dropdown for Service Areas listing all 20
    dd_items = ''.join(
        f'<a href="/palmersconcretecoatings/areas/{a["slug"]}.html" role="menuitem">{esc(a["name"])}</a>'
        for a in AREAS
    )
    return f'''<header class="site"><div class="nav-row">
  <a href="/palmersconcretecoatings/" class="brand">
    <span class="brand-mark"><img src="/palmersconcretecoatings/images/palmer-logo.svg" alt="Palmer's logo" /></span>
    <span class="brand-type"><span class="big">Palmer's Concrete</span><span class="small">Coatings &middot; Boring, OR</span></span>
  </a>
  <button class="nav-toggle" data-menu-toggle aria-expanded="false">Menu</button>
  <nav class="nav-links" data-nav-links>
    <a href="/palmersconcretecoatings/"{cls("home")}>Home</a>
    <a href="/palmersconcretecoatings/services.html"{cls("services")}>Services</a>
    <a href="/palmersconcretecoatings/gallery.html"{cls("gallery")}>Gallery</a>
    <div class="nav-dd" data-dd>
      <button class="nav-dd-btn{' active' if active_page == 'areas' else ''}" data-dd-toggle aria-expanded="false" aria-haspopup="true">
        Service Areas
        <svg class="nav-dd-caret" width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true"><path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <div class="nav-dd-panel" data-dd-panel role="menu">
        <div class="nav-dd-head">
          <span class="nav-dd-eyebrow">20 cities · Portland metro + Mt Hood</span>
          <a href="/palmersconcretecoatings/areas.html" class="nav-dd-all">View all &rarr;</a>
        </div>
        <div class="nav-dd-grid">{dd_items}</div>
      </div>
    </div>
    <a href="/palmersconcretecoatings/about.html"{cls("about")}>About</a>
    <a href="/palmersconcretecoatings/contact.html" class="nav-cta">Free Estimate <span class="arrow">&rarr;</span></a>
  </nav>
</div></header>'''


def footer():
    # Top 6 areas in footer (Boring, Sandy, Gresham, Damascus, Happy Valley, Portland)
    return '''<footer><div class="wrap-wide">
<div class="foot-grid">
<div><div class="foot-brand">Palmer's<br><span class="italic">Coatings.</span></div><p class="foot-blurb">Boring, Oregon's expert concrete coating contractor. Garage epoxy, polyaspartic, staining, and sealing across the Portland metro.</p></div>
<div><h5>Services</h5><ul><li><a href="/palmersconcretecoatings/services/garage-floor-epoxy.html">Garage Floor Epoxy</a></li><li><a href="/palmersconcretecoatings/services/epoxy-floor-coating.html">Epoxy Floor Coating</a></li><li><a href="/palmersconcretecoatings/services/concrete-floor-install.html">Floor Installation</a></li><li><a href="/palmersconcretecoatings/services/concrete-staining.html">Concrete Staining</a></li><li><a href="/palmersconcretecoatings/services/concrete-coloring.html">Concrete Coloring</a></li><li><a href="/palmersconcretecoatings/services/seal-coating.html">Seal Coating</a></li></ul></div>
<div><h5>Service Areas</h5><ul><li><a href="/palmersconcretecoatings/areas/boring.html">Boring</a></li><li><a href="/palmersconcretecoatings/areas/sandy.html">Sandy</a></li><li><a href="/palmersconcretecoatings/areas/gresham.html">Gresham</a></li><li><a href="/palmersconcretecoatings/areas/happy-valley.html">Happy Valley</a></li><li><a href="/palmersconcretecoatings/areas/portland.html">Portland</a></li><li><a href="/palmersconcretecoatings/areas.html">All 20 cities &rarr;</a></li></ul></div>
<div><h5>Company</h5><ul><li><a href="/palmersconcretecoatings/about.html">About</a></li><li><a href="/palmersconcretecoatings/gallery.html">Gallery</a></li><li><a href="/palmersconcretecoatings/contact.html">Contact</a></li><li><a href="tel:+15037669199">503-766-9199</a></li><li>14480 SE Orient Dr.<br>Boring, OR 97009</li></ul></div>
</div>
<div class="foot-legal"><div>&copy; <span data-year>2026</span> Palmer's Concrete Coatings &middot; All rights reserved</div><div>OR CCB # 250294 &middot; Licensed &amp; Insured</div></div>
<div class="foot-credit">Website designed &amp; built by <a href="https://blackboxadvancements.com" target="_blank" rel="noopener">Blackbox Advancements</a></div>
</div></footer>'''


def nearby_chips(current_slug):
    """Return 6 random-ish nearby areas (skip current)."""
    items = [a for a in AREAS if a['slug'] != current_slug][:6]
    return ''.join(f'<a class="area-chip" href="/palmersconcretecoatings/areas/{a["slug"]}.html">{esc(a["name"])}</a>' for a in items)


def build_area_pages():
    os.makedirs(os.path.join(ROOT, 'areas'), exist_ok=True)
    for a in AREAS:
        doc = area_page(a)
        doc = doc.replace('{TOPBAR}', TOPBAR)
        doc = doc.replace('{HEADER_AREAS_ACTIVE}', header('areas'))
        doc = doc.replace('{FOOTER}', footer())
        # nearby chips: exclude self, take first 6 others
        other = [x for x in AREAS if x['slug'] != a['slug']][:8]
        chips = ''.join(f'<a class="area-chip" href="/palmersconcretecoatings/areas/{x["slug"]}.html">{esc(x["name"])}</a>' for x in other)
        doc = doc.replace('{AREA_CHIPS}', chips)
        path = os.path.join(ROOT, 'areas', f'{a["slug"]}.html')
        with open(path, 'w') as f: f.write(doc)
        print(f'  wrote {path}')


def build_areas_index():
    chips = ''.join(
        f'<a class="area-card" href="/palmersconcretecoatings/areas/{a["slug"]}.html" data-reveal>'
        f'<span class="area-card-name">{esc(a["name"])}</span>'
        f'<span class="area-card-county">{esc(a["counties"])}</span>'
        f'<span class="area-card-arrow" aria-hidden="true">&rarr;</span></a>'
        for a in AREAS
    )
    html_doc = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>20 Service Areas | Palmer's Concrete Coatings - Portland Metro + Mt Hood</title>
<meta name="description" content="Concrete coating service across 20 Portland-metro + Mt Hood cities: Boring, Sandy, Gresham, Damascus, Happy Valley, Clackamas, Portland, Troutdale, Corbett, Welches and more." />
<meta name="keywords" content="concrete coating service areas Oregon, Portland metro epoxy contractor, Mt Hood garage floor" />
<link rel="canonical" href="https://blackboxadvancements.com/palmersconcretecoatings/areas.html" />
<link rel="preconnect" href="https://fonts.googleapis.com" />
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
<link rel="icon" type="image/svg+xml" href="/palmersconcretecoatings/images/favicon.svg" />
<link rel="stylesheet" href="/palmersconcretecoatings/style.css" />
</head>
<body>
<div class="scroll-bar" aria-hidden="true"><div></div></div>
{TOPBAR}
{header('areas')}

<section class="page-head">
  <div class="page-head-img" style="background-image:url('/palmersconcretecoatings/images/garage-epoxy-2.jpg')"></div>
  <div class="wrap">
    <div class="crumb"><a href="/palmersconcretecoatings/">Home</a> &rsaquo; Service Areas</div>
    <h1>20 cities. <span class="italic">One standard.</span></h1>
    <p class="lead">Based in Boring, serving the Portland metro from the Columbia Gorge down to Mulino, and up Highway 26 to Mt Hood summit. Free on-site walkthrough in every one.</p>
    <div class="page-head-meta">
      <span class="mono-tag">Clackamas &middot; Multnomah Counties</span>
      <span class="mono-tag">Portland Metro + Mt Hood Corridor</span>
      <span class="mono-tag">Free estimate — 503-766-9199</span>
    </div>
  </div>
</section>

<section class="section"><div class="wrap-wide">
  <div class="areas-masonry">{chips}</div>
</div></section>

<section class="section section-cream"><div class="wrap">
<div class="callout" data-label="Not in the list?">
<p>We occasionally travel farther for the right project — shops in Molalla, farm properties out toward Hood River, commercial jobs anywhere in the region. Call 503-766-9199 and ask.</p>
</div>
</div></section>

{footer()}
<div class="mobile-cta"><span>Free ballpark today?</span><a href="tel:+15037669199" class="m-phone">&#9742; Call</a></div>
<script src="/palmersconcretecoatings/script.js" defer></script>
</body>
</html>
'''
    path = os.path.join(ROOT, 'areas.html')
    with open(path, 'w') as f: f.write(html_doc)
    print(f'  wrote {path}')


def build_sitemap():
    urls = ['https://blackboxadvancements.com/palmersconcretecoatings/']
    for p in ['services.html', 'gallery.html', 'areas.html', 'about.html', 'contact.html']:
        urls.append(f'https://blackboxadvancements.com/palmersconcretecoatings/{p}')
    for s in ['garage-floor-epoxy','epoxy-floor-coating','concrete-floor-install','concrete-staining','concrete-coloring','seal-coating']:
        urls.append(f'https://blackboxadvancements.com/palmersconcretecoatings/services/{s}.html')
    for a in AREAS:
        urls.append(f'https://blackboxadvancements.com/palmersconcretecoatings/areas/{a["slug"]}.html')
    sm = '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
    for u in urls:
        pri = "1.0" if u.endswith('/') else "0.8"
        sm += f'  <url><loc>{u}</loc><changefreq>weekly</changefreq><priority>{pri}</priority></url>\n'
    sm += '</urlset>\n'
    with open(os.path.join(ROOT, 'sitemap.xml'), 'w') as f: f.write(sm)
    print(f'  wrote sitemap ({len(urls)} urls)')


def update_existing_page_nav(path, active_page):
    """Rewrite an existing HTML file's <header class="site">…</header> block with the new nav (dropdown)."""
    with open(path, 'r') as f: src = f.read()
    new_header = header(active_page)
    import re
    # Replace everything between <header class="site"> and </header>
    pattern = re.compile(r'<header class="site">.*?</header>', re.DOTALL)
    if pattern.search(src):
        src = pattern.sub(new_header, src, count=1)
        with open(path, 'w') as f: f.write(src)
        print(f'  updated nav in {path}')


def update_all_existing_pages():
    # Pages whose nav we need to rewrite
    mapping = {
        'index.html': 'home',
        'services.html': 'services',
        'gallery.html': 'gallery',
        'about.html': 'about',
        'contact.html': 'about',  # highlight nothing specific
    }
    for fname, active in mapping.items():
        p = os.path.join(ROOT, fname)
        if os.path.exists(p):
            update_existing_page_nav(p, active)
    # Service sub-pages
    svc_dir = os.path.join(ROOT, 'services')
    if os.path.isdir(svc_dir):
        for f in os.listdir(svc_dir):
            if f.endswith('.html'):
                update_existing_page_nav(os.path.join(svc_dir, f), 'services')


if __name__ == '__main__':
    print('Building area pages…')
    build_area_pages()
    print('\nBuilding areas index (areas.html)…')
    build_areas_index()
    print('\nUpdating nav on existing pages…')
    update_all_existing_pages()
    print('\nBuilding sitemap…')
    build_sitemap()
    print(f'\nDone. {len(AREAS)} area pages built.')
