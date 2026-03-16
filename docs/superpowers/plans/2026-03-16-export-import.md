# Export / Import Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add export and import buttons to SettingsScreen so users can transfer their food library, daily logs, and weight log between devices as a JSON file.

**Architecture:** Two new pure functions (`exportAllData`, `importAllData`) added to the existing storage module handle all data access; `SettingsScreen` grows a Data card that calls them and shows inline toast feedback. No new files needed — both changes are additive to existing files.

**Tech Stack:** Vitest + jsdom for storage tests, React Testing Library for component tests; localStorage mocked by jsdom; no new npm packages.

---

## Chunk 1: Storage functions

### Task 1: `exportAllData` and `importAllData` in `src/storage/index.js`

**Files:**
- Modify: `challo-fit-friend/src/storage/index.js` (append two exports at the bottom)
- Modify: `challo-fit-friend/src/storage/index.test.js` (append new describe block)

**Context:**
- `KEYS.DAILY_LOGS` (`cff_daily_logs`) stores `{ [profileId_date]: logObject }` — a flat object in localStorage
- `KEYS.WEIGHT_LOG` (`cff_weight_log`) stores `WeightEntry[]` in localStorage
- `KEYS.FOOD_LIBRARY` (`cff_food_library`) stores `FoodItem[]`
- `saveFoodItem` does an upsert (overwrites by id) — do NOT use it for dedup; check existence first
- `saveWeightEntry` also upserts — same rule: check by id before calling
- Profile IDs can contain underscores, so key parsing must use `slice` not `split('_')`
- The `read` and `write` helpers are already defined at the top of the file; use them directly for bulk raw access to DAILY_LOGS and WEIGHT_LOG (the existing helpers `getDailyLog`/`getWeightLog` are profile-scoped and not suitable here)
- `read` and `write` are NOT exported — `exportAllData` and `importAllData` live in the same file so they can call them directly

---

- [ ] **Step 1: Write failing tests**

Append this describe block to `challo-fit-friend/src/storage/index.test.js`:

```js
import {
  getProfiles, saveProfile, getActiveProfileId, setActiveProfileId,
  getFoodLibrary, saveFoodItem,
  getDailyLog, updateDailyLog,
  getWeightLog, saveWeightEntry,
  exportAllData, importAllData,
} from './index'
```

> **Update the import at the top of the test file** to include `exportAllData` and `importAllData`. Then append:

```js
describe('exportAllData', () => {
  it('returns correct shape with version, exportedAt, profileId, foodLibrary, dailyLogs, weightLog', () => {
    setActiveProfileId('p1')
    saveFoodItem({ id: 'f1', name: 'Oats' })
    updateDailyLog('p1', '2026-03-15', { calories: 500 })
    saveWeightEntry({ id: 'w1', profileId: 'p1', date: '2026-03-15', weight: 180 })

    const result = exportAllData()

    expect(result.version).toBe(1)
    expect(typeof result.exportedAt).toBe('string')
    expect(result.profileId).toBe('p1')
    expect(result.foodLibrary).toEqual([{ id: 'f1', name: 'Oats' }])
    expect(result.dailyLogs).toHaveProperty('p1_2026-03-15')
    expect(result.weightLog).toEqual([{ id: 'w1', profileId: 'p1', date: '2026-03-15', weight: 180 }])
  })

  it('only exports daily logs for the active profile', () => {
    setActiveProfileId('p1')
    updateDailyLog('p1', '2026-03-15', { calories: 100 })
    updateDailyLog('p2', '2026-03-15', { calories: 999 })

    const result = exportAllData()

    expect(Object.keys(result.dailyLogs)).toEqual(['p1_2026-03-15'])
  })

  it('only exports weight entries for the active profile', () => {
    setActiveProfileId('p1')
    saveWeightEntry({ id: 'w1', profileId: 'p1', date: '2026-03-15', weight: 180 })
    saveWeightEntry({ id: 'w2', profileId: 'p2', date: '2026-03-15', weight: 150 })

    const result = exportAllData()

    expect(result.weightLog).toHaveLength(1)
    expect(result.weightLog[0].id).toBe('w1')
  })
})

describe('importAllData', () => {
  it('adds new food items and returns correct count', () => {
    const backup = {
      version: 1,
      profileId: 'exported-profile',
      foodLibrary: [{ id: 'f1', name: 'Oats' }, { id: 'f2', name: 'Eggs' }],
      dailyLogs: {},
      weightLog: [],
    }
    const result = importAllData(backup, 'current-profile')
    expect(result.foods).toBe(2)
    expect(getFoodLibrary()).toHaveLength(2)
  })

  it('skips duplicate food items (same id) and does not count them', () => {
    saveFoodItem({ id: 'f1', name: 'Oats' })
    const backup = {
      version: 1,
      profileId: 'exported-profile',
      foodLibrary: [{ id: 'f1', name: 'Oats Modified' }, { id: 'f2', name: 'Eggs' }],
      dailyLogs: {},
      weightLog: [],
    }
    const result = importAllData(backup, 'current-profile')
    expect(result.foods).toBe(1) // only f2 is new
    expect(getFoodLibrary().find(i => i.id === 'f1').name).toBe('Oats') // not overwritten
  })

  it('remaps daily log keys from exported profile to current profile', () => {
    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [],
      dailyLogs: { 'old-profile_2026-03-15': { calories: 500, protein: 30 } },
      weightLog: [],
    }
    importAllData(backup, 'new-profile')
    expect(getDailyLog('new-profile', '2026-03-15').calories).toBe(500)
  })

  it('skips log entries for dates already present on current profile', () => {
    updateDailyLog('new-profile', '2026-03-15', { calories: 100 })
    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [],
      dailyLogs: { 'old-profile_2026-03-15': { calories: 999 } },
      weightLog: [],
    }
    const result = importAllData(backup, 'new-profile')
    expect(result.days).toBe(0) // skipped
    expect(getDailyLog('new-profile', '2026-03-15').calories).toBe(100) // unchanged
  })

  it('remaps weight entry profileId to current profile', () => {
    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [],
      dailyLogs: {},
      weightLog: [{ id: 'w1', profileId: 'old-profile', date: '2026-03-15', weight: 180 }],
    }
    importAllData(backup, 'new-profile')
    expect(getWeightLog('new-profile')).toHaveLength(1)
    expect(getWeightLog('new-profile')[0].profileId).toBe('new-profile')
  })

  it('skips duplicate weight entries by id', () => {
    saveWeightEntry({ id: 'w1', profileId: 'new-profile', date: '2026-03-15', weight: 180 })
    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [],
      dailyLogs: {},
      weightLog: [{ id: 'w1', profileId: 'old-profile', date: '2026-03-15', weight: 200 }],
    }
    const result = importAllData(backup, 'new-profile')
    expect(result.weights).toBe(0)
    expect(getWeightLog('new-profile')[0].weight).toBe(180) // unchanged
  })

  it('returns correct counts for a mixed batch (some new, some duplicate)', () => {
    saveFoodItem({ id: 'f1', name: 'Oats' })
    updateDailyLog('new-profile', '2026-03-15', { calories: 100 })
    saveWeightEntry({ id: 'w1', profileId: 'new-profile', date: '2026-03-15', weight: 180 })

    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [
        { id: 'f1', name: 'Oats' },   // duplicate
        { id: 'f2', name: 'Eggs' },   // new
      ],
      dailyLogs: {
        'old-profile_2026-03-15': { calories: 999 }, // duplicate date
        'old-profile_2026-03-16': { calories: 400 }, // new date
      },
      weightLog: [
        { id: 'w1', profileId: 'old-profile', date: '2026-03-15', weight: 200 }, // duplicate
        { id: 'w2', profileId: 'old-profile', date: '2026-03-16', weight: 179 }, // new
      ],
    }

    const result = importAllData(backup, 'new-profile')
    expect(result).toEqual({ foods: 1, days: 1, weights: 1 })
  })

  it('returns zero counts when everything is already present', () => {
    saveFoodItem({ id: 'f1', name: 'Oats' })
    updateDailyLog('new-profile', '2026-03-15', { calories: 100 })
    saveWeightEntry({ id: 'w1', profileId: 'new-profile', date: '2026-03-15', weight: 180 })

    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [{ id: 'f1', name: 'Oats' }],
      dailyLogs: { 'old-profile_2026-03-15': { calories: 100 } },
      weightLog: [{ id: 'w1', profileId: 'old-profile', date: '2026-03-15', weight: 180 }],
    }

    const result = importAllData(backup, 'new-profile')
    expect(result).toEqual({ foods: 0, days: 0, weights: 0 })
  })

  it('returns { foods: 0, days: 0, weights: 0 } on a backup with missing sections', () => {
    const backup = { version: 1, profileId: 'old-profile' }
    const result = importAllData(backup, 'new-profile')
    expect(result).toEqual({ foods: 0, days: 0, weights: 0 })
  })

  it('correctly extracts the date when backup.profileId contains an underscore', () => {
    const backup = {
      version: 1,
      profileId: 'abc_123',
      foodLibrary: [],
      dailyLogs: { 'abc_123_2026-03-16': { calories: 300 } },
      weightLog: [],
    }
    importAllData(backup, 'new-profile')
    expect(getDailyLog('new-profile', '2026-03-16').calories).toBe(300)
  })
})
```

- [ ] **Step 2: Run tests to confirm they fail**

```bash
cd challo-fit-friend && npx vitest run src/storage/index.test.js
```

Expected: Multiple failures — `exportAllData is not a function`, `importAllData is not a function`

- [ ] **Step 3: Implement `exportAllData` and `importAllData`**

Append to the bottom of `challo-fit-friend/src/storage/index.js`:

```js
// --- Export / Import ---
export const exportAllData = () => {
  const profileId = getActiveProfileId()
  const allLogs = read(KEYS.DAILY_LOGS, {})
  const prefix = `${profileId}_`
  const dailyLogs = Object.fromEntries(
    Object.entries(allLogs).filter(([key]) => key.startsWith(prefix))
  )
  const weightLog = read(KEYS.WEIGHT_LOG, []).filter(e => e.profileId === profileId)
  return {
    version: 1,
    exportedAt: new Date().toISOString(),
    profileId,
    foodLibrary: getFoodLibrary(),
    dailyLogs,
    weightLog,
  }
}

export const importAllData = (backup, currentProfileId) => {
  let foods = 0, days = 0, weights = 0

  // Food library — check existence by id before saving; do NOT rely on saveFoodItem's
  // built-in upsert which would silently overwrite existing items
  const existingFoodIds = new Set(getFoodLibrary().map(i => i.id))
  for (const item of (backup.foodLibrary ?? [])) {
    if (!existingFoodIds.has(item.id)) {
      saveFoodItem(item)
      foods++
    }
  }

  // Daily logs — use slice (not split) because profileIds may contain underscores
  const allLogs = read(KEYS.DAILY_LOGS, {})
  for (const [key, entry] of Object.entries(backup.dailyLogs ?? {})) {
    const date = key.slice((backup.profileId ?? '').length + 1)
    const remappedKey = `${currentProfileId}_${date}`
    if (!allLogs[remappedKey]) {
      allLogs[remappedKey] = entry
      days++
    }
  }
  write(KEYS.DAILY_LOGS, allLogs)

  // Weight log — remap profileId, skip duplicates by id
  const existingWeightIds = new Set(read(KEYS.WEIGHT_LOG, []).map(e => e.id))
  for (const entry of (backup.weightLog ?? [])) {
    if (!existingWeightIds.has(entry.id)) {
      saveWeightEntry({ ...entry, profileId: currentProfileId })
      weights++
    }
  }

  return { foods, days, weights }
}
```

- [ ] **Step 4: Run tests to confirm they pass**

```bash
cd challo-fit-friend && npx vitest run src/storage/index.test.js
```

Expected: All tests pass (existing + new)

- [ ] **Step 5: Commit**

```bash
cd challo-fit-friend && git add src/storage/index.js src/storage/index.test.js
git commit -m "feat: add exportAllData and importAllData to storage"
```

---

## Chunk 2: Settings UI

### Task 2: Data card in `src/screens/SettingsScreen.jsx`

**Files:**
- Modify: `challo-fit-friend/src/screens/SettingsScreen.jsx`

**Context:**
- Import `exportAllData`, `importAllData`, `getActiveProfileId` from `../storage`
- Add a `useRef` for the hidden file input (`fileInputRef`)
- Add a `toast` state (string | null) — same pattern as FoodScreen: `setToast(msg); setTimeout(() => setToast(null), 2500)`
- The Data card goes **between the Scanner card and the Save button** (after line 147, before line 156 in the current file)
- Export triggers a programmatic `<a download>` click — create an anchor, set `href` to a `URL.createObjectURL(blob)`, click it, revoke the URL
- Import: file input `accept=".json"`, hidden with `display: 'none'`; clicking "Import from backup" button calls `fileInputRef.current.click()`
- Validate: parse JSON, check for `version` field — any failure shows toast `"Invalid backup file"` and returns
- Show success toast: `"Imported X foods, Y log days, Z weight entries"` or `"Nothing new to import — all data already up to date"` when all counts are zero

---

- [ ] **Step 1: Write failing test**

Create `challo-fit-friend/src/screens/SettingsScreen.test.jsx`:

```jsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach } from 'vitest'
import SettingsScreen from './SettingsScreen'

// Minimal profile that satisfies SettingsScreen's useState initializations
const profile = {
  id: 'p1',
  name: 'Test',
  currentWeight: 180,
  goalWeight: 150,
  targetDate: '2026-12-01',
  weightUnit: 'lbs',
  waterUnit: 'oz',
  waterReminders: true,
  workoutLabels: [],
  targets: { calories: 2000, protein: 150, fat: 60, carbs: 200, waterOz: 64, steps: 8000 },
  calorieGuardrails: { underPercent: 80, overPercent: 120 },
}

// Mock storage module
vi.mock('../storage', () => ({
  exportAllData: vi.fn(() => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    profileId: 'p1',
    foodLibrary: [],
    dailyLogs: {},
    weightLog: [],
  })),
  importAllData: vi.fn(() => ({ foods: 2, days: 1, weights: 0 })),
  getActiveProfileId: vi.fn(() => 'p1'),
}))

// Mock URL.createObjectURL / revokeObjectURL
global.URL.createObjectURL = vi.fn(() => 'blob:mock')
global.URL.revokeObjectURL = vi.fn()

describe('SettingsScreen — Data card', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders Export and Import buttons', () => {
    render(<SettingsScreen profile={profile} onUpdate={() => {}} onBack={() => {}} />)
    expect(screen.getByRole('button', { name: /export my data/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import from backup/i })).toBeInTheDocument()
  })

  it('shows success toast after valid import', async () => {
    render(<SettingsScreen profile={profile} onUpdate={() => {}} onBack={() => {}} />)

    const backup = JSON.stringify({ version: 1, profileId: 'p1', foodLibrary: [], dailyLogs: {}, weightLog: [] })
    const file = new File([backup], 'challo-backup.json', { type: 'application/json' })
    const input = document.querySelector('input[type="file"]')

    // Simulate FileReader reading the file
    const originalFileReader = global.FileReader
    global.FileReader = class {
      readAsText() { setTimeout(() => { this.onload({ target: { result: backup } }) }, 0) }
    }

    fireEvent.change(input, { target: { files: [file] } })

    await waitFor(() => {
      expect(screen.getByText(/imported 2 foods/i)).toBeInTheDocument()
    })

    global.FileReader = originalFileReader
  })

  it('shows error toast for invalid JSON', async () => {
    render(<SettingsScreen profile={profile} onUpdate={() => {}} onBack={() => {}} />)

    const input = document.querySelector('input[type="file"]')
    const originalFileReader = global.FileReader
    global.FileReader = class {
      readAsText() { setTimeout(() => { this.onload({ target: { result: 'not json' } }) }, 0) }
    }

    fireEvent.change(input, { target: { files: [new File(['not json'], 'bad.json')] } })

    await waitFor(() => {
      expect(screen.getByText(/invalid backup file/i)).toBeInTheDocument()
    })

    global.FileReader = originalFileReader
  })

  it('shows "nothing new" toast when all counts are zero', async () => {
    const { importAllData } = await import('../storage')
    importAllData.mockReturnValueOnce({ foods: 0, days: 0, weights: 0 })

    render(<SettingsScreen profile={profile} onUpdate={() => {}} onBack={() => {}} />)

    const backup = JSON.stringify({ version: 1, profileId: 'p1', foodLibrary: [], dailyLogs: {}, weightLog: [] })
    const input = document.querySelector('input[type="file"]')
    const originalFileReader = global.FileReader
    global.FileReader = class {
      readAsText() { setTimeout(() => { this.onload({ target: { result: backup } }) }, 0) }
    }

    fireEvent.change(input, { target: { files: [new File([backup], 'challo-backup.json')] } })

    await waitFor(() => {
      expect(screen.getByText(/nothing new to import/i)).toBeInTheDocument()
    })

    global.FileReader = originalFileReader
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd challo-fit-friend && npx vitest run src/screens/SettingsScreen.test.jsx
```

Expected: FAIL — buttons not found

- [ ] **Step 3: Add imports and state to SettingsScreen**

At the top of `challo-fit-friend/src/screens/SettingsScreen.jsx`, update the imports:

```jsx
import { useState, useEffect, useRef } from 'react'
import { exportAllData, importAllData, getActiveProfileId } from '../storage'
```

Inside the component, after `const [storageMB, setStorageMB] = useState('0')`, add:

```jsx
const [toast, setToast] = useState(null)
const fileInputRef = useRef()

const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }
```

- [ ] **Step 4: Add the export handler**

After the `showToast` definition, add:

```jsx
const handleExport = () => {
  const data = exportAllData()
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'challo-backup.json'
  a.click()
  URL.revokeObjectURL(url)
}
```

- [ ] **Step 5: Add the import handler**

After `handleExport`, add:

```jsx
const handleImport = (e) => {
  const file = e.target.files[0]
  if (!file) return
  // Reset input so the same file can be re-imported if needed
  e.target.value = ''
  const reader = new FileReader()
  reader.onload = (ev) => {
    let backup
    try {
      backup = JSON.parse(ev.target.result)
    } catch {
      showToast('Invalid backup file')
      return
    }
    if (!backup.version) {
      showToast('Invalid backup file')
      return
    }
    const currentProfileId = getActiveProfileId()
    const { foods, days, weights } = importAllData(backup, currentProfileId)
    if (foods === 0 && days === 0 && weights === 0) {
      showToast('Nothing new to import — all data already up to date')
    } else {
      showToast(`Imported ${foods} foods, ${days} log days, ${weights} weight entries`)
    }
  }
  reader.readAsText(file)
}
```

- [ ] **Step 6: Add the Data card and toast to the JSX**

In the JSX, add the toast display right after `<h1>The Recipe ⚙️</h1>` (or near the top of the scrollable area):

```jsx
{toast && <div className="nudge">{toast}</div>}
```

Add the Data card between the Scanner card's closing `</div>` and the storage warning block. In the current file this is after line 147 (`</div>` of the Scanner card) and before line 150 (storage warning):

```jsx
{/* Data */}
<div className="card">
  <h2>Data</h2>
  <input
    ref={fileInputRef}
    type="file"
    accept=".json"
    style={{ display: 'none' }}
    onChange={handleImport}
  />
  <button className="btn btn-primary" onClick={handleExport} style={{ marginBottom: 8 }}>
    Export my data
  </button>
  <button className="btn btn-secondary" onClick={() => fileInputRef.current.click()}>
    Import from backup
  </button>
</div>
```

- [ ] **Step 7: Run tests to confirm they pass**

```bash
cd challo-fit-friend && npx vitest run src/screens/SettingsScreen.test.jsx
```

Expected: All 4 tests pass

- [ ] **Step 8: Run the full test suite to confirm no regressions**

```bash
cd challo-fit-friend && npx vitest run
```

Expected: All tests pass

- [ ] **Step 9: Commit**

```bash
cd challo-fit-friend && git add src/screens/SettingsScreen.jsx src/screens/SettingsScreen.test.jsx
git commit -m "feat: add Data card to SettingsScreen with export and import"
```
