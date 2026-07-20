
// ═══════════════════════════════
//  PIPELINE STAGES
// ═══════════════════════════════
export const STAGES = [
  {
    id: 'new', label: 'New Lead', short: 'New',
    color: '#3b82f6', bg: '#eff6ff', text: '#1d4ed8', followDays: 1, theme: null,
    tasks: [
      { icon: '📞', label: 'Make first contact call' },
      { icon: '📝', label: 'Log initial notes' },
    ],
    scripts: []
  },
  {
    id: 'contacted', label: 'Contacted', short: 'Contacted',
    color: '#4f46e5', bg: '#e0e7ff', text: '#3730a3', followDays: 3, theme: null,
    tasks: [
      { icon: '📋', label: 'Gather policy/risk details' },
      { icon: '📅', label: 'Schedule follow-up' },
    ],
    scripts: []
  },
  {
    id: 'quoted', label: 'Quoted', short: 'Quoted',
    color: '#7c3aed', bg: '#ede9fe', text: '#4c1d95', followDays: 3, theme: null,
    tasks: [
      { icon: '📤', label: 'Send quote to client' },
      { icon: '📅', label: 'Follow up on quote' },
    ],
    scripts: []
  },
  {
    id: 'submitted', label: 'Submitted', short: 'Submitted',
    color: '#d97706', bg: '#fef3c7', text: '#92400e', followDays: 5, theme: null,
    tasks: [
      { icon: '📄', label: 'Confirm application submitted to carrier' },
      { icon: '🔍', label: 'Track underwriting status' },
    ],
    scripts: []
  },
  {
    id: 'bound', label: 'Bound ✓', short: 'Bound',
    color: '#10b981', bg: '#ecfdf5', text: '#065f46', followDays: 0, theme: null,
    tasks: [
      { icon: '✅', label: 'Confirm policy issued' },
      { icon: '🗓', label: 'Note renewal date' },
    ],
    scripts: []
  },
  {
    id: 'lost', label: 'Lost', short: 'Lost',
    color: '#6b7280', bg: '#f3f4f6', text: '#374151', followDays: 0, theme: null,
    tasks: [],
    scripts: []
  },
];

export function gS(id) { return STAGES.find(s => s.id === id) || STAGES[0]; }
export function gSI(id) { return STAGES.findIndex(s => s.id === id); }
