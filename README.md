# QUIZ MASTER — Cloudflare update package

This update uses your current Cloudflare Worker and D1 database. It does not add a paid storage service or require a new database. Existing team, round and question data stays in the current database.

## Included changes

- Team login codes stay unique from round passwords; new teams also receive distinct generated logos.
- Teams enter a waiting lobby and mark themselves ready for each round. The audience question is hidden until every active team is ready.
- Round 1 has no password. For later rounds, the admin can keep passwords on, turn them off for everyone, or grant direct access to selected teams.
- Admin can create or CSV-import multiple-choice and typed-answer questions, add images/videos, and set points and round times.
- Small image/video uploads (up to 1.8 MB each) are saved in D1. Larger files can be linked using a public image/video URL or YouTube link. The media table is created automatically on first upload; no schema re-run is needed.
- Answers lock on submit. Teams see correct/incorrect feedback after each completed round, and correct answers after all rounds are finished.
- Admin can download the answers CSV, which opens in Excel and includes answers, scores, and response times.
- The audience page updates the score-sorted leaderboard live and animates rank rows. It shows projected questions only after all teams are ready.

## Update the existing GitHub repository

Upload and commit the updated `worker.js`, `wrangler.jsonc`, `.assetsignore`, and the complete `public` folder (`admin.html`, `index.html`, `participant.html`, `audience.html`, and `app.js`) to the same repository connected to Cloudflare. Keep the D1 database ID in `wrangler.jsonc` unchanged. Cloudflare should deploy after the GitHub commit.

Do not run the database schema again. The media table is created automatically when you upload the first file. Your existing `ADMIN_PASSWORD` secret remains managed in Cloudflare and is not included here.

If a deployment does not start automatically, open the Cloudflare Worker, choose **Deployments**, and retry the latest build.

## Open the pages

- Admin: `/admin`
- Participants: `/participant`
- Audience projector: `/audience`
