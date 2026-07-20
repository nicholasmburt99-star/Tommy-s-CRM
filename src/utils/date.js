export function today() { const d=new Date(); return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
export function skipWeekend(dateStr) {
  const d = new Date(dateStr + 'T12:00:00');
  const day = d.getDay(); // 0=Sun, 6=Sat
  if (day === 6) d.setDate(d.getDate() + 2); // Sat → Mon
  else if (day === 0) d.setDate(d.getDate() + 1); // Sun → Mon
  return d.toISOString().split('T')[0];
}
export function addDays(n) { const d=new Date(); d.setDate(d.getDate()+n); return skipWeekend(d.toISOString().split('T')[0]); }
export function fmtD(s) { if(!s)return''; const d=new Date(s+'T12:00:00'); return d.toLocaleDateString('en-US',{month:'short',day:'numeric'}); }
export function fmtDT(iso) { if(!iso)return''; const d=new Date(iso); return d.toLocaleDateString('en-US',{month:'short',day:'numeric',hour:'numeric',minute:'2-digit'}); }
export function fuSt(l) {
  if(!l.nextFU) return null;
  const t = today(); // local YYYY-MM-DD
  if(l.nextFU < t) return {label:'⚠️ Overdue', cls:'due-over'};
  if(l.nextFU === t) return {label:'Due TODAY', cls:'due-today'};
  const tom = new Date();
  tom.setDate(tom.getDate() + 1);
  const tomStr = `${tom.getFullYear()}-${String(tom.getMonth()+1).padStart(2,'0')}-${String(tom.getDate()).padStart(2,'0')}`;
  if(l.nextFU === tomStr) return {label:'Due tomorrow', cls:'due-soon'};
  return {label:`Due ${fmtD(l.nextFU)}`, cls:''};
}
