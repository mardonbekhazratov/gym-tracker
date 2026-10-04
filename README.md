# Workout Tracker

An **offline-first, single-user** gym tracker for a fixed 3-day upper-body-focused split (Tue / Thu / Sat). It runs as a web app / installable PWA and as a native Android app (Capacitor), built for a Samsung Galaxy S24 Ultra in portrait.

- No accounts, no servers, no network needed.
- All data stays on the device (IndexedDB via Dexie).
- One React codebase → web app, PWA, and Android APK.

> Working on the code with an AI agent? See [`AGENTS.md`](./AGENTS.md). It covers architecture, conventions, and how to deploy without touching the phone's data.

---

## Features at a glance

- **Log every set**: weight × reps × RIR, with last session's numbers shown as ghost values to beat.
- **Rest timer**: starts automatically after each set. When the countdown ends it keeps counting, showing how far over you went and your total rest time.
- **Rest chime**: one short chime when rest is over, even with the screen locked. By default only into headphones; no notifications.
- **Sessions finish themselves**: if you forget to tap _Finish session_, the session is marked done the day after you last logged a set.
- **Exercise manager**: change any exercise's default sets, rep range, rest time, muscle group or swap alternatives.
- **Swaps, extra exercises, reordering** for a single session without changing the program.
- **Progress**: weekly volume per muscle group, top-set and est. 1RM charts, bodyweight chart.
- **Program helpers**: deload reminder every 6+ weeks and a daily protein target.
- **Backup**: export to a JSON file in your phone's Downloads folder, and import it back.

---

## How to use

### Today: log a workout

1. **Pick a day.** The app selects Tue / Thu / Sat from today's date; tap another tab to train a different day. Use the **Log date** picker to backfill a missed day.
2. **Check the banners.** The **Deload** banner appears once it's been ≥ 6 weeks since your last deload (tap _Mark done_ after your deload week). The **Protein** badge shows your daily target, or links to Settings if your bodyweight isn't set.
3. **Open an exercise.** Each card shows target sets × reps, rest time, and your top set today. Tap to expand.
4. **Log sets.** Enter **Weight**, **Reps**, and **RIR** (reps in reserve, 0–5). The grey placeholder is last session's number; beat it. Values save when you leave the field.
5. **Rest.** The timer floats above the bottom bar. Use _+30s_ or _Skip_. When time's up the ring turns green and counts up (`+0:42`), and the text shows **Rested 2:42**. Tap _Done_ when you start the next set. On the Android app a short chime plays at that moment (see **Rest chime** in Settings); _+30s_ moves it later, _Skip_ cancels it.
6. **Adjust on the fly.**
   - ⇄ swaps an exercise for one of its alternatives, for this session only. Logs stay under the original exercise so charts remain continuous.
   - _+ Add set_ adds an extra row; the trash icon deletes a logged set.
   - _Edit_ (inside an expanded card) changes the exercise's defaults; see [Exercise manager](#exercise-manager).
   - _+ Add exercise_ adds one from the library or creates a new one; _Reorder_ changes the order for this session.
7. **Finish session** when you're done. If you forget, the app does it for you the next day. A session you reopen by hand stays open.

### History

Newest sessions first, with set count and Done / Open status. Open one to edit any set, change swaps, add notes, or toggle done. Editing history doesn't start the rest timer.

### Progress

- **Weekly volume**: working sets per muscle group this week vs. program targets (green on target, amber low, red over).
- **Exercise chart**: top-set weight and Epley est. 1RM over time.
- **Bodyweight chart**: every entry you've logged.

### Settings

- **Units**: kg / lb. Weights are always stored in kg; only the display converts.
- **Rest chime**: what happens when rest is over.
  - _Headphones_ (default): a short chime, only while wired or Bluetooth headphones are connected.
  - _Always_: the chime also plays on the phone speaker.
  - _Off_: silent.

  It plays once at **media volume** (not muted by silent mode), briefly lowers any music, and works with the screen off. The web/PWA version only chimes while the tab is open and can't detect headphones.
- **Bodyweight**: pick a date and weight; one entry per date.
- **Protein target**: g/kg multiplier and reference bodyweight.
- **Program**: start date (drives deload timing) and **Manage exercises**.
- **Backup**
  - _Export JSON_ saves a full snapshot as `Download/workout-tracker-YYYY-MM-DD.json` (Android app) or downloads it in the browser.
  - _Import JSON_ **replaces all data** with a file's contents, after a confirmation.

### Exercise manager

Settings → **Manage exercises** lists every exercise grouped by muscle group, with its sets × reps, rest time, and which days use it. Tap one (or tap _Edit_ on a card in Today) to change:

- name and muscle group
- default number of sets
- rep range (low–high)
- rest time in seconds
- swap alternatives (add / remove)

Changes apply everywhere the exercise is used, and your logged history stays attached. Exercises you've never logged can be deleted; ones with history can't, so no data is lost.

> Which exercises belong to Tue / Thu / Sat is part of the program definition (`src/data/program.ts`) and isn't editable in the app yet.

---

## The six rules (built into the app)

1. Log every set; beat last session by +1 rep or +2.5 kg.
2. Train at 0–2 RIR; only the last set of an exercise nears true failure.
3. Protein 1.6–2.2 g/kg bodyweight daily.
4. Sleep 7–9 h.
5. Deload every 6–8 weeks (~60% load for one week).
6. Run the program ≥ 12 weeks before changing anything.

The app enforces rules 1, 3, and 5 directly (ghost values, protein badge, deload banner).

---

## Development

Requires Node (v22+; v25 used here).

```bash
npm install
npm run dev          # http://localhost:5173
npm run build        # type-check + production build into dist/
npm run preview      # serve dist/
```

Tests are small node scripts:

```bash
node scripts/test-navigation.mjs     # Android back-button routing
node scripts/test-auto-complete.mjs  # auto-finish-session rule
node scripts/test-rest-chime.mjs     # when the rest chime is armed
```

On first launch the app seeds the program (17 exercises, 3 day templates, default settings: kg, protein 1.8 g/kg).

---

## Android app

Requires Android Studio (its bundled JDK is fine) and a phone with USB debugging enabled (Settings → About phone → tap _Build number_ 7× → Developer options → USB debugging).

```bash
npm run build         # produce dist/
npx cap sync android  # copy dist/ into the Android project
npx cap open android  # open in Android Studio, then Run
```

Command-line install on **Windows** (`npx cap run android` doesn't work there):

```powershell
$env:JAVA_HOME = "C:\Program Files\Android\Android Studio\jbr"
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
npm run build; npx cap sync android
& .\android\gradlew.bat -p android installDebug
```

`installDebug` updates the app in place and **keeps your data**. Never uninstall the app or clear its storage unless you have a fresh JSON export. See `AGENTS.md` §2 for the full checklist.

App identity: `com.mardon.workouttracker`, "Workout Tracker", portrait only.

---

## Install as a PWA

Deploy `dist/` to any HTTPS static host, then:

- **Chrome on Android**: menu → _Install app_.
- **Safari on iOS**: share → _Add to Home Screen_.
- **Desktop Chrome / Edge**: install icon in the address bar.

Works offline after the first load.

---

## Project layout

```
src/
  screens/      Today, History, SessionDetail, Progress, Settings, Exercises
  components/   exercise cards, set rows, rest timer, sheets, charts, ui/ primitives
  db/           Dexie schema, queries, seed, migrations
  data/         the program (exercises, day templates, targets, rules)
  lib/          dates, units, backup, Android back button, auto-finish rule, rest chime
  store/        zustand UI state (selected day, units, rest timer, rest chime)
android/        Capacitor Android project (+ native Downloads and RestChime plugins)
scripts/        icon + chime generators and tests
```

Data model in one line: six tables (`exercises`, `dayTemplates`, `sessions`, `setLogs`, `bodyWeights`, `settings`). Weights are in kg, and set logs point at exercises by a permanent **slug**, so renaming or editing an exercise never breaks history.

### Regenerating icons

```bash
node scripts/gen-icons.mjs
```

Writes the PWA icons to `public/` and the Android launcher icons to every `android/app/src/main/res/mipmap-*/`.

### Regenerating the rest chime

```bash
node scripts/gen-chime.mjs
```

Synthesizes the two-note chime into `public/rest-chime.wav` and `android/app/src/main/res/raw/rest_chime.wav`.

---

## Out of scope

iOS build, cloud sync / accounts, multiple users, social features, ads. Local-first and single-user by design.
