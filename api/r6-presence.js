// /api/r6-presence.js
// Live-feel player count for R6 leaderboard hero strip.
// Deterministic per 30-second bucket so refreshes drift smoothly.

export default function handler(req, res) {
  const now = Date.now();
  const BUCKET = 30 * 1000; // 30s drift
  const bucket = Math.floor(now / BUCKET);

  const date = new Date(now);
  const hour = date.getUTCHours() + date.getUTCMinutes() / 60;
  const day = date.getUTCDay();

  // Prime-time EU/NA centered at ~20:00 UTC.
  const hourFactor = 0.5 + 0.5 * Math.cos(((hour - 20) / 24) * Math.PI * 2);
  // Weekend lift (Fri/Sat/Sun)
  const weekendLift = (day === 0 || day === 5 || day === 6) ? 1.12 : 1.0;

  const base = 112000;
  const swing = 68000;
  let global = base + swing * hourFactor;
  global *= weekendLift;

  // Per-bucket jitter so number moves every 30s
  const jitter = Math.sin(bucket * 1.7) * 0.006 + Math.sin(bucket * 0.31) * 0.004;
  global *= (1 + jitter);
  global = Math.round(global);

  // Platform split
  const pc = Math.round(global * (0.54 + Math.sin(bucket * 0.21) * 0.01));
  const ps = Math.round(global * (0.27 + Math.sin(bucket * 0.33) * 0.008));
  const xb = global - pc - ps;

  // Region split
  const regions = [
    { key: 'NCSA', label: 'North/Central/South America', share: 0.38 },
    { key: 'EMEA', label: 'Europe/Middle East/Africa',   share: 0.34 },
    { key: 'APAC', label: 'Asia-Pacific',                share: 0.22 },
    { key: 'OCE',  label: 'Oceania',                     share: 0.06 },
  ].map((r, i) => {
    const wobble = Math.sin(bucket * (0.4 + i * 0.17)) * 0.012;
    return { ...r, players: Math.round(global * (r.share + wobble)) };
  });

  // Ranked queue depth
  const ranked = Math.round(global * (0.41 + Math.sin(bucket * 0.27) * 0.02));
  const casual = global - ranked;

  const matchesInProgress = Math.round(global / 10);
  const queueWait = Math.round(18 + Math.sin(bucket * 0.5) * 7 + (1 - hourFactor) * 15);

  res.setHeader('Cache-Control', 's-maxage=15, stale-while-revalidate=60');
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(200).json({
    updated_at: new Date(now).toISOString(),
    bucket_id: bucket,
    global,
    platforms: { pc, ps, xb },
    regions,
    queue: {
      ranked,
      casual,
      matches_in_progress: matchesInProgress,
      avg_wait_seconds: queueWait,
    },
  });
}
