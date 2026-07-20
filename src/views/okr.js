import { state } from '../store.js';
import { esc } from '../utils/dom.js';

// Module-level quarter/year selection — defaults to current quarter
const now = new Date();
let selQuarter = 'Q' + (Math.floor(now.getMonth() / 3) + 1);
let selYear = now.getFullYear();

// Show/hide inline add forms
let showAddOKR = false;
let showAddKR = {};  // keyed by okrId

const QUARTERS = ['Q1', 'Q2', 'Q3', 'Q4'];
const Q_DATES = {
  Q1: { start: [0, 1], end: [2, 31] },   // Jan 1 – Mar 31
  Q2: { start: [3, 1], end: [5, 30] },   // Apr 1 – Jun 30
  Q3: { start: [6, 1], end: [8, 30] },   // Jul 1 – Sep 30
  Q4: { start: [9, 1], end: [11, 31] },  // Oct 1 – Dec 31
};

function quarterProgress(q, y) {
  const d = Q_DATES[q];
  if (!d) return 0;
  const start = new Date(y, d.start[0], d.start[1]);
  const end = new Date(y, d.end[0], d.end[1], 23, 59, 59);
  const now = new Date();
  if (now < start) return 0;
  if (now > end) return 100;
  return Math.round(((now - start) / (end - start)) * 100);
}

function krPercent(kr) {
  if (kr.type === 'numeric') {
    if (!kr.target || kr.target <= 0) return 0;
    return Math.min(100, Math.round((kr.current / kr.target) * 100));
  }
  return Math.min(100, Math.max(0, Math.round(kr.current || 0)));
}

function objPercent(okr) {
  if (!okr.keyResults.length) return 0;
  const sum = okr.keyResults.reduce((s, kr) => s + krPercent(kr), 0);
  return Math.round(sum / okr.keyResults.length);
}

function progressColor(pct) {
  if (pct >= 60) return '#10b981';
  if (pct >= 30) return '#f59e0b';
  return '#ef4444';
}

function isAtRisk(kr, qProg) {
  const pct = krPercent(kr);
  return pct < (qProg - 10);
}

export function setOKRQuarter(q, y) {
  selQuarter = q;
  selYear = y;
  showAddOKR = false;
  showAddKR = {};
  renderOKR();
}

export function prevOKRQuarter() {
  const qi = QUARTERS.indexOf(selQuarter);
  if (qi === 0) { selQuarter = 'Q4'; selYear--; }
  else selQuarter = QUARTERS[qi - 1];
  showAddOKR = false;
  showAddKR = {};
  renderOKR();
}

export function nextOKRQuarter() {
  const qi = QUARTERS.indexOf(selQuarter);
  if (qi === 3) { selQuarter = 'Q1'; selYear++; }
  else selQuarter = QUARTERS[qi + 1];
  showAddOKR = false;
  showAddKR = {};
  renderOKR();
}

export function toggleAddOKR() {
  showAddOKR = !showAddOKR;
  renderOKR();
  if (showAddOKR) setTimeout(() => document.getElementById('okr-new-title')?.focus(), 50);
}

export function toggleAddKR(okrId) {
  showAddKR[okrId] = !showAddKR[okrId];
  renderOKR();
  if (showAddKR[okrId]) setTimeout(() => document.getElementById('kr-new-title-' + okrId)?.focus(), 50);
}

export function handleKRTypeChange(okrId) {
  const typeEl = document.getElementById('kr-new-type-' + okrId);
  const targetWrap = document.getElementById('kr-target-wrap-' + okrId);
  if (targetWrap) targetWrap.style.display = typeEl?.value === 'numeric' ? '' : 'none';
}

export function renderOKR() {
  const container = document.getElementById('okrInner');
  if (!container) return;

  const okrs = state.okrs.filter(o => o.quarter === selQuarter && o.year === selYear);
  const qProg = quarterProgress(selQuarter, selYear);

  // Summary stats
  let totalPct = 0, onTrack = 0, atRisk = 0, totalKRs = 0;
  okrs.forEach(o => {
    totalPct += objPercent(o);
    o.keyResults.forEach(kr => {
      totalKRs++;
      if (isAtRisk(kr, qProg)) atRisk++;
      else onTrack++;
    });
  });
  const avgPct = okrs.length ? Math.round(totalPct / okrs.length) : 0;

  // Quarter nav
  const quarterNav = `<div class="okr-quarter-nav">
    <button onclick="prevOKRQuarter()" class="okr-nav-btn">&larr;</button>
    <span class="okr-quarter-label">${selQuarter} ${selYear}</span>
    <button onclick="nextOKRQuarter()" class="okr-nav-btn">&rarr;</button>
  </div>`;

  // Stats bar
  const statsHtml = `<div class="okr-stats">
    <div class="okr-stat-card" style="border-left:3px solid ${progressColor(avgPct)}">
      <div class="okr-stat-val">${avgPct}%</div>
      <div class="okr-stat-lbl">Avg Progress</div>
    </div>
    <div class="okr-stat-card" style="border-left:3px solid #10b981">
      <div class="okr-stat-val">${onTrack}</div>
      <div class="okr-stat-lbl">On Track</div>
    </div>
    <div class="okr-stat-card" style="border-left:3px solid #ef4444">
      <div class="okr-stat-val">${atRisk}</div>
      <div class="okr-stat-lbl">At Risk</div>
    </div>
    <div class="okr-stat-card" style="border-left:3px solid #64748b">
      <div class="okr-stat-val">${qProg}%</div>
      <div class="okr-stat-lbl">Quarter Elapsed</div>
    </div>
  </div>`;

  // OKR cards
  const objCards = okrs.map(o => {
    const pct = objPercent(o);
    const col = progressColor(pct);

    const krRows = o.keyResults.map(kr => {
      const kpct = krPercent(kr);
      const kcol = progressColor(kpct);
      const risk = isAtRisk(kr, qProg);
      const valueDisplay = kr.type === 'numeric'
        ? `<span class="okr-kr-value">${kr.current} / ${kr.target}</span>`
        : '';

      return `<div class="okr-kr-row${risk ? ' okr-kr-at-risk' : ''}">
        <div class="okr-kr-info">
          <input type="text" value="${esc(kr.title)}" class="okr-kr-title-input"
            onchange="updateKRTitle('${o.id}','${kr.id}',this.value)">
          ${risk ? '<span class="okr-risk-badge">AT RISK</span>' : ''}
        </div>
        <div class="okr-kr-track">
          ${valueDisplay}
          <div class="okr-progress-bar">
            <div class="okr-progress-fill" style="width:${kpct}%;background:${kcol}"></div>
          </div>
          <span class="okr-kr-pct">${kpct}%</span>
        </div>
        <div class="okr-kr-controls">
          ${kr.type === 'numeric' ? `
            <input type="number" value="${kr.current}" min="0" step="1"
              class="okr-kr-num-input"
              onchange="updateKRProgress('${o.id}','${kr.id}',this.value)"
              title="Current value">
            <span class="okr-kr-sep">/</span>
            <input type="number" value="${kr.target}" min="1" step="1"
              class="okr-kr-num-input"
              onchange="updateKRTarget('${o.id}','${kr.id}',this.value)"
              title="Target">
          ` : `
            <input type="range" min="0" max="100" value="${kr.current}"
              class="okr-kr-slider"
              oninput="updateKRProgress('${o.id}','${kr.id}',this.value)">
          `}
          <select class="okr-kr-type-select" onchange="updateKRType('${o.id}','${kr.id}',this.value)">
            <option value="percent" ${kr.type==='percent'?'selected':''}>%</option>
            <option value="numeric" ${kr.type==='numeric'?'selected':''}>#</option>
          </select>
          <button class="okr-kr-del" onclick="deleteKeyResult('${o.id}','${kr.id}')" title="Remove KR">&times;</button>
        </div>
      </div>`;
    }).join('');

    const addKRForm = showAddKR[o.id] ? `
      <div class="okr-inline-form">
        <input type="text" id="kr-new-title-${o.id}" placeholder="Key result title..."
          class="okr-inline-input"
          onkeydown="if(event.key==='Enter')addKeyResult('${o.id}')">
        <select id="kr-new-type-${o.id}" class="okr-kr-type-select" onchange="handleKRTypeChange('${o.id}')">
          <option value="percent">% based</option>
          <option value="numeric"># target</option>
        </select>
        <div id="kr-target-wrap-${o.id}" style="display:none">
          <input type="number" id="kr-new-target-${o.id}" placeholder="Target" value="100"
            class="okr-kr-num-input" min="1">
        </div>
        <button onclick="addKeyResult('${o.id}')" class="okr-btn-sm okr-btn-primary">Add</button>
        <button onclick="toggleAddKR('${o.id}')" class="okr-btn-sm">Cancel</button>
      </div>` : '';

    return `<div class="okr-obj-card" style="border-left-color:${col}">
      <div class="okr-obj-header">
        <input type="text" value="${esc(o.title)}" class="okr-obj-title-input"
          onchange="saveOKRTitle('${o.id}',this.value)">
        <div class="okr-obj-actions">
          <span class="okr-obj-pct" style="color:${col}">${pct}%</span>
          <button class="okr-obj-del" onclick="deleteOKR('${o.id}')" title="Delete objective">&times;</button>
        </div>
      </div>
      <div class="okr-obj-progress-bar">
        <div class="okr-progress-fill" style="width:${pct}%;background:${col}"></div>
      </div>
      <div class="okr-kr-list">
        ${krRows || '<div class="okr-kr-empty">No key results yet — add one below</div>'}
      </div>
      ${addKRForm}
      ${!showAddKR[o.id] ? `<button onclick="toggleAddKR('${o.id}')" class="okr-add-kr-btn">+ Add Key Result</button>` : ''}
    </div>`;
  }).join('');

  // Add OKR form
  const addOKRForm = showAddOKR ? `
    <div class="okr-inline-form okr-add-obj-form">
      <input type="text" id="okr-new-title" placeholder="Objective title..."
        class="okr-inline-input okr-inline-input-lg"
        onkeydown="if(event.key==='Enter')addOKR('${selQuarter}',${selYear})">
      <button onclick="addOKR('${selQuarter}',${selYear})" class="okr-btn-sm okr-btn-primary">Add Objective</button>
      <button onclick="toggleAddOKR()" class="okr-btn-sm">Cancel</button>
    </div>` : '';

  const emptyState = !okrs.length && !showAddOKR ? `
    <div class="okr-empty">
      <div class="okr-empty-icon">🎯</div>
      <div class="okr-empty-title">No objectives for ${selQuarter} ${selYear}</div>
      <div class="okr-empty-sub">Click "+ Add Objective" to set your first OKR</div>
    </div>` : '';

  container.innerHTML = `
    <div class="okr-header">
      <div class="okr-header-left">
        <div class="okr-title">🎯 OKRs</div>
        ${quarterNav}
      </div>
      <button onclick="toggleAddOKR()" class="okr-add-btn">+ Add Objective</button>
    </div>
    ${statsHtml}
    <div class="okr-body">
      ${addOKRForm}
      ${objCards}
      ${emptyState}
    </div>
  `;
}
