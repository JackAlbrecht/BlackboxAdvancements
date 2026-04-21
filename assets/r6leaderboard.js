// R6 Siege Ranked Leaderboard - live data
// Auto-refreshes every 30 seconds. Player lookup renders a full inline profile
// pulled from /api/r6-player. Live player count pulled from /api/r6-presence.
(function () {
  'use strict';

  const FEED_URL     = '/api/r6-leaderboard';
  const PLAYER_URL   = '/api/r6-player';
  const PRESENCE_URL = '/api/r6-presence';
  const REFRESH_MS   = 30 * 1000;
  const PRESENCE_MS  = 30 * 1000;

  const state = {
    data: null,
    presence: null,
    filters: { platform: 'all', region: 'all' },
    search: '',
    sort: 'rp',
    lastUpdated: null,
    online: true,
    currentPlayer: null
  };

  const platformLabels = { PC: 'PC', PS: 'PS', XBOX: 'Xbox' };
  const platformToCode = { PC: 'ubi', PS: 'psn', XBOX: 'xbl' };
  const avatarInitials = (name) => {
    const clean = (name || '').replace(/[^A-Za-z0-9]/g, '');
    return (clean[0] || 'R').toUpperCase() + ((clean[1] || '').toUpperCase());
  };
  const kdClass = (kd) => (kd >= 1.6 ? 'high' : (kd >= 1.35 ? 'mid' : 'low'));
  const fmtInt = (n) => Number(n || 0).toLocaleString('en-US');
  const fmtClock = (d) => {
    const hh = String(d.getHours()).padStart(2, '0');
    const mm = String(d.getMinutes()).padStart(2, '0');
    const ss = String(d.getSeconds()).padStart(2, '0');
    return `${hh}:${mm}:${ss}`;
  };
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => (
    { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]
  ));

  // -------- Leaderboard feed --------
  async function fetchFeed() {
    try {
      const res = await fetch(`${FEED_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      state.data = json;
      state.lastUpdated = new Date();
      state.online = true;
      renderAll();
    } catch (err) {
      state.online = false;
      renderStatus();
      console.warn('R6 feed fetch failed:', err);
    }
  }

  // -------- Presence feed --------
  async function fetchPresence() {
    try {
      const res = await fetch(`${PRESENCE_URL}?t=${Date.now()}`, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      state.presence = json;
      renderPresence();
    } catch (err) {
      console.warn('R6 presence fetch failed:', err);
    }
  }

  function renderPresence() {
    const p = state.presence;
    if (!p) return;
    const set = (id, v) => { const el = document.getElementById(id); if (el) el.textContent = v; };
    set('onlineGlobal', fmtInt(p.global));
    set('onlinePC',    fmtInt(p.platforms.pc));
    set('onlinePS',    fmtInt(p.platforms.ps));
    set('onlineXB',    fmtInt(p.platforms.xb));
    set('onlineRanked', fmtInt(p.queue.ranked));
    set('onlineQueue', `~${p.queue.avg_wait_seconds}s`);
    set('statTotal', fmtInt(p.queue.matches_in_progress));
  }

  function filtered() {
    if (!state.data) return [];
    return state.data.players
      .filter(p => state.filters.platform === 'all' ? true : p.platform === state.filters.platform)
      .filter(p => state.filters.region === 'all' ? true : p.region === state.filters.region)
      .filter(p => !state.search || p.display.toLowerCase().includes(state.search));
  }

  function renderBoard() {
    const body = document.getElementById('boardBody');
    const empty = document.getElementById('boardEmpty');
    if (!state.data) {
      body.innerHTML = '<tr><td colspan="11" class="r6-empty">Loading live feed&hellip;</td></tr>';
      return;
    }
    const rows = filtered().slice().sort((a, b) => {
      const key = state.sort;
      return (b[key] || 0) - (a[key] || 0);
    });

    if (!rows.length) {
      body.innerHTML = '';
      empty.hidden = false;
      return;
    }
    empty.hidden = true;

    const maxRP = Math.max(...rows.map(p => p.rp));
    body.innerHTML = rows.map((p, i) => {
      const rankClass = i === 0 ? 'top-1' : i === 1 ? 'top-2' : i === 2 ? 'top-3' : '';
      const pct = Math.max(8, Math.round((p.rp / maxRP) * 100));
      return `
        <tr class="player-row" data-player-name="${esc(p.name)}" data-player-platform="${platformToCode[p.platform] || 'ubi'}">
          <td class="col-rank ${rankClass}"><span class="rank-medal">${i + 1}</span></td>
          <td class="col-player">
            <div class="player-cell">
              <div class="player-avatar">${avatarInitials(p.name)}</div>
              <div>
                <div class="player-name">${esc(p.display)}</div>
                <div class="player-sub">${esc(p.name)} &middot; Champion</div>
              </div>
            </div>
          </td>
          <td class="col-platform"><span class="badge ${p.platform.toLowerCase()}">${platformLabels[p.platform]}</span></td>
          <td class="col-region"><span class="badge region">${p.region}</span></td>
          <td class="col-rp">
            <div class="rp-cell">${fmtInt(p.rp)}</div>
            <span class="rp-bar" style="width:${pct}%"></span>
          </td>
          <td class="col-kd"><span class="kd-cell ${kdClass(p.kd)}">${p.kd.toFixed(2)}</span></td>
          <td class="col-wr"><span class="wr-cell">${p.wr}%</span></td>
          <td class="col-hs"><span class="hs-cell">${p.hs}%</span></td>
          <td class="col-matches"><span class="matches-cell">${fmtInt(p.matches)}</span></td>
          <td class="col-op"><span class="op-cell"><span class="op-dot"></span>${esc(p.op)}</span></td>
          <td class="col-profile"><button type="button" class="profile-link row-lookup">View &rarr;</button></td>
        </tr>
      `;
    }).join('');

    // Row click -> load inline profile
    document.querySelectorAll('.player-row').forEach(row => {
      row.addEventListener('click', () => {
        const name = row.dataset.playerName;
        const platform = row.dataset.playerPlatform;
        document.getElementById('lookupName').value = name;
        document.getElementById('lookupPlatform').value = platform;
        loadPlayer(name, platform);
      });
    });
  }

  function renderOps() {
    const grid = document.getElementById('opsGrid');
    if (!state.data) return;
    grid.innerHTML = state.data.operators.map(op => `
      <div class="r6-op-card">
        <div class="r6-op-head">
          <div class="r6-op-name">${esc(op.name)}</div>
          <div class="r6-op-side ${op.side}">${op.side.toUpperCase()}</div>
        </div>
        <div class="r6-op-meter">
          <div class="r6-op-meter-row"><span>Pick rate</span><span>${op.pick}%</span></div>
          <div class="r6-op-meter-bar"><div class="r6-op-meter-fill" style="width:${op.pick}%"></div></div>
          <div class="r6-op-meter-row"><span>Ban rate</span><span>${op.ban}%</span></div>
          <div class="r6-op-meter-bar"><div class="r6-op-meter-fill ban" style="width:${op.ban}%"></div></div>
        </div>
      </div>
    `).join('');
  }

  function renderStats() {
    if (!state.data) return;
    const players = state.data.players;
    const top50 = players.slice(0, 50);
    const topRP = Math.max(...players.map(p => p.rp));
    const avgKD = (top50.reduce((a, p) => a + p.kd, 0) / top50.length).toFixed(2);
    document.getElementById('statTopRP').textContent = fmtInt(topRP);
    document.getElementById('statAvgKD').textContent = avgKD;
    renderStatus();
  }

  function renderStatus() {
    const el = document.getElementById('statUpdated');
    const live = document.getElementById('liveDot');
    const label = document.getElementById('liveLabel');
    if (!el) return;
    if (state.lastUpdated) {
      el.textContent = fmtClock(state.lastUpdated);
    } else {
      el.textContent = state.online ? '—' : 'offline';
    }
    if (live) live.classList.toggle('offline', !state.online);
    if (label) label.textContent = state.online
      ? ' LIVE · Y11S2 · OPERATION TIDAL TORRENT'
      : ' RECONNECTING · LAST DATA CACHED';
  }

  function renderAll() {
    renderStats();
    renderBoard();
    renderOps();
  }

  // -------- Inline player profile --------
  async function loadPlayer(name, platform) {
    if (!name) return;
    state.currentPlayer = { name, platform };
    const panel = document.getElementById('playerPanel');
    const loading = document.getElementById('playerLoading');
    const err = document.getElementById('playerError');
    const body = document.getElementById('playerBody');
    panel.hidden = false;
    err.hidden = true;
    body.innerHTML = '';
    loading.hidden = false;

    try {
      const url = `${PLAYER_URL}?name=${encodeURIComponent(name)}&platform=${encodeURIComponent(platform)}&t=${Date.now()}`;
      const res = await fetch(url, { cache: 'no-store' });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const p = await res.json();
      renderPlayer(p);
      // Smooth scroll to panel
      panel.scrollIntoView({ behavior: 'smooth', block: 'start' });
    } catch (e) {
      err.textContent = 'Could not load that profile. Check the gamertag and platform, then try again.';
      err.hidden = false;
      console.warn('player fetch failed:', e);
    } finally {
      loading.hidden = true;
    }
  }

  function renderPlayer(p) {
    const body = document.getElementById('playerBody');
    const platformLabel = { ubi: 'PC', psn: 'PS', xbl: 'Xbox' }[p.identity.platform] || 'PC';
    const rp = p.rank;
    const st = p.stats;

    // Rank progress bar (0-100)
    const rankPct = Math.max(2, Math.min(100, rp.progress));

    // MMR sparkline SVG
    const mmr = p.mmrTrend || [];
    const mmrSvg = buildSparkline(mmr);

    // Operators table
    const opsRows = (p.operators || []).map(op => `
      <tr>
        <td><span class="op-chip op-${op.side}">${esc(op.name)}</span></td>
        <td class="t-num">${fmtInt(op.rounds)}</td>
        <td class="t-num"><span class="kd-cell ${kdClass(op.kd)}">${op.kd.toFixed(2)}</span></td>
        <td class="t-num">${op.wr}%</td>
        <td class="t-num">${op.hs}%</td>
        <td><span class="mini-bar"><span style="width:${op.playtimePct}%"></span></span></td>
      </tr>
    `).join('');

    // Weapons table
    const wpnRows = (p.weapons || []).map(w => `
      <tr>
        <td><span class="wpn-chip">${esc(w.name)}</span><span class="wpn-type">${esc(w.type)}</span></td>
        <td class="t-num">${fmtInt(w.kills)}</td>
        <td class="t-num">${w.hs}%</td>
        <td><span class="mini-bar"><span style="width:${w.usagePct}%"></span></span></td>
      </tr>
    `).join('');

    // Recent matches
    const matchRows = (p.recentMatches || []).map(m => {
      const cls = m.result === 'W' ? 'win' : (m.result === 'L' ? 'loss' : 'draw');
      const rpDelta = (m.rpDelta > 0 ? '+' : '') + m.rpDelta;
      return `
        <tr class="match-row ${cls}">
          <td><span class="match-chip ${cls}">${m.result === 'W' ? 'WIN' : m.result === 'L' ? 'LOSS' : 'DRAW'}</span></td>
          <td>${esc(m.map)}</td>
          <td class="t-mono">${esc(m.mode)}</td>
          <td class="t-num">${m.score}</td>
          <td class="t-num">${m.kills}/${m.deaths}/${m.assists}</td>
          <td class="t-num"><span class="kd-cell ${kdClass(m.kd)}">${m.kd.toFixed(2)}</span></td>
          <td class="t-num rp-delta ${cls}">${rpDelta} RP</td>
          <td class="t-mono small">${esc(m.op)}</td>
          <td class="t-mono small">${esc(m.ago)}</td>
        </tr>
      `;
    }).join('');

    // Season history
    const histRows = (p.seasonHistory || []).map(s => `
      <tr>
        <td>${esc(s.season)}</td>
        <td><span class="tier-chip tier-${s.tierKey}">${esc(s.tier)}</span></td>
        <td class="t-num">${fmtInt(s.rp)}</td>
        <td class="t-num">${fmtInt(s.matches)}</td>
        <td class="t-num">${s.wr}%</td>
        <td class="t-num"><span class="kd-cell ${kdClass(s.kd)}">${s.kd.toFixed(2)}</span></td>
      </tr>
    `).join('');

    body.innerHTML = `
      <div class="p-head">
        <div class="p-identity">
          <div class="p-avatar">${avatarInitials(p.identity.name)}</div>
          <div>
            <div class="p-name">${esc(p.identity.display || p.identity.name)}</div>
            <div class="p-meta">
              <span class="badge ${platformLabel.toLowerCase()}">${platformLabel}</span>
              <span class="badge region">${esc(p.identity.region)}</span>
              <span class="p-level">Level ${fmtInt(p.identity.level)}</span>
              <span class="p-uplay">${esc(p.identity.name)}</span>
            </div>
          </div>
        </div>
        <div class="p-rank-card">
          <div class="p-rank-top">
            <div class="p-rank-badge tier-${rp.tierKey}">${esc(rp.tier)}</div>
            <div>
              <div class="p-rp">${fmtInt(rp.rp)} <span>RP</span></div>
              <div class="p-rank-next">${rp.nextTier ? `${fmtInt(rp.toNext)} to ${esc(rp.nextTier)}` : 'Max rank'}</div>
            </div>
          </div>
          <div class="p-rank-bar"><div class="p-rank-fill" style="width:${rankPct}%"></div></div>
          <div class="p-rank-extra">
            <div><span>Season high</span><strong>${esc(rp.seasonHigh)} &middot; ${fmtInt(rp.seasonHighRp)} RP</strong></div>
            <div><span>Rank on region</span><strong>#${fmtInt(rp.regionRank)}</strong></div>
            <div><span>Global rank</span><strong>#${fmtInt(rp.globalRank)}</strong></div>
          </div>
        </div>
      </div>

      <div class="p-stat-grid">
        <div class="p-stat"><span>Matches</span><strong>${fmtInt(st.matches)}</strong></div>
        <div class="p-stat"><span>Wins</span><strong>${fmtInt(st.wins)}</strong></div>
        <div class="p-stat"><span>Losses</span><strong>${fmtInt(st.losses)}</strong></div>
        <div class="p-stat"><span>Win Rate</span><strong>${st.wr}%</strong></div>
        <div class="p-stat"><span>K/D</span><strong class="${kdClass(st.kd)}">${st.kd.toFixed(2)}</strong></div>
        <div class="p-stat"><span>HS %</span><strong>${st.hs}%</strong></div>
        <div class="p-stat"><span>Kills</span><strong>${fmtInt(st.kills)}</strong></div>
        <div class="p-stat"><span>Deaths</span><strong>${fmtInt(st.deaths)}</strong></div>
        <div class="p-stat"><span>Assists</span><strong>${fmtInt(st.assists)}</strong></div>
        <div class="p-stat"><span>Playtime</span><strong>${fmtInt(st.hours)}h</strong></div>
        <div class="p-stat"><span>Avg KOST</span><strong>${st.kost}%</strong></div>
        <div class="p-stat"><span>Entry KD</span><strong class="${kdClass(st.entryKd)}">${st.entryKd.toFixed(2)}</strong></div>
      </div>

      <div class="p-chart-card">
        <div class="p-chart-head">
          <h3>MMR trend &middot; last ${mmr.length} matches</h3>
          <div class="p-chart-legend">
            <span class="legend-dot up"></span> Gain
            <span class="legend-dot down"></span> Loss
          </div>
        </div>
        ${mmrSvg}
      </div>

      <div class="p-split">
        <div class="p-card">
          <h3>Top operators</h3>
          <div class="p-table-wrap">
            <table class="p-table">
              <thead><tr><th>Operator</th><th>Rounds</th><th>KD</th><th>Win %</th><th>HS %</th><th>Playtime</th></tr></thead>
              <tbody>${opsRows}</tbody>
            </table>
          </div>
        </div>
        <div class="p-card">
          <h3>Top weapons</h3>
          <div class="p-table-wrap">
            <table class="p-table">
              <thead><tr><th>Weapon</th><th>Kills</th><th>HS %</th><th>Usage</th></tr></thead>
              <tbody>${wpnRows}</tbody>
            </table>
          </div>
        </div>
      </div>

      <div class="p-card">
        <h3>Recent matches</h3>
        <div class="p-table-wrap">
          <table class="p-table match-table">
            <thead><tr><th>Result</th><th>Map</th><th>Mode</th><th>Score</th><th>K/D/A</th><th>KD</th><th>RP</th><th>Op</th><th>When</th></tr></thead>
            <tbody>${matchRows}</tbody>
          </table>
        </div>
      </div>

      <div class="p-card">
        <h3>Season history</h3>
        <div class="p-table-wrap">
          <table class="p-table">
            <thead><tr><th>Season</th><th>Peak</th><th>RP</th><th>Matches</th><th>Win %</th><th>KD</th></tr></thead>
            <tbody>${histRows}</tbody>
          </table>
        </div>
      </div>

      <div class="p-footer">
        <span>Profile updates every 30 seconds &middot; last pulled ${new Date().toLocaleTimeString()}</span>
      </div>
    `;
  }

  function buildSparkline(points) {
    if (!points || points.length < 2) return '<div class="p-chart-empty">Not enough data.</div>';
    const w = 760, h = 140, pad = 8;
    const vals = points.map(p => p.rp);
    const min = Math.min(...vals), max = Math.max(...vals);
    const range = Math.max(1, max - min);
    const stepX = (w - pad * 2) / (points.length - 1);
    const xy = points.map((p, i) => [
      pad + i * stepX,
      h - pad - ((p.rp - min) / range) * (h - pad * 2)
    ]);
    const path = xy.map((pt, i) => (i === 0 ? `M${pt[0]},${pt[1]}` : `L${pt[0]},${pt[1]}`)).join(' ');
    const area = `${path} L${xy[xy.length-1][0]},${h - pad} L${xy[0][0]},${h - pad} Z`;
    const dots = xy.map((pt, i) => {
      const prev = i === 0 ? pt[1] : xy[i-1][1];
      const cls = pt[1] < prev ? 'up' : 'down';
      return `<circle class="dot ${cls}" cx="${pt[0]}" cy="${pt[1]}" r="3" />`;
    }).join('');
    return `
      <svg class="p-spark" viewBox="0 0 ${w} ${h}" preserveAspectRatio="none" role="img" aria-label="MMR trend">
        <defs>
          <linearGradient id="mmrGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#ff7a1a" stop-opacity="0.35"/>
            <stop offset="100%" stop-color="#ff7a1a" stop-opacity="0"/>
          </linearGradient>
        </defs>
        <path d="${area}" fill="url(#mmrGrad)" />
        <path d="${path}" fill="none" stroke="#ff7a1a" stroke-width="2" />
        ${dots}
      </svg>
    `;
  }

  // -------- Bindings --------
  function bind() {
    document.querySelectorAll('[data-filter-platform]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-platform]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filters.platform = btn.dataset.filterPlatform;
        renderBoard();
      });
    });
    document.querySelectorAll('[data-filter-region]').forEach(btn => {
      btn.addEventListener('click', () => {
        document.querySelectorAll('[data-filter-region]').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        state.filters.region = btn.dataset.filterRegion;
        renderBoard();
      });
    });
    document.getElementById('boardSearch').addEventListener('input', (e) => {
      state.search = e.target.value.trim().toLowerCase();
      renderBoard();
    });
    document.querySelectorAll('.r6-table th.sortable').forEach(th => {
      th.addEventListener('click', () => {
        state.sort = th.dataset.sort;
        document.querySelectorAll('.r6-table th.sortable').forEach(t => { t.innerHTML = t.innerHTML.replace(' \u25BE', ''); });
        th.innerHTML = th.innerHTML + ' \u25BE';
        renderBoard();
      });
    });

    document.getElementById('lookupForm').addEventListener('submit', (e) => {
      e.preventDefault();
      const platform = document.getElementById('lookupPlatform').value;
      const name = document.getElementById('lookupName').value.trim();
      if (!name) return;
      loadPlayer(name, platform);
    });

    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', () => {
      fetchFeed();
      fetchPresence();
      if (state.currentPlayer) loadPlayer(state.currentPlayer.name, state.currentPlayer.platform);
    });
  }

  document.addEventListener('DOMContentLoaded', () => {
    bind();
    fetchFeed();
    fetchPresence();
    // Auto-refresh every 30 seconds
    setInterval(() => {
      fetchFeed();
      // Refresh player view if one is open
      if (state.currentPlayer) loadPlayer(state.currentPlayer.name, state.currentPlayer.platform);
    }, REFRESH_MS);
    setInterval(fetchPresence, PRESENCE_MS);
    // "last updated" clock
    setInterval(() => {
      const el = document.getElementById('statUpdated');
      if (el && state.lastUpdated) {
        const secs = Math.floor((Date.now() - state.lastUpdated.getTime()) / 1000);
        el.textContent = secs < 5 ? 'just now' : `${secs}s ago`;
      }
    }, 1000);
  });
})();
