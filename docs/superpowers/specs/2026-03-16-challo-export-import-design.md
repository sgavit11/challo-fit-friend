# Challo Fit Friend — Export / Import Design

**Date:** 2026-03-16
**Status:** Approved
**Project:** `challo-fit-friend`

---

## Overview

Add export and import buttons to the Settings screen so users can transfer their data (food library, daily logs, weight log) between devices as a JSON file. Primary use case: one-time bootstrap from computer to phone.

---

## Data Format

Export file is named `challo-backup.json`:

```json
{
  "version": 1,
  "exportedAt": "2026-03-16T12:00:00.000Z",
  "profileId": "abc123",
  "foodLibrary": [
    { "id": "...", "name": "...", "perServing": { ... }, ... }
  ],
  "dailyLogs": {
    "abc123_2026-03-15": { "calories": 0, "protein": 0, ... },
    "abc123_2026-03-16": { ... }
  },
  "weightLog": [
    { "id": "...", "profileId": "abc123", "date": "YYYY-MM-DD", "weight": 180 }
  ]
}
```

- `profileId` is the active profile's ID at export time — used during import to remap log entries to the target device's profile
- `dailyLogs` is a filtered subset of `cff_daily_logs` containing only entries whose key starts with `${profileId}_`
- `weightLog` contains only entries where `entry.profileId === profileId`
- `foodLibrary` is the full shared library (not profile-scoped)
- Profile settings are **not exported** — the target device keeps its own profile

---

## Export

- Reads `getActiveProfileId()`, `getFoodLibrary()`, and the raw `cff_daily_logs` + `cff_weight_log` keys from localStorage
- Filters daily logs and weight log to active profile only
- Constructs backup object and triggers a browser file download (`challo-backup.json`) via a programmatic `<a download>` click
- No server involved

---

## Import

Triggered by a hidden `<input type="file" accept=".json">`. Steps:

1. Read file with `FileReader`, parse JSON
2. Validate: must be parseable JSON and have a `version` field — otherwise show error toast *"Invalid backup file"* and abort
3. Missing sections (`foodLibrary`, `dailyLogs`, `weightLog`) are treated as empty arrays/objects and skipped silently
4. The caller (SettingsScreen) reads `currentProfileId` via `getActiveProfileId()` and passes it into `importAllData(backup, currentProfileId)`
5. Merge each section:
   - **foodLibrary** — for each item, check existence by `id` against the current library first; skip if found; otherwise call `saveFoodItem(item)`. Do NOT rely on `saveFoodItem`'s built-in upsert to handle deduplication — it would silently overwrite existing items
   - **dailyLogs** — for each key in `backup.dailyLogs`, extract the date by slicing off the exported profile prefix: `date = key.slice(backup.profileId.length + 1)`. Remap to `${currentProfileId}_${date}`; skip if that remapped key already exists in `cff_daily_logs`; otherwise write the entry under the remapped key. Using `slice` (not `split('_')`) is required because profile IDs may contain underscores
   - **weightLog** — for each entry, remap `entry.profileId` to `currentProfileId`; check existence by `id` against the current weight log; skip if found; otherwise call `saveWeightEntry(remappedEntry)`
6. Show success toast: *"Imported X foods, Y log days, Z weight entries"* where counts reflect only newly added items (skipped duplicates are not counted)
7. If all counts are zero (everything was already present), show *"Nothing new to import — all data already up to date"* instead

---

## Storage layer additions

Two new exported functions in `src/storage/index.js`:

### `exportAllData()`

Returns:
```js
{
  version: 1,
  exportedAt: new Date().toISOString(),
  profileId: string,
  foodLibrary: FoodItem[],
  dailyLogs: { [profileId_date]: LogObject },
  weightLog: WeightEntry[],
}
```

### `importAllData(backup, currentProfileId)`

Parameters:
- `backup` — the parsed backup object
- `currentProfileId` — the active profile ID on this device (passed in, not read internally, for testability)

Returns:
```js
{ foods: number, days: number, weights: number }
```

where each count is the number of newly added items only.

---

## UI

New **"Data"** card added to `SettingsScreen`, below the Scanner card and above the Save button:

```
┌─────────────────────────────┐
│ Data                        │
│                             │
│ [Export my data]            │
│ [Import from backup]        │
└─────────────────────────────┘
```

Both buttons use existing `.btn` styles (`btn-primary` for Export, `btn-secondary` for Import). No new screen required.

---

## Component Map

| File | Change |
|------|--------|
| `src/storage/index.js` | Add `exportAllData`, `importAllData` |
| `src/screens/SettingsScreen.jsx` | Add Data card with Export + Import buttons and toast feedback |

---

## Testing

`src/storage/index.test.js` — add tests for `exportAllData` and `importAllData`:

- `exportAllData` returns correct shape with active profile's logs only
- `importAllData` adds new food items, skips duplicates
- `importAllData` remaps `${exportedProfileId}_${date}` log keys to `${currentProfileId}_${date}`
- `importAllData` skips log entries for dates already present
- `importAllData` remaps weight entry profileId, skips duplicates by id
- `importAllData` returns correct counts for a mixed batch (some new, some duplicate)
- `importAllData` returns zero counts when everything is already present
- `importAllData` returns `{ foods: 0, days: 0, weights: 0 }` on a backup with missing sections
- `importAllData` correctly extracts the date when `backup.profileId` itself contains an underscore (e.g. `profileId = "abc_123"`, key `"abc_123_2026-03-16"` → date `"2026-03-16"`)

---

## Error Handling

| Scenario | Behaviour |
|----------|-----------|
| File not valid JSON | Toast: "Invalid backup file" |
| File missing `version` field | Toast: "Invalid backup file" |
| Missing sections in backup | Treated as empty, skipped silently |
| Duplicate food item (same `id`) | Skipped silently, not counted |
| Duplicate log entry (same remapped date key) | Skipped silently, not counted |
| Duplicate weight entry (same `id`) | Skipped silently, not counted |
| All items already present | Toast: "Nothing new to import — all data already up to date" |

---

## Out of Scope

- Profile import (target device keeps its own settings)
- Automatic/scheduled sync
- Cloud storage
- Merging conflicting entries (last-write-wins or diff UI)
- Multi-profile export (active profile only)
