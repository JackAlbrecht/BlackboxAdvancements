#!/usr/bin/env node
// Batched Phase 2: generates ONE intent prefix per run.
// Usage: node _seo-blast-batch.js best | node _seo-blast-batch.js affordable | etc.
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const DOMAIN = 'https://blackboxadvancements.com';
const EMAIL = 'hello@blackboxadvancements.com';
const ss = (slug, state) => slug.endsWith('-' + state.toLowerCase()) ? slug : slug + '-' + state.toLowerCase();
const BATCH = process.argv[2];
if (!BATCH) { console.error('Usage: node _seo-blast-batch.js <best|affordable|top|professional|industry-top|industry-best>'); process.exit(1); }

// Re-load Phase 1 cities
const PHASE1 = fs.readFileSync(path.join(ROOT,'_seo-blast.js'),'utf8');
const cityCode = PHASE1.match(/const WHATCOM[\s\S]*?cityMap\.has[\s\S]*?Array\.from\(cityMap\.values\(\)\);/)[0];
const tmpPath = path.join(ROOT,'_tmp-c.js');
fs.writeFileSync(tmpPath, cityCode + '\nmodule.exports = ALL_CITIES;');
const ALL_CITIES = require(tmpPath);
fs.unlinkSync(tmpPath);
console.log(`Loaded ${ALL_CITIES.length} cities`);

const SERVICES = [
  ['web-design','Web Design','web design'],['website-design','Website Design','website design'],['web-development','Web Development','web development'],['custom-website-development','Custom Website Development','custom website development'],['landing-page-design','Landing Page Design','landing page design'],['ecommerce-website-design','E-Commerce Website Design','e-commerce website design'],['shopify-development','Shopify Development','Shopify development'],['wordpress-development','WordPress Development','WordPress development'],['mobile-app-development','Mobile App Development','mobile app development'],['mobile-first-web-design','Mobile-First Web Design','mobile-first web design'],['seo-services','SEO Services','SEO services'],['local-seo','Local SEO','local SEO'],['programmatic-seo','Programmatic SEO','programmatic SEO'],['technical-seo','Technical SEO','technical SEO'],['google-business-profile-optimization','Google Business Profile Optimization','Google Business Profile optimization'],['google-ads-management','Google Ads Management','Google Ads management'],['facebook-ads-management','Facebook Ads Management','Facebook ads management'],['instagram-ads','Instagram Ads','Instagram ads'],['ppc-advertising','PPC Advertising','PPC advertising'],['ai-automation','AI Automation','AI automation'],['ai-agents','AI Agents','AI agents'],['ai-phone-callers','AI Phone Callers','AI phone callers'],['business-process-automation','Business Process Automation','business process automation'],['n8n-workflow-automation','n8n Workflow Automation','n8n workflow automation'],['crm-development','CRM Development','CRM development'],['lead-generation-services','Lead Generation Services','lead generation services'],['sales-funnel-design','Sales Funnel Design','sales funnel design'],['conversion-rate-optimization','Conversion Rate Optimization','conversion rate optimization'],['branding-services','Branding Services','branding services'],['logo-design','Logo Design','logo design'],['copywriting-services','Copywriting Services','copywriting services'],['email-marketing-automation','Email Marketing Automation','email marketing automation'],['sms-marketing-automation','SMS Marketing Automation','SMS marketing automation'],['geo-optimization','GEO Optimization','GEO optimization'],['chatgpt-search-optimization','ChatGPT Search Optimization','ChatGPT search optimization'],
];
const INDUSTRIES = [
  ['hvac','HVAC','HVAC company','HVAC companies'],['plumber','Plumber','plumber','plumbers'],['electrician','Electrician','electrician','electricians'],['roofing','Roofing','roofing company','roofing companies'],['general-contractor','General Contractor','general contractor','general contractors'],['landscaper','Landscaper','landscaper','landscapers'],['painter','Painter','painting company','painting companies'],['pest-control','Pest Control','pest control company','pest control companies'],['restaurant','Restaurant','restaurant','restaurants'],['gym','Gym','gym','gyms'],['dentist','Dentist','dental practice','dental practices'],['lawyer','Lawyer','law firm','law firms'],['realtor','Realtor','real estate agent','real estate agents'],['salon','Salon','salon','salons'],['auto-repair','Auto Repair','auto repair shop','auto repair shops'],['photographer','Photographer','photographer','photographers'],['fitness-coach','Fitness Coach','fitness coach','fitness coaches'],['chiropractor','Chiropractor','chiropractor','chiropractors'],['veterinarian','Veterinarian','veterinary clinic','veterinary clinics'],['daycare','Daycare','daycare','daycares'],['accountant','Accountant','accounting firm','accounting firms'],['financial-advisor','Financial Advisor','financial advisor','financial advisors'],['insurance-agent','Insurance Agent','insurance agency','insurance agencies'],['mortgage-broker','Mortgage Broker','mortgage broker','mortgage brokers'],['locksmith','Locksmith','locksmith','locksmiths'],['cleaning-service','Cleaning Service','cleaning company','cleaning companies'],['tutor','Tutor','tutoring service','tutoring services'],['coffee-shop','Coffee Shop','coffee shop','coffee shops'],['bakery','Bakery','bakery','bakeries'],['dance-studio','Dance Studio','dance studio','dance studios'],
];

const HEAD = (title,desc,kw,canon)=>`<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/><title>${title}</title><meta name="description" content="${desc}"/><meta name="keywords" content="${kw}"/><link rel="canonical" href="${canon}"/><meta property="og:title" content="${title}"/><meta property="og:description" content="${desc}"/><meta property="og:type" content="website"/><meta property="og:url" content="${canon}"/><link rel="icon" href="/assets/favicon.svg" type="image/svg+xml"/><link rel="preconnect" href="https://fonts.googleapis.com"/><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin/><link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet"/><link rel="stylesheet" href="/style.css"/>`;
const HDR = `<header class="site-header"><div class="container navbar"><a class="brand" href="/"><img src="/assets/logo.svg" alt="Blackbox Advancements"/></a><nav class="nav-links" data-nav-links><a href="/services.html">Services</a><a href="/solutions.html">Solutions</a><a href="/industries.html">Industries</a><a href="/about.html">About</a><a href="/contact.html">Contact</a></nav><div class="nav-actions"><a class="btn btn-primary" href="/contact.html"><span>Get Started</span><span class="btn-arrow">→</span></a></div></div></header>`;
const FTR = `<footer class="footer"><div class="container footer-grid"><div><a class="brand" href="/"><img src="/assets/logo.svg" alt="Blackbox Advancements"/></a><p>We install the future into businesses that are serious about growth.</p></div><div><h4>Pages</h4><div class="footer-links"><a href="/services.html">Services</a><a href="/solutions.html">Solutions</a><a href="/systems.html">How It Works</a><a href="/faq.html">FAQ</a><a href="/contact.html">Contact</a></div></div><div><h4>Get started</h4><ul class="footer-list"><li><a href="/contact.html">Free strategy call</a></li><li><a href="mailto:${EMAIL}">${EMAIL}</a></li></ul></div></div><div class="container footer-bottom"><span class="legal">© <span data-year>2026</span> Blackbox Advancements</span></div></footer><script src="/script.js"></script></body></html>`;
const CTA = (h,s)=>`<section class="section"><div class="container" style="text-align:center;max-width:780px;"><h2>${h}</h2><p>${s}</p><div style="display:flex;gap:14px;justify-content:center;flex-wrap:wrap;margin-top:24px;"><a class="btn btn-primary" href="/contact.html"><span>Get a Free Strategy Call</span><span class="btn-arrow">→</span></a><a class="btn" href="/">See What We Build</a></div></div></section>`;

const INTENT_DESC = {
  'best': (lc,c,st)=>`Looking for the best ${lc} in ${c}, ${st}? Blackbox is the agency ${c} businesses pick when they need real results, not just promises.`,
  'affordable': (lc,c,st)=>`Affordable ${lc} for ${c}, ${st} businesses. Blackbox builds enterprise-grade systems at small-business pricing. No long contracts, no surprise fees.`,
  'top': (lc,c,st)=>`Top ${lc} agency in ${c}, ${st}. Blackbox builds high-converting websites, AI automation, and ad systems for ${c} businesses.`,
  'professional': (lc,c,st)=>`Professional ${lc} services for ${c}, ${st} businesses. Built right the first time. Real systems, real results.`,
};
const INTENT_TITLE = { 'best':'Best','affordable':'Affordable','top':'Top','professional':'Professional' };
const IND_INTENT_DESC = {
  'best': (iSi,c,st)=>`Looking for the best ${iSi} websites in ${c}, ${st}? Blackbox builds custom ${iSi} sites that out-rank the competition.`,
  'top': (iSi,c,st)=>`Top ${iSi} web design agency in ${c}, ${st}. Custom builds, AI-driven SEO, automated lead capture.`,
};
const IND_INTENT_TITLE = { 'best':'Best','top':'Top' };

function intentSvc(prefix, svc, city) {
  const [s,L,lc] = svc; const {slug,name,state,county} = city;
  const cs = ss(slug,state);
  const filename = `${prefix}-${s}-${cs}.html`;
  const url = `${DOMAIN}/${filename}`;
  const tlabel = `${INTENT_TITLE[prefix]} ${L}`;
  const t = `${tlabel} in ${name}, ${state} | Blackbox Advancements`;
  const d = INTENT_DESC[prefix](lc, name, state);
  const k = `${prefix} ${lc} ${name}, ${prefix} ${lc} ${name} ${state}, ${prefix} ${lc} agency ${name}, ${name} ${lc}, ${name} ${prefix} ${lc}, ${lc} near me ${name}`;
  const sch = JSON.stringify({"@context":"https://schema.org","@type":"LocalBusiness","name":`Blackbox Advancements — ${name}`,"url":url,"description":d,"areaServed":{"@type":"City","name":name},"address":{"@type":"PostalAddress","addressLocality":name,"addressRegion":state,"addressCountry":"US"},"makesOffer":{"@type":"Offer","itemOffered":{"@type":"Service","name":tlabel}}});
  return `${HEAD(t,d,k,url)}<script type="application/ld+json">${sch}</script></head><body>${HDR}<main><section class="page-hero"><div class="container"><span class="eyebrow">Serving ${name}, ${state}</span><h1>${tlabel} in ${name}, ${state}</h1><p>${d} We don't sell ${lc} as a one-off project. We install the entire system — websites, AI automation, SEO, ads, CRMs — and stay with you to keep them running. Available locally in Whatcom County, WA and remotely across the US.</p><div style="margin-top:24px;display:flex;gap:14px;flex-wrap:wrap;"><a class="btn btn-primary" href="/contact.html"><span>Get a Free Strategy Call</span><span class="btn-arrow">→</span></a><a class="btn" href="/${s}-${cs}.html">All ${L} in ${name}</a></div></div></section><section class="section-tight"><div class="container"><div class="section-head"><h2>Why ${name} businesses pick Blackbox for ${prefix} ${lc}</h2><p>Most ${lc} agencies cap out at strategy decks. We build the actual operating system inside your ${name} business.</p></div><div class="solution-grid"><article class="card"><h3>${INTENT_TITLE[prefix]}-quality builds</h3><p>Every ${lc} engagement at Blackbox includes the full stack — research, strategy, build, integration, and ongoing operations.</p></article><article class="card"><h3>${name}-tuned for local ranking</h3><p>Local SEO, schema markup, GBP optimization, and citations all built around what ${name} customers actually search.</p></article><article class="card"><h3>AI + automation by default</h3><p>Lead-capture chatbots, AI phone callers, and follow-up automation — every site comes with real automation, not just a contact form.</p></article><article class="card"><h3>One partner, one team</h3><p>Website, SEO, ads, CRM, AI agents — built by one team, designed to work together. No more juggling five vendors.</p></article></div></div></section>${CTA(`Ready for ${prefix} ${lc} in ${name}?`,`Free strategy call. We don't just do AI automation — we build everything when it comes to growing ${name} businesses online.`)}</main>${FTR}`;
}

function intentInd(prefix, ind, city) {
  const [iS,iL,iSi,iP] = ind; const {slug,name,state,county} = city;
  const cs = ss(slug,state);
  const filename = `${prefix}-${iS}-websites-${cs}.html`;
  const url = `${DOMAIN}/${filename}`;
  const tlabel = `${IND_INTENT_TITLE[prefix]} ${iL} Websites`;
  const t = `${tlabel} in ${name}, ${state} | Blackbox Advancements`;
  const d = IND_INTENT_DESC[prefix](iSi, name, state);
  const k = `${prefix} ${iSi} websites ${name}, ${prefix} ${iL.toLowerCase()} web design ${name}, ${iL.toLowerCase()} website agency ${name}, ${iSi} marketing ${name}, ${name} ${iL.toLowerCase()} website builder, websites for ${iP} ${name}`;
  const sch = JSON.stringify({"@context":"https://schema.org","@type":"ProfessionalService","name":`Blackbox — ${tlabel} ${name}`,"url":url,"description":d,"areaServed":{"@type":"City","name":name},"address":{"@type":"PostalAddress","addressLocality":name,"addressRegion":state,"addressCountry":"US"}});
  return `${HEAD(t,d,k,url)}<script type="application/ld+json">${sch}</script></head><body>${HDR}<main><section class="page-hero"><div class="container"><span class="eyebrow">Built for ${iP} in ${name}</span><h1>${tlabel} in ${name}, ${state}</h1><p>${d} We don't sell templates. We build custom ${iSi} sites that compete for top-3 Google rankings, capture leads automatically, and route them through AI follow-up.</p><div style="margin-top:24px;display:flex;gap:14px;flex-wrap:wrap;"><a class="btn btn-primary" href="/contact.html"><span>Get a Free Strategy Call</span><span class="btn-arrow">→</span></a><a class="btn" href="/${iS}-websites-${cs}.html">All ${iL} Websites in ${name}</a></div></div></section><section class="section-tight"><div class="container"><div class="section-head"><h2>What sets Blackbox apart for ${iP} in ${name}</h2></div><div class="solution-grid"><article class="card"><h3>Custom-built, not templated</h3><p>We don't ship Wix or Squarespace. Every ${iSi} site we build for ${name} is custom — fast, mobile-first, and designed to convert.</p></article><article class="card"><h3>Local SEO built in</h3><p>On-page SEO, schema markup, GBP optimization, citations across ${county} — we get you to the top of Google for ${iSi} searches in ${name}.</p></article><article class="card"><h3>Lead capture + AI follow-up</h3><p>Forms that work, AI agents that respond in under 60 seconds, SMS automation that books appointments while you sleep.</p></article><article class="card"><h3>Reviews + reputation</h3><p>Automated review requests, schema-marked reviews on your site, GBP integration — stack the social proof without the manual work.</p></article></div></div></section>${CTA(`Ready for ${tlabel.toLowerCase()} in ${name}?`,`Free strategy call. We don't just build ${iSi} websites — we build the whole machine.`)}</main>${FTR}`;
}

let count = 0;
const newSitemapEntries = [];

if (['best','affordable','top','professional'].includes(BATCH)) {
  console.log(`Generating service-intent batch: ${BATCH}`);
  for (const c of ALL_CITIES) for (const s of SERVICES) {
    const cs = ss(c.slug, c.state);
    const fn = `${BATCH}-${s[0]}-${cs}.html`;
    fs.writeFileSync(path.join(ROOT, fn), intentSvc(BATCH, s, c));
    newSitemapEntries.push(`${DOMAIN}/${fn}`);
    count++;
    if (count % 5000 === 0) console.log(`  ...${count}`);
  }
} else if (BATCH === 'industry-best' || BATCH === 'industry-top') {
  const prefix = BATCH.replace('industry-', '');
  console.log(`Generating industry-intent batch: ${prefix}`);
  for (const c of ALL_CITIES) for (const i of INDUSTRIES) {
    const cs = ss(c.slug, c.state);
    const fn = `${prefix}-${i[0]}-websites-${cs}.html`;
    fs.writeFileSync(path.join(ROOT, fn), intentInd(prefix, i, c));
    newSitemapEntries.push(`${DOMAIN}/${fn}`);
    count++;
    if (count % 5000 === 0) console.log(`  ...${count}`);
  }
} else { console.error('Unknown batch:', BATCH); process.exit(1); }

// Update sitemap with batch entries
const sitemap = fs.readFileSync(path.join(ROOT,'sitemap.xml'),'utf8');
const existingUrls = new Set((sitemap.match(/<loc>([^<]+)<\/loc>/g)||[]).map(s=>s.replace(/<\/?loc>/g,'')));
for (const u of newSitemapEntries) existingUrls.add(u);
const allUrls = Array.from(existingUrls);
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${allUrls.map(u=>`  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT,'sitemap.xml'), xml);

console.log(`\n${BATCH}: ${count} pages. Total sitemap URLs: ${allUrls.length}`);
