# QUIZ MASTER — Cloudflare update package

This update uses your current Cloudflare Worker and D1 database. It does not add a paid storage service or require a new database. Existing team, round and question data stays in the current database.

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
- Small image/video uploads (up to 1.8 MB each) are saved in D1. Larger files can be linked using a public image/video URL or YouTube link. The media table is created automatically on first upload; no schema re-run is needed.
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

Upload and commit the updated `worker.mjs`, `wrangler.jsonc`, `.assetsignore`, and the complete `public` folder (`admin.html`, `index.html`, `participant.html`, `audience.html`, `app.js`, `enhancements.js`, and `polish.js`) to the same repository connected to Cloudflare. Keep the D1 database ID in `wrangler.jsonc` unchanged. Cloudflare should deploy after the GitHub commit.

Do not run the database schema again. The media table is created automatically when you upload the first file. Your existing `ADMIN_PASSWORD` secret remains managed in Cloudflare and is not included here.

If a deployment does not start automatically, open the Cloudflare Worker, choose **Deployments**, and retry the latest build.

## Open the pages

- Admin: `/admin`
- Participants: `/participant`
- Audience projector: `/audience`
