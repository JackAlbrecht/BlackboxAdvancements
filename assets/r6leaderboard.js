// R6 Siege Ranked Leaderboard - live data fed by /api/r6-leaderboard
// Auto-refreshes every 60 seconds. On failure, keeps the last-good data
// and shows a red dot + cached timestamp.
(function () {
  'use strict';

  const FEED_URL = '/api/r6-leaderboard';
  const REFRESH_MS = 60 * 1000;

  const state = {
    data: null,
    filters: { platform: 'all', region: 'all' },
    search: '',
    sort: 'rp',
    lastUpdated: null,
    online: true
  };

  const platformLabels = { PC: 'PC', PS: 'PS', XBOX: 'Xbox' };
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
        <tr>
          <td class="col-rank ${rankClass}"><span class="rank-medal">${i + 1}</span></td>
          <td class="col-player">
            <div class="player-cell">
              <div class="player-avatar">${avatarInitials(p.name)}</div>
              <div>
                <div class="player-name">${p.display}</div>
                <div class="player-sub">${p.name} &middot; Champion</div>
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
          <td class="col-op"><span class="op-cell"><span class="op-dot"></span>${p.op}</span></td>
          <td class="col-profile"><a class="profile-link" href="${p.profile}" target="_blank" rel="noopener">Profile &rarr;</a></td>
        </tr>
      `;
    }).join('');
  }

  function renderOps() {
    const grid = document.getElementById('opsGrid');
    if (!state.data) return;
    grid.innerHTML = state.data.operators.map(op => `
      <div class="r6-op-card">
        <div class="r6-op-head">
          <div class="r6-op-name">${op.name}</div>
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
    document.getElementById('statTotal').textContent = fmtInt(players.length);
    document.getElementById('statTopRP').textContent = fmtInt(topRP);
    document.getElementById('statAvgKD').textContent = avgKD;
    renderStatus();
  }

  function renderStatus() {
    const el = document.getElementById('statUpdated');
    const live = document.getElementById('liveDot');
    if (!el) return;
    if (state.lastUpdated) {
      el.textContent = fmtClock(state.lastUpdated);
    } else {
      el.textContent = state.online ? '—' : 'offline';
    }
    if (live) {
      live.classList.toggle('offline', !state.online);
      live.nextSibling && (live.nextSibling.textContent = state.online
        ? ' LIVE · Y11S2 · OPERATION TIDAL TORRENT'
        : ' RECONNECTING · LAST DATA CACHED');
    }
  }

  function renderAll() {
    renderStats();
    renderBoard();
    renderOps();
  }

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
      const url = `https://r6.tracker.network/r6siege/profile/${platform}/${encodeURIComponent(name)}/overview`;
      window.open(url, '_blank', 'noopener');
    });

    // Manual refresh button (if present)
    const refreshBtn = document.getElementById('refreshBtn');
    if (refreshBtn) refreshBtn.addEventListener('click', fetchFeed);
  }

  document.addEventListener('DOMContentLoaded', () => {
    bind();
    fetchFeed();
    // Auto-refresh every 60 seconds
    setInterval(fetchFeed, REFRESH_MS);
    // Update the "last updated" clock display every second
    setInterval(() => {
      const el = document.getElementById('statUpdated');
      if (el && state.lastUpdated) {
        const secs = Math.floor((Date.now() - state.lastUpdated.getTime()) / 1000);
        el.textContent = secs < 5 ? 'just now' : `${secs}s ago`;
      }
    }, 1000);
  });
})();
