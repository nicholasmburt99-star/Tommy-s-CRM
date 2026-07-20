import { STAGES } from '../data/stages.js';
import { state, save } from '../store.js';
import { gS } from '../data/stages.js';
import { today, fmtD, fmtDT, fuSt, addDays } from '../utils/date.js';
import { esc, log, showToast } from '../utils/dom.js';
import { LOST_CATEGORIES } from '../data/lostCategories.js';
import { renderDetail } from './detail.js';
import { renderList } from './list.js';

export function setReContact(id, date) {
  const lead = state.leads.find(l => l.id === id);
  if (!lead) return;
  lead.reContactDate = date;
  save();
  renderLost();
}
export function reengageLead(id) {
  const lead = state.leads.find(l => l.id === id);
  if (!lead) return;
  lead.stageId = 'new';
  lead.nextFU = addDays(1);
  delete lead.reContactDate;
  lead.activity = lead.activity || [];
  lead.activity.unshift({ txt: 'Re-engaged — moved back to New Lead', col: '#f59e0b', at: new Date().toISOString() });
  save();
  renderLost();
  renderList();
}
export function renderLost() {
  const container = document.getElementById('lostInner');
  if (!container) return;
  const t = today();
  const lostLeads   = state.leads.filter(l => l.stageId === 'lost');

  if (!lostLeads.length) {
    container.innerHTML = `<div class="lost-empty">
      <div class="lei">🎉</div>
      <h3>No lost state.leads</h3>
      <p>All caught up — no one has been marked lost yet.</p>
    </div>`;
    return;
  }

  // Auto-set reContactDate for lost state.leads that don't have one yet
  let migrated = false;
  lostLeads.forEach(l => {
    if (!l.reContactDate) { l.reContactDate = addDays(90); migrated = true; }
  });
  if (migrated) save();

  const daysUntil = dateStr => {
    if (!dateStr) return null;
    return Math.ceil((new Date(dateStr + 'T12:00:00') - new Date(t + 'T12:00:00')) / 86400000);
  };

  // ── LOST CARDS ──
  const sortedLost = [...lostLeads].sort((a, b) =>
    (a.reContactDate || '9999-99-99').localeCompare(b.reContactDate || '9999-99-99'));

  const lostCards = sortedLost.map(l => {
    const rc = l.reContactDate, du = daysUntil(rc);
    let badgeLabel = '', badgeStyle = '';
    if (rc) {
      if (du < 0)       { badgeLabel = `Overdue · ${fmtD(rc)}`;   badgeStyle = 'background:#fef2f2;color:#dc2626'; }
      else if (du === 0){ badgeLabel = `Today · ${fmtD(rc)}`;     badgeStyle = 'background:#fef9c3;color:#92400e'; }
      else if (du <= 7) { badgeLabel = `In ${du}d · ${fmtD(rc)}`; badgeStyle = 'background:#fef9c3;color:#92400e'; }
      else              { badgeLabel = fmtD(rc);                   badgeStyle = 'background:#f1f5f9;color:#475569'; }
    } else {
      badgeLabel = 'Set re-contact date'; badgeStyle = 'background:#f1f5f9;color:#94a3b8;font-style:italic';
    }
    const note = l.notes && l.notes.length ? l.notes[l.notes.length - 1].text : '';
    const cat = l.lostCategory ? LOST_CATEGORIES.find(c=>c.id===l.lostCategory) : null;
    return `<div class="lost-card">
      <div class="lost-card-info">
        <div class="lost-card-name">${esc(l.firstName)} ${esc(l.lastName)}</div>
        <div class="lost-card-company">${esc(l.company || '')}${l.company && l.phone ? ' · ' : ''}${esc(l.phone || '')}</div>
        ${cat ? `<div class="lost-cat-chip">${cat.icon} ${esc(cat.label)}</div>` : ''}
        <div class="lost-card-meta">
          <span>📞 ${esc(l.phone || '')}</span>
          <span>📬 ${esc(l.email || 'No email')}</span>
          ${note ? `<span style="color:#64748b;font-style:italic;max-width:260px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">💬 ${esc(note)}</span>` : ''}
        </div>
      </div>
      <div style="display:flex;flex-direction:column;align-items:flex-end;gap:5px;flex-shrink:0">
        <div style="display:flex;align-items:center;gap:5px">
          <span style="font-size:9px;font-weight:700;color:#94a3b8;text-transform:uppercase;letter-spacing:0.4px">Re-contact</span>
          <div class="cold-badge" style="${badgeStyle};font-size:10px">${badgeLabel}</div>
          <input type="date" value="${rc||''}" style="font-size:10px;border:1px solid #e2e8f0;border-radius:6px;padding:2px 5px;color:#475569;cursor:pointer;background:white" onchange="setReContact('${l.id}',this.value)">
        </div>
        <div class="lost-card-actions">
          <button class="btn bg" style="font-size:11px;padding:5px 10px" onclick="reengageLead('${l.id}')">🔄 Re-engage</button>
          <button class="btn bg" style="font-size:11px;padding:5px 10px" onclick="goToLead('${l.id}')">Open →</button>
        </div>
      </div>
    </div>`;
  }).join('');

  const reachOutTips = [
    'Try a completely new angle — mention a recent industry change or compliance update.',
    'Send a short "just checking in" text. No pitch, just a human touch.',
    'A referral angle can work well: "Do you know anyone who might benefit from a quick benefits review?"',
    'Open benefits enrollment season is a natural re-entry point.',
    'Share a brief case study or Google review relevant to their industry.',
  ];
  const tip = reachOutTips[Math.floor(Math.random() * reachOutTips.length)];

  const lostSection = lostLeads.length ? `
    <div style="font-size:13px;font-weight:800;color:#1e293b;margin:0 0 10px;display:flex;align-items:center;gap:8px">
      ❄️ Lost Leads
      <span style="font-size:10px;font-weight:700;background:#f1f5f9;color:#64748b;padding:2px 8px;border-radius:10px">${lostLeads.length}</span>
    </div>
    <div class="lost-banner">
      <div class="lost-banner-icon">💡</div>
      <div class="lost-banner-body">
        <div class="lost-banner-title">Re-engagement Tip</div>
        <div class="lost-banner-text">${tip} Hit <strong>🔄 Re-engage</strong> to move anyone back to New Lead.</div>
      </div>
    </div>
    <div class="lost-grid">${lostCards}</div>
  ` : '';

  container.innerHTML = `
    <div style="font-size:15px;font-weight:800;color:#1e293b;margin-bottom:18px">❄️ Lost Leads</div>
    ${lostSection}
  `;
}
