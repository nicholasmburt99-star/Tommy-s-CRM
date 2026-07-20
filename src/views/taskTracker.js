import { state } from '../store.js';
import { esc } from '../utils/dom.js';
import { fmtD, today } from '../utils/date.js';

const PRIORITY_META = {
  high: { label: 'High', bg: '#fee2e2', color: '#991b1b', dot: '#ef4444' },
  med:  { label: 'Med',  bg: '#fef3c7', color: '#92400e', dot: '#f59e0b' },
  low:  { label: 'Low',  bg: '#e0f2fe', color: '#0369a1', dot: '#3b82f6' },
};
const PRIORITY_RANK = { high: 0, med: 1, low: 2 };

function leadName(id) {
  if (!id) return '';
  const l = state.leads.find(x => x.id === id);
  if (!l) return '';
  return [l.firstName, l.lastName].filter(Boolean).join(' ') + (l.company ? ` · ${l.company}` : '');
}

function dueBadge(dateStr) {
  if (!dateStr) return '';
  const t = today();
  if (dateStr < t) {
    const d = Math.round((new Date(t+'T00:00:00') - new Date(dateStr+'T00:00:00')) / 86400000);
    return `<span class="tt-due-badge tt-due-overdue">⚠ ${d}d overdue</span>`;
  }
  if (dateStr === t) return `<span class="tt-due-badge tt-due-today">Today</span>`;
  const d = Math.round((new Date(dateStr+'T00:00:00') - new Date(t+'T00:00:00')) / 86400000);
  if (d <= 3) return `<span class="tt-due-badge tt-due-soon">In ${d}d</span>`;
  return `<span class="tt-due-badge">${fmtD(dateStr)}</span>`;
}

function chip(label, active, onclick) {
  return `<button class="pl-chip${active ? ' pl-chip-active' : ''}" onclick="${onclick}">${label}</button>`;
}

function leadOptionsHtml(selectedId) {
  // Sort leads by name for selection list
  const leads = [...state.leads].sort((a, b) => (a.company || a.firstName || '').localeCompare(b.company || b.firstName || ''));
  return leads.map(l => {
    const name = leadName(l.id);
    return `<option value="${l.id}" ${l.id === selectedId ? 'selected' : ''}>${esc(name)}</option>`;
  }).join('');
}

export function renderTasks() {
  const container = document.getElementById('tasksInner');
  if (!container) return;

  const filter = state.taskFilter || 'open';
  const t = today();
  const weekEnd = new Date(t + 'T00:00:00');
  weekEnd.setDate(weekEnd.getDate() + 7);
  const weekEndStr = weekEnd.toISOString().slice(0, 10);

  let tasks = [...state.tasks];
  switch (filter) {
    case 'today':    tasks = tasks.filter(x => !x.done && x.dueDate === t); break;
    case 'overdue':  tasks = tasks.filter(x => !x.done && x.dueDate && x.dueDate < t); break;
    case 'week':     tasks = tasks.filter(x => !x.done && x.dueDate && x.dueDate <= weekEndStr); break;
    case 'done':     tasks = tasks.filter(x => x.done); break;
    case 'all':      break;
    case 'open':
    default:         tasks = tasks.filter(x => !x.done); break;
  }

  // Sort: overdue first (oldest), then today, then by date asc, then by priority, then no-date last
  tasks.sort((a, b) => {
    if (a.done !== b.done) return a.done ? 1 : -1;
    const ad = a.dueDate || 'zzzz';
    const bd = b.dueDate || 'zzzz';
    if (ad !== bd) return ad < bd ? -1 : 1;
    return PRIORITY_RANK[a.priority || 'med'] - PRIORITY_RANK[b.priority || 'med'];
  });

  // Counts for filter chips
  const openTasks = state.tasks.filter(x => !x.done);
  const todayCount = openTasks.filter(x => x.dueDate === t).length;
  const overdueCount = openTasks.filter(x => x.dueDate && x.dueDate < t).length;
  const weekCount = openTasks.filter(x => x.dueDate && x.dueDate <= weekEndStr).length;
  const doneCount = state.tasks.filter(x => x.done).length;

  const filters = [
    chip(`Open (${openTasks.length})`, filter === 'open', "setTaskFilter('open')"),
    chip(`⚠ Overdue (${overdueCount})`, filter === 'overdue', "setTaskFilter('overdue')"),
    chip(`Today (${todayCount})`, filter === 'today', "setTaskFilter('today')"),
    chip(`This Week (${weekCount})`, filter === 'week', "setTaskFilter('week')"),
    chip(`✓ Done (${doneCount})`, filter === 'done', "setTaskFilter('done')"),
    chip('All', filter === 'all', "setTaskFilter('all')"),
  ].join('');

  // Add task form
  const addForm = `
    <div class="tt-add-form">
      <input id="tt-title" type="text" class="tt-add-title" placeholder="What needs doing?"
        onkeydown="if(event.key==='Enter'){event.preventDefault();addTask();}">
      <div class="tt-add-row">
        <input id="tt-due" type="date" class="tt-add-due" title="Due date">
        <select id="tt-priority" class="tt-add-priority">
          <option value="low">Low</option>
          <option value="med" selected>Med</option>
          <option value="high">High</option>
        </select>
        <select id="tt-lead" class="tt-add-lead">
          <option value="">— No lead —</option>
          ${leadOptionsHtml('')}
        </select>
        <button class="btn bp" onclick="addTask()">+ Add</button>
      </div>
      <textarea id="tt-notes" class="tt-add-notes" placeholder="Notes (optional)..."></textarea>
    </div>`;

  // Task rows
  const rows = tasks.length ? tasks.map(task => {
    if (state.taskEditId === task.id) {
      return `<div class="tt-row tt-row-editing">
        <input id="tt-edit-title-${task.id}" type="text" class="tt-edit-title" value="${esc(task.title)}">
        <div class="tt-edit-row">
          <input id="tt-edit-due-${task.id}" type="date" class="tt-add-due" value="${task.dueDate || ''}">
          <select id="tt-edit-priority-${task.id}" class="tt-add-priority">
            <option value="low" ${task.priority === 'low' ? 'selected' : ''}>Low</option>
            <option value="med" ${task.priority === 'med' || !task.priority ? 'selected' : ''}>Med</option>
            <option value="high" ${task.priority === 'high' ? 'selected' : ''}>High</option>
          </select>
          <select id="tt-edit-lead-${task.id}" class="tt-add-lead">
            <option value="" ${!task.leadId ? 'selected' : ''}>— No lead —</option>
            ${leadOptionsHtml(task.leadId)}
          </select>
        </div>
        <textarea id="tt-edit-notes-${task.id}" class="tt-add-notes">${esc(task.notes || '')}</textarea>
        <div class="tt-edit-actions">
          <button class="btn bp" onclick="saveTaskEdit('${task.id}')">Save</button>
          <button class="btn bg" onclick="cancelTaskEdit()">Cancel</button>
        </div>
      </div>`;
    }
    const pri = PRIORITY_META[task.priority || 'med'];
    const lead = task.leadId ? leadName(task.leadId) : '';
    return `<div class="tt-row${task.done ? ' tt-row-done' : ''}">
      <div class="tt-check ${task.done ? 'tt-checked' : ''}" onclick="toggleTaskDone('${task.id}')">${task.done ? '✓' : ''}</div>
      <div class="tt-body">
        <div class="tt-row-top">
          <span class="tt-pri-dot" style="background:${pri.dot}" title="${pri.label} priority"></span>
          <span class="tt-title">${esc(task.title)}</span>
          ${dueBadge(task.dueDate)}
        </div>
        ${lead ? `<div class="tt-row-lead">🔗 <span onclick="goToLead('${task.leadId}')" style="cursor:pointer;color:#2563eb;text-decoration:underline">${esc(lead)}</span></div>` : ''}
        ${task.notes ? `<div class="tt-row-notes">${esc(task.notes)}</div>` : ''}
      </div>
      <div class="tt-actions">
        <button class="tt-icon-btn" title="Edit" onclick="startTaskEdit('${task.id}')">✏️</button>
        <button class="tt-icon-btn" title="Delete" onclick="deleteTask('${task.id}')">✕</button>
      </div>
    </div>`;
  }).join('') : `<div class="tt-empty">
    <div style="font-size:32px;margin-bottom:8px">✅</div>
    <div style="font-weight:700;color:#64748b;margin-bottom:4px">${filter === 'done' ? 'No completed tasks yet' : 'No tasks here'}</div>
    <div style="font-size:12px;color:#94a3b8">${filter === 'open' || filter === 'all' ? 'Add one using the form above' : 'Try a different filter'}</div>
  </div>`;

  container.innerHTML = `
    <div class="tt-header">
      <div class="tt-title-h">✅ Tasks</div>
      <div class="tt-count">${state.tasks.length} total</div>
    </div>
    ${addForm}
    <div class="tt-filters">${filters}</div>
    <div class="tt-list">${rows}</div>
  `;
}
