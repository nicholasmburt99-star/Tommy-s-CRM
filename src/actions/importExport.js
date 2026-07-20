import { STAGES } from '../data/stages.js';
import { state, save } from '../store.js';
import { gS } from '../data/stages.js';
import { today } from '../utils/date.js';
import { uid, showToast } from '../utils/dom.js';
import { renderList } from '../views/list.js';
import { renderDetail } from '../views/detail.js';
import { renderQueue } from '../views/queue.js';

// Map exported stage labels back to stageIds
const STAGE_LABEL_MAP = {
  'new lead': 'new', 'new': 'new',
  'contacted': 'contacted',
  'quoted': 'quoted',
  'submitted': 'submitted',
  'bound ✓': 'bound', 'bound': 'bound',
  'lost': 'lost',
};

export const IMPORT_COLS = ['firstName','lastName','phone','company','industry','state','employees','leadDate'];
export const IMPORT_PLACEHOLDERS = ['John','Smith','(555) 123-4567','Acme Dental','Dental','CA','8',''];
export function makeImportRow(vals, extras) {
  vals = vals || [];
  const tr = document.createElement('tr');
  if (extras) tr.dataset.extras = JSON.stringify(extras);
  IMPORT_COLS.forEach((col, i) => {
    const td = document.createElement('td');
    const inp = document.createElement('input');
    inp.type = col === 'leadDate' ? 'date' : 'text';
    inp.placeholder = IMPORT_PLACEHOLDERS[i] || '';
    inp.value = vals[i] || '';
    if (col === 'leadDate' && !inp.value) inp.value = today();
    inp.dataset.col = col;
    inp.oninput = updateImportCount;
    td.appendChild(inp);
    tr.appendChild(td);
  });
  // delete button
  const delTd = document.createElement('td');
  delTd.className = 'del-col';
  const delBtn = document.createElement('button');
  delBtn.className = 'del-row-btn';
  delBtn.textContent = '✕';
  delBtn.title = 'Remove row';
  delBtn.onclick = () => { tr.remove(); updateImportCount(); };
  delTd.appendChild(delBtn);
  tr.appendChild(delTd);
  return tr;
}
export function addImportRow(vals, extras) {
  const tbody = document.getElementById('importBody');
  tbody.appendChild(makeImportRow(vals, extras));
  updateImportCount();
}
export function updateImportCount() {
  const rows = document.querySelectorAll('#importBody tr');
  let filled = 0;
  rows.forEach(row => {
    const inputs = row.querySelectorAll('input');
    const fn = inputs[0]?.value.trim();
    const ln = inputs[1]?.value.trim();
    const ph = inputs[2]?.value.trim();
    if (fn && ln && ph) filled++;
    // highlight missing required fields
    [inputs[0], inputs[1], inputs[2]].forEach(inp => {
      if (inp) {
        if (!inp.value.trim()) inp.classList.add('err');
        else inp.classList.remove('err');
      }
    });
  });
  // only show errors if some rows have data
  const anyData = [...rows].some(row => {
    const inputs = row.querySelectorAll('input');
    return inputs[0]?.value.trim() || inputs[1]?.value.trim() || inputs[2]?.value.trim();
  });
  if (!anyData) {
    document.querySelectorAll('#importBody input.err').forEach(el => el.classList.remove('err'));
  }
  const el = document.getElementById('importCount');
  if (el) el.innerHTML = `<strong>${filled}</strong> lead${filled!==1?'s':''} ready to import (First Name, Last Name, Phone required)`;
}
export function parsePaste() {
  const raw = document.getElementById('pasteArea').value.trim();
  if (!raw) return;

  const lines = raw.split(/\r?\n/).filter(l => l.trim());
  const rows = lines.map(line => {
    // detect separator: tab or comma
    const sep = line.includes('\t') ? '\t' : ',';
    return line.split(sep).map(cell => cell.trim().replace(/^"|"$/g, ''));
  });

  // detect if first row is a header (no phone-number-like content)
  const isHeader = row => row.some(c => /^(first|last|name|phone|company|industry|state|employee|date)/i.test(c));
  let dataRows = rows;
  let headerRow = null;
  if (rows.length > 0 && isHeader(rows[0])) {
    headerRow = rows[0].map(h => h.toLowerCase());
    dataRows = rows.slice(1);
  }

  if (!dataRows.length) {
    document.getElementById('importError').textContent = 'No data rows found. Make sure you have at least one data row.';
    return;
  }
  document.getElementById('importError').textContent = '';

  // All column aliases including extra fields
  const ALL_ALIASES = {
    firstName: ['first','first name','firstname','given name','fname'],
    lastName: ['last','last name','lastname','surname','lname'],
    phone: ['phone','phone number','cell','mobile','tel'],
    company: ['company','business','employer','organization','org'],
    industry: ['industry','type','sector'],
    state: ['state','st'],
    employees: ['employees','# employees','emp','headcount','size'],
    leadDate: ['lead date','date','received','date received'],
    // extra fields
    email: ['email','e-mail','email address'],
    city: ['city','town','location'],
    website: ['website','web','url','site'],
    source: ['lead source','source','src'],
    referredBy: ['referred by','referral','referred','ref by'],
    decisionMaker: ['decision maker','dm','decision-maker'],
    carrier: ['carrier','current carrier'],
    policyType: ['policy type','plan type','plan','coverage type'],
    renewalDate: ['renewal date','renewal','renews'],
    stage: ['stage','pipeline stage'],
    nextFU: ['next follow-up','next followup','follow-up','followup','next fu'],
    createdAt: ['created at','created','date created'],
  };

  // Try to map columns by header, or fall back to positional
  function mapRow(cells) {
    if (!headerRow) {
      return { vals: cells.slice(0, 8), extras: {} };
    }
    function getCol(col) {
      const keys = ALL_ALIASES[col] || [col.toLowerCase()];
      const idx = headerRow.findIndex(h => keys.some(k => h.includes(k)));
      return idx >= 0 ? (cells[idx] || '') : '';
    }
    const vals = IMPORT_COLS.map(col => getCol(col));
    const extras = {};
    ['email','city','website','source','referredBy','decisionMaker','carrier','policyType','renewalDate','stage','nextFU','createdAt'].forEach(col => {
      const v = getCol(col);
      if (v) extras[col] = v;
    });
    return { vals, extras };
  }

  // Clear existing rows and repopulate
  document.getElementById('importBody').innerHTML = '';
  dataRows.forEach(row => {
    if (row.every(c => !c)) return; // skip blank rows
    const { vals, extras } = mapRow(row);
    addImportRow(vals, extras);
  });

  // Clear paste area
  document.getElementById('pasteArea').value = '';
  updateImportCount();
}
export function doImport() {
  const rows = document.querySelectorAll('#importBody tr');
  const toImport = [];
  let hasError = false;

  rows.forEach((row, ri) => {
    const inputs = row.querySelectorAll('input');
    const fn = inputs[0]?.value.trim();
    const ln = inputs[1]?.value.trim();
    const ph = inputs[2]?.value.trim();
    if (!fn && !ln && !ph) return; // skip fully blank rows
    if (!fn || !ln || !ph) {
      hasError = true;
      [inputs[0], inputs[1], inputs[2]].forEach(inp => {
        if (inp && !inp.value.trim()) inp.classList.add('err');
      });
      return;
    }
    const vals = {};
    inputs.forEach(inp => { if (inp.dataset.col) vals[inp.dataset.col] = inp.value.trim(); });
    const extras = row.dataset.extras ? JSON.parse(row.dataset.extras) : {};
    toImport.push({ ...extras, ...vals });
  });

  if (hasError) {
    document.getElementById('importError').textContent = '⚠️ Some rows are missing First Name, Last Name, or Phone. Please fill them in or remove the row.';
    return;
  }
  if (!toImport.length) {
    document.getElementById('importError').textContent = '⚠️ No leads to import. Add at least one row with First Name, Last Name, and Phone.';
    return;
  }

  const t = today();
  toImport.forEach(v => {
    const stageId = STAGE_LABEL_MAP[(v.stage || '').toLowerCase().trim()] || 'new';
    const lead = {
      id: uid(),
      firstName: v.firstName, lastName: v.lastName, phone: v.phone,
      email: v.email || '',
      city: v.city || '',
      state: (v.state || '').toUpperCase(),
      website: v.website || '',
      company: v.company || '',
      industry: v.industry || '',
      decisionMaker: v.decisionMaker || '',
      employees: v.employees || '',
      leadDate: v.leadDate || t,
      source: v.source || '',
      referredBy: v.referredBy || '',
      carrier: v.carrier || '',
      policyType: v.policyType || '',
      renewalDate: v.renewalDate || '',
      stageId,
      nextFU: v.nextFU || t,
      taskChecks: {},
      notes: [],
      activity: [{ txt: 'Lead imported via bulk import', col: '#2563eb', at: new Date().toISOString() }],
      createdAt: v.createdAt || new Date().toISOString()
    };
    state.leads.unshift(lead);
  });

  save();
  closeImport();
  renderList();
  // select the first imported lead
  if (toImport.length > 0) {
    state.selId = state.leads[0].id;
    renderDetail();
  }

  // show brief success toast
  showToast(`✅ ${toImport.length} lead${toImport.length!==1?'s':''} imported!`);
}
export function parseCSVFile(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    document.getElementById('pasteArea').value = e.target.result;
    parsePaste();
    input.value = ''; // reset so same file can be re-selected
  };
  reader.readAsText(file);
}
export function openImport() {
  document.getElementById('importBody').innerHTML = '';
  document.getElementById('pasteArea').value = '';
  document.getElementById('importError').textContent = '';
  // pre-fill 3 blank rows
  for (let i = 0; i < 3; i++) addImportRow();
  document.getElementById('importModal').style.display = 'flex';
}
export function closeImport() { document.getElementById('importModal').style.display = 'none'; }
export function exportCSV() {
  const headers = ['First Name', 'Last Name', 'Phone', 'Email', 'Company', 'City', 'State', 'Website', 'Industry', 'Employees', 'Lead Source', 'Referred By', 'Decision Maker', 'Carrier', 'Policy Type', 'Renewal Date', 'Lead Date', 'Stage', 'Next Follow-Up', 'Created At'];

  const rows = state.leads.map(l => [
    l.firstName || '',
    l.lastName || '',
    l.phone || '',
    l.email || '',
    l.company || '',
    l.city || '',
    l.state || '',
    l.website || '',
    l.industry || '',
    l.employees || '',
    l.source || '',
    l.referredBy || '',
    l.decisionMaker || '',
    l.carrier || '',
    l.policyType || '',
    l.renewalDate || '',
    l.leadDate || '',
    (gS(l.stageId) || {}).label || '',
    l.nextFU || '',
    l.createdAt || ''
  ]);

  // Escape CSV fields
  const csvRows = [headers, ...rows].map(row => {
    return row.map(cell => {
      const str = String(cell);
      if (str.includes(',') || str.includes('"') || str.includes('\n')) {
        return '"' + str.replace(/"/g, '""') + '"';
      }
      return str;
    }).join(',');
  }).join('\n');

  const blob = new Blob([csvRows], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  const today_d = new Date();
  const dateStr = today_d.getFullYear() + '-' + String(today_d.getMonth() + 1).padStart(2, '0') + '-' + String(today_d.getDate()).padStart(2, '0');
  link.setAttribute('href', url);
  link.setAttribute('download', `leads-export-${dateStr}.csv`);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  showToast('📥 CSV exported!');
}
