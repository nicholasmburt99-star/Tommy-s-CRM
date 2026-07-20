import { state, save } from '../store.js';
import { today } from '../utils/date.js';
import { renderDetail } from '../views/detail.js';

export function toggleLeadCall(leadId, idx) {
  const l = state.leads.find(x => x.id === leadId);
  if (!l) return;
  const d = today();
  if (!l.dailyCalls) l.dailyCalls = {};
  if (!l.dailyCalls[d]) l.dailyCalls[d] = [false, false];
  l.dailyCalls[d][idx] = !l.dailyCalls[d][idx];
  save();
  renderDetail();
}
