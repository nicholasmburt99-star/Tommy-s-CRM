import { state, saveDailyLog } from '../store.js';
import { uid, showToast } from '../utils/dom.js';
import { renderDaily } from '../views/dailyRoutine.js';

export function addDailyNote(text) {
  const t = (text || '').trim();
  if (!t) { showToast('Type something first.'); return; }
  state.dailyLog = state.dailyLog || [];
  state.dailyLog.push({ id: uid(), text: t, at: new Date().toISOString() });
  saveDailyLog();
  renderDaily();
}

export function deleteDailyNote(id) {
  state.dailyLog = (state.dailyLog || []).filter(n => n.id !== id);
  saveDailyLog();
  renderDaily();
}
