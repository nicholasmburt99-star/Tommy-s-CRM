import { state } from '../store.js';
import { STAGES, gS } from '../data/stages.js';
import { today, fmtD, fuSt } from '../utils/date.js';
import { esc } from '../utils/dom.js';
import { daysInStage } from '../actions/callOutcomes.js';

export function renderList() {
  const el = document.getElementById('leadsList');
  let arr = state.leads.filter(l => {
    const q = state.searchQ.toLowerCase();
    const mq = !q || (l.firstName+' '+l.lastName).toLowerCase().includes(q) || l.phone.includes(q) || (l.company||'').toLowerCase().includes(q) || (l.email||'').toLowerCase().includes(q);
    if(!mq)return false;
    const inPipeline = !['quoted','bound','lost'].includes(l.stageId);
    if(state.activeFilter==='active')return inPipeline && (!l.nextFU || l.nextFU > today());
    if(state.activeFilter==='due')return inPipeline && !!l.nextFU && l.nextFU <= today();
    if(state.activeFilter==='quoting')return l.stageId==='quoted';
    if(state.activeFilter==='bound')return l.stageId==='bound';
    if(state.activeFilter==='lost')return l.stageId==='lost';
    return false;
  });
  arr.sort((a,b)=>{
    if(a.nextFU&&b.nextFU)return a.nextFU.localeCompare(b.nextFU);
    if(a.nextFU)return -1; if(b.nextFU)return 1;
    return new Date(b.createdAt)-new Date(a.createdAt);
  });
  if(!arr.length){el.innerHTML=`<div class="empty-state"><div class="ei">🔍</div><h3>No leads found</h3><p>Adjust filter or add a new lead.</p></div>`;return;}
  el.innerHTML=arr.map(l=>{
    const st=gS(l.stageId),fu=fuSt(l);
    const dayCount = daysInStage(l);
    const stuckWarning = dayCount > 7 && !['bound','lost'].includes(l.stageId) ? `⚠️ ${dayCount}d` : '';
    return `<div class="lead-item ${l.id===state.selId?'active':''}" onclick="selLead('${l.id}')">
      <div class="li-top">
        <div class="li-name">${esc(l.firstName)} ${esc(l.lastName)}</div>
        <div style="display:flex;gap:4px;align-items:center">
          ${stuckWarning ? `<span style="font-size:9px;font-weight:700;color:#f59e0b">${stuckWarning}</span>` : ''}
          <span class="li-badge" style="background:${st.bg};color:${st.text}">${st.short}</span>
        </div>
      </div>
      <div class="li-phone">📞 ${esc(l.phone)}${l.company?' · '+esc(l.company):''}</div>
      <div class="li-meta">
        <span>${fmtD(l.leadDate||l.createdAt.split('T')[0])}</span>
        ${fu?`<span class="${fu.cls}">${fu.label}`:'' }
      </div>
    </div>`;
  }).join('');
}
