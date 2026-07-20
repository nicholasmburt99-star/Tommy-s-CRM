import { state, save } from '../store.js';
import { esc, log, showToast } from '../utils/dom.js';
import { renderDetail } from './detail.js';
import { renderList } from './list.js';

let _pending = null; // { leadId, outcome, afterSave }

export function openCallDebrief(leadId, outcome, afterSave) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) { if (afterSave) afterSave(); return; }
  _pending = { leadId, outcome, afterSave };
  const modal = document.getElementById('callDebriefModal');
  if (!modal) { if (afterSave) afterSave(); return; }
  const name = [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || 'this lead';
  modal.innerHTML = `
    <div class="modal-box" style="max-width:460px">
      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">
        <div style="font-size:16px;font-weight:800;color:#1e293b">📞 Quick note about this call?</div>
        <button onclick="skipCallDebrief()" style="background:none;border:none;font-size:18px;cursor:pointer;color:#64748b">✕</button>
      </div>
      <div style="font-size:12px;color:#64748b;margin-bottom:16px">${esc(name)}</div>

      <textarea id="cdb-note" rows="3" class="cdb-textarea" placeholder="What happened on the call?"></textarea>

      <div style="display:flex;justify-content:flex-end;gap:8px;padding-top:12px;margin-top:12px;border-top:1px solid #e2e8f0">
        <button class="btn bg" onclick="skipCallDebrief()">Skip</button>
        <button class="btn bp" onclick="saveCallDebrief()">Save Note</button>
      </div>
    </div>`;
  modal.style.display = 'flex';
  setTimeout(() => { const el = document.getElementById('cdb-note'); if (el) el.focus(); }, 80);
}

function closeModal() {
  const modal = document.getElementById('callDebriefModal');
  if (modal) modal.style.display = 'none';
}

export function saveCallDebrief() {
  if (!_pending) { closeModal(); return; }
  const lead = state.leads.find(l => l.id === _pending.leadId);
  if (!lead) { closeModal(); _pending = null; return; }
  const text = document.getElementById('cdb-note')?.value.trim() || '';
  if (!text) { showToast('Type a note first, or click Skip.'); return; }
  lead.notes = lead.notes || [];
  lead.notes.push({ text, at: new Date().toISOString() });
  log(lead, 'Note added (post-call)', '#64748b');
  save();
  showToast('📝 Note saved');
  const after = _pending.afterSave;
  _pending = null;
  closeModal();
  if (after) after();
  renderList();
  renderDetail();
}

export function skipCallDebrief() {
  const after = _pending && _pending.afterSave;
  _pending = null;
  closeModal();
  if (after) after();
}
