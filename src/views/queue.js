import { state } from '../store.js';
import { gS } from '../data/stages.js';
import { today, fuSt } from '../utils/date.js';
import { esc } from '../utils/dom.js';

export function renderQueue() {
  const container = document.getElementById('queueInner');
  if (!container) return;

  const t = today();
  const queueLeads = state.leads.filter(l => {
    if (['bound','lost'].includes(l.stageId)) return false;
    if (!l.nextFU || l.nextFU > t) return false;
    return true;
  });

  // Sort: overdue first (oldest nextFU first), then today's state.leads
  queueLeads.sort((a, b) => {
    const aOver = a.nextFU < t;
    const bOver = b.nextFU < t;
    if (aOver && !bOver) return -1;
    if (!aOver && bOver) return 1;
    return a.nextFU.localeCompare(b.nextFU);
  });

  if (!queueLeads.length) {
    container.innerHTML = `<div style="text-align:center;padding:40px 20px;color:#94a3b8">
      <div style="font-size:32px;margin-bottom:10px">✅</div>
      <h3 style="font-size:14px;color:#64748b;margin-bottom:4px">All caught up!</h3>
      <p style="font-size:12px">No leads due for follow-up today.</p>
    </div>`;
    return;
  }

  const cards = queueLeads.map(l => {
    const st = gS(l.stageId);
    const lastNoteIdx = l.notes && l.notes.length ? l.notes.length - 1 : -1;
    const lastNote = lastNoteIdx >= 0 ? l.notes[lastNoteIdx].text : '';
    const noteSnippet = lastNote ? lastNote.substring(0, 60) + (lastNote.length > 60 ? '...' : '') : '';

    const fu = fuSt(l);
    const overdue = l.nextFU < t;

    return `<div class="queue-card" style="${overdue ? 'border-left-color:#ef4444;' : ''}">
      <div class="queue-card-name">${esc(l.firstName)} ${esc(l.lastName)}</div>
      <div class="queue-card-meta">
        <span>🏢 ${esc(l.company || '—')}</span>
        <span>📞 ${esc(l.phone)}</span>
        <span style="background:${st.bg};color:${st.text};padding:2px 6px;border-radius:4px;font-size:9px;font-weight:700">${st.short}</span>
        <span>${fu ? fu.label : ''}</span>
        ${noteSnippet ? `<span style="color:#64748b;font-style:italic">💬 ${esc(noteSnippet)}</span>` : ''}
      </div>
      <div class="queue-card-actions">
        <button class="btn bg" style="font-size:10px;padding:5px 10px" onclick="logCallOutcome('${l.id}','no_answer')">📵 No Answer</button>
        <button class="btn bg" style="font-size:10px;padding:5px 10px" onclick="logCallOutcome('${l.id}','vm_left')">📣 VM Left</button>
        <button class="btn bg" style="font-size:10px;padding:5px 10px" onclick="goToLead('${l.id}')">Open →</button>
      </div>
    </div>`;
  }).join('');

  container.innerHTML = `
    <div style="font-size:15px;font-weight:800;color:#1e293b;margin-bottom:14px">📋 Daily Call Queue</div>
    <div style="font-size:11px;font-weight:700;color:#64748b;margin-bottom:10px;text-transform:uppercase;letter-spacing:0.6px">${queueLeads.length} lead${queueLeads.length !== 1 ? 's' : ''} due today</div>
    ${cards}
  `;
}
