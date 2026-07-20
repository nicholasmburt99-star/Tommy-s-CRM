import { state } from '../store.js';
import { esc } from '../utils/dom.js';
import { fmtD, fmtDT, today, addDays } from '../utils/date.js';

// ── Constants ────────────────────────────────────────────────────────────────
const CATEGORIES = {
  agent: { label: 'Agent/Broker', bg: '#eff6ff', color: '#2563eb' },
  cpa: { label: 'CPA', bg: '#f0fdf4', color: '#15803d' },
  attorney: { label: 'Attorney', bg: '#fef3c7', color: '#92400e' },
  financial_advisor: { label: 'Financial Advisor', bg: '#e0f2fe', color: '#0369a1' },
  hr_consultant: { label: 'Realtor / Real Estate', bg: '#fce7f3', color: '#9d174d' },
  carrier: { label: 'Carrier', bg: '#e0e7ff', color: '#3730a3' },
  tpa: { label: 'Claims Adjuster', bg: '#f5f3ff', color: '#6d28d9' },
  payroll: { label: 'Mortgage Lender', bg: '#fef2f2', color: '#991b1b' },
  retirement_401k: { label: 'Property Manager', bg: '#ecfdf5', color: '#047857' },
  other: { label: 'Other', bg: '#f3f4f6', color: '#374151' },
};

const INT_ICONS = { call: '📞', email: '✉️', lunch: '🍽️', event: '🎪', other: '📌' };
const INT_LABELS = { call: 'Call', email: 'Email', lunch: 'Lunch/Coffee', event: 'Event', other: 'Other' };
const INT_COLORS = { call: '#10b981', email: '#2563eb', lunch: '#f59e0b', event: '#8b5cf6', other: '#64748b' };
const HEALTH_COLORS = { green: '#10b981', yellow: '#f59e0b', red: '#ef4444' };

// ── Filter state ─────────────────────────────────────────────────────────────
let nwFilter = { category: '', health: '' };

// ── Helpers ──────────────────────────────────────────────────────────────────
export function partnerHealth(p) {
  if (!p.interactions || !p.interactions.length) return 'red';
  const last = p.interactions[p.interactions.length - 1];
  const diff = Math.floor((Date.now() - new Date(last.at).getTime()) / 86400000);
  if (diff <= 30) return 'green';
  if (diff <= 45) return 'yellow';
  return 'red';
}

function lastContactAgo(p) {
  if (!p.interactions || !p.interactions.length) return 'Never';
  const last = p.interactions[p.interactions.length - 1];
  const diff = Math.floor((Date.now() - new Date(last.at).getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return '1d ago';
  if (diff < 14) return diff + 'd ago';
  if (diff < 60) return Math.floor(diff / 7) + 'wk ago';
  return Math.floor(diff / 30) + 'mo ago';
}

function healthDot(color) {
  return `<span style="display:inline-block;width:10px;height:10px;border-radius:50%;background:${HEALTH_COLORS[color]}"></span>`;
}

function strengthStars(n) {
  return [1,2,3,4,5].map(i => i <= n ? '★' : '☆').join('');
}

function catPill(cat) {
  const c = CATEGORIES[cat] || CATEGORIES.other;
  return `<span class="nw-cat-pill" style="background:${c.bg};color:${c.color}">${c.label}</span>`;
}

function dueBadge(d) {
  if (!d) return '';
  const t = new Date(); t.setHours(0,0,0,0);
  const due = new Date(d + 'T00:00:00');
  const diff = Math.round((due - t) / 86400000);
  if (diff < 0) return `<span class="pl-badge pl-badge-overdue">⚠ ${Math.abs(diff)}d overdue</span>`;
  if (diff === 0) return `<span class="pl-badge pl-badge-today">Today</span>`;
  if (diff <= 3) return `<span class="pl-badge pl-badge-soon">In ${diff}d</span>`;
  return '';
}

function chip(label, active, onclick) {
  return `<button class="pl-chip${active ? ' pl-chip-active' : ''}" onclick="${onclick}">${label}</button>`;
}

// ── Exports for badge/toast ──────────────────────────────────────────────────
export function getOverdueCount() {
  return (state.partners || []).filter(p => partnerHealth(p) === 'red').length;
}

export function setNetworkFilter(key, val) {
  nwFilter[key] = nwFilter[key] === val ? '' : val;
  renderNetwork();
}

// ── Main renderer ────────────────────────────────────────────────────────────
export function renderNetwork() {
  const container = document.getElementById('networkTable');
  if (!container) return;

  let partners = [...(state.partners || [])];

  // Apply filters
  if (nwFilter.category) partners = partners.filter(p => p.category === nwFilter.category);
  if (nwFilter.health) partners = partners.filter(p => partnerHealth(p) === nwFilter.health);

  // Sort: red first, then yellow, then green; within same health, by days since last contact desc
  const healthOrder = { red: 0, yellow: 1, green: 2 };
  partners.sort((a, b) => {
    const ha = healthOrder[partnerHealth(a)], hb = healthOrder[partnerHealth(b)];
    if (ha !== hb) return ha - hb;
    const da = a.interactions?.length ? new Date(a.interactions[a.interactions.length-1].at).getTime() : 0;
    const db = b.interactions?.length ? new Date(b.interactions[b.interactions.length-1].at).getTime() : 0;
    return da - db; // oldest contact first
  });

  // Category filter chips
  const catChips = [chip('All', !nwFilter.category, "setNetworkFilter('category','')")]
    .concat(Object.entries(CATEGORIES).map(([k,v]) =>
      chip(v.label, nwFilter.category === k, `setNetworkFilter('category','${k}')`)
    )).join('');

  // Health filter chips
  const healthChips = [
    chip('All', !nwFilter.health, "setNetworkFilter('health','')"),
    chip('🟢 Healthy', nwFilter.health === 'green', "setNetworkFilter('health','green')"),
    chip('🟡 At Risk', nwFilter.health === 'yellow', "setNetworkFilter('health','yellow')"),
    chip('🔴 Overdue', nwFilter.health === 'red', "setNetworkFilter('health','red')"),
  ].join('');

  // Table rows
  const rows = partners.length
    ? partners.map(p => {
        const sel = state.networkSelId === p.id;
        return `<div class="nw-row${sel ? ' nw-row-selected' : ''}" onclick="selectPartner('${p.id}')">
          <div class="nw-row-health">${healthDot(partnerHealth(p))}</div>
          <div class="nw-row-info">
            <div class="nw-row-name">${esc(p.name)}</div>
            <div class="nw-row-company">${esc(p.company || '')}</div>
          </div>
          <div class="nw-row-category">${p.category ? catPill(p.category) : ''}</div>
          <div class="nw-row-strength" style="color:#f59e0b">${p.strength ? strengthStars(p.strength) : '<span style="color:#e2e8f0">☆☆☆☆☆</span>'}</div>
          <div class="nw-row-last">${lastContactAgo(p)}</div>
          <div class="nw-row-outreach">${p.nextOutreach ? fmtD(p.nextOutreach) : '—'} ${dueBadge(p.nextOutreach)}</div>
        </div>`;
      }).join('')
    : `<div style="color:#94a3b8;font-size:13px;text-align:center;padding:40px 20px">
        <div style="font-size:32px;margin-bottom:8px">🤝</div>
        <div style="font-weight:700;margin-bottom:4px">${state.partners.length ? 'No matches' : 'No partners yet'}</div>
        <div>Click "+ Add Partner" to get started</div>
      </div>`;

  container.innerHTML = `
    <div class="nw-header">
      <div class="nw-title">🤝 Networking</div>
      <div class="nw-count">${state.partners.length} partner${state.partners.length !== 1 ? 's' : ''}</div>
      <button class="okr-add-btn" onclick="openAddPartnerModal()">+ Add Partner</button>
    </div>
    <div class="nw-filters">
      <div style="display:flex;gap:4px;flex-wrap:wrap">${catChips}</div>
      <div style="display:flex;gap:4px;flex-wrap:wrap">${healthChips}</div>
    </div>
    <div class="nw-thead">
      <div class="nw-th"></div>
      <div class="nw-th">Name</div>
      <div class="nw-th">Category</div>
      <div class="nw-th">Strength</div>
      <div class="nw-th">Last</div>
      <div class="nw-th">Next</div>
    </div>
    <div class="nw-list">${rows}</div>
  `;

  // Render detail panel
  renderNetworkDetail();
}

// ── Detail panel ─────────────────────────────────────────────────────────────
function renderNetworkDetail() {
  const panel = document.getElementById('network-detail');
  if (!panel) return;

  if (!state.networkSelId) {
    panel.innerHTML = `<div class="no-sel"><div class="ni">🤝</div><h2>Select a partner</h2><p>Click a row to view details</p></div>`;
    return;
  }

  const p = state.partners.find(x => x.id === state.networkSelId);
  if (!p) { state.networkSelId = null; renderNetworkDetail(); return; }

  const cat = CATEGORIES[p.category] || CATEGORIES.other;

  // Strength stars (clickable)
  const stars = [1,2,3,4,5].map(i =>
    `<button class="nw-star${i <= p.strength ? ' filled' : ''}" onclick="setPartnerStrength('${p.id}',${i})">${i <= p.strength ? '★' : '☆'}</button>`
  ).join('');

  // Contact info
  const contactRows = [
    p.phone ? `<div class="nw-detail-row"><span class="nw-detail-label">Phone</span><span class="nw-detail-val"><a href="tel:${esc(p.phone)}" style="color:#2563eb;text-decoration:none">${esc(p.phone)}</a></span></div>` : '',
    p.email ? `<div class="nw-detail-row"><span class="nw-detail-label">Email</span><span class="nw-detail-val"><a href="mailto:${esc(p.email)}" style="color:#2563eb;text-decoration:none">${esc(p.email)}</a></span></div>` : '',
    p.specialty ? `<div class="nw-detail-row"><span class="nw-detail-label">Specialty</span><span class="nw-detail-val">${esc(p.specialty)}</span></div>` : '',
    p.howMet ? `<div class="nw-detail-row"><span class="nw-detail-label">How Met</span><span class="nw-detail-val">${esc(p.howMet)}</span></div>` : '',
    p.geoOverlap ? `<div class="nw-detail-row"><span class="nw-detail-label">Geo Overlap</span><span class="nw-detail-val">${esc(p.geoOverlap)}</span></div>` : '',
    p.mutualClients ? `<div class="nw-detail-row"><span class="nw-detail-label">Mutual Clients</span><span class="nw-detail-val">${esc(p.mutualClients)}</span></div>` : '',
  ].filter(Boolean).join('');

  // Outreach bar
  const outreachBar = `<div class="nw-outreach-bar">
    <label style="font-size:11px;font-weight:700;color:#475569">📅 Next Outreach:</label>
    <input type="date" style="padding:4px 8px;border:1px solid #e2e8f0;border-radius:6px;font-size:12px;font-family:inherit" value="${p.nextOutreach || ''}" onchange="setPartnerNextOutreach('${p.id}',this.value)">
    ${dueBadge(p.nextOutreach)}
    <div style="flex:1"></div>
    <button class="btn bg" style="font-size:10px;padding:3px 8px" onclick="setPartnerNextOutreach('${p.id}','${addDays(7)}')">+1wk</button>
    <button class="btn bg" style="font-size:10px;padding:3px 8px" onclick="setPartnerNextOutreach('${p.id}','${addDays(14)}')">+2wk</button>
    <button class="btn bg" style="font-size:10px;padding:3px 8px" onclick="setPartnerNextOutreach('${p.id}','${addDays(30)}')">+1mo</button>
  </div>`;

  // Interaction timeline
  const ints = (p.interactions || []);
  const intHtml = ints.length
    ? [...ints].map((int, realIdx) => ({ int, realIdx })).reverse().map(({ int, realIdx }) => {
        const icon = INT_ICONS[int.type] || '📌';
        const label = INT_LABELS[int.type] || 'Other';
        const borderColor = INT_COLORS[int.type] || '#64748b';
        const btnStyle = 'background:none;border:none;cursor:pointer;font-size:11px;color:#94a3b8;padding:1px 4px;border-radius:4px';
        return `<div class="note-item" style="border-left-color:${borderColor}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="note-meta">${icon} ${label} · ${fmtDT(int.at)}</div>
            <button style="${btnStyle}" title="Delete" onclick="deleteInteraction('${p.id}',${realIdx})">✕</button>
          </div>
          <div style="white-space:pre-wrap">${esc(int.text)}</div>
        </div>`;
      }).join('')
    : '<div style="color:#94a3b8;font-size:11px;margin-bottom:8px">No interactions logged yet.</div>';

  panel.innerHTML = `
    <div class="card">
      <div class="nw-detail-header">
        <div>
          <div class="nw-detail-name">${esc(p.name)}</div>
          ${p.title ? `<div style="font-size:12px;color:#475569;margin-top:1px">${esc(p.title)}</div>` : ''}
          ${p.company ? `<div class="nw-detail-company">${esc(p.company)}</div>` : ''}
          ${p.category ? `<div class="nw-detail-cat" style="background:${cat.bg};color:${cat.color}">${cat.label}</div>` : ''}
          <div class="nw-stars">${stars}</div>
        </div>
        <div style="display:flex;gap:6px">
          <button class="btn bg" onclick="openEditPartnerModal('${p.id}')">✏️ Edit</button>
          <button class="btn bd" onclick="deletePartner('${p.id}')">🗑️</button>
        </div>
      </div>
    </div>

    ${contactRows ? `<div class="card">${contactRows}</div>` : ''}

    <div class="card">
      <div class="sec-title">📝 Notes</div>
      <textarea style="width:100%;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:12px;resize:vertical;font-family:inherit;color:#1e293b;min-height:50px"
        placeholder="General notes about this partner…"
        onblur="setPartnerNotes('${p.id}',this.value)">${esc(p.notes || '')}</textarea>
    </div>

    ${outreachBar}

    <div class="card">
      <div class="sec-title">📋 Interaction Log</div>
      <div class="notes-list">${intHtml}</div>
      <div class="nw-int-add">
        <select id="nw-int-type" class="nw-int-select">
          <option value="call">📞 Call</option>
          <option value="email">✉️ Email</option>
          <option value="lunch">🍽️ Lunch/Coffee</option>
          <option value="event">🎪 Event</option>
          <option value="other">📌 Other</option>
        </select>
        <input type="date" id="nw-int-date" value="${today()}" style="padding:7px 10px;border:1px solid #e2e8f0;border-radius:8px;font-size:12px;font-family:inherit;outline:none">
        <textarea id="nw-int-text" class="note-input" placeholder="What happened?"></textarea>
        <button class="btn bp" onclick="logInteraction('${p.id}')">Log</button>
      </div>
    </div>
  `;
}
