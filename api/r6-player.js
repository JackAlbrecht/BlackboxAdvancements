// /api/r6-player — full R6 Siege player profile served from our own backend.
// Query: ?name=<gamertag>&platform=<ubi|psn|xbl>
// Deterministic per name+platform; stats drift every 10 minutes for a live feel.

const RANKS = [
  { tier: 'Copper V',     key: 'copper',   min: 1000,  max: 1199 },
  { tier: 'Copper IV',    key: 'copper',   min: 1200,  max: 1399 },
  { tier: 'Copper III',   key: 'copper',   min: 1400,  max: 1599 },
  { tier: 'Copper II',    key: 'copper',   min: 1600,  max: 1799 },
  { tier: 'Copper I',     key: 'copper',   min: 1800,  max: 1999 },
  { tier: 'Bronze V',     key: 'bronze',   min: 2000,  max: 2199 },
  { tier: 'Bronze IV',    key: 'bronze',   min: 2200,  max: 2399 },
  { tier: 'Bronze III',   key: 'bronze',   min: 2400,  max: 2599 },
  { tier: 'Bronze II',    key: 'bronze',   min: 2600,  max: 2799 },
  { tier: 'Bronze I',     key: 'bronze',   min: 2800,  max: 2999 },
  { tier: 'Silver V',     key: 'silver',   min: 3000,  max: 3399 },
  { tier: 'Silver IV',    key: 'silver',   min: 3400,  max: 3799 },
  { tier: 'Silver III',   key: 'silver',   min: 3800,  max: 4199 },
  { tier: 'Silver II',    key: 'silver',   min: 4200,  max: 4599 },
  { tier: 'Silver I',     key: 'silver',   min: 4600,  max: 4999 },
  { tier: 'Gold V',       key: 'gold',     min: 5000,  max: 5499 },
  { tier: 'Gold IV',      key: 'gold',     min: 5500,  max: 5999 },
  { tier: 'Gold III',     key: 'gold',     min: 6000,  max: 6499 },
  { tier: 'Gold II',      key: 'gold',     min: 6500,  max: 6999 },
  { tier: 'Gold I',       key: 'gold',     min: 7000,  max: 7499 },
  { tier: 'Platinum V',   key: 'plat',     min: 7500,  max: 8499 },
  { tier: 'Platinum IV',  key: 'plat',     min: 8500,  max: 9499 },
  { tier: 'Platinum III', key: 'plat',     min: 9500,  max: 10499 },
  { tier: 'Platinum II',  key: 'plat',     min: 10500, max: 11499 },
  { tier: 'Platinum I',   key: 'plat',     min: 11500, max: 12499 },
  { tier: 'Emerald V',    key: 'emer',     min: 12500, max: 13499 },
  { tier: 'Emerald IV',   key: 'emer',     min: 13500, max: 14499 },
  { tier: 'Emerald III',  key: 'emer',     min: 14500, max: 15499 },
  { tier: 'Emerald II',   key: 'emer',     min: 15500, max: 16499 },
  { tier: 'Emerald I',    key: 'emer',     min: 16500, max: 17499 },
  { tier: 'Diamond V',    key: 'dia',      min: 17500, max: 18199 },
  { tier: 'Diamond IV',   key: 'dia',      min: 18200, max: 18899 },
  { tier: 'Diamond III',  key: 'dia',      min: 18900, max: 19599 },
  { tier: 'Diamond II',   key: 'dia',      min: 19600, max: 20299 },
  { tier: 'Diamond I',    key: 'dia',      min: 20300, max: 20999 },
  { tier: 'Champion',     key: 'champ',    min: 21000, max: 99999 }
];

const OPERATORS = [
  { name: 'Ash',      side: 'attack'  }, { name: 'Jackal',   side: 'attack'  },
  { name: 'Iana',     side: 'attack'  }, { name: 'Sens',     side: 'attack'  },
  { name: 'Thatcher', side: 'attack'  }, { name: 'Thermite', side: 'attack'  },
  { name: 'Hibana',   side: 'attack'  }, { name: 'Zofia',    side: 'attack'  },
  { name: 'Buck',     side: 'attack'  }, { name: 'Sledge',   side: 'attack'  },
  { name: 'Capitao',  side: 'attack'  }, { name: 'Nomad',    side: 'attack'  },
  { name: 'Lion',     side: 'attack'  }, { name: 'Finka',    side: 'attack'  },
  { name: 'Ying',     side: 'attack'  }, { name: 'Twitch',   side: 'attack'  },
  { name: 'Dokkaebi', side: 'attack'  }, { name: 'Fuze',     side: 'attack'  },
  { name: 'Blitz',    side: 'attack'  }, { name: 'Kali',     side: 'attack'  },
  { name: 'Jager',    side: 'defense' }, { name: 'Smoke',    side: 'defense' },
  { name: 'Mute',     side: 'defense' }, { name: 'Bandit',   side: 'defense' },
  { name: 'Mira',     side: 'defense' }, { name: 'Kaid',     side: 'defense' },
  { name: 'Valkyrie', side: 'defense' }, { name: 'Rook',     side: 'defense' },
  { name: 'Kapkan',   side: 'defense' }, { name: 'Mozzie',   side: 'defense' },
  { name: 'Solis',    side: 'defense' }, { name: 'Melusi',   side: 'defense' },
  { name: 'Ela',      side: 'defense' }, { name: 'Echo',     side: 'defense' },
  { name: 'Lesion',   side: 'defense' }, { name: 'Caveira',  side: 'defense' },
  { name: 'Thorn',    side: 'defense' }, { name: 'Aruni',    side: 'defense' }
];

const WEAPONS = [
  { name: 'R4-C',         type: 'Assault Rifle' },
  { name: 'C8-SFW',       type: 'Assault Rifle' },
  { name: 'ARX200',       type: 'Assault Rifle' },
  { name: 'AK-12',        type: 'Assault Rifle' },
  { name: 'ACS12',        type: 'Shotgun' },
  { name: 'FMG-9',        type: 'SMG' },
  { name: 'MP5',          type: 'SMG' },
  { name: 'MP7',          type: 'SMG' },
  { name: 'L85A2',        type: 'Assault Rifle' },
  { name: '556XI',        type: 'Assault Rifle' },
  { name: 'Scorpion EVO', type: 'SMG' },
  { name: 'SPAS-15',      type: 'Shotgun' }
];

const MAPS  = ['Clubhouse','Oregon','Chalet','Bank','Kafe','Border','Consulate','Villa','Coastline','Theme Park','Skyscraper','Nighthaven'];
const MODES = ['Ranked','Ranked','Ranked','Standard','Quick Match'];
const REGIONS = ['NA','EU','APAC','LATAM'];

function hash32(s) {
  let h = 2166136261 >>> 0;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}
function seeded(seed) {
  let s = seed || 1;
  return function () { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}
function rankFromRP(rp) {
  for (const r of RANKS) if (rp >= r.min && rp <= r.max) return r;
  return RANKS[RANKS.length - 1];
}
function agoString(minsAgo) {
  if (minsAgo < 60) return `${minsAgo}m ago`;
  const hrs = minsAgo / 60;
  if (hrs < 24) return `${Math.round(hrs)}h ago`;
  const days = hrs / 24;
  if (days < 7) return `${Math.round(days)}d ago`;
  return `${Math.round(days / 7)}w ago`;
}

function buildProfile(name, platform) {
  const key = `${platform}|${name.toLowerCase().trim()}`;
  const seed = hash32(key);
  const rnd = seeded(seed);
  const bucket = Math.floor(Date.now() / (10 * 60 * 1000));
  const liveRnd = seeded(hash32(key) ^ bucket);

  // Skill: power-user boost for short clean names
  const nameBoost = /^[A-Za-z]{3,10}$/.test(name) ? 0.22 : 0.08;
  const skill = Math.min(0.99, 0.35 + rnd() * 0.55 + nameBoost);
  const baseRP = Math.round(2000 + skill * 18500);
  const rpDrift = Math.round((liveRnd() - 0.5) * 240);
  const rp = Math.max(1000, baseRP + rpDrift);

  const rank = rankFromRP(rp);
  const rankIdx = RANKS.indexOf(rank);
  const nextRank = RANKS[rankIdx + 1];
  const progress = Math.max(0, Math.min(100,
    Math.round(((rp - rank.min) / Math.max(1, rank.max - rank.min)) * 100)
  ));
  const toNext = nextRank ? Math.max(0, nextRank.min - rp) : 0;

  const kd = +(0.55 + skill * 1.6 + (liveRnd() - 0.5) * 0.04).toFixed(2);
  const wr = Math.max(28, Math.min(78, Math.round(35 + skill * 40 + (liveRnd() - 0.5) * 2)));
  const hs = Math.max(22, Math.min(72, Math.round(24 + skill * 40 + (liveRnd() - 0.5) * 2)));
  const matchesBase = Math.round(80 + rnd() * 1800);
  const matches = matchesBase + Math.floor(liveRnd() * 4);
  const wins = Math.round(matches * (wr / 100));
  const losses = matches - wins;
  const kills = Math.round(matches * (4 + skill * 4));
  const deaths = Math.max(1, Math.round(kills / Math.max(0.5, kd)));
  const assists = Math.round(kills * (0.3 + rnd() * 0.25));
  const hours = Math.round(matches * (0.22 + rnd() * 0.08));
  const kost = Math.max(45, Math.min(82, Math.round(55 + skill * 25 + (rnd() - 0.5) * 3)));
  const entryKd = +(kd * (0.85 + rnd() * 0.18)).toFixed(2);
  const seasonHighRp = Math.max(rp, rp + Math.round(rnd() * 800));
  const seasonHigh = rankFromRP(seasonHighRp).tier;

  // Region rank & global rank derived from skill + name variance
  const regionRank = Math.max(1, Math.round((1 - skill) * 12000 + rnd() * 300 + 1));
  const globalRank = Math.max(regionRank, Math.round(regionRank * (3.5 + rnd() * 1.4)));

  // Top 12 operators, sorted by rounds
  const shuffledOps = OPERATORS.slice().sort(() => rnd() - 0.5).slice(0, 12);
  let weight = 1;
  const opsRaw = shuffledOps.map((op) => {
    weight = Math.max(0.05, weight - rnd() * 0.08);
    const rounds = Math.round(matches * (0.06 + weight * 0.14));
    const opKD = +(Math.max(0.5, kd + (rnd() - 0.5) * 0.8)).toFixed(2);
    const opWR = Math.max(25, Math.min(82, Math.round(wr + (rnd() - 0.5) * 12)));
    const opHS = Math.max(18, Math.min(78, Math.round(hs + (rnd() - 0.5) * 14)));
    return { name: op.name, side: op.side, rounds, kd: opKD, wr: opWR, hs: opHS };
  }).sort((a, b) => b.rounds - a.rounds);
  const maxRounds = Math.max(1, opsRaw[0].rounds);
  const operators = opsRaw.map(o => ({ ...o, playtimePct: Math.round((o.rounds / maxRounds) * 100) }));

  // Top 5 weapons
  const pickedWeapons = WEAPONS.slice().sort(() => rnd() - 0.5).slice(0, 5);
  let wWeight = 1;
  const wpnsRaw = pickedWeapons.map(w => {
    wWeight = Math.max(0.1, wWeight - rnd() * 0.1);
    const wkills = Math.round(kills * (0.08 + wWeight * 0.18));
    return { name: w.name, type: w.type, kills: wkills, hs: Math.max(18, Math.min(78, Math.round(hs + (rnd() - 0.5) * 10))) };
  }).sort((a, b) => b.kills - a.kills);
  const maxWKills = Math.max(1, wpnsRaw[0].kills);
  const weapons = wpnsRaw.map(w => ({ ...w, usagePct: Math.round((w.kills / maxWKills) * 100) }));

  // Recent matches (last 20)
  let cumAgoMin = 0;
  const topOps = operators.slice(0, 6);
  const recentMatches = Array.from({ length: 20 }).map((_, i) => {
    cumAgoMin += Math.round(25 + rnd() * 95);
    const win = rnd() < (wr / 100);
    const draw = !win && rnd() < 0.04;
    const result = draw ? 'D' : (win ? 'W' : 'L');
    const mapName = MAPS[Math.floor(rnd() * MAPS.length)];
    const mode = MODES[Math.floor(rnd() * MODES.length)];
    const rounds = 4 + Math.floor(rnd() * 4);
    const enemyRounds = win ? Math.max(0, rounds - 1 - Math.floor(rnd() * 3)) : rounds + 1 + Math.floor(rnd() * 3);
    const matchK = Math.round(2 + rnd() * 10 + skill * 6);
    const matchD = Math.max(1, Math.round(matchK / Math.max(0.4, kd + (rnd() - 0.5) * 0.4)));
    const matchA = Math.round(rnd() * 4);
    const rpDelta = draw ? 0 : (win ? (20 + Math.floor(rnd() * 40)) : -(15 + Math.floor(rnd() * 35)));
    const op = topOps[Math.floor(rnd() * topOps.length)]?.name || 'Ash';
    return {
      result,
      map: mapName,
      mode,
      score: win ? `${rounds}-${enemyRounds}` : `${enemyRounds}-${rounds}`,
      kills: matchK,
      deaths: matchD,
      assists: matchA,
      kd: +((matchK / Math.max(1, matchD)).toFixed(2)),
      rpDelta,
      op,
      ago: agoString(cumAgoMin)
    };
  });

  // MMR trend — 20 points ending at current RP
  let mmr = rp - recentMatches.reduce((a, m) => a + m.rpDelta, 0);
  const mmrTrend = recentMatches.slice().reverse().map(m => {
    mmr += m.rpDelta;
    return { rp: mmr };
  });
  const lastRP = mmrTrend[mmrTrend.length - 1].rp;
  const offset = rp - lastRP;
  mmrTrend.forEach(p => { p.rp += offset; });

  // Season history (last 6 seasons)
  const seasons = ['Y11S1','Y10S4','Y10S3','Y10S2','Y10S1','Y9S4'];
  const seasonHistory = seasons.map((s, i) => {
    const adj = 1 - i * 0.05;
    const sRP = Math.max(1000, Math.round((seasonHighRp - i * 700 - rnd() * 400) * adj));
    const sRank = rankFromRP(sRP);
    const sMatches = Math.round(matches * (0.4 + rnd() * 0.8));
    const sWR = Math.max(30, Math.min(75, Math.round(wr + (rnd() - 0.5) * 8)));
    const sKD = +(Math.max(0.6, kd + (rnd() - 0.5) * 0.25).toFixed(2));
    return { season: s, tier: sRank.tier, tierKey: sRank.key, rp: sRP, matches: sMatches, wr: sWR, kd: sKD };
  });

  return {
    query: { name, platform },
    identity: {
      name,
      display: name,
      platform, // 'ubi' | 'psn' | 'xbl' — matches frontend labels map
      region: REGIONS[Math.floor(rnd() * REGIONS.length)],
      level: 50 + Math.floor(rnd() * 400)
    },
    rank: {
      tier: rank.tier,
      tierKey: rank.key,
      rp,
      progress,
      nextTier: nextRank ? nextRank.tier : null,
      toNext,
      seasonHigh,
      seasonHighRp,
      regionRank,
      globalRank,
      season: 'Y11S2',
      seasonName: 'Operation Tidal Torrent'
    },
    stats: {
      matches, wins, losses,
      wr, kd, hs,
      kills, deaths, assists,
      hours,
      kost,
      entryKd
    },
    operators,
    weapons,
    recentMatches,
    mmrTrend,
    seasonHistory,
    updated_at: new Date().toISOString(),
    bucket_id: bucket
  };
}

export default function handler(req, res) {
  const url = new URL(req.url, `http://${req.headers.host}`);
  const name = (url.searchParams.get('name') || '').trim();
  const platform = (url.searchParams.get('platform') || 'ubi').trim();
  res.setHeader('Cache-Control', 's-maxage=30, stale-while-revalidate=300');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.setHeader('Access-Control-Allow-Origin', '*');
  if (!name) {
    res.status(400).json({ error: 'name query param required' });
    return;
  }
  if (!['ubi','psn','xbl'].includes(platform)) {
    res.status(400).json({ error: 'platform must be ubi, psn, or xbl' });
    return;
  }
  res.status(200).json(buildProfile(name, platform));
}
