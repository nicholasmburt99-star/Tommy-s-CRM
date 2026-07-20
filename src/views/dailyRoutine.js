import { state } from '../store.js';
import { esc } from '../utils/dom.js';
import { today } from '../utils/date.js';

function timeOfDay(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

function dateKey(iso) {
  return (iso || '').slice(0, 10);
}

function fmtDateHeading(key) {
  if (!key) return 'Unknown date';
  const t = today();
  if (key === t) return 'Today';
  const d = new Date(key + 'T00:00:00');
  const yest = new Date(); yest.setDate(yest.getDate() - 1); yest.setHours(0,0,0,0);
  const yestKey = yest.getFullYear() + '-' + String(yest.getMonth()+1).padStart(2,'0') + '-' + String(yest.getDate()).padStart(2,'0');
  if (key === yestKey) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

// Pull today's activity entries logged against any lead (stage changes, notes, call debriefs, etc.)
function getTodayLeadActivity() {
  const t = today();
  const items = [];
  state.leads.forEach(lead => {
    (lead.activity || []).forEach(a => {
      if (a.at && a.at.slice(0, 10) === t) {
        items.push({
          leadId: lead.id,
          leadName: [lead.firstName, lead.lastName].filter(Boolean).join(' ') || lead.company || 'Lead',
          txt: a.txt,
          at: a.at,
        });
      }
    });
  });
  return items.sort((a, b) => (a.at > b.at ? -1 : 1));
}

export function renderDaily() {
  const container = document.getElementById('dailyInner');
  if (!container) return;

  const todayDate = new Date().toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  const log = [...(state.dailyLog || [])].sort((a, b) => (a.at > b.at ? -1 : 1));

  // Group standalone daily notes by calendar date
  const groups = {};
  log.forEach(n => {
    const k = dateKey(n.at);
    if (!groups[k]) groups[k] = [];
    groups[k].push(n);
  });
  const dateKeys = Object.keys(groups).sort().reverse();

  const notesListHtml = dateKeys.length ? dateKeys.map(k => `
    <div style="margin-bottom:14px">
      <div style="font-size:11px;font-weight:800;color:#64748b;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:6px">${esc(fmtDateHeading(k))}</div>
      ${groups[k].map(n => `
        <div class="note-item" style="border-left-color:#2563eb;background:#f8fafc">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="note-meta">${timeOfDay(n.at)}</div>
            <button title="Delete" onclick="deleteDailyNote('${n.id}')" style="background:none;border:none;cursor:pointer;font-size:11px;color:#94a3b8;padding:1px 4px;border-radius:4px">✕</button>
          </div>
          <div style="white-space:pre-wrap">${esc(n.text)}</div>
        </div>
      `).join('')}
    </div>
  `).join('') : `<div class="dr-empty">No quick notes yet today — jot one down above.</div>`;

  const todayActivity = getTodayLeadActivity();
  const activityHtml = todayActivity.length ? `<div class="dr-wins-list">${todayActivity.map(a => `
    <div class="dr-win">
      <div class="dr-win-head">
        <span class="dr-win-time">${timeOfDay(a.at)}</span>
        <span class="dr-win-lead" onclick="goToLead('${a.leadId}')">${esc(a.leadName)}</span>
      </div>
      <div class="dr-win-row">${esc(a.txt)}</div>
    </div>
  `).join('')}</div>` : `<div class="dr-empty">No call activity logged yet today.</div>`;

  container.innerHTML = `
    <div class="dr-header">
      <div class="dr-title">📝 Daily Notes</div>
      <div class="dr-subtitle">${todayDate}</div>
    </div>

    <div class="dr-section">
      <div class="dr-section-title">✍️ Quick Note</div>
      <div class="dr-helper">Jot down anything worth remembering — not tied to a specific lead.</div>
      <textarea class="dr-textarea" id="daily-note-input" rows="2" placeholder="What's on your mind?"></textarea>
      <div style="margin-top:8px;text-align:right">
        <button class="btn bp" onclick="addDailyNote(document.getElementById('daily-note-input').value);document.getElementById('daily-note-input').value=''">Add</button>
      </div>
    </div>

    <div class="dr-section">
      <div class="dr-section-title">🗒 Your Notes</div>
      ${notesListHtml}
    </div>

    <div class="dr-section">
      <div class="dr-section-title">📞 Today's Call Activity</div>
      <div class="dr-helper">Everything logged today against a lead — stage moves, quick notes, call notes.</div>
      ${activityHtml}
    </div>
  `;
}
