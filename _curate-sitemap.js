#!/usr/bin/env node
// Build a 50K-URL curated sitemap from highest-value Blackbox pages.
const fs = require('fs');
const path = require('path');
const ROOT = __dirname;
const DOMAIN = 'https://blackboxadvancements.com';

// Load all city data from phase 1 source
const PHASE1 = fs.readFileSync(path.join(ROOT,'_seo-blast.js'),'utf8');
const cityCode = PHASE1.match(/const WHATCOM[\s\S]*?cityMap\.has[\s\S]*?Array\.from\(cityMap\.values\(\)\);/)[0];
const tmpPath = path.join(ROOT,'_tmp-c2.js');
fs.writeFileSync(tmpPath, cityCode + '\nmodule.exports = {ALL_CITIES, WHATCOM, WASHINGTON, US_CITIES};');
const { ALL_CITIES, WHATCOM, WASHINGTON, US_CITIES } = require(tmpPath);
fs.unlinkSync(tmpPath);

const ss = (slug, state) => slug.endsWith('-' + state.toLowerCase()) ? slug : slug + '-' + state.toLowerCase();

// Service slugs (must match generator output)
const SERVICES = [
'web-design','website-design','web-development','custom-website-development','landing-page-design','ecommerce-website-design','shopify-development','wordpress-development','mobile-app-development','mobile-first-web-design','seo-services','local-seo','programmatic-seo','technical-seo','google-business-profile-optimization','google-ads-management','facebook-ads-management','instagram-ads','ppc-advertising','ai-automation','ai-agents','ai-phone-callers','business-process-automation','n8n-workflow-automation','crm-development','lead-generation-services','sales-funnel-design','conversion-rate-optimization','branding-services','logo-design','copywriting-services','email-marketing-automation','sms-marketing-automation','geo-optimization','chatgpt-search-optimization'
];
const INDUSTRIES = [
'hvac','plumber','electrician','roofing','general-contractor','landscaper','painter','pest-control','restaurant','gym','dentist','lawyer','realtor','salon','auto-repair','photographer','fitness-coach','chiropractor','veterinarian','daycare','accountant','financial-advisor','insurance-agent','mortgage-broker','locksmith','cleaning-service','tutor','coffee-shop','bakery','dance-studio'
];
const SVC_INTENTS = ['best','affordable','top','professional'];
const IND_INTENTS = ['best','top'];

// Highest-value services & industries first (by search volume + commercial intent)
const TOP_SERVICES = ['web-design','website-design','seo-services','local-seo','google-ads-management','ai-automation','web-development','wordpress-development','shopify-development','landing-page-design','ecommerce-website-design','facebook-ads-management','google-business-profile-optimization','lead-generation-services','branding-services','logo-design','crm-development','ai-agents','ai-phone-callers','technical-seo'];
const TOP_INDUSTRIES = ['hvac','plumber','electrician','roofing','dentist','lawyer','realtor','restaurant','gym','chiropractor','salon','auto-repair','general-contractor','landscaper','accountant','financial-advisor','insurance-agent','mortgage-broker'];

// Top US metros by population (most search volume)
const TOP_US_METRO_SLUGS = ['new-york','los-angeles','chicago','houston','phoenix','philadelphia','san-antonio','san-diego','dallas','san-jose','austin','jacksonville','fort-worth','columbus-oh','charlotte','indianapolis','san-francisco','seattle','denver','washington','boston','el-paso','nashville','detroit','oklahoma-city','portland-or','las-vegas','memphis','louisville','baltimore','milwaukee','albuquerque','tucson','fresno','sacramento','kansas-city-mo','mesa-az','atlanta','colorado-springs','omaha','raleigh','miami','long-beach-ca','virginia-beach','oakland','minneapolis','tulsa','tampa','arlington-tx','new-orleans','wichita','cleveland','bakersfield','aurora-co','anaheim','honolulu','santa-ana','riverside','corpus-christi','lexington-ky','stockton','st-louis','st-paul','henderson','pittsburgh','cincinnati','anchorage','plano','greensboro','lincoln-ne','toledo-oh','orlando','jersey-city','chula-vista','fort-wayne','chandler','st-petersburg','laredo','buffalo-ny','madison-wi','lubbock','reno','irvine','garland','glendale-az','hialeah','chesapeake','scottsdale','north-las-vegas','irving','baton-rouge','fremont','richmond-va','boise','san-bernardino','spokane','des-moines-ia','modesto','tacoma','salt-lake-city','tallahassee','huntsville','fontana','oxnard','moreno-valley','frisco','mckinney','fayetteville-nc','huntington-beach','akron','glendale-ca','grand-rapids','salem-or','little-rock','aurora-il','overland-park','rochester-ny','knoxville','rancho-cucamonga','providence','newport-news','columbus-ga','santa-clarita','cape-coral','peoria-az','tempe','springfield-mo','garden-grove','oceanside','ontario-ca','vancouver','sioux-falls','fort-lauderdale','pembroke-pines','salinas','elk-grove','jackson-ms','rockford','santa-rosa','corona','eugene','cary','palmdale','springfield-ma','salem-ma','pasadena-ca','fort-collins','hayward','pomona','escondido','torrance','sunnyvale','syracuse','orange-ca','hollywood-fl','warren-mi','bridgeport-ct','dayton-oh','new-haven','olathe','mesquite','savannah','clarksville','lakewood-co','alexandria-va','fullerton','shreveport','providence','chattanooga','tacoma','aurora','grand-prairie','arvada','round-rock','amarillo','provo','sterling-heights','cedar-rapids','elizabeth-nj','thousand-oaks','kent','waco','gainesville-fl','pearland','simi-valley','concord-ca','topeka','hartford','victorville','college-station','lansing','rochester-mn','fairfield-ca','denton','santa-clara-ca','springfield-il','allentown','vallejo','independence-mo','springfield-or','beaumont','berkeley','round-rock','clovis','flint','carrollton','el-monte','ann-arbor','cambridge-ma','bellevue','mcallen','bellingham','everett','spokane-valley','renton','federal-way','kirkland'];
const TOP_METRO_SET = new Set(TOP_US_METRO_SLUGS);

// =============================================================
// PRIORITY TIER ASSIGNMENT
// =============================================================
const urls = [];
const TARGET = 50000;
const seen = new Set();
function add(u) { if (!seen.has(u) && urls.length < TARGET) { seen.add(u); urls.push(u); } }

// TIER 0: base + pillar pages
console.log('Tier 0: base + pillar pages');
['', 'services.html', 'solutions.html', 'industries.html', 'about.html', 'contact.html', 'systems.html', 'faq.html'].forEach(u => add(`${DOMAIN}/${u}`));
SERVICES.forEach(s => add(`${DOMAIN}/${s}.html`));
console.log(`  After tier 0: ${urls.length}`);

// TIER 1: ALL Whatcom County (every variant — primary market)
console.log('Tier 1: ALL Whatcom County permutations');
for (const c of WHATCOM) {
  const [slug, name, state] = c;
  const cs = ss(slug, state);
  // city x service (all 35)
  for (const s of SERVICES) add(`${DOMAIN}/${s}-${cs}.html`);
  // city x industry (all 30)
  for (const i of INDUSTRIES) add(`${DOMAIN}/${i}-websites-${cs}.html`);
  // city x intent x service
  for (const intent of SVC_INTENTS) for (const s of SERVICES) add(`${DOMAIN}/${intent}-${s}-${cs}.html`);
  // city x intent x industry
  for (const intent of IND_INTENTS) for (const i of INDUSTRIES) add(`${DOMAIN}/${intent}-${i}-websites-${cs}.html`);
}
console.log(`  After tier 1: ${urls.length}`);

// TIER 2: Service × Industry combos (no city) — strong middle-of-funnel
console.log('Tier 2: service x industry combos');
for (const s of SERVICES) for (const i of INDUSTRIES) add(`${DOMAIN}/${s}-for-${i}.html`);
console.log(`  After tier 2: ${urls.length}`);

// TIER 3: Top US metros - all base + intent variants
console.log('Tier 3: Top US metros (full coverage)');
const topCities = ALL_CITIES.filter(c => TOP_METRO_SET.has(c.slug));
console.log(`  Found ${topCities.length} top metros in dataset`);
for (const c of topCities) {
  const cs = ss(c.slug, c.state);
  for (const s of TOP_SERVICES) add(`${DOMAIN}/${s}-${cs}.html`);
  for (const i of TOP_INDUSTRIES) add(`${DOMAIN}/${i}-websites-${cs}.html`);
  for (const intent of SVC_INTENTS) for (const s of TOP_SERVICES) add(`${DOMAIN}/${intent}-${s}-${cs}.html`);
  for (const intent of IND_INTENTS) for (const i of TOP_INDUSTRIES) add(`${DOMAIN}/${intent}-${i}-websites-${cs}.html`);
  if (urls.length >= TARGET) break;
}
console.log(`  After tier 3: ${urls.length}`);

// TIER 4: ALL WA state cities (regional priority)
console.log('Tier 4: All WA state base permutations');
for (const c of WASHINGTON) {
  const [slug, name, state] = c;
  const cs = ss(slug, state);
  for (const s of TOP_SERVICES) add(`${DOMAIN}/${s}-${cs}.html`);
  for (const i of TOP_INDUSTRIES) add(`${DOMAIN}/${i}-websites-${cs}.html`);
  if (urls.length >= TARGET) break;
}
console.log(`  After tier 4: ${urls.length}`);

// TIER 5: Fill with all other US cities (top services + industries only)
console.log('Tier 5: Remaining US cities (top services/industries)');
for (const c of ALL_CITIES) {
  if (TOP_METRO_SET.has(c.slug)) continue; // already added
  if (c.state === 'WA') continue; // already added
  const cs = ss(c.slug, c.state);
  for (const s of TOP_SERVICES) add(`${DOMAIN}/${s}-${cs}.html`);
  if (urls.length >= TARGET) break;
  for (const i of TOP_INDUSTRIES) add(`${DOMAIN}/${i}-websites-${cs}.html`);
  if (urls.length >= TARGET) break;
}
console.log(`  After tier 5: ${urls.length}`);

// TIER 6: backfill with intent variants for any remaining slot
if (urls.length < TARGET) {
  console.log('Tier 6: Backfill with intent variants for remaining cities');
  for (const c of ALL_CITIES) {
    const cs = ss(c.slug, c.state);
    for (const intent of SVC_INTENTS) for (const s of TOP_SERVICES) {
      add(`${DOMAIN}/${intent}-${s}-${cs}.html`);
      if (urls.length >= TARGET) break;
    }
    if (urls.length >= TARGET) break;
  }
}

console.log(`\nFINAL count: ${urls.length}`);

// Write the curated sitemap
const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map(u => `  <url><loc>${u}</loc></url>`).join('\n')}\n</urlset>\n`;
fs.writeFileSync(path.join(ROOT,'sitemap.xml'), xml);
console.log(`Wrote sitemap.xml with ${urls.length} URLs`);
