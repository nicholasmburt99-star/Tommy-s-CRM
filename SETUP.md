# Tommy's CRM — Setup Guide

This is a copy of Nick's cold-calling CRM, adapted for property & commercial
insurance and simplified per Tommy's request (no scripted cadence — just a
flat pipeline, quick call notes, and a daily notes log).

It's a static site (Vite + vanilla JS) backed by Firebase Firestore for
storage/sync. Three things need to happen before Tommy can use it day-to-day:

## 1. Create a Firebase project (~5 min)

Tommy needs his own Firebase project so his data doesn't touch Nick's.

1. Go to https://console.firebase.google.com and sign in (any Google account).
2. Click **Add project**, name it something like "tommy-crm", finish the wizard
   (Google Analytics can be skipped/disabled — not needed).
3. In the project, click the **web (`</>`)** icon to register a new web app
   (any nickname, e.g. "tommy-crm-web"). Skip Firebase Hosting.
4. Copy the `firebaseConfig` object it shows you.
5. In this project, open `src/firebase.js` and replace the `REPLACE_ME`
   placeholders with those real values.
6. Back in the Firebase console, go to **Build → Firestore Database → Create
   database**. Start in **production mode**, pick any region.
7. Go to the **Rules** tab and replace the rules with (this app has no login,
   so it needs open read/write — fine since only Tommy will have the URL):
   ```
   rules_version = '2';
   service cloud.firestore {
     match /databases/{database}/documents {
       match /{document=**} {
         allow read, write: if true;
       }
     }
   }
   ```
   Click **Publish**.

## 2. Push the code to a GitHub repo

```
cd /Users/nickburt/Desktop/tommy-crm-template
git remote add origin <new-empty-repo-url>
git push -u origin main
```

(Create the empty repo first at github.com/new — under Tommy's account, or
yours if he doesn't have one yet.)

## 3. Deploy to Vercel

1. Go to https://vercel.com/new, sign in, import the GitHub repo you just
   pushed.
2. Framework preset should auto-detect as **Vite** (build command
   `npm run build`, output directory `dist` — already set in `vercel.json`).
3. Click **Deploy**. Tommy gets a `*.vercel.app` URL he can bookmark/add to
   his phone home screen.

## Notes

- `npm audit` flags some pre-existing vulnerabilities in dev dependencies
  (inherited from the original project) — none are exploitable in a static
  site with no server-side code, but worth an `npm audit fix` at some point.
- If Tommy ever wants the Gmail-send feature working, he'll need his own
  Google Cloud OAuth client ID (prompted for in-app the first time he tries
  to send an email) — not required for day-to-day kanban/notes use.
