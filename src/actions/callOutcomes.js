import { STAGES } from '../data/stages.js';
import { state, save } from '../store.js';
import { gS, gSI } from '../data/stages.js';
import { today, addDays, skipWeekend, fmtD } from '../utils/date.js';
import { log, showToast } from '../utils/dom.js';
import { renderDetail } from '../views/detail.js';
import { renderQueue } from '../views/queue.js';
import { renderList } from '../views/list.js';
import { showLostReasonPicker } from './lostReasonPicker.js';
import { openCallDebrief } from '../views/callDebriefModal.js';

export function daysInStage(lead) {
  if (!lead.activity || !lead.activity.length) {
    const createdDate = new Date(lead.createdAt);
    const today_d = new Date();
    return Math.floor((today_d - createdDate) / 86400000);
  }
  // Find the most recent "Stage:" activity entry
  const stageChangeActivities = lead.activity.filter(a => a.txt && a.txt.includes('Stage:'));
  if (stageChangeActivities.length > 0) {
    const mostRecent = stageChangeActivities[stageChangeActivities.length - 1];
    const changeDate = new Date(mostRecent.at);
    const today_d = new Date();
    return Math.floor((today_d - changeDate) / 86400000);
  }
  // Fallback to created date
  const createdDate = new Date(lead.createdAt);
  const today_d = new Date();
  return Math.floor((today_d - createdDate) / 86400000);
}
export function logCallOutcome(leadId, outcome) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;

  switch (outcome) {
    case 'no_answer':
      log(lead, 'No Answer', '#ef4444');
      lead.nextFU = addDays(1);
      break;
    case 'vm_left':
      log(lead, 'Voicemail Left', '#f59e0b');
      lead.nextFU = addDays(2);
      break;
    case 'connected':
      log(lead, 'Connected — live call', '#10b981');
      lead.stageId = 'contacted';
      const nw = gS('contacted');
      if (nw.followDays > 0) lead.nextFU = addDays(nw.followDays);
      save(); renderList(); renderDetail();
      if (state.activeTab === 'queue') renderQueue();
      openCallDebrief(leadId, 'connected');
      return;
    case 'not_interested':
      showLostReasonPicker(leadId, (category, note) => {
        lead.lostCategory = category;
        if (note) lead.lostReason = note;
        log(lead, 'Not Interested — marked lost', '#6b7280');
        lead.stageId = 'lost';
        lead.reContactDate = addDays(90);
        save(); renderList(); renderDetail();
        if (state.activeTab === 'queue') renderQueue();
      });
      return;
  }
  save(); renderList(); renderDetail();
  if (state.activeTab === 'queue') renderQueue();
}
export function requestCallback(leadId) {
  const lead = state.leads.find(l => l.id === leadId);
  if (!lead) return;

  // Show inline date picker
  const modal = document.getElementById('modal');
  if (!modal) return;

  const dateInput = document.createElement('input');
  dateInput.type = 'date';
  dateInput.value = today();
  dateInput.style.cssText = 'padding:8px;border:1px solid #e2e8f0;border-radius:8px;font-size:13px';

  const overlay = document.createElement('div');
  overlay.style.cssText = 'position:fixed;inset:0;background:rgba(15,23,42,0.5);display:flex;align-items:center;justify-content:center;z-index:2000;backdrop-filter:blur(3px)';
  overlay.onclick = e => { if (e.target === overlay) overlay.remove(); };

  const dialog = document.createElement('div');
  dialog.style.cssText = 'background:white;border-radius:12px;padding:20px;width:360px;box-shadow:0 24px 60px rgba(0,0,0,0.2)';
  dialog.innerHTML = `
    <h3 style="font-size:15px;font-weight:800;margin-bottom:12px;color:#1e293b">📅 Callback Date</h3>
    <div style="margin-bottom:16px"></div>
  `;
  dialog.querySelector('div').appendChild(dateInput);

  const btnContainer = document.createElement('div');
  btnContainer.style.cssText = 'display:flex;gap:8px;justify-content:flex-end;margin-top:16px;padding-top:12px;border-top:1px solid #f1f5f9';

  const cancelBtn = document.createElement('button');
  cancelBtn.className = 'btn bg';
  cancelBtn.textContent = 'Cancel';
  cancelBtn.onclick = () => overlay.remove();

  const confirmBtn = document.createElement('button');
  confirmBtn.className = 'btn bp';
  confirmBtn.textContent = 'Set Callback';
  confirmBtn.onclick = () => {
    const date = dateInput.value;
    if (!date) return;
    log(lead, `Callback requested for ${fmtD(date)}`, '#2563eb');
    lead.nextFU = skipWeekend(date);
    save(); renderList(); renderDetail();
    if (state.activeTab === 'queue') renderQueue();
    overlay.remove();
  };

  btnContainer.appendChild(cancelBtn);
  btnContainer.appendChild(confirmBtn);
  dialog.appendChild(btnContainer);
  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
  dateInput.focus();
}
