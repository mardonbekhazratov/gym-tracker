# Workout Tracker

An **offline-first, single-user** gym tracker for a fixed 3-day upper-body-focused split (Mon / Wed / Fri). Built as a PWA and wrapped to an Android APK with Capacitor. Targets a Samsung Galaxy S24 Ultra in portrait.

- No accounts, no servers, no network required.
- All data lives on-device in IndexedDB (Dexie).
- One React codebase → web app, installable PWA, native Android APK.

The full build specification lives in [`BUILD_SPEC_workout_tracker.md`](./BUILD_SPEC_workout_tracker.md).

---

## Stack

| Layer | Choice |
|---|---|
| Build | Vite |
| UI | React 18 + TypeScript + Tailwind CSS (dark) |
| Local DB | Dexie.js (IndexedDB) |
| State | Zustand |
| Routing | React Router |
| Charts | Recharts |
| PWA | vite-plugin-pwa (Workbox) |
| Native wrap | @capacitor/core + @capacitor/android |

---

## Quick start (dev)

```bash
npm install
npm run dev          # http://localhost:5173
```

```bash
npm run build        # produces dist/ (PWA + Capacitor source)
npm run preview      # serve the built dist/
```

Open the app on http://localhost:5173 (or your LAN IP shown by Vite) — on first launch the program seeds itself (19 exercises, 3 day templates, default settings: kg, protein 1.8 g/kg).

---

## How to use

### Today screen — log a workout

1. **Pick a day.** It auto-selects Mon / Wed / Fri based on the date; tap a different tab to plan ahead.
2. **Glance at the top.**
   - **Deload banner** appears once it's been ≥6 weeks since your last deload (or program start). Tap _Mark done_ when you finish your deload week.
   - **Protein badge** shows your daily target (`bodyweight × protein g/kg`). If empty, it links to Settings.
3. **Open an exercise.** Each card shows target sets × rep range, default rest, and your top set so far. Tap to expand.
4. **Log sets.** Type **Weight**, **Reps**, and **RIR** (reps in reserve, 0–5). The greyed placeholder in each input is your last session's number — your job is to beat it. Values save on blur.
5. **Rest timer.** Auto-starts on every save from `exercise.restSeconds`. Use _+30s_ or _Skip_. It floats above the bottom nav.
6. **Need a substitute?** Tap the ⇄ icon on an exercise to open the swap sheet. Pick from the program's listed alternatives — the swap only applies to the current session and is persisted (no template mutation). Set logs stay under the original exercise so progress charts remain continuous.
7. **Add an extra set** with the _+ Add set_ button. Delete a logged set with the ✕ at the end of its row.
8. **Finish session** at the bottom marks it complete. Tap again to reopen.

### History screen

- Newest sessions first. Each row shows the day label, date, and set count.
- Tap into any session to edit weight/reps/RIR on any set, change exercise swaps, add notes, or toggle completion. Editing past sessions does **not** trigger the rest timer.

### Progress screen

- **Weekly volume dashboard** — working sets per muscle group in the current ISO week vs the program targets and the 10–20 band. Bar tint is green (on target), amber (low), or red (over).
- **Exercise picker + chart** — top set weight and Epley est-1RM over time for any exercise that has logs.
- **Bodyweight chart** — line of every bodyweight entry you've made.

### Settings screen

- **Units** — kg / lb toggle. Weights are always stored in kg internally; display converts.
- **Bodyweight** — pick a date + weight, save. Upserts the row for that date. Feeds the chart and the protein target.
- **Protein** — g/kg multiplier and your reference bodyweight.
- **Program** — start date (drives "weeks since start" and deload timing).
- **Backup**
  - _Export JSON_ — downloads a complete snapshot of your DB (`workout-tracker-YYYY-MM-DD.json`).
  - _Import JSON_ — replaces all current data with the file's contents (transactional, confirms first).
  - _Reset all data_ — clears every table and re-seeds the program.

---

## The six rules (built into the app)

1. Log every set; beat last session by +1 rep or +2.5 kg.
2. Train at 0–2 RIR; only the last set of an exercise nears true failure.
3. Protein 1.6–2.2 g/kg bodyweight daily.
4. Sleep 7–9 h.
5. Deload every 6–8 weeks (~60% load for one week).
6. Run the program ≥12 weeks before changing anything.

The app enforces rules 1, 3, and 5 directly (ghost values, protein badge, deload banner).

---

## Install as a PWA (Android, iOS, desktop)

After deploying `dist/` to any HTTPS static host (Netlify, Vercel, GitHub Pages, etc.):

- **Chrome on Android**: menu → _Install app_ / _Add to Home screen_. Opens standalone, works offline after first load.
- **Safari on iOS**: share → _Add to Home Screen_.
- **Desktop Chrome / Edge**: the install icon in the address bar.

The manifest declares portrait, standalone, brand color `#0f1f3d`, and adaptive icons.

---

## Build a debug APK (Android)

Requires Android Studio + JDK 17 (Studio's bundled JDK is fine). Works on macOS / Linux / Windows.

```bash
npm run build         # produce dist/
npx cap sync android  # copy dist/ into the android project
npx cap open android  # opens the project in Android Studio
```

Then in Android Studio: let Gradle sync, plug in your phone with USB debugging enabled (Settings → About phone → tap _Build number_ 7×; back → Developer options → USB debugging), and hit **Run**.

CLI alternative:

```bash
cd android && ./gradlew assembleDebug
# APK at android/app/build/outputs/apk/debug/app-debug.apk
```

Re-run `npm run build && npx cap sync android` after any web change before rebuilding the APK.

App identity:

- **appId**: `com.mardon.workouttracker`
- **appName**: `Workout Tracker`
- portrait-locked

---

## Project structure

```
.
├─ index.html
├─ vite.config.ts             # vite + vite-plugin-pwa (manifest, service worker)
├─ tailwind.config.js
├─ capacitor.config.ts        # appId, appName, webDir
├─ public/                    # PWA icons (192, 512, maskable-512)
├─ scripts/
│  └─ gen-icons.mjs           # zero-dep PNG icon generator (PWA + Android mipmaps)
├─ android/                   # generated by `npx cap add android`
└─ src/
   ├─ main.tsx, App.tsx
   ├─ index.css               # tailwind directives + utility classes
   ├─ db/
   │  ├─ db.ts                # Dexie schema (6 tables) + types
   │  ├─ seed.ts              # first-run seed (exercises, templates, settings)
   │  └─ queries.ts           # lastSessionForExercise, weeklyVolume, etc.
   ├─ data/
   │  └─ program.ts           # the full program (exercises, day templates, targets)
   ├─ store/
   │  └─ useStore.ts          # zustand: selectedDay, units, rest timer state
   ├─ lib/
   │  ├─ epley.ts             # estimated 1RM = w × (1 + reps/30)
   │  ├─ units.ts             # kg ↔ lb
   │  ├─ dates.ts             # ISO week math, dayKey for today
   │  └─ backup.ts            # export / import / reset
   ├─ components/
   │  ├─ BottomNav.tsx
   │  ├─ ExerciseCard.tsx     # per-exercise list with swap button
   │  ├─ SetRow.tsx           # weight / reps / RIR inputs + ghost values
   │  ├─ RestTimer.tsx        # floating countdown
   │  ├─ DeloadBanner.tsx
   │  ├─ ProteinBadge.tsx
   │  ├─ ExerciseSwapSheet.tsx
   │  ├─ WeeklyVolume.tsx
   │  ├─ BodyWeightInput.tsx
   │  ├─ BodyWeightChart.tsx
   │  └─ ExerciseProgressChart.tsx
   └─ screens/
      ├─ TodayScreen.tsx
      ├─ HistoryScreen.tsx
      ├─ SessionDetailScreen.tsx
      ├─ ProgressScreen.tsx
      └─ SettingsScreen.tsx
```

---

## Data model (quick reference)

Six Dexie tables: `exercises`, `dayTemplates`, `sessions`, `setLogs`, `bodyWeights`, `settings`. Weights are stored in kg internally regardless of UI units. `setLogs` reference exercises by **slug**, not numeric id, so a reseed never breaks history. The "beat last session" ghost values are derived from the most recent `Session` _before today_ that has `setLogs` for the same `exerciseSlug`.

Full schema in `src/db/db.ts`.

---

## Regenerating icons

Both the PWA manifest icons and the Android launcher icons are produced by one zero-dep node script:

```bash
node scripts/gen-icons.mjs
```

It writes to `public/` and (if the android project exists) to every `android/app/src/main/res/mipmap-*/` density. Adjust the colors or shape in that script, re-run, and rebuild.

---

## Out of scope

iOS build, cloud sync / accounts, multi-user, social features, ads. Local-first and single-user by design.
