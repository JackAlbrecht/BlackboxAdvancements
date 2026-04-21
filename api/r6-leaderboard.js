// /api/r6-leaderboard  --  Live-style R6 ranked leaderboard feed
// Vercel serverless function. Returns JSON with a current snapshot
// of the top 50 Champion-ranked players.
//
// This endpoint is the seam where real data plugs in. Today it serves
// a curated roster with lightly rotating stats (RP drifts up/down each
// hour, win% and KD shift within realistic bands, ranks re-sort). Swap
// the `baseRoster` for a live pull (r6.tracker.network, r6data.eu, or a
// Ubisoft OAuth scrape) and the frontend doesn't have to change.

const baseRoster = [
  { name: 'Beaulo',    display: 'Beaulo.TSM',     platform: 'PC',   region: 'NA',    rp: 21480, kd: 1.94, wr: 71, hs: 62, matches: 812,  op: 'Jackal' },
  { name: 'Spoit',     display: 'Spoit.-',        platform: 'PC',   region: 'EU',    rp: 21190, kd: 1.87, wr: 69, hs: 64, matches: 742,  op: 'Iana' },
  { name: 'Kanto',     display: 'Kanto',          platform: 'PC',   region: 'EU',    rp: 20940, kd: 1.82, wr: 68, hs: 61, matches: 698,  op: 'Ash' },
  { name: 'Meepey',    display: 'Meepey.TSM',     platform: 'PC',   region: 'NA',    rp: 20790, kd: 1.78, wr: 67, hs: 58, matches: 634,  op: 'Thatcher' },
  { name: 'Panbazou',  display: 'Panbazou',       platform: 'PC',   region: 'EU',    rp: 20610, kd: 1.76, wr: 66, hs: 60, matches: 588,  op: 'Jager' },
  { name: 'Shas',      display: 'Shas.G2',        platform: 'PC',   region: 'EU',    rp: 20480, kd: 1.73, wr: 65, hs: 56, matches: 552,  op: 'Smoke' },
  { name: 'LoftStyle', display: 'LoftStyle-',     platform: 'PC',   region: 'NA',    rp: 20320, kd: 1.71, wr: 64, hs: 59, matches: 612,  op: 'Dokkaebi' },
  { name: 'Virtue',    display: 'Virtue.Oxy',     platform: 'PC',   region: 'NA',    rp: 20180, kd: 1.69, wr: 63, hs: 57, matches: 487,  op: 'Ash' },
  { name: 'Fultz',     display: 'Fultz.TSM',      platform: 'PC',   region: 'NA',    rp: 20020, kd: 1.67, wr: 62, hs: 55, matches: 641,  op: 'Mute' },
  { name: 'Rampy',     display: 'Rampy.-',        platform: 'PC',   region: 'NA',    rp: 19880, kd: 1.65, wr: 62, hs: 58, matches: 502,  op: 'Iana' },
  { name: 'Goga',      display: 'Goga',           platform: 'PC',   region: 'EU',    rp: 19760, kd: 1.63, wr: 61, hs: 54, matches: 570,  op: 'Jager' },
  { name: 'Pie',       display: 'Pie.XO',         platform: 'PC',   region: 'NA',    rp: 19640, kd: 1.62, wr: 61, hs: 56, matches: 433,  op: 'Twitch' },
  { name: 'Jess',      display: 'JesssieePINK',   platform: 'PC',   region: 'NA',    rp: 19530, kd: 1.61, wr: 60, hs: 53, matches: 512,  op: 'Valk' },
  { name: 'Diesel',    display: 'Diesel.FaZe',    platform: 'PC',   region: 'NA',    rp: 19410, kd: 1.59, wr: 60, hs: 55, matches: 474,  op: 'Ying' },
  { name: 'Canadian',  display: 'Canadian.TSM',   platform: 'PC',   region: 'NA',    rp: 19300, kd: 1.58, wr: 59, hs: 52, matches: 598,  op: 'Bandit' },
  { name: 'Bryan',     display: 'Bryan-tc',       platform: 'PC',   region: 'LATAM', rp: 19180, kd: 1.57, wr: 59, hs: 54, matches: 544,  op: 'Buck' },
  { name: 'Gomfi',     display: 'Gomfi.NVK',      platform: 'PC',   region: 'EU',    rp: 19080, kd: 1.56, wr: 58, hs: 57, matches: 410,  op: 'Capitao' },
  { name: 'CTZN',      display: 'CTZN.BDS',       platform: 'PC',   region: 'EU',    rp: 18970, kd: 1.55, wr: 58, hs: 55, matches: 396,  op: 'Ash' },
  { name: 'Pengu',     display: 'Pengu',          platform: 'PC',   region: 'EU',    rp: 18880, kd: 1.54, wr: 57, hs: 53, matches: 462,  op: 'Blitz' },
  { name: 'Hungry',    display: 'HungryBox.HM',   platform: 'PC',   region: 'NA',    rp: 18770, kd: 1.52, wr: 57, hs: 51, matches: 521,  op: 'Lion' },
  { name: 'Nyx',       display: 'NyxWasHere',     platform: 'PC',   region: 'NA',    rp: 18660, kd: 1.50, wr: 56, hs: 52, matches: 388,  op: 'Nomad' },
  { name: 'Saves',     display: 'Saves.XO',       platform: 'PC',   region: 'NA',    rp: 18560, kd: 1.49, wr: 56, hs: 54, matches: 443,  op: 'Rook' },
  { name: 'Yeti',      display: 'Yeti.MNM',       platform: 'PC',   region: 'EU',    rp: 18470, kd: 1.48, wr: 55, hs: 50, matches: 502,  op: 'Mira' },
  { name: 'AceeZ',     display: 'AceeZ.TSM',      platform: 'PC',   region: 'NA',    rp: 18380, kd: 1.47, wr: 55, hs: 49, matches: 467,  op: 'Thermite' },
  { name: 'Yuzus',     display: 'Yuzus.CAG',      platform: 'PC',   region: 'APAC',  rp: 18290, kd: 1.46, wr: 54, hs: 56, matches: 384,  op: 'Iana' },
  { name: 'Psycho',    display: 'Psycho',         platform: 'PS',   region: 'EU',    rp: 18220, kd: 1.45, wr: 54, hs: 48, matches: 610,  op: 'Sledge' },
  { name: 'ShiiNa',    display: 'ShiiNa_FaZe',    platform: 'PS',   region: 'EU',    rp: 18150, kd: 1.43, wr: 53, hs: 51, matches: 572,  op: 'Ash' },
  { name: 'Nebras',    display: 'Nebraskka',      platform: 'PC',   region: 'EU',    rp: 18070, kd: 1.42, wr: 53, hs: 52, matches: 411,  op: 'Finka' },
  { name: 'Brammer',   display: 'Brammer.TSM',    platform: 'PC',   region: 'NA',    rp: 17980, kd: 1.41, wr: 52, hs: 50, matches: 489,  op: 'Mozzie' },
  { name: 'Hutch',     display: 'Hutch',          platform: 'PC',   region: 'NA',    rp: 17890, kd: 1.40, wr: 52, hs: 47, matches: 534,  op: 'Blackbeard' },
  { name: 'Hori',      display: 'Hori.CAG',       platform: 'PC',   region: 'APAC',  rp: 17820, kd: 1.39, wr: 51, hs: 54, matches: 361,  op: 'Sens' },
  { name: 'Renshiro',  display: 'Renshiro.CAG',   platform: 'PC',   region: 'APAC',  rp: 17750, kd: 1.38, wr: 51, hs: 53, matches: 378,  op: 'Hibana' },
  { name: 'KingGeorge',display: 'KingGeorge',     platform: 'PC',   region: 'NA',    rp: 17680, kd: 1.37, wr: 50, hs: 48, matches: 612,  op: 'Zofia' },
  { name: 'Shuttle',   display: 'Shuttle.DG',     platform: 'PC',   region: 'NA',    rp: 17600, kd: 1.36, wr: 50, hs: 49, matches: 421,  op: 'Jager' },
  { name: 'Neox',      display: 'Neox.M80',       platform: 'PC',   region: 'NA',    rp: 17530, kd: 1.35, wr: 50, hs: 51, matches: 398,  op: 'Kapkan' },
  { name: 'Onni',      display: 'Onni.DG',        platform: 'PC',   region: 'NA',    rp: 17460, kd: 1.34, wr: 49, hs: 50, matches: 412,  op: 'Fuze' },
  { name: 'Cryn',      display: 'Cryn.W7M',       platform: 'PC',   region: 'LATAM', rp: 17400, kd: 1.33, wr: 49, hs: 52, matches: 447,  op: 'Ela' },
  { name: 'Alem4o',    display: 'Alem4o.W7M',     platform: 'PC',   region: 'LATAM', rp: 17340, kd: 1.32, wr: 48, hs: 49, matches: 480,  op: 'Thermite' },
  { name: 'Soulz1',    display: 'Soulz1.FaZe',    platform: 'PC',   region: 'LATAM', rp: 17280, kd: 1.31, wr: 48, hs: 50, matches: 392,  op: 'Iana' },
  { name: 'Novys',     display: 'Novys.FaZe',     platform: 'PC',   region: 'LATAM', rp: 17210, kd: 1.30, wr: 47, hs: 48, matches: 415,  op: 'Nomad' },
  { name: 'Yoggah',    display: 'YoggahTV',       platform: 'XBOX', region: 'NA',    rp: 17150, kd: 1.29, wr: 47, hs: 46, matches: 571,  op: 'Hibana' },
  { name: 'Creep',     display: 'Creeep.-',       platform: 'XBOX', region: 'NA',    rp: 17090, kd: 1.28, wr: 46, hs: 47, matches: 502,  op: 'Ash' },
  { name: 'Elemzje',   display: 'Elemzje',        platform: 'PC',   region: 'EU',    rp: 17020, kd: 1.27, wr: 46, hs: 49, matches: 359,  op: 'Buck' },
  { name: 'Korey',     display: 'Korey.BDS',      platform: 'PC',   region: 'EU',    rp: 16960, kd: 1.26, wr: 45, hs: 50, matches: 374,  op: 'Sledge' },
  { name: 'Risze',     display: 'Risze.BDS',      platform: 'PC',   region: 'EU',    rp: 16900, kd: 1.25, wr: 45, hs: 48, matches: 402,  op: 'Mira' },
  { name: 'BriD',      display: 'BriD.CAG',       platform: 'PC',   region: 'APAC',  rp: 16840, kd: 1.24, wr: 44, hs: 51, matches: 341,  op: 'Iana' },
  { name: 'Walk3r',    display: 'Walk3r',         platform: 'PC',   region: 'APAC',  rp: 16780, kd: 1.23, wr: 44, hs: 47, matches: 388,  op: 'Kaid' },
  { name: 'Quwi',      display: 'Quwi.M80',       platform: 'PC',   region: 'NA',    rp: 16720, kd: 1.22, wr: 43, hs: 48, matches: 367,  op: 'Jager' },
  { name: 'TrickyBxbe',display: 'TrickyBxbe',     platform: 'PS',   region: 'NA',    rp: 16670, kd: 1.21, wr: 43, hs: 45, matches: 518,  op: 'Zofia' },
  { name: 'Mellowxo',  display: 'Mellowxo.SFX',   platform: 'XBOX', region: 'EU',    rp: 16610, kd: 1.20, wr: 42, hs: 46, matches: 472,  op: 'Ash' }
];

// Deterministic pseudo-random so the same 10-minute window returns the same data.
// Means a refresh 30s later shows consistent numbers; 15 min later numbers move.
function seededRand(seed) {
  const x = Math.sin(seed) * 10000;
  return x - Math.floor(x);
}

function buildSnapshot() {
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000)); // 10-minute bucket
  const profileBase = (name, platform) => {
    const plat = platform === 'PS' ? 'psn' : platform === 'XBOX' ? 'xbl' : 'ubi';
    return `https://r6.tracker.network/r6siege/profile/${plat}/${encodeURIComponent(name)}/overview`;
  };

  const rows = baseRoster.map((p, i) => {
    // Drift RP by +/- up to ~180 per bucket, KD by +/- 0.04, wr by +/- 1, hs by +/- 1, matches only increases.
    const r1 = seededRand(bucket * 31 + i);
    const r2 = seededRand(bucket * 37 + i * 3);
    const r3 = seededRand(bucket * 41 + i * 5);
    const r4 = seededRand(bucket * 43 + i * 7);
    const rpDelta = Math.round((r1 - 0.5) * 360);
    const kdDelta = +(((r2 - 0.5) * 0.08).toFixed(3));
    const wrDelta = Math.round((r3 - 0.5) * 2);
    const hsDelta = Math.round((r4 - 0.5) * 2);
    const matchesDelta = Math.floor(seededRand(bucket * 47 + i * 11) * 4);

    return {
      name: p.name,
      display: p.display,
      platform: p.platform,
      region: p.region,
      rp: Math.max(12000, p.rp + rpDelta),
      kd: Math.max(0.9, +(p.kd + kdDelta).toFixed(2)),
      wr: Math.max(30, Math.min(85, p.wr + wrDelta)),
      hs: Math.max(30, Math.min(80, p.hs + hsDelta)),
      matches: p.matches + matchesDelta,
      op: p.op,
      profile: profileBase(p.display, p.platform)
    };
  });

  // Re-sort by RP — so #1 can change spots over time.
  rows.sort((a, b) => b.rp - a.rp);
  rows.forEach((r, i) => { r.rank = i + 1; });

  return {
    season: 'Y11S2',
    season_name: 'Operation Tidal Torrent',
    updated_at: new Date().toISOString(),
    bucket_id: bucket,
    source: 'blackbox-r6-pipeline',
    count: rows.length,
    players: rows,
    operators: [
      { name: 'Jager',     side: 'defense', pick: 71, ban: 4 },
      { name: 'Iana',      side: 'attack',  pick: 68, ban: 12 },
      { name: 'Thatcher',  side: 'attack',  pick: 64, ban: 18 },
      { name: 'Smoke',     side: 'defense', pick: 59, ban: 6 },
      { name: 'Ash',       side: 'attack',  pick: 57, ban: 8 },
      { name: 'Mute',      side: 'defense', pick: 54, ban: 5 },
      { name: 'Jackal',    side: 'attack',  pick: 42, ban: 38 },
      { name: 'Sens',      side: 'attack',  pick: 41, ban: 16 },
      { name: 'Bandit',    side: 'defense', pick: 38, ban: 3 },
      { name: 'Montagne',  side: 'attack',  pick: 24, ban: 41 },
      { name: 'Solis',     side: 'defense', pick: 36, ban: 29 },
      { name: 'Capitao',   side: 'attack',  pick: 31, ban: 2 }
    ]
  };
}

export default function handler(req, res) {
  // Cache for 60s at the edge, serve stale for another 10 min while revalidating.
  res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=600');
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.status(200).json(buildSnapshot());
}
