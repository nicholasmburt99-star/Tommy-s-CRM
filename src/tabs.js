import { state } from './store.js';
import { renderKanban } from './views/kanban.js';
import { renderOverview } from './views/overview.js';
import { renderDetail } from './views/detail.js';
import { renderTasks } from './views/taskTracker.js';
import { renderDaily } from './views/dailyRoutine.js';

export function switchTab(tab) {
  state.activeTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
  const btn = document.getElementById('tab-' + tab);
  if (btn) btn.classList.add('active');
  const vl = document.getElementById('view-leads');
  if (vl) vl.style.display = 'none';
  const ov = document.getElementById('view-overview');
  if (ov) ov.style.display = tab === 'overview' ? 'flex' : 'none';
  const kv = document.getElementById('view-kanban');
  if (kv) kv.style.display = tab === 'kanban' ? 'flex' : 'none';
  const tt = document.getElementById('view-tasks');
  if (tt) tt.style.display = tab === 'tasks' ? 'flex' : 'none';
  const dr = document.getElementById('view-daily');
  if (dr) dr.style.display = tab === 'daily' ? 'flex' : 'none';
  if (tab === 'overview') renderOverview();
  if (tab === 'kanban') { renderKanban(); renderDetail(); }
  if (tab === 'tasks') renderTasks();
  if (tab === 'daily') renderDaily();
}

export function goToLead(id) {
  state.selId = id;
  switchTab('kanban');
}
