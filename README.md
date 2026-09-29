# QUIZ MASTER — Cloudflare update package

This update keeps your current Cloudflare Worker and D1 database and adds an R2 bucket for uploaded media. Existing teams, rounds, questions, and previously uploaded D1 media remain available. No D1 schema or database ID change is required.

## Included changes

- Team login codes stay unique from round passwords; new teams also receive distinct generated logos.
- Generated team emblems use an expanded icon and color set with varied badge shapes; the admin UI uses an indigo/teal palette and subtle interaction animations.
- Adding teams and creating or editing questions use responsive in-site popup editors for easier use on phones.
- Popup forms close with a short animation only after the database confirms a successful save; if saving fails, the popup stays open and keeps the entered values for retry.
- Teams enter the branded waiting lobby after login. Each team can mark itself ready for its next eligible round before the admin starts it. The admin start control waits until every selected, eligible team is ready.
- Admins can grant or revoke round access one team at a time, or use the existing all-team access controls. A team can only enter the round immediately after its own completed round; teams cannot skip ahead.
- Before the next round, each team sees a private, read-only review of its own previous answers marked correct or wrong. The participant API returns only that team’s answers; it does not reveal other teams’ answers.
- When the admin starts a round, participant screens remain locked until the admin unlocks them. When an unlocked round timer expires, submitted answers are kept and any unanswered questions for selected eligible teams are recorded blank, locking that round and allowing those teams to continue. The admin can still close the round manually. For later rounds the admin can grant access to all teams with one button.
- Admin settings can customize the company/event page title and quiz master name/photo. The participant waiting area and login screen show that branding.
- Round 1 has no password. For later rounds, the admin can keep passwords on, turn them off for everyone, or grant direct access to selected teams.
- Admins can set the tournament to 1–20 rounds and edit each round name. Removing a round is blocked if it is active or has submitted answers; its questions are removed after confirmation.
- Admin can create or CSV-import multiple-choice and typed-answer questions, add images/videos, and set points and round times.
- New photos and videos up to 50 MB are stored in the Cloudflare R2 bucket `quiz-master-media`. Larger still photos are optimized in the browser; videos play through the Worker media route with byte-range support for seeking. Existing D1 media continues to load. If R2 is not bound, uploads up to 1.8 MB continue to use D1.
- Answers lock on submit and cannot be changed. Teams see their own correct/incorrect status after each completed round; other teams’ answers remain private.
- Admin can download the answers CSV, which opens in Excel and includes answers, scores, and response times.
- The audience page updates the score-sorted leaderboard live and animates rank rows. It shows projected questions only after all teams are ready.
- On round start, the first question in that round is projected automatically. The audience view switches to the leaderboard when the round ends, then transitions into the next round after its readiness gate is met. Projected questions are hidden outside their active round.
- Projector transitions, question entrances, leaderboard rank changes, and hover states use short motion effects; reduced-motion preferences are respected.
- Admin Settings now includes one-click copy buttons for the participant and projector links, plus editable event rules.
- The participant and projector lobby mirror live team check-ins with each team’s logo and animated arrival cards. Presence expires automatically after teams disconnect.
- Projector and participant round screens display the active timer; the final three seconds pulse red. On supported phones the participant page requests a light vibration at 3, 2, and 1 seconds.
- Before a team starts, a rules dialog offers fullscreen and vibration. The site can warn when the participant leaves the page or exits fullscreen, but browsers do not let websites block app switching or enforce fullscreen.
- After each round, participants can open an animated answer-status scorecard from the owl hint. A submission confirmation dialog explains that answers will lock.
- Each round now starts with participant screens locked. The admin can unlock the round to start the timer, lock it again to pause participants and the remaining time, then unlock it to resume. Submissions are rejected by the Worker while locked.
- Round cards show a clear participant lock state and a separate lock/unlock control. The projector announces the lock while waiting for the host to begin.
- Each round has a separate focus-protection switch. When enabled, participant entry requests fullscreen; leaving the quiz tab or exiting fullscreen creates a host-visible focus alert. Admins can allow other apps for selected teams, or turn focus protection off for a round. Round completion/timeout returns the participant page to its normal screen.
- Focus protection is a browser reminder and reporting feature, not a device lock: websites cannot prevent participants from opening other apps. The timer continues while a participant is away. Fullscreen is only available on supported browsers and user gestures.
- Destructive actions such as removing a team, deleting a question, or removing rounds use styled in-site confirmations instead of browser popups. Removed team names are retained for historical answer exports.

## Update the existing GitHub repository

Upload and commit `worker.mjs`, `worker.js`, `wrangler.jsonc`, `.assetsignore`, and the complete `public` folder to the same GitHub repository connected to Cloudflare. This package uses `wrangler.jsonc` with `main` set to `./worker.mjs`. Replace the old config and keep only one Wrangler configuration. The D1 database ID is unchanged.

Do not run the database schema again. The media table is created automatically when you upload the first file. Your existing `ADMIN_PASSWORD` secret remains managed in Cloudflare and is not included here.

If a deployment does not start automatically, open the Cloudflare Worker, choose **Deployments**, and retry the latest build.

## Rounds experience update

The Rounds tab now shows a focused round selector; configuration appears only for the selected round. Round count stays under a collapsed schedule control. Team access is closed by default and must be granted for each round, either one team at a time or to all eligible teams. The server now closes the round at the configured deadline and rejects late answer submissions.

## Open the pages

- Admin: `/admin`
- Participants: `/participant`
- Audience projector: `/audience`


# Participant question access fix

The participant page now uses a dedicated, responsive question screen with accessible answer choices, typed answers, saved drafts during a host pause, clear submission feedback, and a clear lobby message when a round has no questions. The Worker rejects attempts to start an empty round and reports accurate question counts to the participant lobby. No D1 schema or database ID changes are included.

For the current tournament data, Round 1 had no questions while Round 2 had two. Teams cannot skip Round 1, so add a question to Round 1 (or edit an existing question and assign it to Round 1) in Admin → Questions before starting. Then grant team access, start the round, and unlock participant screens when ready.

Deploy with the existing Cloudflare command `npx wrangler deploy --config ./wrangler.jsonc`.

# Admin controls and visual update

The selected round now has a clearly labeled, high-visibility start control that stays in view while scrolling. It explains why a round is locked and keeps the existing checks for assigned questions, earlier-round completion, team access, and team readiness. Admin live refreshes run less often and restore expanded panels after an update. Repeated panel entrance and active-tab pop animations were removed to stop the blinking effect. Team logos have a subtle 3D tilt and depth treatment, with reduced-motion preferences respected. No D1 schema or database binding changes were made.

# Participant media and visual update

Participant question photos now use a clear, centered image frame; uploaded and embedded videos use a larger responsive player. If media fails to load, participants see a helpful message instead of a blank space. Question text and answer choices have larger type and more comfortable line spacing, and question cards enter with a short stagger. The owl mascot, brand mark, team emblems, and navigation icons have gentle motion; system reduced-motion preferences are honored.

# Media delivery and round readiness update

D1 returns BLOB columns as byte arrays; the `/media/` route now converts those bytes to a browser-readable response, which fixes uploaded question images failing on participant devices. New uploads are checked by reopening the saved media before the question can be saved. The selected-round panel now lists every team’s access, earlier-round, and ready status. It clearly shows that screens are locked before a round starts and remain locked after starting until the admin unlocks them. A layered vector owl now has subtle breathing, wing, head, and blink motion. No D1 schema or database ID changes were made.

# Participant photo and readiness flow fix

The participant photo delivery route converts D1 image bytes into a valid browser response. The round workflow is: the admin selects a round and grants access to specific teams (or all teams); each selected team uses the Ready button in its waiting area; the admin sees each team’s access, earlier-round eligibility, and ready status; Start becomes available after every selected eligible team is ready. Starting a round keeps participant screens locked until the admin unlocks them. Teams may mark ready before a round starts even when the tournament-wide pause toggle is on. No D1 schema or database ID changes were made.

# Large photo and host-start update

Large still photos are resized and converted to JPEG in the admin browser before upload. Large GIFs are not flattened; use a smaller GIF or a public link. Videos remain unchanged and upload to R2 up to 50 MB once the `MEDIA` binding is configured. Participants keep the Ready check-in button, but no longer have an Enter/Start round button: after the admin starts and unlocks a round, the ready team’s questions open automatically. Teams included by the admin when starting a round can enter without another round password prompt. No D1 schema or database ID changes were made.

# Question flow, exports and live updates

Each round can use either the existing all-at-once mode or a sequential mode. In sequential mode, configure seconds per question, lock an answer for immediate private correct/incorrect feedback, and wait for the shared question timer to reveal the next question. The projector follows the same current question and does not reveal answers during a live round. Answer exports accept inclusive start and end dates. Admin, participant, and projector views poll more frequently so saved changes appear without a manual refresh. The Teams tab now focuses on adding and managing teams instead of CSV import/export actions. Shared link previews identify the site as Quiz Club.

## Platform limits

A website cannot prevent someone from switching phone apps or browser tabs. The round focus toggle can request fullscreen, detect tab/fullscreen exits, and report alerts to the host, but it cannot enforce a device lock. Large still photos are reduced in the browser. Video and media uploads support files up to 50 MB when the `MEDIA` R2 binding is configured; without that binding, only the D1 fallback limit of 1.8 MB is available. The website can brand its link preview as Quiz Club, but the sender name in Gmail or another sharing app comes from that account and cannot be changed by this site.

# Larger media uploads with R2

Create the R2 bucket before deploying this version:

1. In the Cloudflare dashboard, open **R2 Object Storage** and choose **Create bucket**.
2. Name the bucket exactly `quiz-master-media` and create it. Keep it private; participants receive media through the Worker route.
3. Commit the updated `wrangler.jsonc`, `worker.mjs`, and `public/app.js` to the connected GitHub repository. Keep the deploy command as `npx wrangler deploy --config ./wrangler.jsonc`.
4. Wait for the deployment to succeed. New photo/video uploads up to 50 MB will then go to R2. Existing media stored in D1 remains readable.

The Worker binding is named `MEDIA`. The bucket name in Cloudflare must match `quiz-master-media`; otherwise Wrangler cannot deploy the binding. R2 uploads do not need a public bucket URL or a D1 schema change. The 50 MB application limit is intentional for reliable browser uploads; it is below the typical Workers request-body ceiling.
