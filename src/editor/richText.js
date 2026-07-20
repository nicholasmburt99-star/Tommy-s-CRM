import { escPre } from '../utils/dom.js';

export function fmtRich(cmd, val) {
  document.execCommand(cmd, false, val || null);
  const ed = document.activeElement;
  if (ed) ed.focus();
}
export function buildRichToolbar() {
  return `<div class="rich-toolbar">
    <button class="rtb" title="Bold" onmousedown="event.preventDefault();fmtRich('bold')"><b>B</b></button>
    <button class="rtb" title="Underline" onmousedown="event.preventDefault();fmtRich('underline')"><u style="text-underline-offset:2px">U</u></button>
    <button class="rtb" title="Italic" onmousedown="event.preventDefault();fmtRich('italic')"><i>I</i></button>
    <div class="rtb-sep"></div>
    <button class="rtb rtb-wide" title="Bullet list" onmousedown="event.preventDefault();fmtRich('insertUnorderedList')">• List</button>
    <button class="rtb rtb-wide" title="Numbered list" onmousedown="event.preventDefault();fmtRich('insertOrderedList')">1. List</button>
    <div class="rtb-sep"></div>
    <button class="rtb rtb-wide" title="Clear formatting" onmousedown="event.preventDefault();fmtRich('removeFormat')" style="font-size:10px;color:#94a3b8">✕ Clear</button>
  </div>`;
}
export function getPlainText(html) {
  // Strip HTML tags for copy/mailto, preserve newlines
  const tmp = document.createElement('div');
  tmp.innerHTML = html;
  // Convert block elements to newlines
  tmp.querySelectorAll('p,br,li,div').forEach(el => {
    if (el.tagName === 'BR') el.replaceWith('\n');
    else el.insertAdjacentText('beforeend', '\n');
  });
  tmp.querySelectorAll('li').forEach(el => el.insertAdjacentText('afterbegin', '• '));
  return (tmp.textContent || '').replace(/\n{3,}/g, '\n\n').trim();
}
export function toRichHtml(text) {
  // Convert plain text to safe HTML for contenteditable initial load
  if (!text) return '';
  if (/<[a-zA-Z]/.test(text)) return text; // already HTML
  return text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/\n/g,'<br>');
}
export function getRichVal(id) {
  const el = document.getElementById(id);
  return el ? el.innerHTML : '';
}
export function renderScriptBody(text) {
  if (!text) return '';
  // If content has HTML tags (saved from rich editor), render as HTML
  if (/<[a-zA-Z]/.test(text)) return text;
  // Otherwise render as escaped pre-formatted plain text
  return escPre(text);
}
