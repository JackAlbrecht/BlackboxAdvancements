"""Generate one site per business from _data.py + _template.html into /spec/{slug}/index.html."""
import re, sys, colorsys
from pathlib import Path
sys.path.insert(0, str(Path(__file__).parent))
from _data import BUSINESSES
from _industries import INDUSTRIES

ROOT = Path('/sessions/pensive-magical-noether/bb/spec')
TEMPLATE = (ROOT / '_template.html').read_text(encoding='utf-8')

def darken_hex(hex_color, amt=0.18):
    """Return a hex color about `amt` darker (0-1)."""
    h = hex_color.lstrip('#')
    r,g,b = int(h[0:2],16)/255, int(h[2:4],16)/255, int(h[4:6],16)/255
    h2,l2,s2 = colorsys.rgb_to_hls(r,g,b)
    l2 = max(0, l2 - amt)
    r,g,b = colorsys.hls_to_rgb(h2,l2,s2)
    return f"#{int(r*255):02X}{int(g*255):02X}{int(b*255):02X}"

def initials(name):
    parts = re.findall(r'[A-Z][a-zA-Z0-9]*', name)
    if len(parts) >= 2:
        return (parts[0][0] + parts[1][0]).upper()
    if len(name) >= 2:
        return name[:2].upper()
    return name.upper()

def split_name(name):
    """Split for footer two-line treatment."""
    words = name.split()
    if len(words) == 1:
        return words[0], ''
    return words[0], ' '.join(words[1:])

def unsplash(img_id, w=1800, q=80):
    return f"https://images.unsplash.com/photo-{img_id}?w={w}&q={q}"

def render(biz):
    ind = INDUSTRIES[biz['industry']]
    primary = biz['primary']
    primary_dark = darken_hex(primary)
    accent = biz['accent']
    initials_2 = initials(biz['name'])
    name_1, name_2 = split_name(biz['name'])
    phone_tel = '+1' + re.sub(r'\D','', biz['phone'])

    hero_img = unsplash(ind['hero_imgs'][0])
    gallery = [unsplash(i, 1200, 75) for i in ind['gallery_imgs']]
    while len(gallery) < 6:
        gallery.append(unsplash(ind['hero_imgs'][0], 1200, 75))

    headline_a = ind['hero_words'][0].replace(' ','&nbsp;').strip()
    headline_b = ind['hero_words'][1].replace(' ','&nbsp;').strip()

    repls = {
        'BIZ_NAME': biz['name'],
        'BIZ_NAME_FOOTER_1': name_1,
        'BIZ_NAME_FOOTER_2': name_2,
        'BIZ_INITIALS': initials_2,
        'CITY': biz['city'],
        'STATE': biz['state'],
        'PHONE': biz['phone'],
        'PHONE_TEL': phone_tel,
        'EMAIL': biz['email'],
        'HOURS': biz.get('hours','Mon&ndash;Sat 8a&ndash;6p'),
        'YEARS': str(biz['years']),
        'JOBS': f"{biz['jobs']:,}",
        'PRIMARY_COLOR': primary,
        'PRIMARY_COLOR_DARK': primary_dark,
        'ACCENT_COLOR': accent,
        'INDUSTRY_TITLE': ind['title'],
        'INDUSTRY_KEYWORDS': ind['keywords'],
        'INDUSTRY_UNIT': ind['unit'],
        'TAGLINE': ind['tagline'],
        'SERVICES_INTRO': ind['services_intro'],
        'HERO_HEADLINE': headline_a,
        'HERO_HEADLINE_ITALIC': headline_b,
        'HERO_IMAGE': hero_img,
        'CONTACT_BLURB': ind['biz_blurb'],
        'LICENSE_LINE': ind.get('license',''),
    }
    for i, (icon, t, b) in enumerate(ind['services'], start=1):
        repls[f'ICON_{i}'] = icon
        repls[f'SERVICE_{i}_TITLE'] = t
        repls[f'SERVICE_{i}_BODY'] = b
    for i, url in enumerate(gallery[:6], start=1):
        repls[f'GALLERY_{i}'] = url
    for i, (text, name, loc) in enumerate(ind['reviews'], start=1):
        repls[f'REVIEW_{i}_TEXT'] = text
        repls[f'REVIEW_{i}_NAME'] = name
        repls[f'REVIEW_{i}_LOCATION'] = loc

    out = TEMPLATE
    for k, v in repls.items():
        out = out.replace('{{' + k + '}}', str(v))
    return out

def main():
    out_dir = ROOT
    count = 0
    for biz in BUSINESSES:
        site_dir = out_dir / biz['slug']
        site_dir.mkdir(exist_ok=True)
        html = render(biz)
        (site_dir / 'index.html').write_text(html, encoding='utf-8')
        count += 1
    print(f"Generated {count} sites in {out_dir}/")

    # Build an index page listing all generated sites
    index_html = '<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8" /><meta name="viewport" content="width=device-width, initial-scale=1" />'
    index_html += '<title>Spec Sites — Blackbox Advancements</title>'
    index_html += '<style>body{font-family:system-ui,-apple-system,sans-serif;background:#0E0E10;color:#F7F4EE;padding:60px 24px;max-width:1100px;margin:0 auto;line-height:1.5}'
    index_html += 'h1{font-size:48px;margin-bottom:8px;font-weight:900;letter-spacing:-0.02em}'
    index_html += 'p.lead{opacity:0.7;font-size:16px;margin-bottom:50px}'
    index_html += 'h2{margin-top:50px;margin-bottom:18px;font-size:14px;letter-spacing:0.18em;text-transform:uppercase;opacity:0.6;border-top:1px solid #1F1F25;padding-top:30px}'
    index_html += '.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(280px,1fr));gap:14px;margin-bottom:30px}'
    index_html += 'a.card{background:#1A1A1F;padding:18px;border-radius:8px;text-decoration:none;color:inherit;display:block;border:1px solid #2A2A30;transition:border-color 0.2s,transform 0.2s}'
    index_html += 'a.card:hover{border-color:#22c55e;transform:translateY(-2px)}'
    index_html += '.name{font-weight:600;font-size:16px;margin-bottom:4px}'
    index_html += '.meta{font-size:12px;opacity:0.6;letter-spacing:0.08em;text-transform:uppercase}'
    index_html += '</style></head><body>'
    index_html += '<h1>Spec sites <span style="color:#22c55e;font-style:italic;font-weight:400">— ready to pitch.</span></h1>'
    index_html += f'<p class="lead">{count} websites auto-generated for businesses with FB-only presence. Send them the live URL.</p>'

    by_industry = {}
    for biz in BUSINESSES:
        by_industry.setdefault(biz['industry'], []).append(biz)
    for industry, bizes in sorted(by_industry.items()):
        index_html += f'<h2>{INDUSTRIES[industry]["title"]} &mdash; {len(bizes)}</h2>'
        index_html += '<div class="grid">'
        for biz in bizes:
            index_html += f'<a class="card" href="/spec/{biz["slug"]}/" target="_blank"><div class="name">{biz["name"]}</div><div class="meta">{biz["city"]}, {biz["state"]} &middot; {biz["phone"]}</div></a>'
        index_html += '</div>'
    index_html += '</body></html>'
    (out_dir / 'index.html').write_text(index_html, encoding='utf-8')
    print(f"Index: {out_dir}/index.html")

if __name__ == '__main__':
    main()
