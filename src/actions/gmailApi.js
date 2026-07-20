// Shared personalization utility — used by sendEmail(), copyScript(), and batch outreach
export function personalize(text, lead) {
  const area = [lead.city, lead.state].filter(Boolean).join(', ') || '[area]';
  return text
    .replace(/\[Name\]/g, lead.firstName || '[Name]')
    .replace(/\[Prospect's Name\]/g, lead.firstName || '[Name]')
    .replace(/\[Company\]/g, lead.company || '[Company]')
    .replace(/\[area\]/g, area)
    .replace(/\[X\]\+/g, (lead.employees || '[X]') + '+');
}

// After personalization, any remaining [brackets] need human input
export function needsReview(text) {
  return /\[[^\]]+\]/.test(text);
}

// ── Gmail OAuth (Google Identity Services) ──────────────────────────────────

let _gisLoaded = false;
let _accessToken = null;
let _tokenExpiry = 0;

function loadGoogleScript() {
  if (_gisLoaded || document.getElementById('gis-script')) { _gisLoaded = true; return Promise.resolve(); }
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.id = 'gis-script';
    s.src = 'https://accounts.google.com/gsi/client';
    s.onload = () => { _gisLoaded = true; resolve(); };
    s.onerror = () => reject(new Error('Failed to load Google Identity Services'));
    document.head.appendChild(s);
  });
}

export function getClientId() {
  return localStorage.getItem('bpcrm_gmail_client_id') || '';
}
export function saveClientId(id) {
  localStorage.setItem('bpcrm_gmail_client_id', id.trim());
}

export function requestAccessToken() {
  // Return cached token if still valid (with 60s buffer)
  if (_accessToken && Date.now() < _tokenExpiry - 60000) return Promise.resolve(_accessToken);

  const clientId = getClientId();
  if (!clientId) return Promise.reject(new Error('NO_CLIENT_ID'));

  return loadGoogleScript().then(() => new Promise((resolve, reject) => {
    const client = window.google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/gmail.compose',
      callback: (resp) => {
        if (resp.error) { reject(new Error(resp.error)); return; }
        _accessToken = resp.access_token;
        _tokenExpiry = Date.now() + (resp.expires_in || 3600) * 1000;
        resolve(_accessToken);
      },
      error_callback: (err) => reject(new Error(err.type || 'oauth_error')),
    });
    client.requestAccessToken({ prompt: '' });
  }));
}

// ── Send a single email via Gmail API ───────────────────────────────────────

export async function sendGmailMessage(to, subject, body) {
  const token = await requestAccessToken();
  const message = [
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body,
  ].join('\r\n');

  // base64url encode (Gmail API requirement)
  const encoded = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ raw: encoded }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}

// ── Create a Gmail Draft (for emails that need manual review) ───────────────

export async function createGmailDraft(to, subject, body) {
  const token = await requestAccessToken();
  const message = [
    'Content-Type: text/plain; charset="UTF-8"',
    'MIME-Version: 1.0',
    `To: ${to}`,
    `Subject: ${subject}`,
    '',
    body,
  ].join('\r\n');

  const encoded = btoa(unescape(encodeURIComponent(message)))
    .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/drafts', {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: { raw: encoded } }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err?.error?.message || `HTTP ${res.status}`);
  }
  return res.json();
}
