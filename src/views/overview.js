import { STAGES } from '../data/stages.js';
import { state } from '../store.js';
import { gS } from '../data/stages.js';
import { today, fmtD, fmtDT } from '../utils/date.js';
import { esc } from '../utils/dom.js';
import { LOST_CATEGORIES } from '../data/lostCategories.js';

export function renderOverview() {
  const container = document.getElementById('overviewInner');
  if (!container) return;

  const t = today();
  // Active = in pipeline but NOT quoting/bound/lost
  const totalActive     = state.leads.filter(l => !['quoted','bound','lost'].includes(l.stageId)).length;
  const totalQuoting    = state.leads.filter(l => l.stageId === 'quoted').length;
  const totalLost       = state.leads.filter(l => l.stageId === 'lost').length;
  const totalBound      = state.leads.filter(l => l.stageId === 'bound').length;

  const statsHtml = `<div class="ov-stats">
    <div class="ov-stat" style="background:#eff6ff">
      <div class="ov-stat-val" style="color:#2563eb">${totalActive}</div>
      <div class="ov-stat-lbl" style="color:#2563eb">Active</div>
    </div>
    <div class="ov-stat" style="background:#fefce8">
      <div class="ov-stat-val" style="color:#ca8a04">${totalQuoting}</div>
      <div class="ov-stat-lbl" style="color:#ca8a04">Quoting</div>
    </div>
    <div class="ov-stat" style="background:#fef2f2">
      <div class="ov-stat-val" style="color:#dc2626">${totalLost}</div>
      <div class="ov-stat-lbl" style="color:#dc2626">Lost</div>
    </div>
    <div class="ov-stat" style="background:#d1fae5">
      <div class="ov-stat-val" style="color:#10b981">${totalBound}</div>
      <div class="ov-stat-lbl" style="color:#10b981">Bound</div>
    </div>
  </div>`;

  // Monthly breakdown — keyed by leadDate (user-specified received date), falling back to createdAt
  const monthKey = iso => (iso || '').slice(0, 7); // 'YYYY-MM'
  const fmtMonth = key => {
    if (!key || key === 'unknown') return 'Unknown Date';
    const [y, m] = key.split('-');
    return new Date(+y, +m - 1, 1).toLocaleString('default', { month: 'long', year: 'numeric' });
  };
  const byMonth = {};
  state.leads.forEach(l => {
    // Use leadDate first (user-set received date), then createdAt
    const dateStr = l.leadDate || (l.createdAt ? l.createdAt.split('T')[0] : '');
    const key = monthKey(dateStr) || 'unknown';
    if (!byMonth[key]) byMonth[key] = { total: 0, active: 0, quoting: 0, lost: 0, won: 0 };
    byMonth[key].total++;
    if (l.stageId === 'bound') byMonth[key].won++;
    else if (l.stageId === 'lost') byMonth[key].lost++;
    else if (l.stageId === 'quoted') byMonth[key].quoting++;
    else byMonth[key].active++;
  });
  const months = Object.keys(byMonth).filter(k => k !== 'unknown').sort().reverse();
  if (byMonth['unknown']) months.push('unknown');

  const monthRows = months.length
    ? months.map(key => {
        const d = byMonth[key];
        const av = (n, cls) => `<div class="mb-val ${cls}${n===0?' zero':''}">${n}</div>`;
        return `<div class="mb-row">
          <div class="mb-month">${fmtMonth(key)}</div>
          ${av(d.total,'total')}
          ${av(d.active,'active')}
          ${av(d.quoting,'quoting')}
          ${av(d.lost,'lost')}
          ${av(d.won,'won')}
        </div>`;
      }).join('')
    : `<div style="padding:12px 8px;font-size:12px;color:#94a3b8">No leads yet — add your first lead to see monthly stats.</div>`;

  const monthBreakdownHtml = `<div class="month-breakdown">
    <div class="mb-title">📅 Monthly Breakdown <span style="font-weight:500;text-transform:none;letter-spacing:0;color:#94a3b8;font-size:10px">(based on date lead was added)</span></div>
    <div class="mb-head">
      <span>Month</span>
      <span class="mb-h-total">Total</span>
      <span class="mb-h-active">Active</span>
      <span class="mb-h-quoting">Quoting</span>
      <span class="mb-h-lost">Lost</span>
      <span class="mb-h-won">Bound</span>
    </div>
    ${monthRows}
  </div>`;

  // WEEKLY SUMMARY — resets every Monday at midnight local time
  const weekStart = new Date();
  const dow = weekStart.getDay(); // 0=Sun, 1=Mon … 6=Sat
  weekStart.setDate(weekStart.getDate() - (dow === 0 ? 6 : dow - 1));
  weekStart.setHours(0, 0, 0, 0);
  let newLeadsWeek = 0, dialsWeek = 0, apptsWeek = 0, lostWeek = 0;

  // New state.leads added this week
  state.leads.forEach(l => {
    if (l.createdAt && new Date(l.createdAt) >= weekStart) newLeadsWeek++;
  });

  // Dials, appointments, lost from activity logs
  state.leads.forEach(l => {
    (l.activity || []).forEach(a => {
      if (new Date(a.at) >= weekStart) {
        // Dials = any call attempt logged
        if (a.txt.includes('No Answer') || a.txt.includes('Voicemail') || a.txt.includes('Connected') || a.txt.includes('Callback') || a.txt.includes('Not Interested')) dialsWeek++;
        // Appointments = callback requests (scheduled follow-up)
        if (a.txt.includes('Callback requested')) apptsWeek++;
        // Lost this week
        if (a.txt.includes('marked lost') || a.txt.includes('→ Lost')) lostWeek++;
      }
    });
  });

  const weeklyHtml = `<div class="weekly-card" style="display:flex;gap:16px;margin-bottom:18px;flex-wrap:wrap">
    <div class="ov-stat" style="background:#f0f9ff;flex:1;min-width:120px">
      <div class="ov-stat-val" style="color:#2563eb">${newLeadsWeek}</div>
      <div class="ov-stat-lbl" style="color:#2563eb">New Leads Added</div>
    </div>
    <div class="ov-stat" style="background:#f0fdf4;flex:1;min-width:120px">
      <div class="ov-stat-val" style="color:#10b981">${dialsWeek}</div>
      <div class="ov-stat-lbl" style="color:#10b981">Dials Made</div>
    </div>
    <div class="ov-stat" style="background:#fefce8;flex:1;min-width:120px">
      <div class="ov-stat-val" style="color:#ca8a04">${apptsWeek}</div>
      <div class="ov-stat-lbl" style="color:#ca8a04">Appointments Set</div>
    </div>
    <div class="ov-stat" style="background:#fef2f2;flex:1;min-width:120px">
      <div class="ov-stat-val" style="color:#dc2626">${lostWeek}</div>
      <div class="ov-stat-lbl" style="color:#dc2626">Lost</div>
    </div>
  </div>`;

  // CONVERSION BY SOURCE
  const bySource = {};
  state.leads.forEach(l => {
    const src = l.source || 'Untracked';
    if (src === 'Untracked') return;
    if (!bySource[src]) bySource[src] = { total: 0, won: 0, lost: 0 };
    bySource[src].total++;
    if (l.stageId === 'bound') bySource[src].won++;
    if (l.stageId === 'lost') bySource[src].lost++;
  });


  // ── LOSS ANALYTICS ──────────────────────────────────────────────────────
  const lostLeads = state.leads.filter(l => l.stageId === 'lost');
  let lossAnalyticsHtml = '';

  if (lostLeads.length > 0) {
    // Reason breakdown
    const reasonCounts = {};
    LOST_CATEGORIES.forEach(c => { reasonCounts[c.id] = 0; });
    let uncategorized = 0;
    lostLeads.forEach(l => {
      if (l.lostCategory && reasonCounts[l.lostCategory] !== undefined) reasonCounts[l.lostCategory]++;
      else uncategorized++;
    });
    const maxCount = Math.max(...LOST_CATEGORIES.map(c => reasonCounts[c.id]), uncategorized, 1);

    const reasonRows = LOST_CATEGORIES.map(c => {
      const count = reasonCounts[c.id];
      const pct = Math.round((count / maxCount) * 100);
      return `<div style="display:grid;grid-template-columns:180px 1fr 40px;align-items:center;padding:6px 0;gap:10px">
        <div style="font-size:12px;font-weight:600;color:#1e293b;white-space:nowrap;overflow:hidden;text-overflow:ellipsis">${c.icon} ${esc(c.label)}</div>
        <div class="loss-bar-track"><div class="loss-bar-fill" style="width:${pct}%"></div></div>
        <div style="font-size:13px;font-weight:800;color:${count > 0 ? '#dc2626' : '#cbd5e1'};text-align:right">${count}</div>
      </div>`;
    }).join('');

    const uncatRow = uncategorized > 0 ? `<div style="display:grid;grid-template-columns:180px 1fr 40px;align-items:center;padding:6px 0;gap:10px">
      <div style="font-size:12px;font-weight:600;color:#94a3b8;font-style:italic">Uncategorized</div>
      <div class="loss-bar-track"><div class="loss-bar-fill" style="width:${Math.round((uncategorized / maxCount) * 100)}%;background:#d1d5db"></div></div>
      <div style="font-size:13px;font-weight:800;color:#94a3b8;text-align:right">${uncategorized}</div>
    </div>` : '';

    // Avg days before loss
    let totalDaysToLoss = 0, countWithDates = 0;
    lostLeads.forEach(l => {
      const created = l.createdAt ? new Date(l.createdAt) : null;
      const lostActivity = (l.activity || []).find(a =>
        a.txt && (a.txt.includes('→ Closed – Lost') || a.txt.includes('marked lost')));
      if (created && lostActivity) {
        const days = Math.floor((new Date(lostActivity.at) - created) / 86400000);
        if (days >= 0) { totalDaysToLoss += days; countWithDates++; }
      }
    });
    const avgDays = countWithDates > 0 ? Math.round(totalDaysToLoss / countWithDates) : '—';

    // Monthly loss trend
    const lostByMonth = {};
    const CAT_SHORT = { price: 'Price', competitor: 'Comp', timing: 'Timing', covered: 'Covered', unresponsive: 'Ghost', info_ghosted: 'Info', no_response: 'No Resp', decision_maker: 'DM No', unqualified: 'Unqual', other: 'Other' };
    lostLeads.forEach(l => {
      const dateStr = l.leadDate || (l.createdAt ? l.createdAt.split('T')[0] : '');
      const key = monthKey(dateStr) || 'unknown';
      if (!lostByMonth[key]) {
        lostByMonth[key] = {};
        LOST_CATEGORIES.forEach(c => { lostByMonth[key][c.id] = 0; });
      }
      if (l.lostCategory && lostByMonth[key][l.lostCategory] !== undefined) lostByMonth[key][l.lostCategory]++;
    });
    const lostMonths = Object.keys(lostByMonth).filter(k => k !== 'unknown').sort().reverse();

    const trendHead = `<div style="display:grid;grid-template-columns:100px repeat(10, 1fr);gap:0;margin-bottom:4px;align-items:center">
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.4px;color:#64748b">Month</div>
      ${LOST_CATEGORIES.map(c => `<div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.3px;color:#94a3b8;text-align:center">${CAT_SHORT[c.id]}</div>`).join('')}
    </div>`;

    const trendRows = lostMonths.length > 0 ? lostMonths.map(key => {
      const d = lostByMonth[key];
      return `<div style="display:grid;grid-template-columns:100px repeat(10, 1fr);gap:0;padding:6px 0;border-bottom:1px solid #f1f5f9;align-items:center">
        <div style="font-size:11px;font-weight:600;color:#475569">${fmtMonth(key)}</div>
        ${LOST_CATEGORIES.map(c => {
          const n = d[c.id];
          return `<div style="font-size:12px;font-weight:700;text-align:center;color:${n > 0 ? '#dc2626' : '#e2e8f0'}">${n}</div>`;
        }).join('')}
      </div>`;
    }).join('') : '<div style="padding:8px;font-size:11px;color:#94a3b8;text-align:center">No categorized losses yet</div>';

    lossAnalyticsHtml = `<div style="background:white;border-radius:12px;padding:14px 18px;margin-bottom:18px;box-shadow:0 1px 3px rgba(0,0,0,0.06);border-left:4px solid #dc2626">
      <div class="mb-title" style="color:#dc2626">❌ Loss Analytics</div>
      <div style="display:flex;gap:12px;margin-bottom:16px;flex-wrap:wrap">
        <div class="ov-stat" style="background:#fef2f2;flex:1;min-width:100px">
          <div class="ov-stat-val" style="color:#dc2626">${lostLeads.length}</div>
          <div class="ov-stat-lbl" style="color:#dc2626">Total Lost</div>
        </div>
        <div class="ov-stat" style="background:#fef2f2;flex:1;min-width:100px">
          <div class="ov-stat-val" style="color:#dc2626">${avgDays}${avgDays !== '—' ? 'd' : ''}</div>
          <div class="ov-stat-lbl" style="color:#dc2626">Avg Days to Loss</div>
        </div>
      </div>
      <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Reason Breakdown</div>
      <div style="margin-bottom:18px">${reasonRows}${uncatRow}</div>
      <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.5px">Monthly Loss Trend</div>
      ${trendHead}
      ${trendRows}
    </div>`;
  }

  // Extend source table to include Lost and Loss Rate columns
  const sourceRowsExtended = Object.keys(bySource).length > 0
    ? Object.keys(bySource).sort().map(src => {
        const d = bySource[src];
        const winRate = d.won + d.lost > 0 ? Math.round((d.won / (d.won + d.lost)) * 100) : '—';
        const lossRate = d.won + d.lost > 0 ? Math.round((d.lost / (d.won + d.lost)) * 100) : '—';
        return `<div style="display:grid;grid-template-columns:1fr 55px 55px 55px 55px 55px;align-items:center;padding:10px 8px;border-bottom:1px solid #f1f5f9">
          <div style="font-size:13px;font-weight:700;color:#1e293b">${esc(src)}</div>
          <div style="font-size:14px;font-weight:800;text-align:center;color:#64748b">${d.total}</div>
          <div style="font-size:14px;font-weight:800;text-align:center;color:#10b981">${d.won}</div>
          <div style="font-size:14px;font-weight:800;text-align:center;color:#dc2626">${d.lost}</div>
          <div style="font-size:13px;font-weight:700;text-align:center;color:#10b981">${winRate}${winRate !== '—' ? '%' : ''}</div>
          <div style="font-size:13px;font-weight:700;text-align:center;color:#dc2626">${lossRate}${lossRate !== '—' ? '%' : ''}</div>
        </div>`;
      }).join('')
    : '';

  const sourceBreakdownExtHtml = Object.keys(bySource).length > 0 ? `<div class="source-breakdown" style="background:white;border-radius:12px;padding:14px 18px;margin-bottom:18px;box-shadow:0 1px 3px rgba(0,0,0,0.06)">
    <div class="mb-title">📊 Conversion by Source</div>
    <div style="display:grid;grid-template-columns:1fr 55px 55px 55px 55px 55px;gap:0;margin-bottom:8px;align-items:center">
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#64748b">Source</div>
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#64748b;text-align:center">Total</div>
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#10b981;text-align:center">Won</div>
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#dc2626;text-align:center">Lost</div>
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#10b981;text-align:center">Win%</div>
      <div style="font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:0.5px;color:#dc2626;text-align:center">Loss%</div>
    </div>
    ${sourceRowsExtended}
  </div>` : '';

  container.innerHTML = `
    <div style="font-size:15px;font-weight:800;color:#1e293b;margin-bottom:14px">📊 Overview</div>
    <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:8px;text-transform:uppercase;letter-spacing:0.6px">This Week <span style="font-weight:500;text-transform:none;letter-spacing:0;color:#94a3b8;font-size:10px">(Mon ${fmtD(weekStart.toISOString().split('T')[0])} – now)</span></div>
    ${weeklyHtml}
    ${sourceBreakdownExtHtml}
    ${statsHtml}
    ${monthBreakdownHtml}
    ${lossAnalyticsHtml}
  `;
}
