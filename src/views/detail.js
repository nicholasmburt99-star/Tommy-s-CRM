import { STAGES, gS, gSI } from '../data/stages.js';
import { state } from '../store.js';
import { today, fmtD, fmtDT, fuSt, addDays } from '../utils/date.js';
import { toggleLeadCall } from '../actions/dailyCalls.js';
import { esc } from '../utils/dom.js';
import { getChecks } from '../actions/tasks.js';
import { daysInStage } from '../actions/callOutcomes.js';
import { LOST_CATEGORIES } from '../data/lostCategories.js';

export function renderDetail() {
  const panelId = state.activeTab === 'kanban' ? 'kanban-detail' : 'detail';
  const panel = document.getElementById(panelId);
  if(!panel) return;
  if(!state.selId){panel.innerHTML=`<div class="no-sel"><div class="ni">👥</div><h2>Select a lead</h2><p>Click a row to view details</p></div>`;return;}
  const lead = state.leads.find(l=>l.id===state.selId);
  if(!lead){state.selId=null;renderDetail();return;}
  const st = gS(lead.stageId), idx = gSI(lead.stageId), fu = fuSt(lead);
  const checks = getChecks(lead, lead.stageId);

  // Stage track (compact)
  let track = '';
  STAGES.forEach((s,i)=>{
    const dc = i<idx?'done':i===idx?'current':'future';
    const lc = i<idx?'done':i===idx?'current':'';
    const num = i<idx?'✓':(i+1);
    if(i>0) track += `<div class="st-conn-wrap"><div class="st-conn ${i<=idx?'done':''}"></div></div>`;
    track += `<div class="st-step" onclick="${s.id === 'lost' ? `markLost('${lead.id}')` : `jumpS('${s.id}')`}" title="${s.label}" style="cursor:pointer">
      <div class="st-dot ${dc}">${num}</div>
      <div class="st-lbl ${lc}">${s.short}</div>
    </div>`;
  });

  // Info row
  const locationStr = lead.address || [lead.city, lead.state].filter(Boolean).join(', ');
  const sosLabels = { active: '✅ SOS Active', suspended: '⚠️ SOS Suspended', forfeited: '⛔ SOS Forfeited', dissolved: '⛔ SOS Dissolved', not_found: '❓ SOS Not Found', not_checked: '🔍 SOS Not Checked' };
  const info = [
    lead.phone?`📞 ${esc(lead.phone)}`:'',
    lead.email?`✉️ ${esc(lead.email)}`:'',
    locationStr?`📍 ${esc(locationStr)}`:'',
    lead.sosStatus?sosLabels[lead.sosStatus]||'':'',
    lead.company?`🏢 ${esc(lead.company)}`:'',
    lead.website?`🌐 <a href="${esc(lead.website)}" target="_blank" style="color:#2563eb;text-decoration:none">${esc(lead.website.replace(/^https?:\/\//,''))}</a>`:'',
    lead.industry?`${esc(lead.industry)}`:'',
    lead.employees?`👥 ${esc(lead.employees)} employees`:'',
    lead.source?`📌 ${esc(lead.source)}`:'',
    lead.decisionMaker?`👤 DM: ${esc(lead.decisionMaker)}`:'',
    lead.referredBy?`🤝 Ref: ${esc(lead.referredBy)}`:'',
    lead.carrier || lead.policyType ? `📋 ${lead.carrier||''} ${lead.policyType?'('+lead.policyType+')':''}`:'',
    lead.renewalDate?`🔄 Renews ${fmtD(lead.renewalDate)}`:'',
  ].filter(Boolean).map(x=>`<span>${x}</span>`).join('');

  // Tasks HTML
  let tasksHtml = '';
  {
    const hideCallChecks = ['quoted','lost','new'].includes(lead.stageId);
    const todayStr = today();
    const dc = ((lead.dailyCalls && lead.dailyCalls[todayStr]) || [false, false]).slice(0, 2);
    const dcDone = dc.filter(Boolean).length;
    const callChecks = hideCallChecks ? '' : dc.map((checked, ci) =>
      `<div class="task-item ${checked?'done-task':''}" onclick="toggleLeadCall('${lead.id}',${ci})">
        <span class="task-icon">📞</span>
        <div class="task-check">${checked?'✓':''}</div>
        <span class="task-label">Cold Call #${ci+2}</span>
      </div>`
    ).join('');
    const allStageTasksDone = st.tasks.length ? checks.every(Boolean) : true;
    const allCallsDone = hideCallChecks || dcDone === 2;
    const allDone = allStageTasksDone && allCallsDone && st.tasks.length > 0;
    tasksHtml = `<div class="card">
      <div class="sec-title">✅ Today's Tasks${allDone?' — All Done! 🎉':''}</div>
      <div class="task-list">
        ${st.tasks.map((t,i)=>`
          <div class="task-item ${checks[i]?'done-task':''}" onclick="toggleTask('${lead.id}','${lead.stageId}',${i})">
            <span class="task-icon">${t.icon}</span>
            <div class="task-check">${checks[i]?'✓':''}</div>
            <span class="task-label">${esc(t.label)}</span>
          </div>`).join('')}
        ${callChecks}
      </div>
    </div>`;
  }

  // Quick Notes — free-text notes + activity log, timestamped
  const notesHtml = (lead.notes||[]).length
    ? [...(lead.notes||[])].map((n,realIdx)=>({n,realIdx})).reverse().map(({n,realIdx}) => {
        const isAI = n.text.startsWith('🔍 AI Research:');
        const borderColor = isAI ? '#0369a1' : '#2563eb';
        const bg = isAI ? '#f0f9ff' : '#f8fafc';
        const label = isAI ? '<span style="font-size:9px;font-weight:800;background:#0369a1;color:white;padding:1px 6px;border-radius:10px;margin-left:6px">AI RESEARCH</span>' : '';
        const bodyText = isAI ? n.text.replace('🔍 AI Research:\n','') : n.text;
        const btnStyle = 'background:none;border:none;cursor:pointer;font-size:11px;color:#94a3b8;padding:1px 4px;border-radius:4px';
        return `<div class="note-item" id="note_${lead.id}_${realIdx}" style="border-left-color:${borderColor};background:${bg}">
          <div style="display:flex;justify-content:space-between;align-items:center">
            <div class="note-meta">${fmtDT(n.at)}${label}</div>
            <div>
              <button style="${btnStyle}" title="Edit" onclick="startNoteEdit('${lead.id}',${realIdx})">✏️</button>
              <button style="${btnStyle}" title="Delete" onclick="deleteNote('${lead.id}',${realIdx})">✕</button>
            </div>
          </div>
          <div id="note_body_${lead.id}_${realIdx}" style="white-space:pre-wrap">${esc(bodyText)}</div>
        </div>`;
      }).join('')
    : '<div style="color:#94a3b8;font-size:11px;margin-bottom:8px">No notes yet.</div>';

  const quickNotesHtml = `<div class="card">
      <div class="sec-title">📝 Quick Notes</div>
      <div class="notes-list">${notesHtml}</div>
      <div class="note-add">
        <textarea class="note-input" id="ni_${lead.id}" placeholder="Add a note about this lead or call…"></textarea>
        <button class="btn bp" onclick="addNote('${lead.id}')">Add Note</button>
      </div>
    </div>`;

  // Activity
  const actHtml = (lead.activity||[]).length
    ? (lead.activity||[]).slice().reverse().map(a=>`<div class="act-item"><div class="act-dot" style="background:${a.col||'#2563eb'}"></div><div><div class="act-txt">${esc(a.txt)}</div><div class="act-time">${fmtDT(a.at)}</div></div></div>`).join('')
    : '<div style="color:#94a3b8;font-size:11px">No activity yet.</div>';

  const dayCount = daysInStage(lead);
  const stuckMsg = dayCount > 7 && !['bound','lost'].includes(lead.stageId) ? `<div style="font-size:11px;color:#f59e0b;font-weight:700;margin-top:6px">⚠️ In this stage for ${dayCount} days — consider moving forward</div>` : '';

  panel.innerHTML = `
    <div class="dh">
      <div>
        <div class="dh-name">${esc(lead.firstName)} ${esc(lead.lastName)}</div>
        <div class="dh-info">${info}</div>
        ${lead.leadDate?`<div style="font-size:10px;color:#94a3b8;margin-top:4px">Lead received: ${fmtD(lead.leadDate)}</div>`:''}
        ${stuckMsg}
      </div>
      <div class="dh-actions">
        <button class="btn bg" onclick="openEdit('${lead.id}')">✏️ Edit</button>
        <button class="btn bd" onclick="delLead('${lead.id}')">🗑️</button>
      </div>
    </div>

    <div class="fu-bar">
      <label>📅 Next Follow-Up:</label>
      <input type="date" class="fu-input" value="${lead.nextFU||''}" onchange="setFU('${lead.id}',this.value)">
      ${fu?`<span class="fu-status ${fu.cls}">${fu.label}</span>`:''}
      <div style="flex:1"></div>
      <button class="btn bg" style="font-size:10px;padding:3px 8px" onclick="setFU('${lead.id}','${addDays(1)}')">+1d</button>
      <button class="btn bg" style="font-size:10px;padding:3px 8px" onclick="setFU('${lead.id}','${addDays(3)}')">+3d</button>
      <button class="btn bg" style="font-size:10px;padding:3px 8px" onclick="setFU('${lead.id}','${addDays(7)}')">+1wk</button>
    </div>

    <div class="call-outcomes">
      <button class="call-outcome-btn" onclick="logCallOutcome('${lead.id}','connected')">🤝 Connected</button>
      <button class="call-outcome-btn" onclick="requestCallback('${lead.id}')">📅 Callback Requested</button>
      <button class="call-outcome-btn" onclick="logCallOutcome('${lead.id}','not_interested')">🚫 Not Interested</button>
    </div>

    <div class="stage-card">
      <div class="sec-title">📊 Pipeline — ${STAGES.length} Stages</div>
      <div class="stage-track">${track}</div>
      <div class="stage-btns">
        ${idx>0?`<button class="btn bg" onclick="moveS('${lead.id}',-1)">← Back</button>`:''}
        <span class="stage-cur" style="background:${st.bg};color:${st.text}">${st.label}</span>
        ${idx<STAGES.length-1?`<button class="btn bp" onclick="moveS('${lead.id}',1)">Next Stage →</button>`:''}
        ${!['quoted','bound','lost'].includes(lead.stageId)?`<button class="btn" style="background:#7c3aed;color:white;border:none;padding:6px 12px;border-radius:7px;font-size:11px;font-weight:700;cursor:pointer" onclick="jumpS('quoted')">📋 Move to Quoting</button>`:''}
        ${lead.stageId!=='bound'?`<button class="btn bs" onclick="jumpS('bound')">✓ Mark Bound</button>`:''}
        <div style="display:flex;gap:6px;margin-left:auto">
          ${lead.stageId!=='lost'?`<button class="btn bw" onclick="markLost('${lead.id}')">Mark Lost</button>`:''}
        </div>
      </div>
    </div>

    ${tasksHtml}
    ${quickNotesHtml}

    <div class="card">
      <div class="sec-title" style="color:#0369a1">🔍 AI Research</div>
      ${(()=>{
        const rItems = Array.isArray(lead.research) ? lead.research : (lead.research ? [{text: lead.research, at: null}] : []);
        const btnStyle = 'background:none;border:none;cursor:pointer;font-size:11px;color:#94a3b8;padding:1px 4px;border-radius:4px';
        const rHtml = rItems.length
          ? [...rItems].map((r,realIdx)=>({r,realIdx})).reverse().map(({r,realIdx})=>
              `<div class="note-item" style="border-left-color:#0369a1;background:#f0f9ff">
                <div style="display:flex;justify-content:space-between;align-items:center">
                  <div class="note-meta">${r.at ? fmtDT(r.at) : 'Imported'}</div>
                  <button style="${btnStyle}" title="Delete" onclick="deleteResearch('${lead.id}',${realIdx})">✕</button>
                </div>
                <div style="white-space:pre-wrap">${esc(r.text)}</div>
              </div>`
            ).join('')
          : '<div style="color:#94a3b8;font-size:11px;margin-bottom:8px">No research saved yet.</div>';
        return `<div class="notes-list">${rHtml}</div>
          <div class="note-add">
            <textarea class="note-input" id="ri_${lead.id}" placeholder="Paste or type research…"></textarea>
            <button class="btn bp" onclick="saveResearch('${lead.id}',document.getElementById('ri_${lead.id}').value)">Save</button>
          </div>
          <div style="margin-top:8px">
            <button class="btn" style="background:#f0f9ff;color:#0369a1;border:1px solid #bae6fd;padding:6px 12px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer" onclick="researchLead('${lead.id}')">🔍 Research with Claude</button>
          </div>`;
      })()}
    </div>

    <div class="card" style="${lead.stageId==='lost'?'border:1.5px solid #fecaca;':''}">
      <div class="sec-title" style="color:${lead.stageId==='lost'?'#dc2626':'#64748b'}">❌ Lost Reason</div>
      ${(()=>{
        const cat = lead.lostCategory ? LOST_CATEGORIES.find(c=>c.id===lead.lostCategory) : null;
        if (cat) return `<div class="lost-cat-chip" style="cursor:pointer" onclick="changeLostCategory('${lead.id}')" title="Click to change category">${cat.icon} ${esc(cat.label)} <span style="font-size:9px;color:#94a3b8;margin-left:4px">✎</span></div>`;
        return `<button class="btn" style="background:#fef2f2;color:#dc2626;border:1px solid #fecaca;padding:6px 12px;border-radius:7px;font-size:12px;font-weight:700;cursor:pointer;margin-bottom:8px" onclick="changeLostCategory('${lead.id}')">+ Set Lost Category</button>`;
      })()}
      <textarea id="lost_reason_ta_${lead.id}" rows="3"
        style="width:100%;box-sizing:border-box;border:1px solid ${lead.stageId==='lost'?'#fecaca':'#e2e8f0'};border-radius:8px;padding:8px 10px;font-size:12px;resize:vertical;font-family:inherit;color:#1e293b;margin-bottom:8px;background:${lead.stageId==='lost'?'#fef2f2':'white'}"
        placeholder="Additional notes about why this lead was lost…"
        onblur="saveLostReason('${lead.id}',this.value)">${esc(lead.lostReason||'')}</textarea>
      <button class="btn bp" style="font-size:12px" onclick="saveLostReason('${lead.id}',document.getElementById('lost_reason_ta_${lead.id}').value);showToast('✅ Lost reason saved!')">Save</button>
    </div>

    <div class="card">
      <div class="sec-title">🕐 Activity Log</div>
      ${actHtml}
    </div>
  `;
}
