# QUIZ MASTER — Cloudflare update package

This update works with the existing Cloudflare Worker and D1 database. It keeps the database binding and ID already configured for your project. Do not run `schema.sql` again when updating the existing site.

## Included changes

- Admin tabs for overview, teams, questions, round controls, audience projector, and settings.
- Add teams manually or by CSV. Each team receives a unique login password and an automatically generated logo.
- Set each round's duration and default points; edit points on individual questions.
- Add questions in the admin page or import a CSV with columns: `round,question,option_a,option_b,option_c,option_d,answer,points`.
- Round 1 needs no round password. Starting each later round generates a different password for every team; only the admin page shows those passwords.
- Participants see their team logo and waiting area, and answers lock on submission or round timeout.
- Audience page (`/audience`) shows the live leaderboard and the question the admin projects. It reveals correct answers and the full question list when every team has completed every round.
- Speed is an admin-only tie-break field and is not added to question points.

## Replace the site files

Upload and commit the updated files to the same GitHub repository connected to Cloudflare: `worker.js`, `wrangler.jsonc`, `.assetsignore`, and the complete `public` folder (`admin.html`, `index.html`, `participant.html`, `audience.html`, and `app.js`). The Worker now serves only the `public` folder, which avoids accidentally publishing project files or installed packages. Keep the database ID in `wrangler.jsonc` unchanged. Cloudflare should start a deployment after the GitHub commit.

If the deployment does not start automatically, open the Cloudflare Worker, choose **Deployments**, and retry the latest build. Your existing `ADMIN_PASSWORD` secret is managed in Cloudflare and is not in this package.

## Open the pages

- Admin: `/admin`
- Participants: `/participant`
- Audience projector: `/audience`
