# Sportal — Ionic (React) + Capacitor

The `screenshot-to-scene-45-main` app, converted from TanStack Start (web, server-rendered) to an
**Ionic React app packaged natively with Capacitor** (Android + iOS). Same screens, same look
(Tailwind + shadcn), same profile/ranking/recruiting logic. What changed is the shell around them.

## What changed

| Before (web) | Now (native) |
| --- | --- |
| TanStack Router, file routes | Ionic Router (`@ionic/react-router`), routes in `src/App.tsx` |
| Server functions + HTTP-only cookie | Small API (`server/`) + Bearer token kept in Capacitor Preferences |
| Sidebar + hand-made mobile bar | `IonSplitPane` + `IonMenu` (sidebar on tablets, slide-out on phones) + bottom tab bar |
| `AppShell` | `src/components/Page.tsx` (native toolbar, scrolling content, tab bar) |
| `beforeLoad` auth redirects | Route guards in `src/App.tsx` (login → back to the page you wanted) |

Screens (`src/pages/`) are the old route files with only the router/auth lines changed; `src/lib`,
`src/components`, `src/data` are unchanged apart from the `Link` import (`src/router-compat.tsx`).

## Run it

You need Node 22.5+ and a Postgres database (a free [Neon](https://neon.tech) database works, or
`docker run -d -p 5432:5432 -e POSTGRES_PASSWORD=pw -e POSTGRES_DB=sportal postgres:16`).

```sh
npm install
cp .env.example .env          # set DATABASE_URL (see the comments in the file)

npm run api                   # terminal 1: the API on :8787 (creates its tables on first start)
npm run dev                   # terminal 2: the app in your browser (http://localhost:5173)
```

## Administrator

Sportal has one predefined administrator. There is no administrator sign up, and no screen or API
can grant the role. The account is configured with environment variables and created when the API
starts:

```sh
ADMIN_EMAIL=admin@yourschool.edu     # must not be an email anyone has registered with
ADMIN_PASSWORD=...                   # 12+ characters, letters and numbers
```

(`ADMIN_USERNAME` and `ADMIN_DISPLAY_NAME` are optional.) The administrator signs in at
**`/admin/login`** and lands on **`/admin/dashboard`**. The page is deliberately not linked from the
public site. Regular users sign in at `/login`; that form refuses the administrator's credentials,
and `/admin/login` refuses everyone else, with the same "incorrect credentials" message. Admin
sessions last 4 hours and have no "remember me". Failed admin attempts are rate limited separately
from regular sign-ins, and every admin sign-in is written to the audit log.

**User Management** (`/admin/users`) lists every student-athlete, coach and school representative with search, role and status filters, a detail panel, and Suspend / Reactivate. Suspending signs the person out everywhere at once and blocks sign-in until reactivated; the administrator account never appears there and can't be suspended. "Pending" and "Rejected" are school representatives whose application is still with, or was turned down by, School Verification.

**School Verification** (`/admin/verifications`) is where school and university representative applications are reviewed. A representative who signs up doesn't get an account straight away: they submit their details plus 1 to 3 documents (PDF, PNG or JPG, 2 MB each, 3 MB in total, checked by their actual contents). Until an administrator approves the application the person cannot sign in, and they see that it is still being reviewed. The administrator can open each document, then **Approve** or **Reject**; a rejection needs a reason, which the applicant reads when they try to sign in. A rejected application can still be approved later. Approving also registers the school (the "Registered Schools" count). Representatives who already had accounts before this feature were kept as approved. Accounts made with `npm run user:create` skip the application, since the operator has vetted them. Documents are stored in the database and only the administrator can fetch them.

**Platform Monitoring** (`/admin/monitoring`) shows four numbers (total activities, pending reports, resolved reports, flagged content), the **Activity Logs** and **Reported Content**, all read from the database. The activity log is the audit log: sign-ins, sign-ups, connections, scholarships, admin actions and every moderation step, each with a time, a user name and a plain sentence. Reports are filed by any signed-in user except the administrator with **Report this profile** on an athlete's profile (a coach's My Athletes page), or `POST /api/reports` for a profile, a highlight video or a profile photo. The administrator can **Investigate**, **Dismiss** an invalid report, or **Take action**: remove the content (a photo or video becomes `rejected`, a biography is cleared; the old text stays on the report as evidence), warn the athlete (a notification), and/or suspend the account (the same switch as User Management). Moderation never changes roles or any verification. There is no sample data: with no reports, the section is empty.

**Settings** (`/admin/settings`) has four tabs, all working against the database: **Admin Profile** (name, first and last name, profile photo; the email and username are read-only because they come from `ADMIN_EMAIL` / `ADMIN_USERNAME`), **Account Security** (change password, and the list of devices you're signed in on, with sign-out for one device or all the others), **Notification Preferences** (switches for what the bell counts: school representative applications, reported content, security alerts, new registrations) and **System Information** (version, environment, database health and size, schema version, platform totals and the security policy, read live; no secrets are shown). Changing your password signs every other device out. Email notifications aren't set up, so the preferences apply to the bell only.

**Passwords.** `ADMIN_PASSWORD` sets the administrator's password when the account is created. After that you can change it in Settings and the server keeps your choice across restarts. It only sets the password again when the value of `ADMIN_PASSWORD` itself changes (change it and redeploy, e.g. if the password is lost); the old admin sessions are revoked when that happens.
If `ADMIN_EMAIL` / `ADMIN_PASSWORD` are unset or invalid, administrator sign-in is off and the API
logs why. At startup any other account holding the admin role loses it.

To create ordinary test accounts: `npm run user:create -- --email you@school.edu --username you --role coach`

## Deploy to Vercel (app + API, one project)

The web app is static; the API is one Vercel Function (`api/index.mjs`) that serves every `/api/*`
route, backed by Postgres. Both live on the same domain, so there is no CORS setup.

1. Push this folder to GitHub (it must be the repo root) and import it at vercel.com/new.
2. In the project, open **Storage** and connect a **Neon** Postgres database. This adds
   `DATABASE_URL` (and `POSTGRES_URL`) to the project. Tables are created on the first request.
3. Do **not** set `VITE_API_URL` (the web app then calls `/api` on its own domain). Deploy.
4. Add `ADMIN_EMAIL` and `ADMIN_PASSWORD` under Settings, Environment Variables, then redeploy. The
   administrator is created on the first request and signs in at `/admin/login`.

`api/index.mjs` is generated from `server/` by `npm run build:api` (the `build` script runs it), and
is committed so Vercel deploys exactly what was tested. Run `npm run build:api` after editing
anything in `server/`, then commit the result. Choose the Vercel function region closest to your
database (Settings, Functions).

## Build the native apps

```sh
npx cap add android           # once (needs Android Studio)
npx cap add ios               # once, on a Mac (needs Xcode)
npm run android               # builds, syncs and opens Android Studio
npm run ios                   # builds, syncs and opens Xcode
```

A phone can't reach `localhost` on your computer, so set `VITE_API_URL` to a reachable address
(Android emulator: `http://10.0.2.2:8787`; real device: your API's https URL) and rebuild.
If the API is plain `http`, enable `server.cleartext` in `capacitor.config.ts` (testing only).

**Camera / video upload** (New Practice uses the camera and photo library): add the usual
permission entries after `cap add` — iOS `NSCameraUsageDescription`, `NSMicrophoneUsageDescription`,
`NSPhotoLibraryUsageDescription` in `Info.plist`; Android `CAMERA` in `AndroidManifest.xml`.

## Hosting the API elsewhere

`server/index.ts` runs the same handler as a plain Node server (`npm run api`), so the API can also
run on a VPS, Railway, Fly.io or Render against the same Postgres. If you do that, point the native
app (and the web app, if you host it separately) at it with `VITE_API_URL`, and add the web origin to
`CORS_ORIGINS`. The Capacitor origins are built in.
