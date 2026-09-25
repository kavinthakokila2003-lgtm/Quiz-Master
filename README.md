# QUIZ MASTER — Cloudflare update package

This update uses your current Cloudflare Worker and D1 database. It does not add a paid storage service or require a new database. Existing team, round and question data stays in the current database.

## Included changes

- Team login codes stay unique from round passwords; new teams also receive distinct generated logos.
- Generated team emblems use an expanded icon and color set with varied badge shapes; the admin UI uses an indigo/teal palette and subtle interaction animations.
- Adding teams and creating or editing questions use responsive in-site popup editors for easier use on phones.
- Teams enter a waiting lobby and mark themselves ready for each round. The audience question is hidden until every active team is ready.
- A ready team can enter an active round without waiting for the other teams; the projector still waits for the full readiness count before revealing the question. Admins can grant later-round access team-by-team or to all teams.
- Round 1 has no password. For later rounds, the admin can keep passwords on, turn them off for everyone, or grant direct access to selected teams.
- Admins can set the tournament to 1–20 rounds and edit each round name. Removing a round is blocked if it is active or has submitted answers; its questions are removed after confirmation.
- Admin can create or CSV-import multiple-choice and typed-answer questions, add images/videos, and set points and round times.
- Small image/video uploads (up to 1.8 MB each) are saved in D1. Larger files can be linked using a public image/video URL or YouTube link. The media table is created automatically on first upload; no schema re-run is needed.
- Answers lock on submit. Teams see correct/incorrect feedback after each completed round, and correct answers after all rounds are finished.
- Admin can download the answers CSV, which opens in Excel and includes answers, scores, and response times.
- The audience page updates the score-sorted leaderboard live and animates rank rows. It shows projected questions only after all teams are ready.
- On round start, the first question in that round is projected automatically. The audience view switches to the leaderboard when the round ends, then transitions into the next round after its readiness gate is met. Projected questions are hidden outside their active round.
- Projector transitions, question entrances, leaderboard rank changes, and hover states use short motion effects; reduced-motion preferences are respected.

## Update the existing GitHub repository

Upload and commit the updated `worker.js`, `wrangler.jsonc`, `.assetsignore`, and the complete `public` folder (`admin.html`, `index.html`, `participant.html`, `audience.html`, and `app.js`) to the same repository connected to Cloudflare. Keep the D1 database ID in `wrangler.jsonc` unchanged. Cloudflare should deploy after the GitHub commit.

Do not run the database schema again. The media table is created automatically when you upload the first file. Your existing `ADMIN_PASSWORD` secret remains managed in Cloudflare and is not included here.

If a deployment does not start automatically, open the Cloudflare Worker, choose **Deployments**, and retry the latest build.

## Open the pages

- Admin: `/admin`
- Participants: `/participant`
- Audience projector: `/audience`
