import { state, save } from '../store.js';
import { gS } from '../data/stages.js';
import { renderDetail } from '../views/detail.js';
import { renderQueue } from '../views/queue.js';

export function getChecks(lead, stageId) {
  const st = gS(stageId);
  lead.taskChecks = lead.taskChecks || {};
  if (!lead.taskChecks[stageId]) lead.taskChecks[stageId] = st.tasks.map(()=>false);
  return lead.taskChecks[stageId];
}
export function toggleTask(leadId, stageId, idx) {
  const lead = state.leads.find(l=>l.id===leadId); if(!lead)return;
  const checks = getChecks(lead, stageId);
  checks[idx] = !checks[idx];
  lead.taskChecks[stageId] = checks;
  save(); renderDetail();
}
