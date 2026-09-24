# Quizly tournament site

This folder contains the participant page, admin dashboard, audience leaderboard, and shared Node.js backend. For online use, Quizly saves shared tournament data in Firebase Firestore and runs the app on Render. You can set it up in a browser; no computer installation is needed.

## Free online setup

Firebase's no-cost Spark plan includes Firestore. Firebase Cloud Functions require the billing-enabled Blaze plan, so this setup runs the Node server on Render instead. Render's free server sleeps after 15 minutes without requests and wakes when someone visits. Firestore's free quota is 1 GiB of stored data, 50,000 reads/day, and 20,000 writes/day. This simple prototype keeps tournament state in one Firestore document, so use it for a modest quiz and avoid very large events.

1. **Create Firebase project and database.** In [Firebase Console](https://console.firebase.google.com/), create a project, then go to **Build → Firestore Database → Create database**. Choose a location. Keep the project on the Spark plan.
2. **Set Firestore rules.** Open Firestore **Rules**, replace the contents with `firestore.rules` from this folder, then click **Publish**. The server uses its private service account; the public website does not connect directly to the database.
3. **Create a private server key.** In Firebase **Project settings → Service accounts**, choose **Generate new private key** and save the downloaded JSON file. Do not upload or share this file. You will paste its contents only into Render's private environment setting.
4. **Upload the site files to GitHub.** Create a repository and upload `admin.html`, `participant.html`, `audience.html`, `index.html`, `server.js`, `package.json`, and `firestore.rules`. Do not upload the service account file or any password.
5. **Create the website on Render.** In [Render](https://render.com/), choose **New → Web Service** and connect your GitHub repository. Set build command to `npm install` and start command to `npm start`.
6. **Add private settings in Render.** Under your service's **Environment** settings add:
   - `ADMIN_PASSWORD` — choose a private password with at least 12 characters.
   - `FIREBASE_SERVICE_ACCOUNT_JSON` — open the downloaded JSON file in Notepad, copy all its contents, and paste them as the value. Do not put this key in GitHub, a website page, or a message.
7. **Deploy and share.** After deployment, Render gives you a website address. Share that address with `/admin.html` for the admin, `/participant.html` for teams, or `/audience.html` for the projected leaderboard.

Firebase Firestore free plan details: [pricing and quotas](https://firebase.google.com/docs/firestore/quotas). Render free service details: [Render free limits](https://render.com/docs/free). Keep the admin password and Firebase private key secret. If a key is exposed, revoke it in Firebase and create a new one.

## Local use

The server can also use SQLite locally if no Firebase environment key is set. This requires Node.js 22.13 or newer. In PowerShell, set `ADMIN_PASSWORD` and run `npm start`. Local data is saved in `quizly.sqlite` beside the server.

## Prototype features

The backend provides shared storage, admin password sign-in, team-code sign-in, server-side team-specific round-password checks, immutable answer submissions, server-calculated points, answer CSV export, and a public leaderboard that omits passwords and answers. The sample participant flow currently demonstrates one scored question for an opened round; expand the question-entry and play screens before using it as a full multi-question competition.
