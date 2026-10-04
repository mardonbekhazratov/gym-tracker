# AGENTS.md — guide for AI coding agents

Read this first. It is the source of truth for how this repo works and how to
change it safely. Human-facing docs live in `README.md`.

**Keep this file current.** Whenever you change behavior, data shape, commands,
file layout, or learn a gotcha, update the relevant section here (and the
user-facing part of `README.md`) in the same branch as the change.

---

## 1. What this is

A single-user, offline-first gym tracker. One React + TypeScript codebase that
runs as a web app/PWA and is wrapped as a native Android app with Capacitor.
The owner trains a fixed 3-day split (**Tue / Thu / Sat**) and uses the
**Android app daily on a Samsung Galaxy S24 Ultra** (adb serial `RFCXA193X7L`).
There is no backend: all data lives in IndexedDB on the phone.

## 2. The one rule that matters most: never lose the phone's data

The phone holds months of real training history (as of 2026-10-03: 75
sessions, 630 set logs, 33 bodyweights). When deploying or touching storage:

- **Never** `adb uninstall`, `pm clear`, "Clear storage", or `installDebug`
  after an uninstall. Updating in place (`installDebug` / `adb install -r`)
  keeps app data as long as the signing key matches (debug key in
  `~/.android/debug.keystore` on the owner's PC). If an install fails with
  `INSTALL_FAILED_UPDATE_INCOMPATIBLE`, stop and ask — do not uninstall.
- Keep `appId` `com.mardon.workouttracker` and `server.androidScheme: 'https'`
  in `capacitor.config.ts`. The WebView origin `https://localhost` is where
  IndexedDB lives; changing it orphans the data.
- Dexie DB name `workoutTrackerDB`, schema `version(1)` (IndexedDB version 10).
  Adding **non-indexed** fields needs no schema change. Adding/changing an
  **index** needs `this.version(2).stores(...)` with an upgrade, never editing
  version 1 in place. Never call `db.delete()` or clear tables outside the
  explicit Import/Reset flows.
- `src/db/migrate.ts` and `seedIfEmpty()` run on every boot; they must stay
  idempotent and only act on stale data.
- **Before every deploy, back up the phone's data** (works because the debug
  build is debuggable):
  ```bash
  ADB="$LOCALAPPDATA/Android/Sdk/platform-tools/adb.exe"
  D="/c/Users/Mardon/gym-tracker-phone-backups/$(date +%F)-before-deploy"; mkdir -p "$D"
  "$ADB" exec-out run-as com.mardon.workouttracker tar -cf - app_webview databases files shared_prefs no_backup > "$D/app-data.tar"
  ```
  (Use Git Bash for `exec-out` — PowerShell redirection corrupts binary output.)
  Then compare row counts before/after (see §7).

## 3. Commands

```bash
npm install
npm run dev                         # Vite dev server, http://localhost:5173
npm run build                       # tsc -b && vite build → dist/
node scripts/test-navigation.mjs    # back-button routing rules
node scripts/test-auto-complete.mjs # auto-finish-session rule
node scripts/test-rest-chime.mjs    # rest-chime arming rule
node scripts/gen-chime.mjs          # regenerate the chime WAV (public/ + res/raw/)
```

There is no test framework or linter config; `npm run build` (strict tsc) is
the type check. Tests are plain node scripts using `node:assert` that import
`.ts` files directly (Node's built-in type stripping; v25 on the owner's PC) —
so a module under test must
have **no runtime imports** (type-only imports are fine). Put pure logic in
such a module (see `src/lib/autoComplete.ts`, `src/lib/navigation.ts`) and add
a `scripts/test-*.mjs`.

### Android build & install (Windows)

`npx cap run android` is broken on Windows (spawns `gradlew`, not
`gradlew.bat`). Use, in PowerShell:

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
$env:Path = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:Path"
npm run build; npx cap sync android
& "$PWD\android\gradlew.bat" -p android installDebug     # builds + installs to the phone
adb shell monkey -p com.mardon.workouttracker -c android.intent.category.LAUNCHER 1
```

If `adb devices` shows `unauthorized`, ask the owner to accept the USB
debugging prompt on the phone.

## 4. Architecture map

```
src/
  main.tsx            boot: service-worker policy → seedIfEmpty → migrateProgram
                      → autoCompleteStaleSessions → render
  App.tsx             routes, rest timer + chime hook, bottom nav, back button,
                      resume hook
  db/db.ts            Dexie schema + types (Exercise, DayTemplate, Session, SetLog, …)
  db/queries.ts       all reads/writes used by screens (sessions, sets, exercises,
                      bodyweight, volume, auto-finish, exercise edit/delete)
  db/seed.ts          first-run seed from data/program.ts
  db/migrate.ts       idempotent data migrations (merged slugs, day templates)
  data/program.ts     the program: seed exercises, day templates, merged-slug map,
                      BODYWEIGHT_ONLY_SLUGS, six rules, weekly volume targets
  store/useStore.ts   zustand UI state: selected day, expanded card, units, rest
                      timer, rest-chime mode
  lib/                pure helpers: dates, units, epley, backup (export/import),
                      downloads (native plugin bridge), navigation + overlayStack
                      + useAndroidBackButton, autoComplete, restChime (pure rule)
                      + useRestChime (native plugin bridge + web fallback)
  components/         ExerciseCard, SetRow, RestTimer, sheets (Add/Edit/Swap
                      exercise), ExerciseFields (shared form), charts, banners
  components/ui/      primitives: Sheet, ConfirmDialog, NumberField, TextField,
                      TextArea, DatePicker, Select
  screens/            Today, History, SessionDetail, Progress, Settings, Exercises
android/              Capacitor project; custom code in
                      app/src/main/java/com/mardon/workouttracker/
                      (MainActivity edge-to-edge, DownloadsPlugin,
                      RestChimePlugin + RestChimeReceiver); chime sound in
                      app/src/main/res/raw/rest_chime.wav
scripts/              gen-icons.mjs, gen-chime.mjs, test-*.mjs
```

Routes: `/` Today, `/history`, `/history/:sessionId`, `/progress`,
`/settings`, `/settings/exercises`.

## 5. Data model & invariants

- Six tables: `exercises`, `dayTemplates`, `sessions`, `setLogs`,
  `bodyWeights`, `settings` (single row, id 1). `settings.restChime`
  (`headphones | always | off`, non-indexed) may be missing on older rows —
  read it as `?? DEFAULT_REST_CHIME` (`headphones`).
- **Weights are stored in kg**; `lib/units.ts` converts for display.
- **Set logs reference exercises by `slug`**, never by id. Slugs are permanent:
  editing an exercise changes name/targets but never its slug.
- A `Session` is one (date, dayKey) pair, auto-created when a day is viewed on
  the Today screen (so many sessions have zero sets; History hides those).
  `exerciseOrder` (optional) overrides the template order for that session
  only; `swaps` maps slug → alternative display name for that session (logs
  stay under the original slug).
- `completed` = "Finish session". `autoCompleted` = the app finished it.
- Active day keys: `tuesday | thursday | saturday`. Legacy
  `monday | wednesday | friday` templates are kept so old sessions keep labels.
- `MERGED_EXERCISE_SLUGS` (program.ts) remaps retired duplicate slugs in
  `migrate.ts`; add to it rather than editing logs by hand.
- `BODYWEIGHT_ONLY_SLUGS` is a hardcoded set (weight input replaced by BW).

## 6. Feature behavior worth knowing

- **Ghost values**: each set row's placeholder is the same set from the most
  recent earlier session with logs for that slug (`lastSessionForExercise`).
- **Rest timer** (`RestTimer.tsx`, state in zustand, in-memory only): starts on
  every set save on the Today screen (not in History edits) from
  `exercise.restSeconds`. After zero it keeps running: ring shows `+m:ss`
  overtime and the text shows total time rested.
- **Rest chime** (Settings → Rest chime: Headphones / Always / Off): one short
  chime when rest ends, never a notification. The WebView stops running JS
  once the screen locks, so `useRestChime()` (mounted in `App`) hands the
  end time to the native `RestChime` plugin, which arms an exact
  `AlarmManager` alarm (`USE_EXACT_ALARM`, auto-granted on Android 13+;
  only one pending at a time). It is re-armed whenever `rest.endsAt` or the
  mode changes (set saved, +30s) and cancelled on Skip/Done/Off; the rule is
  `lib/restChime.ts`. `RestChimeReceiver` checks for wired/USB/Bluetooth
  headphones *at fire time* (Headphones mode) and plays `res/raw/rest_chime.wav`
  on the media stream with transient ducking focus — so it follows the active
  output and silent mode doesn't mute it. Logs tag `RestChime`. Web fallback
  is a `setTimeout` + `<audio>` (tab must be open, no headphone detection).
  To test on the phone without logging sets, call
  `Capacitor.Plugins.RestChime.schedule({ at: Date.now() + 10000, headphonesOnly: false })`
  over the DevTools socket (§7) and check `adb logcat -s RestChime` and
  `adb shell dumpsys alarm | grep RestChime`.
- **Auto-finish sessions**: on boot and on `visibilitychange → visible`,
  `autoCompleteStaleSessions()` marks done every open session with ≥1 set whose
  latest set-log `timestamp` is on a calendar day before today. Only once per
  session (`autoCompleted`), so a manual reopen sticks. Rule lives in
  `lib/autoComplete.ts`.
- **Exercise manager**: Settings → Manage exercises (`ExercisesScreen`) or the
  "Edit" button in an expanded exercise card opens `EditExerciseSheet` (name,
  muscle group, default sets, rep range, rest, swap alternatives). Delete is
  allowed only for never-logged exercises and also strips the slug from day
  templates and session orders. Day templates themselves (which exercises
  belong to Tue/Thu/Sat) are **not** editable in the UI yet — in-session
  add/reorder only affects that one session.
- **Backup**: Settings → Export JSON writes `Download/workout-tracker-<date>.json`
  via the native `DownloadsPlugin` (MediaStore, Android 10+); on web it's a
  normal browser download. Import replaces all tables in one transaction.
  (`resetAllData()` exists in `lib/backup.ts` but has no button.)
- **Android back button**: closes the top overlay (`useOverlay` in every
  Sheet/Dialog), else Today → exit app, other tabs → Today, deeper routes →
  back. Rules in `lib/navigation.ts`.
- **Service worker**: registered only on web. On native it is unregistered and
  caches cleared on boot — a stale precache inside the WebView runs old JS
  against the new APK. Keep `injectRegister: false` in `vite.config.ts`.

## 7. Verifying changes

- **Web**: `npm run dev` and drive it in a browser. The browser's IndexedDB
  at `localhost:5173` is disposable dev data — clean up anything you add.
- **On the phone**, do not log fake sets into the real database. Read-only
  inspection works through the WebView DevTools socket (debug build):
  ```bash
  PID=$("$ADB" shell pidof com.mardon.workouttracker)
  "$ADB" forward tcp:9333 localabstract:webview_devtools_remote_$PID
  # then GET http://127.0.0.1:9333/json and send Runtime.evaluate over the
  # page's webSocketDebuggerUrl (Node ≥ 22 has a global WebSocket)
  ```
  The app must be in the foreground, or evaluation hangs (paused WebView).
  Use it to count rows per table before and after a deploy.
- Logs: `adb logcat` filtered on `Capacitor/Console`; lines from
  `https://localhost/assets/index-*.js` are app code.

## 8. Conventions

- TypeScript strict; functional React components with hooks; no class
  components. Match existing Tailwind tokens (`ink-*`, `ember-*`) and the
  utility classes in `src/index.css` (`card`, `btn-primary`, `btn-ghost`,
  `field`, `label-eyebrow`, `tap`, `num`, `display`).
- Use `Sheet` for bottom sheets and `useConfirm()` for confirmations — never
  `window.alert/confirm` (they block the WebView and the back-button stack).
- Icons come from `components/Icon.tsx` (add new names there).
- Comments explain *why*; keep them at the density of surrounding code.
- DB access goes through `db/queries.ts` helpers where one exists.

## 9. Git workflow

- `main` is the default branch; work on a `feat/...` branch and open a PR
  (remote `origin` = github.com/mardonbekhazratov/gym-tracker). Commit only
  when asked; one logical change per commit, imperative subject line.
- `.claude/` is git-ignored (local agent settings).
- Line endings: files are committed with LF; git on Windows warns about CRLF
  conversion — harmless.
