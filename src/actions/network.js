import { state, savePartners } from '../store.js';
import { uid, showToast } from '../utils/dom.js';
import { renderNetwork } from '../views/network.js';

export function addPartner() {
  const name = document.getElementById('np-name').value.trim();
  if (!name) { showToast('Name is required.'); return; }
  const p = {
    id: uid(),
    name,
    title: document.getElementById('np-title').value.trim(),
    company: document.getElementById('np-company').value.trim(),
    phone: document.getElementById('np-phone').value.trim(),
    email: document.getElementById('np-email').value.trim(),
    category: document.getElementById('np-category').value,
    specialty: document.getElementById('np-specialty').value.trim(),
    howMet: document.getElementById('np-howmet').value.trim(),
    geoOverlap: document.getElementById('np-geo').value.trim(),
    mutualClients: document.getElementById('np-mutual').value.trim(),
    strength: 0,
    nextOutreach: '',
    interactions: [],
    notes: document.getElementById('np-notes').value.trim(),
    createdAt: new Date().toISOString(),
  };
  state.partners.push(p);
  savePartners();
  closePartnerModal();
  state.networkSelId = p.id;
  renderNetwork();
  showToast('Partner added!');
}

export function editPartner(id) {
  const p = state.partners.find(x => x.id === id);
  if (!p) return;
  const name = document.getElementById('np-name').value.trim();
  if (!name) { showToast('Name is required.'); return; }
  p.name = name;
  p.title = document.getElementById('np-title').value.trim();
  p.company = document.getElementById('np-company').value.trim();
  p.phone = document.getElementById('np-phone').value.trim();
  p.email = document.getElementById('np-email').value.trim();
  p.category = document.getElementById('np-category').value;
  p.specialty = document.getElementById('np-specialty').value.trim();
  p.howMet = document.getElementById('np-howmet').value.trim();
  p.geoOverlap = document.getElementById('np-geo').value.trim();
  p.mutualClients = document.getElementById('np-mutual').value.trim();
  p.notes = document.getElementById('np-notes').value.trim();
  savePartners();
  closePartnerModal();
  renderNetwork();
  showToast('Partner updated!');
}

export function deletePartner(id) {
  if (!confirm('Delete this partner?')) return;
  state.partners = state.partners.filter(x => x.id !== id);
  if (state.networkSelId === id) state.networkSelId = null;
  savePartners();
  renderNetwork();
}

export function logInteraction(partnerId) {
  const typeEl = document.getElementById('nw-int-type');
  const dateEl = document.getElementById('nw-int-date');
  const textEl = document.getElementById('nw-int-text');
  if (!textEl || !textEl.value.trim()) { showToast('Describe what happened.'); return; }
  const p = state.partners.find(x => x.id === partnerId);
  if (!p) return;
  const dateVal = dateEl && dateEl.value ? new Date(dateEl.value + 'T12:00:00').toISOString() : new Date().toISOString();
  p.interactions = p.interactions || [];
  p.interactions.push({ id: uid(), type: typeEl.value, text: textEl.value.trim(), at: dateVal });
  savePartners();
  renderNetwork();
  showToast('Interaction logged!');
}

export function deleteInteraction(partnerId, idx) {
  if (!confirm('Delete this interaction?')) return;
  const p = state.partners.find(x => x.id === partnerId);
  if (!p || !p.interactions) return;
  p.interactions.splice(idx, 1);
  savePartners();
  renderNetwork();
}

export function setPartnerStrength(id, val) {
  const p = state.partners.find(x => x.id === id);
  if (!p) return;
  p.strength = parseInt(val);
  savePartners();
  renderNetwork();
}

export function setPartnerNextOutreach(id, val) {
  const p = state.partners.find(x => x.id === id);
  if (!p) return;
  p.nextOutreach = val;
  savePartners();
  renderNetwork();
}

export function setPartnerNotes(id, val) {
  const p = state.partners.find(x => x.id === id);
  if (!p) return;
  p.notes = val;
  savePartners();
}

export function selectPartner(id) {
  state.networkSelId = id;
  renderNetwork();
}

export function openAddPartnerModal() {
  state.networkEditId = null;
  document.getElementById('pmTitle').textContent = '🤝 Add Partner';
  const btn = document.getElementById('pmSave');
  btn.textContent = 'Add Partner';
  btn.setAttribute('onclick', 'addPartner()');
  ['np-name','np-title','np-company','np-phone','np-email','np-specialty','np-howmet','np-geo','np-mutual','np-notes'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  document.getElementById('np-category').value = '';
  document.getElementById('partnerModal').style.display = 'flex';
}

export function openEditPartnerModal(id) {
  const p = state.partners.find(x => x.id === id);
  if (!p) return;
  state.networkEditId = id;
  document.getElementById('pmTitle').textContent = '🤝 Edit Partner';
  const btn = document.getElementById('pmSave');
  btn.textContent = 'Save Changes';
  btn.setAttribute('onclick', `editPartner('${id}')`);
  document.getElementById('np-name').value = p.name || '';
  document.getElementById('np-title').value = p.title || '';
  document.getElementById('np-company').value = p.company || '';
  document.getElementById('np-phone').value = p.phone || '';
  document.getElementById('np-email').value = p.email || '';
  document.getElementById('np-category').value = p.category || '';
  document.getElementById('np-specialty').value = p.specialty || '';
  document.getElementById('np-howmet').value = p.howMet || '';
  document.getElementById('np-geo').value = p.geoOverlap || '';
  document.getElementById('np-mutual').value = p.mutualClients || '';
  document.getElementById('np-notes').value = p.notes || '';
  document.getElementById('partnerModal').style.display = 'flex';
}

export function closePartnerModal() {
  document.getElementById('partnerModal').style.display = 'none';
  state.networkEditId = null;
}
