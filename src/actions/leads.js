import { STAGES } from '../data/stages.js';
import { state, save } from '../store.js';
import { gS } from '../data/stages.js';
import { today, addDays } from '../utils/date.js';
import { uid, esc, log, showToast } from '../utils/dom.js';
import { getPlainText } from '../editor/richText.js';
import { getScriptBody } from '../store.js';
import { renderList } from '../views/list.js';
import { renderDetail } from '../views/detail.js';
import { personalize } from './gmailApi.js';

export function clearF(){['fF','fL','fP','fE','fAddr','fSOS','fWeb','fCo','fInd','fEmp','fLD','fN','fSrc','fDM','fRef','fPolicyType','fCarrier','fRenew'].forEach(id=>{const el=document.getElementById(id);if(el)el.value='';});}
export function openAdd(){
  state.editId=null;
  document.getElementById('mtitle').textContent='➕ Add New Lead';
  document.getElementById('mSave').textContent='Add Lead';
  document.getElementById('mSave').onclick=saveLead;
  clearF();
  document.getElementById('fLD').value=today();
  document.getElementById('modal').style.display='flex';
}
export function openEdit(leadId){
  const l=state.leads.find(x=>x.id===leadId);if(!l)return;
  state.editId=leadId;
  document.getElementById('mtitle').textContent='✏️ Edit Lead';
  document.getElementById('mSave').textContent='Save Changes';
  document.getElementById('mSave').onclick=saveLead;
  document.getElementById('fF').value=l.firstName||'';
  document.getElementById('fL').value=l.lastName||'';
  document.getElementById('fP').value=l.phone||'';
  document.getElementById('fE').value=l.email||'';
  document.getElementById('fAddr').value=l.address||'';
  document.getElementById('fSOS').value=l.sosStatus||'';
  document.getElementById('fWeb').value=l.website||'';
  document.getElementById('fCo').value=l.company||'';
  document.getElementById('fInd').value=l.industry||'';
  document.getElementById('fDM').value=l.decisionMaker||'';
  document.getElementById('fEmp').value=l.employees||'';
  document.getElementById('fLD').value=l.leadDate||'';
  document.getElementById('fSrc').value=l.source||'';
  document.getElementById('fRef').value=l.referredBy||'';
  document.getElementById('fPolicyType').value=l.policyType||'';
  document.getElementById('fCarrier').value=l.carrier||'';
  document.getElementById('fRenew').value=l.renewalDate||'';
  document.getElementById('fN').value='';
  document.getElementById('modal').style.display='flex';
}
export function closeModal(){document.getElementById('modal').style.display='none';state.editId=null;}
export function saveLead(){
  const fn=document.getElementById('fF').value.trim();
  const ln=document.getElementById('fL').value.trim();
  const ph=document.getElementById('fP').value.trim();
  if(!fn||!ln||!ph){alert('First Name, Last Name, and Phone are required.');return;}
  if(state.editId){
    const l=state.leads.find(x=>x.id===state.editId);if(!l)return;
    l.firstName=fn;l.lastName=ln;l.phone=ph;
    l.email=document.getElementById('fE').value.trim();
    l.address=document.getElementById('fAddr').value.trim();
    l.sosStatus=document.getElementById('fSOS').value;
    l.website=document.getElementById('fWeb').value.trim();
    l.company=document.getElementById('fCo').value.trim();
    l.industry=document.getElementById('fInd').value.trim();
    l.decisionMaker=document.getElementById('fDM').value.trim();
    l.employees=document.getElementById('fEmp').value;
    l.leadDate=document.getElementById('fLD').value;
    l.source=document.getElementById('fSrc').value;
    l.referredBy=document.getElementById('fRef').value.trim();
    l.policyType=document.getElementById('fPolicyType').value.trim();
    l.carrier=document.getElementById('fCarrier').value.trim();
    l.renewalDate=document.getElementById('fRenew').value;
    log(l,'Lead info updated','#64748b');
    save();closeModal();renderList();renderDetail();
  }else{
    const note=document.getElementById('fN').value.trim();
    const l={
      id:uid(),firstName:fn,lastName:ln,phone:ph,
      email:document.getElementById('fE').value.trim(),
      address:document.getElementById('fAddr').value.trim(),
      sosStatus:document.getElementById('fSOS').value,
      website:document.getElementById('fWeb').value.trim(),
      company:document.getElementById('fCo').value.trim(),
      industry:document.getElementById('fInd').value.trim(),
      decisionMaker:document.getElementById('fDM').value.trim(),
      employees:document.getElementById('fEmp').value,
      leadDate:document.getElementById('fLD').value,
      source:document.getElementById('fSrc').value,
      referredBy:document.getElementById('fRef').value.trim(),
      policyType:document.getElementById('fPolicyType').value.trim(),
      carrier:document.getElementById('fCarrier').value.trim(),
      renewalDate:document.getElementById('fRenew').value,
      stageId:'new',nextFU:today(),taskChecks:{},
      notes:note?[{text:note,at:new Date().toISOString()}]:[],
      research:[],lostReason:'',lostCategory:'',
      activity:[{txt:'Lead added to CRM',col:'#3b82f6',at:new Date().toISOString()}],
      createdAt:new Date().toISOString()
    };
    state.leads.unshift(l);save();closeModal();state.selId=l.id;renderList();renderDetail();
  }
}
export function delLead(leadId){
  if(!confirm('Delete this lead? This cannot be undone.'))return;
  state.leads=state.leads.filter(l=>l.id!==leadId);state.selId=null;save();renderList();renderDetail();
}
export function copyScript(si, leadId){
  const l=state.leads.find(x=>x.id===leadId);if(!l)return;
  const st=gS(l.stageId);const sc=st.scripts[si];if(!sc||!sc.body)return;
  const skey=`s|${l.stageId}|${si}`;
  const subjectKey=`s|${l.stageId}|${si}|subject`;
  let rawBody=personalize(getPlainText(getScriptBody(skey,sc.body)),l);
  let rawSubj=personalize(getPlainText(getScriptBody(subjectKey,sc.subject||'')),l);
  const txt=(rawSubj?rawSubj+'\n\n':'')+rawBody;
  navigator.clipboard.writeText(txt).then(()=>showToast('📋 Copied!')).catch(()=>{});
}
export function addNote(leadId){
  const inp=document.getElementById('ni_'+leadId);
  if(!inp||!inp.value.trim()){showToast('Type something first.');return;}
  const l=state.leads.find(x=>x.id===leadId);if(!l)return;
  l.notes=l.notes||[];l.notes.push({text:inp.value.trim(),at:new Date().toISOString()});
  log(l,'Note added','#64748b');save();renderDetail();showToast('📝 Note saved!');
}
export function deleteNote(leadId, noteIdx) {
  if (!confirm('Delete this note?')) return;
  const l = state.leads.find(x => x.id === leadId); if (!l) return;
  l.notes.splice(noteIdx, 1);
  log(l, 'Note deleted', '#64748b'); save(); renderDetail();
}
export function startNoteEdit(leadId, noteIdx) {
  const l = state.leads.find(x => x.id === leadId); if (!l) return;
  const note = l.notes[noteIdx]; if (!note) return;
  const bodyDiv = document.getElementById('note_body_' + leadId + '_' + noteIdx);
  if (!bodyDiv || bodyDiv.querySelector('textarea')) return; // already editing
  const currentText = note.text;
  bodyDiv.innerHTML = `
    <textarea id="note_edit_ta_${leadId}_${noteIdx}" style="width:100%;box-sizing:border-box;border:1px solid #e2e8f0;border-radius:6px;padding:6px 8px;font-size:12px;resize:vertical;font-family:inherit;min-height:60px">${currentText.replace(/</g,'&lt;')}</textarea>
    <div style="display:flex;gap:6px;margin-top:4px">
      <button onclick="saveNoteEdit('${leadId}',${noteIdx})" style="padding:3px 10px;border:none;border-radius:5px;background:#2563eb;color:white;font-size:11px;font-weight:700;cursor:pointer">Save</button>
      <button onclick="renderDetail()" style="padding:3px 10px;border:1px solid #e2e8f0;border-radius:5px;background:white;font-size:11px;cursor:pointer">Cancel</button>
    </div>`;
  const ta = document.getElementById('note_edit_ta_' + leadId + '_' + noteIdx);
  if (ta) { ta.focus(); ta.setSelectionRange(ta.value.length, ta.value.length); }
}
export function saveNoteEdit(leadId, noteIdx) {
  const ta = document.getElementById('note_edit_ta_' + leadId + '_' + noteIdx);
  if (!ta) return;
  const newText = ta.value.trim();
  if (!newText) { showToast('Note cannot be empty.'); return; }
  const l = state.leads.find(x => x.id === leadId); if (!l) return;
  if (!l.notes[noteIdx]) return;
  l.notes[noteIdx].text = newText;
  save(); renderDetail();
}
export function researchLead(leadId) {
  const l = state.leads.find(x => x.id === leadId);
  if (!l) return;
  const name = [l.firstName, l.lastName].filter(Boolean).join(' ');
  const company = l.company || '';
  const website = l.website || '';
  const industry = l.industry || '';
  const city = l.address || [l.city, l.state].filter(Boolean).join(', ');
  const employees = l.employees ? `~${l.employees} employees` : '';

  const contextParts = [
    company && `Company: ${company}`,
    website && `Website: ${website}`,
    industry && `Industry: ${industry}`,
    city && `Location: ${city}`,
    employees,
  ].filter(Boolean).join('\n');

  const prompt = `I'm a property & commercial insurance broker preparing to reach out to a prospect. Please research this lead and give me a quick briefing:

Contact: ${name}
${contextParts}

Please tell me:
1. What does this company do and who do they serve?
2. Approximate company size and any recent news or changes
3. Likely coverage needs (property, general liability, auto, workers' comp, umbrella, etc.)
4. Potential pain points — recent claims history, coverage gaps, upcoming renewal/expiration timing
5. A specific, personalized opening line I could use to start the call

Keep it concise — I need this in under 2 minutes before I dial.`;

  const url = 'https://claude.ai/new?q=' + encodeURIComponent(prompt);
  window.open(url, '_blank');

  // Show paste-back panel in the detail view
  const existingPanel = document.getElementById('research_panel_' + leadId);
  if (existingPanel) { existingPanel.querySelector('.research-textarea').focus(); return; }

  const panel = document.createElement('div');
  panel.className = 'research-panel';
  panel.id = 'research_panel_' + leadId;
  panel.innerHTML = `
    <div class="research-panel-title">🔍 AI Research — ${esc(name)}${company ? ' · ' + esc(company) : ''}</div>
    <div class="research-panel-sub">Claude opened in a new tab. Once you have the research, paste it below and click <strong>Save to Notes</strong>.</div>
    <textarea class="research-textarea" id="research_ta_${leadId}" placeholder="Paste Claude's research response here…"></textarea>
    <div class="research-panel-actions">
      <button class="btn bp" style="font-size:12px" onclick="saveResearchNote('${leadId}')">💾 Save to Notes</button>
      <button class="btn bg" style="font-size:12px" onclick="dismissResearch('${leadId}')">Dismiss</button>
    </div>`;

  // Insert just above the Notes card
  const detail = document.getElementById('detail');
  if (detail) {
    const notesCard = [...detail.querySelectorAll('.card')].find(c => c.textContent.includes('📝 Notes'));
    if (notesCard) notesCard.parentNode.insertBefore(panel, notesCard);
    else detail.querySelector('.detail') ? detail.querySelector('.detail').prepend(panel) : detail.prepend(panel);
  }
  setTimeout(() => panel.querySelector('.research-textarea').focus(), 100);
}
export function saveResearchNote(leadId) {
  const ta = document.getElementById('research_ta_' + leadId);
  if (!ta || !ta.value.trim()) { showToast('Paste the research first.'); return; }
  const l = state.leads.find(x => x.id === leadId);
  if (!l) return;
  if (!Array.isArray(l.research)) l.research = l.research ? [{text: l.research, at: new Date().toISOString()}] : [];
  l.research.push({text: ta.value.trim(), at: new Date().toISOString()});
  log(l, 'AI research saved', '#0369a1');
  save();
  dismissResearch(leadId);
  renderDetail();
  showToast('✅ Research saved!');
}
export function saveResearch(leadId, text) {
  if (!text.trim()) { showToast('Type something first.'); return; }
  const l = state.leads.find(x => x.id === leadId); if (!l) return;
  if (!Array.isArray(l.research)) l.research = l.research ? [{text: l.research, at: new Date().toISOString()}] : [];
  l.research.push({text: text.trim(), at: new Date().toISOString()});
  log(l, 'AI research added', '#0369a1');
  save(); renderDetail(); showToast('🔍 Research saved!');
}
export function deleteResearch(leadId, idx) {
  if (!confirm('Delete this research entry?')) return;
  const l = state.leads.find(x => x.id === leadId); if (!l) return;
  if (Array.isArray(l.research)) l.research.splice(idx, 1);
  save(); renderDetail();
}
export function saveLostReason(leadId, text) {
  const l = state.leads.find(x => x.id === leadId);
  if (!l) return;
  l.lostReason = text;
  save();
}
export function dismissResearch(leadId) {
  const panel = document.getElementById('research_panel_' + leadId);
  if (panel) panel.remove();
}
export function sendEmail(si, leadId) {
  const l = state.leads.find(x => x.id === leadId); if (!l) return;
  const st = gS(l.stageId);
  const sc = st.scripts[si]; if (!sc) return;
  const skey = `s|${l.stageId}|${si}`;
  const subjectKey = `s|${l.stageId}|${si}|subject`;
  const bodyText = personalize(getPlainText(getScriptBody(skey, sc.body || '')), l);
  const subjectText = personalize(getPlainText(getScriptBody(subjectKey, sc.subject || '')), l);
  const mailto = `mailto:${encodeURIComponent(l.email||'')}?subject=${encodeURIComponent(subjectText)}&body=${encodeURIComponent(bodyText)}`;
  window.open(mailto, '_blank');
  log(l, `Email draft opened: ${sc.title||sc.tab}`, '#2563eb');
  save();
}
