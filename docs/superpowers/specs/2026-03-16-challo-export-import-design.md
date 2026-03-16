# Challo Fit Friend — Export / Import Design

**Date:** 2026-03-16
**Status:** Approved
**Project:** `challo-fit-friend`

---

## Overview

Add export and import buttons to the Settings screen so users can transfer their data (food library, daily logs, weight log, profile) between devices as a JSON file. Primary use case: one-time bootstrap from computer to phone.

---

## Data Format

Export file is named `challo-backup.json` and contains:

```json
{
  "version": 1,
  "exportedAt": "YYYY-MM-DD",
  "profile": { ... },
  "foodLibrary": [ ... ],
  "dailyLogs": { "YYYY-MM-DD": { ... } },
  "weightLog": [ ... ]
}
```

All fields map directly to the existing localStorage keys (`cff_profiles`, `cff_food_library`, `cff_daily_logs`, `cff_weight_log`).

---

## Export

- Reads all four data sources from localStorage via the existing storage functions
- Constructs the backup object with `version: 1` and `exportedAt: today`
- Serialises to JSON and triggers a browser file download (`challo-backup.json`)
- Uses a programmatic `<a download>` click — no server involved

---

## Import

- A hidden `<input type="file" accept=".json">` triggered by the Import button
- Reads the file with `FileReader`, parses JSON
- Validates: must have `version` field; must be parseable JSON
- Merges each section:
  - **foodLibrary** — adds items whose `id` doesn't already exist in localStorage; skips duplicates
  - **dailyLogs** — adds log entries for dates not already present; skips existing dates
  - **weightLog** — adds entries whose `date` doesn't already exist; skips duplicates
  - **profile** — not imported; target device keeps its own profile and settings
- Shows a toast on success: *"Imported X foods, Y log days, Z weight entries"*
- Shows an error toast on failure: *"Invalid backup file"*

---

## UI

New **"Data"** card added to `SettingsScreen` below the storage warning:

```
┌─────────────────────────────┐
│ Data                        │
│                             │
│ [Export my data]            │
│ [Import from backup]        │
└─────────────────────────────┘
```

Both buttons use existing `.btn` styles. No new screen required.

---

## Storage layer additions

Two new functions in `src/storage/index.js`:

- `exportAllData()` — returns the full backup object (reads all four keys)
- `importAllData(backup)` — performs the merge logic described above, returns `{ foods, days, weights }` counts

Keeping the merge logic in the storage layer (not in the component) keeps SettingsScreen thin and makes the logic testable.

---

## Component Map

| File | Change |
|------|--------|
| `src/storage/index.js` | Add `exportAllData`, `importAllData` |
| `src/screens/SettingsScreen.jsx` | Add Data card with Export + Import buttons |

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| File not valid JSON | Toast: "Invalid backup file" |
| File missing `version` field | Toast: "Invalid backup file" |
| Duplicate food item (same `id`) | Skip silently |
| Duplicate log entry (same date) | Skip silently |
| Duplicate weight entry (same date) | Skip silently |

---

## Out of Scope

- Profile import (target device keeps its own settings)
- Automatic/scheduled sync
- Cloud storage
- Merging conflicting entries (last-write-wins or diff UI)
