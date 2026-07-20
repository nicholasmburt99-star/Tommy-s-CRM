import { STAGES } from '../data/stages.js';
import { state, save } from '../store.js';
import { gS, gSI } from '../data/stages.js';
import { today, fuSt, addDays } from '../utils/date.js';
import { esc, log } from '../utils/dom.js';
import { renderList } from './list.js';
import { renderDetail } from './detail.js';

let _kanbanScrollTimer = null;
let dragLeadId = null;

export function renderKanban() {
  const container = document.getElementById('kanbanInner');
  if (!container) return;

  const cols = STAGES.map(st => {
    const stLeads = state.leads.filter(l => l.stageId === st.id);
    const cardsHtml = stLeads.length
      ? stLeads.map(l => {
          const fu = fuSt(l);
          return `<div class="pipeline-card"
            draggable="true"
            id="kcard_${l.id}"
            ondragstart="kanbanDragStart(event,'${l.id}')"
            ondragend="kanbanDragEnd(event)"
            onclick="goToLead('${l.id}')">
            <div class="pc-name">${esc(l.firstName)} ${esc(l.lastName)}</div>
            <div class="pc-sub">${esc(l.company||l.phone)}</div>
            ${l.policyType ? `<span class="pc-ins pc-ins-unk">${esc(l.policyType)}</span>` : ''}
            ${fu ? `<div class="pc-due ${fu.cls}">${fu.label}</div>` : ''}
          </div>`;
        }).join('')
      : `<div class="col-empty">Drop here</div>`;
    return `<div class="pipeline-col">
      <div class="pipeline-col-header" style="background:${st.bg};color:${st.text}">
        <span>${st.short}</span>
        <span class="pcnt">${stLeads.length}</span>
      </div>
      <div class="pipeline-col-body"
        id="kcol_${st.id}"
        ondragover="kanbanDragOver(event,'${st.id}')"
        ondragleave="kanbanDragLeave(event,'${st.id}')"
        ondrop="kanbanDrop(event,'${st.id}')">
        ${cardsHtml}
      </div>
    </div>`;
  }).join('');

  container.innerHTML = `
    <div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:10px">
      <div>
        <div style="font-size:15px;font-weight:800;color:#1e293b">🗂 Kanban Board</div>
        <div style="font-size:11px;font-weight:700;color:#64748b;margin-top:3px;text-transform:uppercase;letter-spacing:0.6px">Drag cards to move · click to open</div>
      </div>
      <div style="display:flex;gap:6px;flex-shrink:0">
        <button
          onmousedown="kanbanScrollStart(-1)" onmouseup="kanbanScrollStop()" onmouseleave="kanbanScrollStop()" ontouchstart="kanbanScrollStart(-1)" ontouchend="kanbanScrollStop()"
          style="width:36px;height:36px;border-radius:50%;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.08);transition:background 0.15s;user-select:none"
          onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#fff'"
          title="Scroll left">◀</button>
        <button
          onmousedown="kanbanScrollStart(1)" onmouseup="kanbanScrollStop()" onmouseleave="kanbanScrollStop()" ontouchstart="kanbanScrollStart(1)" ontouchend="kanbanScrollStop()"
          style="width:36px;height:36px;border-radius:50%;border:1.5px solid #e2e8f0;background:#fff;cursor:pointer;font-size:16px;display:flex;align-items:center;justify-content:center;box-shadow:0 1px 4px rgba(0,0,0,0.08);transition:background 0.15s;user-select:none"
          onmouseover="this.style.background='#f1f5f9'" onmouseout="this.style.background='#fff'"
          title="Scroll right">▶</button>
      </div>
    </div>
    <div id="kanbanBoard" style="flex:1;overflow-x:auto;overflow-y:auto;padding-bottom:8px">
      <div class="pipeline-board">${cols}</div>
    </div>
  `;
}
export function kanbanScrollStart(dir) {
  kanbanScrollStop();
  const board = document.getElementById('kanbanBoard');
  if (!board) return;
  // Immediate first scroll + hold-to-scroll
  function step() { board.scrollLeft += dir * 220; }
  step();
  _kanbanScrollTimer = setInterval(step, 180);
}
export function kanbanScrollStop() {
  if (_kanbanScrollTimer) { clearInterval(_kanbanScrollTimer); _kanbanScrollTimer = null; }
}
export function kanbanDragStart(e, leadId) {
  dragLeadId = leadId;
  const card = document.getElementById('kcard_' + leadId);
  if (card) { setTimeout(() => card.classList.add('dragging'), 0); }
  e.dataTransfer.effectAllowed = 'move';
}
export function kanbanDragEnd(e) {
  if (dragLeadId) {
    const card = document.getElementById('kcard_' + dragLeadId);
    if (card) card.classList.remove('dragging');
  }
  document.querySelectorAll('.pipeline-col-body').forEach(c => c.classList.remove('drag-over'));
}
export function kanbanDragOver(e, stageId) {
  e.preventDefault();
  e.dataTransfer.dropEffect = 'move';
  const col = document.getElementById('kcol_' + stageId);
  if (col) col.classList.add('drag-over');
}
export function kanbanDragLeave(e, stageId) {
  const col = document.getElementById('kcol_' + stageId);
  if (col) col.classList.remove('drag-over');
}
export function kanbanDrop(e, stageId) {
  e.preventDefault();
  document.querySelectorAll('.pipeline-col-body').forEach(c => c.classList.remove('drag-over'));
  if (!dragLeadId) return;
  const l = state.leads.find(x => x.id === dragLeadId);
  if (!l || l.stageId === stageId) { dragLeadId = null; return; }
  const old = gS(l.stageId);
  l.stageId = stageId;
  const nw = gS(stageId);
  if (nw.followDays > 0) l.nextFU = addDays(nw.followDays);
  if (stageId === 'lost') l.reContactDate = addDays(90);
  log(l, `Stage: ${old.label} → ${nw.label} (moved via board)`, nw.color);
  save();
  renderList();
  if (state.selId === dragLeadId) renderDetail();
  const movedId = dragLeadId;
  dragLeadId = null;
  renderKanban();
}
