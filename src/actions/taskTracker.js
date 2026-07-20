import { state, saveTasks } from '../store.js';
import { uid, showToast } from '../utils/dom.js';
import { renderTasks } from '../views/taskTracker.js';

export function addTask() {
  const titleEl = document.getElementById('tt-title');
  const dueEl = document.getElementById('tt-due');
  const priEl = document.getElementById('tt-priority');
  const leadEl = document.getElementById('tt-lead');
  const notesEl = document.getElementById('tt-notes');
  const title = titleEl ? titleEl.value.trim() : '';
  if (!title) { showToast('Type a task first.'); return; }
  state.tasks.push({
    id: uid(),
    title,
    dueDate: dueEl?.value || '',
    priority: priEl?.value || 'med',
    notes: notesEl?.value.trim() || '',
    leadId: leadEl?.value || '',
    done: false,
    createdAt: new Date().toISOString(),
    completedAt: '',
  });
  saveTasks();
  renderTasks();
  // Clear inputs
  if (titleEl) titleEl.value = '';
  if (dueEl) dueEl.value = '';
  if (notesEl) notesEl.value = '';
  if (priEl) priEl.value = 'med';
  if (leadEl) leadEl.value = '';
  if (titleEl) titleEl.focus();
}

export function toggleTaskDone(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.done = !t.done;
  t.completedAt = t.done ? new Date().toISOString() : '';
  saveTasks();
  renderTasks();
}

export function deleteTask(id) {
  if (!confirm('Delete this task?')) return;
  state.tasks = state.tasks.filter(x => x.id !== id);
  saveTasks();
  renderTasks();
}

export function startTaskEdit(id) {
  state.taskEditId = id;
  renderTasks();
}

export function saveTaskEdit(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  const titleEl = document.getElementById('tt-edit-title-' + id);
  const dueEl = document.getElementById('tt-edit-due-' + id);
  const priEl = document.getElementById('tt-edit-priority-' + id);
  const leadEl = document.getElementById('tt-edit-lead-' + id);
  const notesEl = document.getElementById('tt-edit-notes-' + id);
  const title = titleEl ? titleEl.value.trim() : '';
  if (!title) { showToast('Title cannot be empty.'); return; }
  t.title = title;
  t.dueDate = dueEl?.value || '';
  t.priority = priEl?.value || 'med';
  t.leadId = leadEl?.value || '';
  t.notes = notesEl?.value.trim() || '';
  state.taskEditId = null;
  saveTasks();
  renderTasks();
}

export function cancelTaskEdit() {
  state.taskEditId = null;
  renderTasks();
}

export function setTaskFilter(val) {
  state.taskFilter = val;
  renderTasks();
}
