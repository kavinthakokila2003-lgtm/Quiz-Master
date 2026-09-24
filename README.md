# Quiz Master — Cloudflare setup

This version runs the pages and private API on Cloudflare Workers, and saves shared data in Cloudflare D1. It deploys from GitHub through the Cloudflare dashboard; no software installation is needed on your computer.

## Setup

1. Open the new database's **Console** or **Query** tab. Copy all the text in `schema.sql` into the SQL box and run it.
2. In GitHub, replace the current repository files with the files in this folder. Keep the four HTML files at the repository root. Do not upload passwords. This copy of `wrangler.jsonc` is already filled with the Database ID you supplied.
3. In Cloudflare, go to **Workers & Pages → Create application → Import a repository**. Connect GitHub and choose `Quiz-Master`.
4. Use Worker name `quiz-master`. Set the production deploy command to `npx wrangler deploy`, then deploy. The Wrangler config contains the static page and D1 bindings.
5. In the Worker **Settings → Variables and Secrets**, add secret `ADMIN_PASSWORD` with a private password of at least 12 characters. Save and redeploy.
6. Open the Worker URL. Use `/admin.html` for the admin, `/participant.html` for teams, and `/audience.html` for the audience display.

Cloudflare advertises a free Workers plan without requiring a credit card. Workers Free includes up to 100,000 requests/day. D1 Free includes 5 million rows read/day, 100,000 rows written/day, and 5 GB total storage; queries stop for the day if the free daily limit is reached. See [Workers pricing](https://developers.cloudflare.com/workers/platform/pricing/), [D1 pricing](https://developers.cloudflare.com/d1/platform/pricing/), and [GitHub deployment](https://developers.cloudflare.com/workers/ci-cd/builds/).

## Important prototype note

This project has the tournament-management prototype screens and shared backend flows. The participant demonstration currently uses a sample question flow; complete and review all question-entry and round controls before running a live tournament.
