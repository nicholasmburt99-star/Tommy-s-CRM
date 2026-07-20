import './style.css';
import { onSnapshot } from 'firebase/firestore';
import { CRM_DOC } from './firebase.js';
import { STAGES } from './data/stages.js';
import { today, skipWeekend, addDays, fmtD, fmtDT, fuSt } from './utils/date.js';
import { uid, esc, escPre, log, showToast } from './utils/dom.js';
import { state, save, setOnSave } from './store.js';
import { gS, gSI } from './data/stages.js';
import { getChecks, toggleTask } from './actions/tasks.js';
import { renderList } from './views/list.js';
import { renderDetail } from './views/detail.js';
import { renderOverview } from './views/overview.js';
import { renderKanban } from './views/kanban.js';
import { renderLost } from './views/lost.js';
import { selLead, onSearch, setF, moveS, jumpS, setFU, toggleCS, toggleObj, toggleScriptBody, toggleScriptCollapse, markLost, changeLostCategory } from './actions/pipeline.js';
import { clearF, openAdd, openEdit, closeModal, saveLead, delLead, copyScript, addNote, deleteNote, startNoteEdit, saveNoteEdit, researchLead, saveResearchNote, dismissResearch, saveResearch, deleteResearch, saveLostReason, sendEmail } from './actions/leads.js';
import { daysInStage, logCallOutcome, requestCallback } from './actions/callOutcomes.js';
import { exportCSV, exportJSON, parseJSONFile, openImport, closeImport, parsePaste, doImport, addImportRow, parseCSVFile } from './actions/importExport.js';
import { switchTab, goToLead } from './tabs.js';
import { setReContact, reengageLead } from './views/lost.js';
import { kanbanScrollStart, kanbanScrollStop, kanbanDragStart, kanbanDragEnd, kanbanDragOver, kanbanDragLeave, kanbanDrop } from './views/kanban.js';
import { renderOKR, setOKRQuarter, prevOKRQuarter, nextOKRQuarter, toggleAddOKR, toggleAddKR, handleKRTypeChange } from './views/okr.js';
import { addOKR, deleteOKR, saveOKRTitle, addKeyResult, deleteKeyResult, updateKRProgress, updateKRTitle, updateKRType, updateKRTarget } from './actions/okr.js';
import { toggleLeadCall } from './actions/dailyCalls.js';
import { renderNetwork, setNetworkFilter, getOverdueCount } from './views/network.js';
import { addPartner, editPartner, deletePartner, logInteraction, deleteInteraction, setPartnerStrength, setPartnerNextOutreach, setPartnerNotes, selectPartner, openAddPartnerModal, openEditPartnerModal, closePartnerModal } from './actions/network.js';
import { renderTasks } from './views/taskTracker.js';
import { addTask, toggleTaskDone, deleteTask, startTaskEdit, saveTaskEdit, cancelTaskEdit, setTaskFilter } from './actions/taskTracker.js';
import { renderDaily } from './views/dailyRoutine.js';
import { addDailyNote, deleteDailyNote } from './actions/dailyRoutine.js';
import { openCallDebrief, saveCallDebrief, skipCallDebrief } from './views/callDebriefModal.js';

Object.assign(window, {
  selLead, onSearch, setF, moveS, jumpS, setFU, goToLead, switchTab, markLost, changeLostCategory,
  renderList, renderDetail, renderOverview, renderKanban, renderLost,
  openAdd, openEdit, closeModal, saveLead, delLead, copyScript, sendEmail, addNote, deleteNote, startNoteEdit, saveNoteEdit,
  researchLead, saveResearchNote, dismissResearch, saveResearch, deleteResearch, saveLostReason,
  logCallOutcome, requestCallback,
  exportCSV, exportJSON, parseJSONFile, openImport, closeImport, parsePaste, doImport, addImportRow, parseCSVFile,
  showToast,
  toggleCS, toggleObj, toggleScriptBody, toggleScriptCollapse,
  setReContact, reengageLead,
  getChecks, toggleTask,
  kanbanScrollStart, kanbanScrollStop, kanbanDragStart, kanbanDragEnd,
  kanbanDragOver, kanbanDragLeave, kanbanDrop,
  renderOKR, setOKRQuarter, prevOKRQuarter, nextOKRQuarter, toggleAddOKR, toggleAddKR, handleKRTypeChange,
  addOKR, deleteOKR, saveOKRTitle, addKeyResult, deleteKeyResult, updateKRProgress, updateKRTitle, updateKRType, updateKRTarget,
  toggleLeadCall,
  renderNetwork, setNetworkFilter,
  addPartner, editPartner, deletePartner, logInteraction, deleteInteraction,
  setPartnerStrength, setPartnerNextOutreach, setPartnerNotes,
  selectPartner, openAddPartnerModal, openEditPartnerModal, closePartnerModal,
  renderTasks, addTask, toggleTaskDone, deleteTask, startTaskEdit, saveTaskEdit, cancelTaskEdit, setTaskFilter,
  renderDaily, addDailyNote, deleteDailyNote,
  openCallDebrief, saveCallDebrief, skipCallDebrief,
});

document.addEventListener('keydown', e => {
  if (document.getElementById('modal').style.display !== 'none' && e.key === 'Escape') closeModal();
});

// INIT — fix any existing leads whose nextFU falls on a weekend
(function fixWeekendDates() {
  let changed = false;
  state.leads.forEach(l => {
    if (l.nextFU) {
      const safe = skipWeekend(l.nextFU);
      if (safe !== l.nextFU) { l.nextFU = safe; changed = true; }
    }
  });
  if (changed) save();
})();
// Re-render the active tab after every save() to keep data fresh
setOnSave(() => {
  if (state.activeTab === 'overview') renderOverview();
  if (state.activeTab === 'kanban') renderKanban();
  if (state.activeTab === 'okr') renderOKR();
  if (state.activeTab === 'network') renderNetwork();
  if (state.activeTab === 'tasks') renderTasks();
  if (state.activeTab === 'daily') renderDaily();
  updateNetworkBadge();
  updateTasksBadge();
});

function updateTasksBadge() {
  const t = today();
  const count = state.tasks.filter(x => !x.done && x.dueDate && x.dueDate <= t).length;
  const badge = document.getElementById('tt-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
  }
}

function updateNetworkBadge() {
  const count = getOverdueCount();
  const badge = document.getElementById('nw-badge');
  if (badge) {
    badge.textContent = count;
    badge.style.display = count > 0 ? 'inline' : 'none';
  }
}

switchTab('kanban');

// Overdue toasts on app open
setTimeout(() => {
  updateNetworkBadge();
  updateTasksBadge();
  const oc = getOverdueCount();
  if (oc > 0) showToast(`🤝 ${oc} networking partner${oc > 1 ? 's' : ''} overdue for check-in`);
  const t = today();
  const lostDue = state.leads.filter(l => l.stageId === 'lost' && l.reContactDate && l.reContactDate <= t).length;
  if (lostDue > 0) showToast(`📋 ${lostDue} lost lead${lostDue > 1 ? 's' : ''} due for re-contact`);
  const taskDue = state.tasks.filter(x => !x.done && x.dueDate && x.dueDate <= t).length;
  if (taskDue > 0) showToast(`✅ ${taskDue} task${taskDue > 1 ? 's' : ''} due or overdue`);
}, 500);

// ── Firestore real-time sync ────────────────────────────────────────────────
onSnapshot(CRM_DOC, (snap) => {
  if (!snap.exists()) {
    // First time opening — push local data up to Firestore
    if (state.leads.length > 0) save();
    return;
  }
  const data = snap.data();
  if (!data.leads) return;
  // Skip if this matches what's already in state (our own write came back)
  if (data.leads === JSON.stringify(state.leads)) return;
  // Remote change — update state and re-render
  state.leads = JSON.parse(data.leads);
  localStorage.setItem('bpcrm2_leads', data.leads);
  if (data.scripts) {
    state.scriptOverrides = JSON.parse(data.scripts);
    localStorage.setItem('bpcrm2_scripts', data.scripts);
  }
  if (data.okrs) {
    state.okrs = JSON.parse(data.okrs);
    localStorage.setItem('bpcrm2_okrs', data.okrs);
  }
  if (data.partners) {
    state.partners = JSON.parse(data.partners);
    localStorage.setItem('bpcrm2_partners', data.partners);
  }
  if (data.tasks) {
    state.tasks = JSON.parse(data.tasks);
    localStorage.setItem('bpcrm2_tasks', data.tasks);
  }
  if (data.dailyLog) {
    state.dailyLog = JSON.parse(data.dailyLog);
    localStorage.setItem('bpcrm2_dailyLog', data.dailyLog);
  }
  switchTab(state.activeTab);
}, (err) => console.warn('Firestore listener error:', err));
