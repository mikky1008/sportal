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

To rotate the password, change `ADMIN_PASSWORD` and redeploy; the old admin sessions are revoked.
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
