import { STAGES } from '../data/stages.js';
import { state, save } from '../store.js';
import { gS, gSI } from '../data/stages.js';
import { today, addDays, skipWeekend, fmtD } from '../utils/date.js';
import { log, showToast } from '../utils/dom.js';
import { renderList } from '../views/list.js';
import { renderDetail } from '../views/detail.js';
import { renderOverview } from '../views/overview.js';
import { renderQueue } from '../views/queue.js';
import { showLostReasonPicker } from './lostReasonPicker.js';

export function markLost(leadId) {
  if (!leadId) leadId = state.selId;
  if (!leadId) return;
  showLostReasonPicker(leadId, (category, note) => {
    const l = state.leads.find(x => x.id === leadId);
    if (!l) return;
    l.lostCategory = category;
    if (note) l.lostReason = note;
    state.selId = leadId;
    jumpS('lost');
  });
}

export function changeLostCategory(leadId) {
  if (!leadId) return;
  showLostReasonPicker(leadId, (category, note) => {
    const l = state.leads.find(x => x.id === leadId);
    if (!l) return;
    l.lostCategory = category;
    if (note) l.lostReason = note;
    save(); renderList(); renderDetail();
  });
}

export function selLead(id){state.selId=id;renderList();renderDetail();if(state.activeTab==='overview')renderOverview();}
export function onSearch(v){state.searchQ=v;renderList();}
export function setF(f,btn){state.activeFilter=f;document.querySelectorAll('.fbtn').forEach(b=>b.classList.remove('active'));btn.classList.add('active');renderList();}
export function moveS(leadId,dir){
  const l=state.leads.find(x=>x.id===leadId);if(!l)return;
  const i=gSI(l.stageId),ni=Math.max(0,Math.min(STAGES.length-1,i+dir));
  if(ni===i)return;
  const old=gS(l.stageId);l.stageId=STAGES[ni].id;const nw=gS(l.stageId);
  if(nw.followDays>0)l.nextFU=addDays(nw.followDays);
  if(nw.id==='lost')l.reContactDate=addDays(90);
  log(l,`Stage: ${old.label} → ${nw.label}`,nw.color);
  save();renderList();renderDetail();
  if(state.activeTab==='queue')renderQueue();
}
export function jumpS(stageId){
  if(!state.selId)return;
  const l=state.leads.find(x=>x.id===state.selId);if(!l)return;
  const old=gS(l.stageId);l.stageId=stageId;const nw=gS(stageId);
  if(nw.followDays>0)l.nextFU=addDays(nw.followDays);
  if(stageId==='lost') l.reContactDate=addDays(90);
  log(l,`Stage: ${old.label} → ${nw.label}`,nw.color);
  save();renderList();renderDetail();
  if(state.activeTab==='queue')renderQueue();
}
export function setFU(leadId,date){
  const l=state.leads.find(x=>x.id===leadId);if(!l)return;
  const safe=skipWeekend(date);
  if(safe!==date) showToast(`📅 Moved to ${fmtD(safe)} — no weekends!`);
  l.nextFU=safe;log(l,`Follow-up set to ${fmtD(safe)}`,'#f59e0b');
  save();renderList();renderDetail();
  if(state.activeTab==='queue')renderQueue();
}
export function toggleCS(id){const el=document.getElementById(id);if(el)el.classList.toggle('open');}
export function toggleObj(id){const el=document.getElementById(id);if(el)el.classList.toggle('open');}
export function toggleScriptBody(id){const el=document.getElementById(id);if(el)el.style.display=el.style.display==='none'?'':'none';}
export function toggleScriptCollapse(si) {
  const section = document.getElementById('ss_' + si);
  const body = document.getElementById('sb_' + si);
  if (!section || !body) return;
  const isOpen = body.style.display !== 'none';
  body.style.display = isOpen ? 'none' : '';
  if (isOpen) section.classList.remove('open');
  else section.classList.add('open');
}
