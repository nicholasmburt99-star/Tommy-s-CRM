import { LOST_CATEGORIES } from '../data/lostCategories.js';
import { state } from '../store.js';
import { esc } from '../utils/dom.js';

export function showLostReasonPicker(leadId, onConfirm) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;

  let selected = null;

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.5);display:flex;align-items:center;justify-content:center;z-index:2000;backdrop-filter:blur(3px)';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const dialog = document.createElement('div');
  dialog.style.cssText = 'background:white;border-radius:12px;padding:24px;width:420px;max-height:85vh;overflow-y:auto;box-shadow:0 24px 60px rgba(0,0,0,0.2)';

  function render() {
    dialog.innerHTML = `
      <div style="font-size:16px;font-weight:800;color:#1e293b;margin-bottom:4px">❌ Why was this lead lost?</div>
      <div style="font-size:12px;color:#64748b;margin-bottom:16px">${esc(lead.firstName)} ${esc(lead.lastName)}${lead.company ? ' — ' + esc(lead.company) : ''}</div>
      <div style="display:flex;flex-direction:column;gap:6px;margin-bottom:16px">
        ${LOST_CATEGORIES.map(c => `
          <button class="lost-cat-btn${selected === c.id ? ' selected' : ''}" data-cat="${c.id}">
            <span style="font-size:16px;width:24px;text-align:center">${c.icon}</span>
            <span>${c.label}</span>
          </button>
        `).join('')}
      </div>
      <div style="margin-bottom:16px">
        <label style="font-size:11px;font-weight:700;color:#64748b;display:block;margin-bottom:4px">Additional notes (optional)</label>
        <textarea id="lost-picker-notes" rows="2"
          style="width:100%;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:8px;padding:8px 10px;font-size:12px;resize:vertical;font-family:inherit;color:#1e293b"
          placeholder="Any details about why they were lost...">${esc(lead.lostReason || '')}</textarea>
      </div>
      <div style="display:flex;gap:8px;justify-content:flex-end;padding-top:12px;border-top:1px solid #f1f5f9">
        <button id="lost-picker-cancel" style="padding:8px 16px;border:1px solid #e2e8f0;border-radius:8px;background:white;cursor:pointer;font-size:13px;font-weight:600;color:#475569">Cancel</button>
        <button id="lost-picker-confirm" style="padding:8px 18px;border:none;border-radius:8px;background:${selected ? '#dc2626' : '#e2e8f0'};color:${selected ? 'white' : '#94a3b8'};font-weight:700;cursor:${selected ? 'pointer' : 'default'};font-size:13px" ${selected ? '' : 'disabled'}>Mark Lost</button>
      </div>
    `;

    // Bind category buttons
    dialog.querySelectorAll('.lost-cat-btn').forEach(btn => {
      btn.onclick = () => {
        selected = btn.dataset.cat;
        render();
      };
    });

    // Bind cancel
    dialog.querySelector('#lost-picker-cancel').onclick = () => overlay.remove();

    // Bind confirm
    const confirmBtn = dialog.querySelector('#lost-picker-confirm');
    if (selected) {
      confirmBtn.onclick = () => {
        const notes = dialog.querySelector('#lost-picker-notes')?.value?.trim() || '';
        overlay.remove();
        onConfirm(selected, notes);
      };
    }
  }

  render();
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}
