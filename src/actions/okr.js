import { state, saveOKRs } from '../store.js';
import { uid } from '../utils/dom.js';
import { renderOKR } from '../views/okr.js';

export function addOKR(quarter, year) {
  const title = document.getElementById('okr-new-title')?.value?.trim();
  if (!title) return;
  state.okrs.push({
    id: uid(),
    title,
    quarter,
    year,
    status: 'in_progress',
    keyResults: [],
    createdAt: new Date().toISOString(),
  });
  saveOKRs();
  renderOKR();
}

export function deleteOKR(id) {
  if (!confirm('Delete this objective and all its key results?')) return;
  state.okrs = state.okrs.filter(o => o.id !== id);
  saveOKRs();
  renderOKR();
}

export function saveOKRTitle(id, title) {
  const okr = state.okrs.find(o => o.id === id);
  if (!okr || !title.trim()) return;
  okr.title = title.trim();
  saveOKRs();
}

export function addKeyResult(okrId) {
  const okr = state.okrs.find(o => o.id === okrId);
  if (!okr) return;
  const titleEl = document.getElementById('kr-new-title-' + okrId);
  const typeEl = document.getElementById('kr-new-type-' + okrId);
  const targetEl = document.getElementById('kr-new-target-' + okrId);
  const title = titleEl?.value?.trim();
  if (!title) return;
  const type = typeEl?.value || 'percent';
  const kr = { id: uid(), title, type, current: 0 };
  if (type === 'numeric') kr.target = parseInt(targetEl?.value) || 100;
  okr.keyResults.push(kr);
  saveOKRs();
  renderOKR();
}

export function deleteKeyResult(okrId, krId) {
  const okr = state.okrs.find(o => o.id === okrId);
  if (!okr) return;
  okr.keyResults = okr.keyResults.filter(kr => kr.id !== krId);
  saveOKRs();
  renderOKR();
}

export function updateKRProgress(okrId, krId, value) {
  const okr = state.okrs.find(o => o.id === okrId);
  if (!okr) return;
  const kr = okr.keyResults.find(k => k.id === krId);
  if (!kr) return;
  kr.current = parseFloat(value) || 0;
  saveOKRs();
  renderOKR();
}

export function updateKRTitle(okrId, krId, title) {
  const okr = state.okrs.find(o => o.id === okrId);
  if (!okr) return;
  const kr = okr.keyResults.find(k => k.id === krId);
  if (!kr) return;
  kr.title = title;
  saveOKRs();
}

export function updateKRType(okrId, krId, type) {
  const okr = state.okrs.find(o => o.id === okrId);
  if (!okr) return;
  const kr = okr.keyResults.find(k => k.id === krId);
  if (!kr) return;
  kr.type = type;
  if (type === 'numeric' && !kr.target) kr.target = 100;
  saveOKRs();
  renderOKR();
}

export function updateKRTarget(okrId, krId, target) {
  const okr = state.okrs.find(o => o.id === okrId);
  if (!okr) return;
  const kr = okr.keyResults.find(k => k.id === krId);
  if (!kr) return;
  kr.target = parseInt(target) || 1;
  saveOKRs();
  renderOKR();
}
