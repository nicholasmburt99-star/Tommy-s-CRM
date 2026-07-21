# How to Update This CRM

The code lives at https://github.com/nicholasmburt99-star/Tommy-s-CRM and
deploys automatically to https://tommy-s-crm.vercel.app/ every time someone
pushes to the `main` branch. Nothing needs to be "redeployed" manually —
push to GitHub, and the live site updates within about a minute.

---

## For Nick (already set up)

You already have everything needed on this machine.

1. Open a terminal in `/Users/nickburt/Desktop/tommy-crm-template` (or open
   Claude Code and point it at that folder).
2. Just describe the change you want in plain English — e.g. "add a field
   for policy number" or "change the kanban colors."
3. Claude will edit the code, run `npm run dev` to preview it in a browser,
   and confirm it works before you approve.
4. Once you're happy, ask Claude to commit and push:
   ```
   git add -A
   git commit -m "describe the change"
   git push
   ```
5. Check https://tommy-s-crm.vercel.app/ after ~30–60 seconds — the change
   will be live.

No Firebase/GitHub/Vercel setup steps are needed again — all of that is
already wired up and committed.

---

## For Tommy (one-time setup, then fully independent)

This only needs to be done once. After that, Tommy can request changes
himself without going through Nick at all.

### One-time setup (~15 minutes)

1. **Install Node.js** — go to https://nodejs.org, download the "LTS"
   version, run the installer (default options are fine).
2. **Install Git**:
   - Mac: open Terminal, type `git --version` — if it's not installed,
     macOS will prompt to install the Xcode Command Line Tools. Click Install.
   - Windows: download from https://git-scm.com and run the installer
     (default options are fine).
3. **Install Claude Code** — follow the instructions at
   https://claude.com/claude-code (this requires Tommy's own Claude
   account/subscription — a coding-capable plan).
4. **Get repo access** — Nick needs to do this part: go to
   https://github.com/nicholasmburt99-star/Tommy-s-CRM → **Settings** →
   **Collaborators** → **Add people** → enter Tommy's GitHub username or
   email → send invite. Tommy accepts the invite email.
   (Alternative: Nick transfers the repo to Tommy's own GitHub account under
   Settings → General → Danger Zone → Transfer ownership — cleaner
   long-term if Tommy will own this going forward.)
5. **Clone the repo** — Tommy opens a terminal and runs:
   ```
   git clone https://github.com/nicholasmburt99-star/Tommy-s-CRM.git
   cd Tommy-s-CRM
   npm install
   ```

That's it — no Firebase setup needed again, the real config is already in
the code.

### Ongoing workflow (every time Tommy wants a change)

1. Open a terminal in the `Tommy-s-CRM` folder.
2. Run `claude` to start Claude Code.
3. Describe what he wants changed in plain English — no coding knowledge
   needed. Examples:
   - "Add a field to track the policy number"
   - "Change 'Bound' to say 'Active'"
   - "Make the Daily Notes box bigger"
4. Claude will make the change and can preview it locally before anything
   goes live.
5. Once it looks right, ask Claude to commit and push the change (same two
   commands as above: `git add -A`, `git commit -m "..."`, `git push`).
6. The live site at https://tommy-s-crm.vercel.app/ updates automatically
   within about a minute.

### If something breaks

Nothing here is destructive by default — every change is a new commit, so
previous versions are never lost. If a change causes a problem, tell Claude
"undo the last change" or `git revert HEAD && git push`, and it'll roll back
to the previous working version.
