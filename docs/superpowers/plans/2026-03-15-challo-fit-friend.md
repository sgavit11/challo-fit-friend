# Challo Fit Friend Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first React PWA fitness tracker with profile switcher, food scanner (Claude AI), macro/water/workout/steps tracking, and progress dashboard.

**Architecture:** React + Vite SPA, all data in localStorage via a single `storage/index.js` module (future Supabase swap point), Claude vision API proxied through a Netlify serverless function. No router — tab state managed in App.jsx.

**Tech Stack:** React 18, Vite, Vitest, Recharts, canvas-confetti, Netlify Functions, CSS custom properties.

---

## File Map

```
challo-fit-friend/
├── public/
│   ├── manifest.json
│   └── icon-192.png (placeholder)
├── netlify/
│   └── functions/
│       └── claude-vision.js
├── src/
│   ├── main.jsx
│   ├── App.jsx
│   ├── storage/
│   │   └── index.js
│   ├── lib/
│   │   ├── calculations.js
│   │   └── nudges.js
│   ├── hooks/
│   │   ├── useProfile.js
│   │   ├── useDailyLog.js
│   │   ├── useFoodLibrary.js
│   │   └── useWeightLog.js
│   ├── components/
│   │   ├── BottomNav.jsx
│   │   ├── ProgressBar.jsx
│   │   ├── Confetti.jsx
│   │   └── MacroCard.jsx
│   ├── onboarding/
│   │   ├── OnboardingFlow.jsx
│   │   ├── StepName.jsx
│   │   ├── StepStats.jsx
│   │   ├── StepGoal.jsx
│   │   ├── StepTraining.jsx
│   │   └── StepTargets.jsx
│   ├── screens/
│   │   ├── HomeScreen.jsx
│   │   ├── FoodScreen.jsx
│   │   ├── WaterScreen.jsx
│   │   ├── ProgressScreen.jsx
│   │   ├── WorkoutScreen.jsx
│   │   └── SettingsScreen.jsx
│   └── styles/
│       └── global.css
├── index.html
├── vite.config.js
├── netlify.toml
└── package.json
```

---

## Chunk 1: Project Setup + Storage + Lib + Hooks

### Task 1: Scaffold project

**Files:**
- Create: `package.json`, `vite.config.js`, `netlify.toml`, `index.html`, `src/main.jsx`

- [ ] **Step 1: Create project directory and scaffold with Vite**

```bash
cd /Users/Shreyas/Documents/claude-projects
npm create vite@latest challo-fit-friend -- --template react
cd challo-fit-friend
npm install
```

Expected: `node_modules/` created, dev server runs.

- [ ] **Step 2: Install dependencies**

```bash
npm install recharts canvas-confetti
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 3: Replace `vite.config.js`**

```js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/test-setup.js',
  },
})
```

- [ ] **Step 4: Create `src/test-setup.js`**

```js
import '@testing-library/jest-dom'
```

- [ ] **Step 5: Create `netlify.toml`**

```toml
[build]
  command = "npm run build"
  publish = "dist"

[functions]
  directory = "netlify/functions"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

- [ ] **Step 6: Update `package.json` scripts**

Add to the `scripts` section:
```json
"test": "vitest",
"test:ui": "vitest --ui"
```

- [ ] **Step 7: Create `public/manifest.json`**

```json
{
  "name": "Challo Fit Friend",
  "short_name": "Challo",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#0F0F0F",
  "theme_color": "#F5A623",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" }
  ]
}
```

- [ ] **Step 8: Update `index.html` to link manifest and set theme**

Replace the contents of `index.html`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0" />
    <meta name="theme-color" content="#F5A623" />
    <link rel="manifest" href="/manifest.json" />
    <title>Challo Fit Friend</title>
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
```

- [ ] **Step 9: Verify dev server starts**

```bash
npm run dev
```

Expected: `http://localhost:5173` opens in browser showing default Vite React page.

- [ ] **Step 10: Commit**

```bash
git add .
git commit -m "feat: scaffold Vite React project with Netlify config and PWA manifest"
```

---

### Task 2: Storage layer

**Files:**
- Create: `src/storage/index.js`
- Create: `src/storage/index.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/storage/index.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import {
  getProfiles, saveProfile, getActiveProfileId, setActiveProfileId,
  getFoodLibrary, saveFoodItem,
  getDailyLog, updateDailyLog,
  getWeightLog, saveWeightEntry,
} from './index'

beforeEach(() => localStorage.clear())

describe('profiles', () => {
  it('returns empty array when no profiles', () => {
    expect(getProfiles()).toEqual([])
  })
  it('saves and retrieves a profile', () => {
    const p = { id: '1', name: 'Shreyas' }
    saveProfile(p)
    expect(getProfiles()).toEqual([p])
  })
  it('updates existing profile by id', () => {
    saveProfile({ id: '1', name: 'Old' })
    saveProfile({ id: '1', name: 'New' })
    expect(getProfiles()).toHaveLength(1)
    expect(getProfiles()[0].name).toBe('New')
  })
})

describe('activeProfileId', () => {
  it('returns null when not set', () => expect(getActiveProfileId()).toBeNull())
  it('sets and gets id', () => {
    setActiveProfileId('abc')
    expect(getActiveProfileId()).toBe('abc')
  })
})

describe('foodLibrary', () => {
  it('returns empty array initially', () => expect(getFoodLibrary()).toEqual([]))
  it('saves and retrieves items', () => {
    const item = { id: '1', name: 'Oats' }
    saveFoodItem(item)
    expect(getFoodLibrary()).toEqual([item])
  })
})

describe('dailyLog', () => {
  it('returns zeroed log when no entry', () => {
    const log = getDailyLog('p1', '2026-03-15')
    expect(log.calories).toBe(0)
    expect(log.workoutLogged).toBe(false)
  })
  it('saves and retrieves log', () => {
    updateDailyLog('p1', '2026-03-15', { calories: 500 })
    expect(getDailyLog('p1', '2026-03-15').calories).toBe(500)
  })
  it('merges updates into existing log', () => {
    updateDailyLog('p1', '2026-03-15', { calories: 500 })
    updateDailyLog('p1', '2026-03-15', { protein: 30 })
    const log = getDailyLog('p1', '2026-03-15')
    expect(log.calories).toBe(500)
    expect(log.protein).toBe(30)
  })
})

describe('weightLog', () => {
  it('returns empty array initially', () => expect(getWeightLog('p1')).toEqual([]))
  it('saves and retrieves entries for profile', () => {
    saveWeightEntry({ id: '1', profileId: 'p1', weight: 180, date: '2026-03-15' })
    expect(getWeightLog('p1')).toHaveLength(1)
  })
  it('does not return entries for other profiles', () => {
    saveWeightEntry({ id: '1', profileId: 'p1', weight: 180, date: '2026-03-15' })
    expect(getWeightLog('p2')).toHaveLength(0)
  })
})
```

- [ ] **Step 2: Run tests — expect all to fail**

```bash
npm test
```

Expected: `Cannot find module './index'` or similar failures.

- [ ] **Step 3: Implement `src/storage/index.js`**

```js
const KEYS = {
  PROFILES: 'cff_profiles',
  ACTIVE_PROFILE: 'cff_active_profile',
  FOOD_LIBRARY: 'cff_food_library',
  DAILY_LOGS: 'cff_daily_logs',
  WEIGHT_LOG: 'cff_weight_log',
}

const read = (key, fallback) => {
  try {
    const val = localStorage.getItem(key)
    return val ? JSON.parse(val) : fallback
  } catch { return fallback }
}

const write = (key, val) => localStorage.setItem(key, JSON.stringify(val))

// --- Profiles ---
export const getProfiles = () => read(KEYS.PROFILES, [])

export const saveProfile = (profile) => {
  const profiles = getProfiles()
  const idx = profiles.findIndex(p => p.id === profile.id)
  if (idx >= 0) profiles[idx] = profile
  else profiles.push(profile)
  write(KEYS.PROFILES, profiles)
}

export const deleteProfile = (id) => {
  const profiles = getProfiles().filter(p => p.id !== id)
  write(KEYS.PROFILES, profiles)
}

// --- Active profile ---
export const getActiveProfileId = () => localStorage.getItem(KEYS.ACTIVE_PROFILE)
export const setActiveProfileId = (id) => localStorage.setItem(KEYS.ACTIVE_PROFILE, id)

// --- Food library ---
export const getFoodLibrary = () => read(KEYS.FOOD_LIBRARY, [])

export const saveFoodItem = (item) => {
  const library = getFoodLibrary()
  const idx = library.findIndex(i => i.id === item.id)
  if (idx >= 0) library[idx] = item
  else library.push(item)
  write(KEYS.FOOD_LIBRARY, library)
}

export const deleteFoodItem = (id) => {
  write(KEYS.FOOD_LIBRARY, getFoodLibrary().filter(i => i.id !== id))
}

// --- Daily logs ---
const EMPTY_LOG = () => ({
  calories: 0, protein: 0, fat: 0, carbs: 0,
  waterOz: 0, steps: 0,
  workoutLogged: false, workoutLabel: null,
  meals: [],
})

export const getDailyLog = (profileId, date) => {
  const logs = read(KEYS.DAILY_LOGS, {})
  return logs[`${profileId}_${date}`] ?? EMPTY_LOG()
}

export const updateDailyLog = (profileId, date, updates) => {
  const logs = read(KEYS.DAILY_LOGS, {})
  const key = `${profileId}_${date}`
  logs[key] = { ...(logs[key] ?? EMPTY_LOG()), ...updates }
  write(KEYS.DAILY_LOGS, logs)
}

// --- Weight log ---
export const getWeightLog = (profileId) =>
  read(KEYS.WEIGHT_LOG, []).filter(e => e.profileId === profileId)

export const saveWeightEntry = (entry) => {
  const log = read(KEYS.WEIGHT_LOG, [])
  const idx = log.findIndex(e => e.id === entry.id)
  if (idx >= 0) log[idx] = entry
  else log.push(entry)
  write(KEYS.WEIGHT_LOG, log)
}
```

- [ ] **Step 4: Run tests — expect all to pass**

```bash
npm test
```

Expected: All tests green.

- [ ] **Step 5: Commit**

```bash
git add src/storage/
git commit -m "feat: add localStorage storage layer with full test coverage"
```

---

### Task 3: Calculations library

**Files:**
- Create: `src/lib/calculations.js`
- Create: `src/lib/calculations.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/lib/calculations.test.js`:

```js
import { describe, it, expect } from 'vitest'
import {
  calcCalorieTarget, calcProteinTarget, calcWaterTarget,
  calcMacrosForQuantity, calcWeeklyAverage, calcTrendLine,
  calcWeeksToGoal, todayKey, greetingIndex,
} from './calculations'

describe('calcCalorieTarget', () => {
  it('returns reasonable range for male 180lb 70in 25yo moderate activity', () => {
    const cals = calcCalorieTarget({ weight: 180, height: 70, age: 25, sex: 'm', activityLevel: 'moderate' })
    expect(cals).toBeGreaterThan(2000)
    expect(cals).toBeLessThan(3500)
  })
})

describe('calcProteinTarget', () => {
  it('returns 0.8g per lb of bodyweight', () => {
    expect(calcProteinTarget(180)).toBe(144)
  })
})

describe('calcWaterTarget', () => {
  it('returns 96oz as default', () => {
    expect(calcWaterTarget()).toBe(96)
  })
})

describe('calcMacrosForQuantity', () => {
  it('scales macros by quantity multiplier', () => {
    const item = { perServing: { calories: 100, protein: 10, fat: 5, carbs: 15 } }
    const result = calcMacrosForQuantity(item, 2.5)
    expect(result.calories).toBe(250)
    expect(result.protein).toBe(25)
    expect(result.fat).toBe(12.5)
    expect(result.carbs).toBe(37.5)
  })
})

describe('calcWeeksToGoal', () => {
  it('returns Infinity when no weight loss recorded', () => {
    expect(calcWeeksToGoal(180, 160, 0)).toBe(Infinity)
  })
  it('calculates weeks based on weekly loss rate', () => {
    expect(calcWeeksToGoal(175, 160, 1)).toBe(15)
  })
})

describe('todayKey', () => {
  it('returns YYYY-MM-DD string', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('greetingIndex', () => {
  it('returns a number 0-5', () => {
    const idx = greetingIndex()
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThanOrEqual(5)
  })
})
```

- [ ] **Step 2: Run — expect failures**

```bash
npm test
```

- [ ] **Step 3: Implement `src/lib/calculations.js`**

```js
// Harris-Benedict BMR → TDEE
export const calcCalorieTarget = ({ weight, height, age = 25, sex = 'm', activityLevel = 'moderate' }) => {
  // weight in lbs, height in inches
  const weightKg = weight * 0.453592
  const heightCm = height * 2.54
  const bmr = sex === 'm'
    ? 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age)
    : 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age)
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
  return Math.round(bmr * (multipliers[activityLevel] ?? 1.55))
}

// 0.8g protein per lb bodyweight
export const calcProteinTarget = (weightLbs) => Math.round(weightLbs * 0.8)

// Default water target
export const calcWaterTarget = () => 96

// Scale food item macros by serving quantity multiplier
export const calcMacrosForQuantity = (item, quantity) => ({
  calories: item.perServing.calories * quantity,
  protein: item.perServing.protein * quantity,
  fat: item.perServing.fat * quantity,
  carbs: item.perServing.carbs * quantity,
})

// Weekly average from array of daily log values
export const calcWeeklyAverage = (logs, key) => {
  if (!logs.length) return 0
  return Math.round(logs.reduce((sum, l) => sum + (l[key] ?? 0), 0) / logs.length)
}

// Simple linear regression for weight trend
export const calcTrendLine = (entries) => {
  if (entries.length < 2) return entries.map(e => ({ date: e.date, trend: e.weight }))
  const n = entries.length
  const xs = entries.map((_, i) => i)
  const ys = entries.map(e => e.weight)
  const xMean = xs.reduce((a, b) => a + b, 0) / n
  const yMean = ys.reduce((a, b) => a + b, 0) / n
  const slope = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0) /
    xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0)
  const intercept = yMean - slope * xMean
  return entries.map((e, i) => ({ date: e.date, trend: +(intercept + slope * i).toFixed(1) }))
}

// Estimated weeks to goal given current weekly loss rate
export const calcWeeksToGoal = (currentWeight, goalWeight, weeklyLossRate) => {
  if (weeklyLossRate <= 0) return Infinity
  return Math.ceil((currentWeight - goalWeight) / weeklyLossRate)
}

// Today as YYYY-MM-DD
export const todayKey = () => new Date().toISOString().split('T')[0]

// Returns 0-5 index based on day of year for greeting rotation
export const greetingIndex = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return dayOfYear % 6
}
```

- [ ] **Step 4: Run — expect all pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/calculations.js src/lib/calculations.test.js
git commit -m "feat: add calculations library (BMR, macros, trend line) with tests"
```

---

### Task 4: Nudges library

**Files:**
- Create: `src/lib/nudges.js`
- Create: `src/lib/nudges.test.js`

- [ ] **Step 1: Write failing tests**

Create `src/lib/nudges.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { getMacroNudge, getWaterNudge, getStepsNudge, getWorkoutNudge } from './nudges'

const profile = {
  name: 'Shreyas',
  targets: { calories: 2000, protein: 150, waterOz: 96, steps: 10000 },
  calorieGuardrails: { underPercent: 60, overPercent: 110 },
}

describe('getMacroNudge', () => {
  it('returns under-calories nudge when below guardrail', () => {
    const msg = getMacroNudge({ calories: 900, protein: 50 }, profile)
    expect(msg).toContain('running on empty')
  })
  it('returns over-calories nudge when above guardrail', () => {
    const msg = getMacroNudge({ calories: 2300, protein: 50 }, profile)
    expect(msg).toContain('omakase')
  })
  it('returns protein nudge when protein goal hit', () => {
    const msg = getMacroNudge({ calories: 1800, protein: 150 }, profile)
    expect(msg).toContain("Chef's kiss")
  })
  it('returns clean plate when all targets hit', () => {
    const msg = getMacroNudge({ calories: 2000, protein: 150 }, profile)
    expect(msg).toContain('Clean plate')
  })
  it('returns null when no threshold crossed', () => {
    const msg = getMacroNudge({ calories: 1500, protein: 100 }, profile)
    expect(msg).toBeNull()
  })
})

describe('getWaterNudge', () => {
  it('returns 50% nudge at halfway', () => {
    expect(getWaterNudge(48, profile)).toContain('Halfway there')
  })
  it('returns 100% nudge when full', () => {
    expect(getWaterNudge(96, profile)).toContain('cucumber')
  })
  it('returns null below 50%', () => {
    expect(getWaterNudge(30, profile)).toBeNull()
  })
})

describe('getStepsNudge', () => {
  it('returns under 5k message', () => {
    expect(getStepsNudge(3000, profile)).toContain('kitchen')
  })
  it('returns 5k-9k message', () => {
    expect(getStepsNudge(7000, profile)).toContain('Almost')
  })
  it('returns target hit message with dynamic target', () => {
    const msg = getStepsNudge(10000, profile)
    expect(msg).toContain('10000')
    expect(msg).toContain('dumpling')
  })
})

describe('getWorkoutNudge', () => {
  it('returns logged message when workout done', () => {
    expect(getWorkoutNudge(true, false, 'Shreyas')).toContain('showed up')
  })
  it('returns missed message on missed training day', () => {
    expect(getWorkoutNudge(false, true, 'Shreyas')).toContain('missed you')
  })
  it('returns rest day message on non-training day', () => {
    expect(getWorkoutNudge(false, false, 'Shreyas')).toContain('Sundays off')
  })
})
```

- [ ] **Step 2: Run — expect failures**

```bash
npm test
```

- [ ] **Step 3: Implement `src/lib/nudges.js`**

```js
export const getMacroNudge = (log, profile) => {
  const { calories, protein } = log
  const { targets, calorieGuardrails, name } = profile
  const underThreshold = targets.calories * (calorieGuardrails.underPercent / 100)
  const overThreshold = targets.calories * (calorieGuardrails.overPercent / 100)

  if (calories >= targets.calories && protein >= targets.protein) {
    return `Clean plate. Perfect day ✅🍽️`
  }
  if (protein >= targets.protein) {
    return `Main course done. Chef's kiss 🤌`
  }
  if (calories > overThreshold) {
    return `Easy there — even omakase has a last course 😅`
  }
  if (calories < underThreshold && calories > 0) {
    return `You're running on empty — time to refuel ${name} 🫓`
  }
  return null
}

export const getWaterNudge = (waterOz, profile) => {
  const target = profile.targets.waterOz
  if (waterOz >= target) return `Fully hydrated. You're basically a fresh cucumber 🥒`
  if (waterOz >= target * 0.5) return `Halfway there — keep the flow going 🌊`
  return null
}

export const getStepsNudge = (steps, profile) => {
  const target = profile.targets.steps
  const name = profile.name
  if (steps >= target) return `${target} steps DONE. You earned that extra dumpling 😂🥟`
  if (steps >= 5000) return `Almost at your target — a few more steps to go 🚶`
  if (steps > 0) return `You've barely left the kitchen — get moving ${name} 👟`
  return null
}

export const getWorkoutNudge = (workoutLogged, isMissedTrainingDay, name) => {
  if (workoutLogged) return `Session served. You showed up. 🔥`
  if (isMissedTrainingDay) return `The gym missed you today ${name} — come back strong tomorrow 💪`
  return `Rest day — even Michelin star chefs take Sundays off 👨‍🍳`
}
```

- [ ] **Step 4: Run — expect all pass**

```bash
npm test
```

- [ ] **Step 5: Commit**

```bash
git add src/lib/nudges.js src/lib/nudges.test.js
git commit -m "feat: add nudges library with full test coverage"
```

---

### Task 5: React hooks

**Files:**
- Create: `src/hooks/useProfile.js`
- Create: `src/hooks/useDailyLog.js`
- Create: `src/hooks/useFoodLibrary.js`
- Create: `src/hooks/useWeightLog.js`

- [ ] **Step 1: Create `src/hooks/useProfile.js`**

```js
import { useState, useCallback } from 'react'
import { getProfiles, saveProfile, deleteProfile, getActiveProfileId, setActiveProfileId } from '../storage'
import { todayKey } from '../lib/calculations'

export const useProfile = () => {
  const [profiles, setProfiles] = useState(() => getProfiles())
  const [activeId, setActiveId] = useState(() => getActiveProfileId())

  const activeProfile = profiles.find(p => p.id === activeId) ?? null

  const addOrUpdateProfile = useCallback((profile) => {
    saveProfile(profile)
    setProfiles(getProfiles())
  }, [])

  const removeProfile = useCallback((id) => {
    if (getProfiles().length <= 1) return
    deleteProfile(id)
    const remaining = getProfiles()
    setProfiles(remaining)
    if (id === activeId) {
      setActiveProfileId(remaining[0].id)
      setActiveId(remaining[0].id)
    }
  }, [activeId])

  const switchProfile = useCallback((id) => {
    setActiveProfileId(id)
    setActiveId(id)
  }, [])

  return { profiles, activeProfile, addOrUpdateProfile, removeProfile, switchProfile }
}
```

- [ ] **Step 2: Create `src/hooks/useDailyLog.js`**

```js
import { useState, useCallback } from 'react'
import { getDailyLog, updateDailyLog } from '../storage'
import { todayKey } from '../lib/calculations'

export const useDailyLog = (profileId) => {
  const today = todayKey()
  const [log, setLog] = useState(() => getDailyLog(profileId, today))

  const update = useCallback((updates) => {
    updateDailyLog(profileId, today, updates)
    setLog(getDailyLog(profileId, today))
  }, [profileId, today])

  const logMeal = useCallback((meal) => {
    const current = getDailyLog(profileId, today)
    const updatedMeals = [...current.meals, meal]
    const updates = {
      calories: current.calories + meal.macros.calories,
      protein: current.protein + meal.macros.protein,
      fat: current.fat + meal.macros.fat,
      carbs: current.carbs + meal.macros.carbs,
      meals: updatedMeals,
    }
    updateDailyLog(profileId, today, updates)
    setLog(getDailyLog(profileId, today))
  }, [profileId, today])

  return { log, update, logMeal }
}
```

- [ ] **Step 3: Create `src/hooks/useFoodLibrary.js`**

```js
import { useState, useCallback } from 'react'
import { getFoodLibrary, saveFoodItem, deleteFoodItem } from '../storage'

export const useFoodLibrary = () => {
  const [library, setLibrary] = useState(() => getFoodLibrary())

  const addItem = useCallback((item) => {
    saveFoodItem(item)
    setLibrary(getFoodLibrary())
  }, [])

  const removeItem = useCallback((id) => {
    deleteFoodItem(id)
    setLibrary(getFoodLibrary())
  }, [])

  return { library, addItem, removeItem }
}
```

- [ ] **Step 4: Create `src/hooks/useWeightLog.js`**

```js
import { useState, useCallback } from 'react'
import { getWeightLog, saveWeightEntry } from '../storage'

export const useWeightLog = (profileId) => {
  const [entries, setEntries] = useState(() => getWeightLog(profileId))

  const addEntry = useCallback((entry) => {
    saveWeightEntry(entry)
    setEntries(getWeightLog(profileId))
  }, [profileId])

  return { entries, addEntry }
}
```

- [ ] **Step 5: Commit**

```bash
git add src/hooks/
git commit -m "feat: add React hooks for profile, daily log, food library, weight log"
```

---

## Chunk 2: Global Styles + App Shell + Components

### Task 6: Global styles

**Files:**
- Create: `src/styles/global.css`

- [ ] **Step 1: Create `src/styles/global.css`**

```css
:root {
  --bg: #0F0F0F;
  --bg-card: #1A1A1A;
  --bg-input: #222222;
  --border: #333333;
  --saffron: #F5A623;
  --chili: #E8341C;
  --green: #4CAF6F;
  --text: #FFFFFF;
  --text-muted: #888888;
  --nav-height: 64px;
  --radius: 12px;
}

* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  background: var(--bg);
  color: var(--text);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  min-height: 100dvh;
  min-width: 375px;
  max-width: 430px;
  margin: 0 auto;
  -webkit-font-smoothing: antialiased;
}

#root {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.screen {
  flex: 1;
  overflow-y: auto;
  padding: 16px 16px calc(var(--nav-height) + 16px);
}

.card {
  background: var(--bg-card);
  border-radius: var(--radius);
  padding: 16px;
  margin-bottom: 12px;
}

.btn {
  display: block;
  width: 100%;
  padding: 14px;
  border: none;
  border-radius: var(--radius);
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn:active { opacity: 0.7; }
.btn-primary { background: var(--saffron); color: #000; }
.btn-secondary { background: var(--bg-input); color: var(--text); }
.btn-danger { background: var(--chili); color: #fff; }

input[type="text"],
input[type="number"],
input[type="date"] {
  width: 100%;
  background: var(--bg-input);
  border: 1px solid var(--border);
  border-radius: 8px;
  color: var(--text);
  font-size: 16px;
  padding: 12px;
  outline: none;
}
input:focus { border-color: var(--saffron); }

h1 { font-size: 24px; font-weight: 700; margin-bottom: 4px; }
h2 { font-size: 18px; font-weight: 600; margin-bottom: 8px; }
p { color: var(--text-muted); font-size: 14px; line-height: 1.5; }

.nudge {
  background: var(--bg-card);
  border-left: 3px solid var(--saffron);
  padding: 12px;
  border-radius: 0 var(--radius) var(--radius) 0;
  font-size: 14px;
  margin-bottom: 12px;
}

.label { font-size: 12px; color: var(--text-muted); margin-bottom: 4px; }
.value { font-size: 20px; font-weight: 700; }
.emoji { font-size: 24px; }
```

- [ ] **Step 2: Update `src/main.jsx`**

```jsx
import React from 'react'
import ReactDOM from 'react-dom/client'
import './styles/global.css'
import App from './App'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/ src/main.jsx
git commit -m "feat: add global dark theme CSS and update entry point"
```

---

### Task 7: Core components

**Files:**
- Create: `src/components/BottomNav.jsx`
- Create: `src/components/ProgressBar.jsx`
- Create: `src/components/Confetti.jsx`
- Create: `src/components/MacroCard.jsx`

- [ ] **Step 1: Create `src/components/BottomNav.jsx`**

```jsx
const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'workout', label: 'Workout', icon: '💪' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: '#111', borderTop: '1px solid #222',
      display: 'flex', height: 'var(--nav-height)',
      zIndex: 100,
    }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: activeTab === tab.id ? 'var(--saffron)' : 'var(--text-muted)',
            fontSize: 10, gap: 2,
          }}
        >
          <span style={{ fontSize: 22 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
```

- [ ] **Step 2: Create `src/components/ProgressBar.jsx`**

```jsx
export default function ProgressBar({ value, max, color = 'var(--saffron)', label, sublabel }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  const over = value > max

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: over ? 'var(--chili)' : 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sublabel}</span>
      </div>
      <div style={{
        background: '#333', borderRadius: 8, height: 12, overflow: 'hidden',
      }}>
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: over ? 'var(--chili)' : color,
          borderRadius: 8,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/components/Confetti.jsx`**

```jsx
import { useEffect } from 'react'
import confetti from 'canvas-confetti'

const FOOD_EMOJIS = ['🌮', '🍣', '🍝', '🥟', '🥤', '🍱', '🍗', '🥑']

export default function Confetti({ trigger }) {
  useEffect(() => {
    if (!trigger) return
    const duration = 2500
    const end = Date.now() + duration
    // Register food emoji shapes for canvas-confetti
    const shapes = FOOD_EMOJIS.map(emoji =>
      confetti.shapeFromText({ text: emoji, scalar: 2 })
    )
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        shapes,
        scalar: 2,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        shapes,
        scalar: 2,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [trigger])

  return null
}
```

- [ ] **Step 4: Create `src/components/MacroCard.jsx`**

```jsx
import ProgressBar from './ProgressBar'

const MACRO_META = {
  calories: { label: 'Energy on the plate 🔥', color: 'var(--saffron)', unit: 'kcal' },
  protein:  { label: 'The main course 🍗',    color: 'var(--green)',   unit: 'g' },
  carbs:    { label: 'Fuel for the dance floor 🍚', color: '#60A5FA', unit: 'g' },
  fat:      { label: 'The good stuff 🥑',     color: '#A78BFA',        unit: 'g' },
}

export default function MacroCard({ log, targets }) {
  return (
    <div className="card">
      {['calories', 'protein', 'carbs', 'fat'].map(key => {
        const meta = MACRO_META[key]
        const value = log[key] ?? 0
        const target = targets[key] ?? 0
        const remaining = Math.max(0, target - value)
        return (
          <ProgressBar
            key={key}
            value={value}
            max={target}
            color={meta.color}
            label={meta.label}
            sublabel={`${remaining}${meta.unit} left`}
          />
        )
      })}
    </div>
  )
}
```

- [ ] **Step 5: Commit**

```bash
git add src/components/
git commit -m "feat: add BottomNav, ProgressBar, Confetti, MacroCard components"
```

---

### Task 8: App shell

**Files:**
- Create: `src/App.jsx`

- [ ] **Step 1: Create `src/App.jsx`**

```jsx
import { useState } from 'react'
import { useProfile } from './hooks/useProfile'
import BottomNav from './components/BottomNav'
import OnboardingFlow from './onboarding/OnboardingFlow'
import ProfileSwitcher from './onboarding/ProfileSwitcher'
import HomeScreen from './screens/HomeScreen'
import FoodScreen from './screens/FoodScreen'
import WaterScreen from './screens/WaterScreen'
import ProgressScreen from './screens/ProgressScreen'
import WorkoutScreen from './screens/WorkoutScreen'
import SettingsScreen from './screens/SettingsScreen'

export default function App() {
  const { profiles, activeProfile, addOrUpdateProfile, removeProfile, switchProfile } = useProfile()
  const [tab, setTab] = useState('home')
  const [showSettings, setShowSettings] = useState(false)

  // No profiles → run onboarding
  if (profiles.length === 0) {
    return (
      <OnboardingFlow
        onComplete={(profile) => {
          addOrUpdateProfile(profile)
          switchProfile(profile.id)
        }}
      />
    )
  }

  // Has profiles but none active → show profile switcher
  if (!activeProfile) {
    return (
      <ProfileSwitcher
        profiles={profiles}
        onSelect={switchProfile}
        onAddComplete={(profile) => { addOrUpdateProfile(profile); switchProfile(profile.id) }}
      />
    )
  }

  if (showSettings) {
    return (
      <>
        <SettingsScreen
          profile={activeProfile}
          onUpdate={addOrUpdateProfile}
          onBack={() => setShowSettings(false)}
        />
      </>
    )
  }

  const screenProps = { profile: activeProfile, onOpenSettings: () => setShowSettings(true) }

  return (
    <>
      {tab === 'home'     && <HomeScreen    {...screenProps} />}
      {tab === 'food'     && <FoodScreen    {...screenProps} />}
      {tab === 'water'    && <WaterScreen   {...screenProps} />}
      {tab === 'progress' && <ProgressScreen {...screenProps} />}
      {tab === 'workout'  && <WorkoutScreen  {...screenProps} />}
      <BottomNav activeTab={tab} onTabChange={setTab} />
    </>
  )
}
```

- [ ] **Step 2: Create placeholder files so all imports resolve**

Create each of these with a minimal placeholder — we'll fill them in later tasks. **Include `ProfileSwitcher` here** so `App.jsx` imports don't fail at compile time:

`src/screens/HomeScreen.jsx`:
```jsx
export default function HomeScreen({ profile }) {
  return <div className="screen"><h1>Home — {profile.name}</h1></div>
}
```

`src/screens/FoodScreen.jsx`:
```jsx
export default function FoodScreen({ profile }) {
  return <div className="screen"><h1>Food</h1></div>
}
```

`src/screens/WaterScreen.jsx`:
```jsx
export default function WaterScreen({ profile }) {
  return <div className="screen"><h1>Water</h1></div>
}
```

`src/screens/ProgressScreen.jsx`:
```jsx
export default function ProgressScreen({ profile }) {
  return <div className="screen"><h1>Progress</h1></div>
}
```

`src/screens/WorkoutScreen.jsx`:
```jsx
export default function WorkoutScreen({ profile }) {
  return <div className="screen"><h1>Workout</h1></div>
}
```

`src/screens/SettingsScreen.jsx`:
```jsx
export default function SettingsScreen({ profile, onBack }) {
  return <div className="screen"><button onClick={onBack}>← Back</button><h1>The Recipe</h1></div>
}
```

`src/onboarding/ProfileSwitcher.jsx` (placeholder — full version comes in Task 9):
```jsx
export default function ProfileSwitcher({ profiles, onSelect, onAddComplete }) {
  return (
    <div className="screen">
      <h1>Who's using the app?</h1>
      {profiles.map(p => (
        <button key={p.id} className="btn btn-secondary" onClick={() => onSelect(p.id)}>{p.name}</button>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Verify app compiles and runs**

```bash
npm run dev
```

Expected: App loads in browser. Since no profiles exist it will try to render OnboardingFlow — we'll build that next. At minimum there should be no compile errors.

- [ ] **Step 4: Commit**

```bash
git add src/App.jsx src/screens/
git commit -m "feat: add App shell with tab routing and placeholder screens"
```

---

## Chunk 3: Onboarding + Profile Switcher

### Task 9: Onboarding flow

**Files:**
- Create: `src/onboarding/OnboardingFlow.jsx`
- Create: `src/onboarding/StepName.jsx`
- Create: `src/onboarding/StepStats.jsx`
- Create: `src/onboarding/StepGoal.jsx`
- Create: `src/onboarding/StepTraining.jsx`
- Create: `src/onboarding/StepTargets.jsx`
- Create: `src/onboarding/ProfileSwitcher.jsx`

- [ ] **Step 1: Create `src/onboarding/StepName.jsx`**

```jsx
import { useState } from 'react'

export default function StepName({ onNext }) {
  const [name, setName] = useState('')
  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ marginBottom: 32 }}>
        <div className="emoji" style={{ marginBottom: 12 }}>🚀</div>
        <h1>Challo — let's set you up in 60 seconds</h1>
      </div>
      <div className="label">What's your name?</div>
      <input
        type="text"
        placeholder="e.g. Shreyas"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ marginBottom: 24 }}
        autoFocus
      />
      <button className="btn btn-primary" onClick={() => name.trim() && onNext(name.trim())} disabled={!name.trim()}>
        Next →
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Create `src/onboarding/StepStats.jsx`**

```jsx
import { useState } from 'react'

export default function StepStats({ onNext }) {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [weightUnit, setWeightUnit] = useState('lbs')
  const [heightUnit, setHeightUnit] = useState('in')

  const valid = weight && height && !isNaN(Number(weight)) && !isNaN(Number(height))

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Your current stats</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="label">Weight</div>
          <input type="number" placeholder="180" value={weight} onChange={e => setWeight(e.target.value)} />
        </div>
        <div>
          <div className="label">Unit</div>
          <select value={weightUnit} onChange={e => setWeightUnit(e.target.value)}
            style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 8px', fontSize: 16 }}>
            <option value="lbs">lbs</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <div style={{ flex: 1 }}>
          <div className="label">Height</div>
          <input type="number" placeholder="70" value={height} onChange={e => setHeight(e.target.value)} />
        </div>
        <div>
          <div className="label">Unit</div>
          <select value={heightUnit} onChange={e => setHeightUnit(e.target.value)}
            style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 8px', fontSize: 16 }}>
            <option value="in">in</option>
            <option value="cm">cm</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" disabled={!valid}
        onClick={() => onNext({ currentWeight: Number(weight), height: Number(height), weightUnit, heightUnit })}>
        Next →
      </button>
    </div>
  )
}
```

- [ ] **Step 3: Create `src/onboarding/StepGoal.jsx`**

```jsx
import { useState } from 'react'

export default function StepGoal({ weightUnit, onNext }) {
  const [goalWeight, setGoalWeight] = useState('')
  const [targetDate, setTargetDate] = useState('')
  const valid = goalWeight && targetDate && !isNaN(Number(goalWeight))

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Your goal</h2>
      <div style={{ marginBottom: 16 }}>
        <div className="label">Goal weight ({weightUnit})</div>
        <input type="number" placeholder="165" value={goalWeight} onChange={e => setGoalWeight(e.target.value)} />
      </div>
      <div style={{ marginBottom: 32 }}>
        <div className="label">Target date</div>
        <input type="date" value={targetDate} onChange={e => setTargetDate(e.target.value)} />
      </div>
      <button className="btn btn-primary" disabled={!valid}
        onClick={() => onNext({ goalWeight: Number(goalWeight), targetDate })}>
        Next →
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Create `src/onboarding/StepTraining.jsx`**

```jsx
import { useState } from 'react'

const DAYS = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday']
const DEFAULT_LABELS = ['Push','Pull','Legs','Cardio']

export default function StepTraining({ onNext }) {
  const [selectedDays, setSelectedDays] = useState([])
  const [labels, setLabels] = useState(DEFAULT_LABELS.join(', '))

  const toggleDay = (day) =>
    setSelectedDays(prev => prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day])

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Training days</h2>
      <p style={{ marginBottom: 16 }}>Which days do you train?</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
        {DAYS.map(day => (
          <button key={day} onClick={() => toggleDay(day)}
            style={{
              padding: '8px 14px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 14,
              background: selectedDays.includes(day) ? 'var(--saffron)' : 'var(--bg-input)',
              color: selectedDays.includes(day) ? '#000' : 'var(--text)',
              fontWeight: selectedDays.includes(day) ? 600 : 400,
            }}>
            {day.slice(0,3)}
          </button>
        ))}
      </div>
      <div className="label">Workout labels (comma-separated)</div>
      <input type="text" value={labels} onChange={e => setLabels(e.target.value)} style={{ marginBottom: 32 }} />
      <button className="btn btn-primary" disabled={selectedDays.length === 0}
        onClick={() => onNext({
          trainingDays: selectedDays,
          trainingDaysPerWeek: selectedDays.length,
          workoutLabels: labels.split(',').map(l => l.trim()).filter(Boolean),
        })}>
        Next →
      </button>
    </div>
  )
}
```

- [ ] **Step 5: Create `src/onboarding/StepTargets.jsx`**

```jsx
import { useState } from 'react'
import { calcCalorieTarget, calcProteinTarget, calcWaterTarget } from '../lib/calculations'

export default function StepTargets({ profile, onNext }) {
  const defaultCals = calcCalorieTarget({ weight: profile.currentWeight, height: profile.height })
  const defaultProtein = calcProteinTarget(profile.currentWeight)
  const [calories, setCalories] = useState(String(defaultCals))
  const [protein, setProtein] = useState(String(defaultProtein))
  const [fat, setFat] = useState('70')
  const [carbs, setCarbs] = useState('250')
  const [water, setWater] = useState('96')
  const [steps, setSteps] = useState('10000')

  const valid = [calories, protein, fat, carbs, water, steps].every(v => v && !isNaN(Number(v)))

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Daily targets</h2>
      <p style={{ marginBottom: 16 }}>We've set smart defaults — adjust if needed.</p>
      {[
        { label: 'Calories (kcal) 🔥', val: calories, set: setCalories },
        { label: 'Protein (g) 🍗', val: protein, set: setProtein },
        { label: 'Fat (g) 🥑', val: fat, set: setFat },
        { label: 'Carbs (g) 🍚', val: carbs, set: setCarbs },
        { label: 'Water (oz) 💧', val: water, set: setWater },
        { label: 'Steps 👟', val: steps, set: setSteps },
      ].map(({ label, val, set }) => (
        <div key={label} style={{ marginBottom: 16 }}>
          <div className="label">{label}</div>
          <input type="number" value={val} onChange={e => set(e.target.value)} />
        </div>
      ))}
      <div style={{ height: 16 }} />
      <button className="btn btn-primary" disabled={!valid}
        onClick={() => onNext({ calories: +calories, protein: +protein, fat: +fat, carbs: +carbs, waterOz: +water, steps: +steps })}>
        Let's go 🚀
      </button>
    </div>
  )
}
```

- [ ] **Step 6: Create `src/onboarding/OnboardingFlow.jsx`**

```jsx
import { useState } from 'react'
import StepName from './StepName'
import StepStats from './StepStats'
import StepGoal from './StepGoal'
import StepTraining from './StepTraining'
import StepTargets from './StepTargets'

const genId = () => Math.random().toString(36).slice(2)

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})

  const next = (updates) => {
    const merged = { ...data, ...updates }
    setData(merged)
    setStep(s => s + 1)
    if (step === 4) {
      const profile = {
        id: genId(),
        ...merged,
        targets: updates,
        calorieGuardrails: { underPercent: 60, overPercent: 110 },
        createdAt: new Date().toISOString().split('T')[0],
      }
      onComplete(profile)
    }
  }

  // Step 4 completion screen
  if (step === 5) {
    return (
      <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', minHeight: '100dvh' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🍽️🔥</div>
        <h1>You're all set {data.name}.</h1>
        <p style={{ marginTop: 8 }}>Your journey starts now.</p>
        <p style={{ marginTop: 4, color: 'var(--saffron)', fontWeight: 600 }}>Challo let's go 🍽️🔥</p>
      </div>
    )
  }

  const STEPS = [
    <StepName onNext={next} />,
    <StepStats onNext={next} />,
    <StepGoal weightUnit={data.weightUnit || 'lbs'} onNext={next} />,
    <StepTraining onNext={next} />,
    <StepTargets profile={data} onNext={next} />,
  ]

  return (
    <div>
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 4 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? 'var(--saffron)' : 'var(--border)',
          }} />
        ))}
      </div>
      {STEPS[step]}
    </div>
  )
}
```

Note: The first version of `OnboardingFlow` above has a logic bug in `next()` (step 4 calls `onComplete` but also increments to step 5) and incorrect profile merging. Step 8 below rewrites the entire file with the corrected version — do NOT ship Step 6's version as-is.

- [ ] **Step 7: Create `src/onboarding/ProfileSwitcher.jsx`**

```jsx
import { useState } from 'react'
import OnboardingFlow from './OnboardingFlow'

export default function ProfileSwitcher({ profiles, onSelect, onAddComplete }) {
  const [addingNew, setAddingNew] = useState(false)

  if (addingNew) {
    return (
      <OnboardingFlow
        onComplete={(profile) => {
          onAddComplete(profile)
          setAddingNew(false)
          onSelect(profile.id)
        }}
      />
    )
  }

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '100dvh' }}>
      <div style={{ textAlign: 'center', marginBottom: 32 }}>
        <div style={{ fontSize: 48, marginBottom: 8 }}>🍽️</div>
        <h1>Who's using the app?</h1>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24 }}>
        {profiles.map(p => (
          <button key={p.id} className="btn btn-secondary" onClick={() => onSelect(p.id)}
            style={{ fontSize: 18, padding: 20 }}>
            {p.name}
          </button>
        ))}
      </div>
      <button className="btn btn-primary" onClick={() => setAddingNew(true)}>
        + Add profile
      </button>
    </div>
  )
}
```

- [ ] **Step 8: Fix OnboardingFlow — clean up the step 4 completion logic**

The `next` function has a bug: step 4 calls `onComplete` but also increments to step 5. The targets step sends the `targets` object directly but the profile structure needs to merge correctly. Replace `OnboardingFlow.jsx` with this corrected version:

```jsx
import { useState } from 'react'
import StepName from './StepName'
import StepStats from './StepStats'
import StepGoal from './StepGoal'
import StepTraining from './StepTraining'
import StepTargets from './StepTargets'

const genId = () => Math.random().toString(36).slice(2)

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  const [data, setData] = useState({})
  const [done, setDone] = useState(false)
  const [finalName, setFinalName] = useState('')

  const advance = (updates) => {
    if (step < 4) {
      // For steps 0-3: merge into accumulated data
      setData(prev => ({ ...prev, ...updates }))
      setStep(s => s + 1)
    } else {
      // Last step: updates IS the targets object — build full profile from accumulated data
      const profile = {
        id: genId(),
        name: data.name,
        currentWeight: data.currentWeight,
        height: data.height,
        weightUnit: data.weightUnit,
        heightUnit: data.heightUnit,
        goalWeight: data.goalWeight,
        targetDate: data.targetDate,
        trainingDays: data.trainingDays,
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        workoutLabels: data.workoutLabels,
        targets: updates,
        calorieGuardrails: { underPercent: 60, overPercent: 110 },
        createdAt: new Date().toISOString().split('T')[0],
      }
      setFinalName(data.name)
      setDone(true)
      onComplete(profile)
    }
  }

  if (done) {
    return (
      <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', textAlign: 'center', minHeight: '100dvh' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>🍽️🔥</div>
        <h1>You're all set {finalName}.</h1>
        <p style={{ marginTop: 8 }}>Your journey starts now.</p>
        <p style={{ marginTop: 4, color: 'var(--saffron)', fontWeight: 600 }}>Challo let's go 🍽️🔥</p>
      </div>
    )
  }

  const STEPS = [
    <StepName onNext={advance} />,
    <StepStats onNext={advance} />,
    <StepGoal weightUnit={data.weightUnit || 'lbs'} onNext={advance} />,
    <StepTraining onNext={advance} />,
    <StepTargets profile={data} onNext={advance} />,
  ]

  return (
    <div>
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 4 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? 'var(--saffron)' : 'var(--border)',
          }} />
        ))}
      </div>
      {STEPS[step]}
    </div>
  )
}
```

- [ ] **Step 8b: Verify corrected OnboardingFlow compiles**

```bash
npm run dev
```

Expected: No compile errors. If you see "Cannot find module" — check that all imports in `OnboardingFlow.jsx` match existing file names exactly.

- [ ] **Step 9: Test onboarding flow end-to-end in browser**

```bash
npm run dev
```

Open `http://localhost:5173`. Expected flow:
1. "Challo — let's set you up in 60 seconds" with name input
2. Progress bar advances through each step
3. Completion screen appears
4. On next refresh: profile switcher appears with the name you entered
5. Tapping the name loads the Home placeholder screen

Open DevTools → Application → Local Storage → verify `cff_profiles` key contains your profile data.

- [ ] **Step 10: Commit**

```bash
git add src/onboarding/
git commit -m "feat: add onboarding flow and profile switcher with 5-step setup"
```

---

## Chunk 4: Home, Water, Workout Screens

### Task 10: Home screen

**Files:**
- Modify: `src/screens/HomeScreen.jsx`

- [ ] **Step 1: Replace `src/screens/HomeScreen.jsx`**

```jsx
import { useDailyLog } from '../hooks/useDailyLog'
import { todayKey, greetingIndex } from '../lib/calculations'
import MacroCard from '../components/MacroCard'
import ProgressBar from '../components/ProgressBar'

const GREETINGS = [
  (name) => `Challo ${name}, today's plate is waiting to be filled 🍽️`,
  () => `Rise and grind — the gains don't slow-cook themselves 🍲`,
  (name) => `Good morning ${name} — let's cook up a great day 🔥`,
  (name) => `New day, new menu ${name} — let's make it count 🌮`,
  () => `Your bento box of goals is empty — let's fill it 🍱`,
  (name) => `Ciao ${name} — today's session won't prep itself 🍝`,
]

export default function HomeScreen({ profile, onOpenSettings }) {
  const { log } = useDailyLog(profile.id)
  const greeting = GREETINGS[greetingIndex()](profile.name)
  const waterPct = Math.min(100, (log.waterOz / profile.targets.waterOz) * 100)
  const stepsPct = Math.min(100, (log.steps / profile.targets.steps) * 100)

  return (
    <div className="screen">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 20 }}>
        <div>
          <h1 style={{ fontSize: 20 }}>{greeting}</h1>
        </div>
        <button onClick={onOpenSettings}
          style={{ background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: 22, cursor: 'pointer' }}>
          ⚙️
        </button>
      </div>

      {/* Macros summary */}
      <div className="card" style={{ marginBottom: 12 }}>
        <div className="label" style={{ marginBottom: 8 }}>Today's macros</div>
        <MacroCard log={log} targets={profile.targets} />
      </div>

      {/* Water */}
      <div className="card">
        <div className="label">Water 💧</div>
        <ProgressBar
          value={log.waterOz}
          max={profile.targets.waterOz}
          color="#60A5FA"
          label={`${log.waterOz} / ${profile.targets.waterOz} oz`}
          sublabel={`${Math.round(waterPct)}%`}
        />
      </div>

      {/* Steps */}
      <div className="card">
        <div className="label">Steps 👟</div>
        <ProgressBar
          value={log.steps}
          max={profile.targets.steps}
          color="var(--green)"
          label={`${log.steps.toLocaleString()} / ${profile.targets.steps.toLocaleString()}`}
          sublabel={`${Math.round(stepsPct)}%`}
        />
      </div>

      {/* Workout */}
      <div className="card">
        <div className="label">Workout 💪</div>
        <div style={{ fontSize: 16, fontWeight: 600 }}>
          {log.workoutLogged
            ? `✅ ${log.workoutLabel || 'Session done'}`
            : '—  Not logged yet'}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify home screen in browser**

```bash
npm run dev
```

Complete onboarding (or clear localStorage and redo it). Expected: Home screen shows greeting, macro bars, water bar, steps bar, workout status.

- [ ] **Step 3: Commit**

```bash
git add src/screens/HomeScreen.jsx
git commit -m "feat: implement Home screen with daily snapshot"
```

---

### Task 11: Water screen

**Files:**
- Modify: `src/screens/WaterScreen.jsx`

- [ ] **Step 1: Replace `src/screens/WaterScreen.jsx`**

```jsx
import { useDailyLog } from '../hooks/useDailyLog'
import { getWaterNudge } from '../lib/nudges'
import ProgressBar from '../components/ProgressBar'

const TAP_OZ = 16
const TAP_ML = 470

export default function WaterScreen({ profile }) {
  const { log, update } = useDailyLog(profile.id)
  const isOz = profile.weightUnit !== 'kg' // use oz unless metric profile
  const tapAmount = isOz ? TAP_OZ : TAP_ML
  const targetDisplay = isOz ? profile.targets.waterOz : Math.round(profile.targets.waterOz * 29.5735)
  const currentDisplay = isOz ? log.waterOz : Math.round(log.waterOz * 29.5735)
  const unit = isOz ? 'oz' : 'ml'
  const nudge = getWaterNudge(log.waterOz, profile)

  const logWater = () => {
    const newOz = log.waterOz + TAP_OZ // always store in oz
    update({ waterOz: newOz })
  }

  const reset = () => update({ waterOz: 0 })

  return (
    <div className="screen">
      <h1>Water 💧</h1>
      <p style={{ marginBottom: 20 }}>One tap = {tapAmount}{unit}</p>

      {nudge && <div className="nudge">{nudge}</div>}

      <div className="card" style={{ textAlign: 'center', marginBottom: 24 }}>
        <div style={{ fontSize: 64, marginBottom: 8 }}>💧</div>
        <div className="value" style={{ fontSize: 36 }}>{currentDisplay}<span style={{ fontSize: 18, color: 'var(--text-muted)' }}>{unit}</span></div>
        <div style={{ color: 'var(--text-muted)', fontSize: 14 }}>of {targetDisplay}{unit} goal</div>
        <div style={{ marginTop: 16 }}>
          <ProgressBar value={log.waterOz} max={profile.targets.waterOz} color="#60A5FA" label="" sublabel="" />
        </div>
      </div>

      <button className="btn btn-primary" style={{ fontSize: 20, padding: 20, marginBottom: 12 }} onClick={logWater}>
        + {tapAmount}{unit}
      </button>
      <button className="btn btn-secondary" onClick={reset}>Reset today</button>
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser — tap the button and check bar fills**

Open DevTools → Application → Local Storage → check `cff_daily_logs` key updates after each tap.

- [ ] **Step 3: Commit**

```bash
git add src/screens/WaterScreen.jsx
git commit -m "feat: implement Water screen with tap-to-log and nudges"
```

---

### Task 12: Workout screen

**Files:**
- Modify: `src/screens/WorkoutScreen.jsx`

- [ ] **Step 1: Replace `src/screens/WorkoutScreen.jsx`**

```jsx
import { useDailyLog } from '../hooks/useDailyLog'
import { getWorkoutNudge } from '../lib/nudges'
import { todayKey } from '../lib/calculations'

export default function WorkoutScreen({ profile }) {
  const { log, update } = useDailyLog(profile.id)
  const today = new Date().toLocaleDateString('en-US', { weekday: 'long' })
  const isTrainingDay = profile.trainingDays?.includes(today)
  const nudge = getWorkoutNudge(log.workoutLogged, isTrainingDay && !log.workoutLogged, profile.name)

  const logWorkout = (label) => update({ workoutLogged: true, workoutLabel: label })

  return (
    <div className="screen">
      <h1>Workout 💪</h1>

      {log.workoutLogged ? (
        <div className="card" style={{ textAlign: 'center', padding: 32 }}>
          <div style={{ fontSize: 64 }}>🔥</div>
          <h2 style={{ marginTop: 12 }}>{log.workoutLabel}</h2>
          <p style={{ marginTop: 4 }}>Session served. You showed up.</p>
        </div>
      ) : (
        <>
          <div className="nudge">{nudge}</div>
          {isTrainingDay && (
            <>
              <p style={{ marginBottom: 16 }}>Did you get a session in today {profile.name}? 💪</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(profile.workoutLabels || ['Session']).map(label => (
                  <button key={label} className="btn btn-primary" onClick={() => logWorkout(label)}>
                    ✅ {label}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Verify in browser**

Log a workout. Expected: Screen updates to show the session name and fire animation. DevTools → check `workoutLogged: true` in daily log.

- [ ] **Step 3: Commit**

```bash
git add src/screens/WorkoutScreen.jsx
git commit -m "feat: implement Workout screen with daily check-in and label selection"
```

---

## Chunk 5: Food Screen

### Task 13: Food screen — macro tracker + meal builder

**Files:**
- Modify: `src/screens/FoodScreen.jsx`
- Create: `src/screens/food/MacroTracker.jsx`
- Create: `src/screens/food/FoodLibrary.jsx`
- Create: `src/screens/food/MealBuilder.jsx`

- [ ] **Step 1: Create `src/screens/food/MacroTracker.jsx`**

```jsx
import MacroCard from '../../components/MacroCard'
import { getMacroNudge } from '../../lib/nudges'

export default function MacroTracker({ log, profile }) {
  const nudge = getMacroNudge(log, profile)
  return (
    <div>
      {nudge && <div className="nudge">{nudge}</div>}
      <MacroCard log={log} targets={profile.targets} />
    </div>
  )
}
```

- [ ] **Step 2: Create `src/screens/food/FoodLibrary.jsx`**

```jsx
export default function FoodLibrary({ library, onSelect, onDelete }) {
  if (library.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>📸</div>
        <p>Your menu is empty — scan your first item 📸</p>
      </div>
    )
  }

  return (
    <div>
      {library.map(item => (
        <div key={item.id} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div style={{ fontWeight: 600 }}>{item.name}</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
              {item.perServing.calories} kcal · {item.perServing.protein}g protein · per {item.servingSize}{item.servingUnit}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <button onClick={() => onSelect(item)}
              style={{ background: 'var(--saffron)', color: '#000', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600 }}>
              Add
            </button>
            <button onClick={() => onDelete(item.id)}
              style={{ background: 'var(--bg-input)', color: 'var(--text-muted)', border: 'none', borderRadius: 8, padding: '6px 10px', cursor: 'pointer' }}>
              ✕
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
```

- [ ] **Step 3: Create `src/screens/food/MealBuilder.jsx`**

```jsx
import { useState } from 'react'
import { calcMacrosForQuantity } from '../../lib/calculations'

export default function MealBuilder({ item, onLog, onCancel }) {
  const [quantity, setQuantity] = useState('1')
  const qty = Number(quantity)
  const valid = !isNaN(qty) && qty > 0
  const macros = valid ? calcMacrosForQuantity(item, qty) : null

  return (
    <div className="card">
      <h2>{item.name}</h2>
      <p style={{ marginBottom: 16 }}>Per serving: {item.servingSize}{item.servingUnit}</p>
      <div className="label">Quantity (servings)</div>
      <input type="number" value={quantity} step="0.5" min="0.5"
        onChange={e => setQuantity(e.target.value)} style={{ marginBottom: 16 }} />
      {macros && (
        <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
          {['calories','protein','fat','carbs'].map(k => (
            <div key={k} style={{ flex: 1, textAlign: 'center' }}>
              <div style={{ fontSize: 18, fontWeight: 700 }}>{Math.round(macros[k])}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k === 'calories' ? 'kcal' : 'g'}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</div>
            </div>
          ))}
        </div>
      )}
      <button className="btn btn-primary" disabled={!valid} onClick={() => onLog({ ...item, quantity: qty, macros })} style={{ marginBottom: 8 }}>
        Log to today 🤌
      </button>
      <button className="btn btn-secondary" onClick={onCancel}>Cancel</button>
    </div>
  )
}
```

- [ ] **Step 4: Replace `src/screens/FoodScreen.jsx`**

```jsx
import { useState } from 'react'
import { useDailyLog } from '../hooks/useDailyLog'
import { useFoodLibrary } from '../hooks/useFoodLibrary'
import MacroTracker from './food/MacroTracker'
import FoodLibrary from './food/FoodLibrary'
import MealBuilder from './food/MealBuilder'
import FoodScanner from './food/FoodScanner'

export default function FoodScreen({ profile }) {
  const { log, logMeal } = useDailyLog(profile.id)
  const { library, addItem, removeItem } = useFoodLibrary()
  const [view, setView] = useState('main') // 'main' | 'scanner' | 'build'
  const [selectedItem, setSelectedItem] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => {
    setToast(msg)
    setTimeout(() => setToast(null), 2500)
  }

  const handleLog = (mealEntry) => {
    logMeal({ foodItemId: mealEntry.id, name: mealEntry.name, quantity: mealEntry.quantity, macros: mealEntry.macros })
    showToast('Meal locked in — macros calculated, chef approved 🤌')
    setView('main')
    setSelectedItem(null)
  }

  if (view === 'scanner') {
    return <FoodScanner onSave={(item) => { addItem(item); showToast('First ingredient in — your kitchen is open 👨‍🍳'); setView('main') }} onCancel={() => setView('main')} />
  }

  if (view === 'build' && selectedItem) {
    return <MealBuilder item={selectedItem} onLog={handleLog} onCancel={() => setView('main')} />
  }

  return (
    <div className="screen">
      {toast && <div className="nudge">{toast}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Food 🍽️</h1>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => setView('scanner')}>
          📸 Scan
        </button>
      </div>
      <MacroTracker log={log} profile={profile} />
      <h2 style={{ marginBottom: 12 }}>My Library</h2>
      <FoodLibrary
        library={library}
        onSelect={(item) => { setSelectedItem(item); setView('build') }}
        onDelete={removeItem}
      />
    </div>
  )
}
```

- [ ] **Step 5: Create placeholder `src/screens/food/FoodScanner.jsx`** (we'll implement this in Chunk 6 with the Netlify Function):

```jsx
export default function FoodScanner({ onSave, onCancel }) {
  return (
    <div className="screen">
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', marginBottom: 16 }}>
        ← Back
      </button>
      <h1>Scan a label 📸</h1>
      <p>Food scanner coming in the next step.</p>
    </div>
  )
}
```

- [ ] **Step 6: Verify food screen in browser**

Navigate to Food tab. Expected: Macro bars show. Library shows empty state. Tap "Add" on a library item (once you manually add one via DevTools to test).

- [ ] **Step 7: Commit**

```bash
git add src/screens/FoodScreen.jsx src/screens/food/
git commit -m "feat: implement Food screen with macro tracker, library, meal builder"
```

---

## Chunk 6: Food Scanner (Netlify Function)

### Task 14: Netlify Function + FoodScanner UI

**Files:**
- Create: `netlify/functions/claude-vision.js`
- Modify: `src/screens/food/FoodScanner.jsx`
- Create: `src/lib/scannerApi.js`

- [ ] **Step 1: Create `netlify/functions/claude-vision.js`**

```js
export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Scanner not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const { imageBase64, mediaType = 'image/jpeg' } = body

  if (!imageBase64) {
    return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Extract the nutrition information from this label. Return ONLY valid JSON in this exact format, nothing else:
{"name":"product name","brand":"brand name or empty string","servingSize":100,"servingUnit":"g","calories":0,"protein":0,"fat":0,"carbs":0}
Use numbers only for numeric fields. If you cannot read a value clearly, use 0. If this is not a nutrition label, return {"error":"not a nutrition label"}.`,
            },
          ],
        }],
      }),
    })

    if (!response.ok) {
      const err = await response.text()
      return new Response(JSON.stringify({ error: 'Scanner is having a moment — try again in a few seconds 🍳' }), {
        status: 502, headers: { 'Content-Type': 'application/json' }
      })
    }

    const result = await response.json()
    const text = result.content?.[0]?.text ?? ''

    let parsed
    try { parsed = JSON.parse(text) } catch {
      return new Response(JSON.stringify({ error: "Couldn't read that label — try better lighting 📸" }), {
        status: 422, headers: { 'Content-Type': 'application/json' }
      })
    }

    if (parsed.error) {
      return new Response(JSON.stringify({ error: parsed.error }), {
        status: 422, headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ data: parsed }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Scanner is having a moment — try again 🍳' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}

export const config = { path: '/api/scan' }
```

- [ ] **Step 2: Create `src/lib/scannerApi.js`**

```js
export const scanLabel = async (imageBase64, mediaType = 'image/jpeg') => {
  const res = await fetch('/.netlify/functions/claude-vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mediaType }),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error || 'Scan failed')
  return json.data
}
```

- [ ] **Step 3: Replace `src/screens/food/FoodScanner.jsx`**

```jsx
import { useState, useRef } from 'react'
import { scanLabel } from '../../lib/scannerApi'

const genId = () => Math.random().toString(36).slice(2)

const EMPTY_FORM = { name: '', brand: '', servingSize: '', servingUnit: 'g', calories: '', protein: '', fat: '', carbs: '' }

export default function FoodScanner({ onSave, onCancel }) {
  const [stage, setStage] = useState('upload') // 'upload' | 'scanning' | 'confirm' | 'error'
  const [form, setForm] = useState(EMPTY_FORM)
  const [errorMsg, setErrorMsg] = useState('')
  const [firstUse] = useState(() => localStorage.getItem('cff_scanner_used') !== 'yes')
  const fileRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    setStage('scanning')
    try {
      const base64 = await fileToBase64(file)
      const data = await scanLabel(base64, file.type || 'image/jpeg')
      setForm({
        name: data.name || '',
        brand: data.brand || '',
        servingSize: String(data.servingSize || ''),
        servingUnit: data.servingUnit || 'g',
        calories: String(data.calories || ''),
        protein: String(data.protein || ''),
        fat: String(data.fat || ''),
        carbs: String(data.carbs || ''),
      })
      localStorage.setItem('cff_scanner_used', 'yes')
      setStage('confirm')
    } catch (err) {
      setErrorMsg(err.message || "Couldn't read that label — try better lighting 📸")
      setStage('error')
    }
  }

  const handleSave = () => {
    const required = ['name', 'servingSize', 'calories', 'protein', 'fat', 'carbs']
    const missing = required.filter(k => !form[k])
    if (missing.length) { setErrorMsg(`Please fill in: ${missing.join(', ')}`); return }
    const item = {
      id: genId(),
      name: form.name,
      brand: form.brand,
      servingSize: Number(form.servingSize),
      servingUnit: form.servingUnit,
      perServing: {
        calories: Number(form.calories),
        protein: Number(form.protein),
        fat: Number(form.fat),
        carbs: Number(form.carbs),
      },
      dateAdded: new Date().toISOString().split('T')[0],
    }
    onSave(item)
  }

  const field = (key, label, type = 'text') => (
    <div key={key} style={{ marginBottom: 12 }}>
      <div className="label">{label}</div>
      <input type={type} value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ borderColor: !form[key] ? 'var(--chili)' : undefined }}
      />
    </div>
  )

  return (
    <div className="screen">
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', marginBottom: 16, fontSize: 16 }}>
        ← Back
      </button>

      {stage === 'upload' && (
        <>
          <h1>Scan a label 📸</h1>
          {firstUse && <div className="nudge">Best results with clear, well-lit label photos 📸</div>}
          <div className="card" style={{ textAlign: 'center', padding: 40 }}
            onClick={() => fileRef.current?.click()}>
            <div style={{ fontSize: 56 }}>📸</div>
            <p style={{ marginTop: 8 }}>Tap to upload or take a photo</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0])}
          />
          <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
            Choose photo
          </button>
        </>
      )}

      {stage === 'scanning' && (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h2>Reading label...</h2>
          <p>Claude is extracting the macros</p>
        </div>
      )}

      {stage === 'confirm' && (
        <>
          <h1>Review & save</h1>
          <p style={{ marginBottom: 16 }}>Check the values — edit anything that looks wrong.</p>
          {field('name', 'Product name *')}
          {field('brand', 'Brand')}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 2 }}>{field('servingSize', 'Serving size *', 'number')}</div>
            <div style={{ flex: 1 }}>
              <div className="label">Unit</div>
              <select value={form.servingUnit} onChange={e => setForm(f => ({ ...f, servingUnit: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 16 }}>
                {['g','ml','oz','cup','tbsp','tsp','piece'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {field('calories', 'Calories (kcal) *', 'number')}
          {field('protein', 'Protein (g) *', 'number')}
          {field('fat', 'Fat (g) *', 'number')}
          {field('carbs', 'Carbs (g) *', 'number')}
          {errorMsg && <p style={{ color: 'var(--chili)', marginBottom: 12 }}>{errorMsg}</p>}
          <button className="btn btn-primary" onClick={handleSave} style={{ marginBottom: 8 }}>
            Looks good → Save 👨‍🍳
          </button>
          <button className="btn btn-secondary" onClick={() => setStage('upload')}>Re-scan</button>
        </>
      )}

      {stage === 'error' && (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>😅</div>
          <h2>Scan failed</h2>
          <p style={{ marginBottom: 24 }}>{errorMsg}</p>
          <button className="btn btn-primary" onClick={() => setStage('upload')}>Try again</button>
        </div>
      )}
    </div>
  )
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
```

- [ ] **Step 4: Commit**

```bash
git add netlify/functions/ src/lib/scannerApi.js src/screens/food/FoodScanner.jsx
git commit -m "feat: add Claude vision food scanner with Netlify Function and confirmation UI"
```

---

## Chunk 7: Progress Screen + Settings + Deployment

### Task 15: Progress screen

**Files:**
- Modify: `src/screens/ProgressScreen.jsx`

- [ ] **Step 1: Replace `src/screens/ProgressScreen.jsx`**

```jsx
import { useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'
import { useWeightLog } from '../hooks/useWeightLog'
import { calcTrendLine, calcWeeksToGoal } from '../lib/calculations'
import Confetti from '../components/Confetti'

const MILESTONES = [
  { key: 'down2', check: (start, cur) => start - cur >= 2, msg: (n) => `2 lbs down 🔥 The cut is real` },
  { key: 'down5', check: (start, cur) => start - cur >= 5, msg: (n) => `5 lbs gone 💪 A whole bag of flour lighter` },
  { key: 'halfway', check: (start, cur, goal) => cur <= start - (start - goal) / 2, msg: (n) => `Halfway there ${n} — the best course is still coming 🌶️` },
  { key: 'goal', check: (start, cur, goal) => cur <= goal, msg: (n) => `GOAL HIT. Table for one — and you're the main event 🎉🍽️🔥` },
]

export default function ProgressScreen({ profile }) {
  const { entries, addEntry } = useWeightLog(profile.id)
  const [weight, setWeight] = useState('')
  const [confetti, setConfetti] = useState(false)
  const [milestone, setMilestone] = useState(null)

  const startWeight = entries.length > 0 ? entries[0].weight : profile.currentWeight
  const latestWeight = entries.length > 0 ? entries[entries.length - 1].weight : profile.currentWeight
  const goalWeight = profile.goalWeight

  const trend = calcTrendLine(entries.length > 0 ? entries : [{ date: 'Start', weight: startWeight }])
  const weeklyLoss = entries.length > 1
    ? (startWeight - latestWeight) / (entries.length - 1)
    : 0
  const weeksLeft = calcWeeksToGoal(latestWeight, goalWeight, weeklyLoss)

  const logWeight = () => {
    const w = Number(weight)
    if (!w || w <= 0) return
    const entry = { id: Math.random().toString(36).slice(2), profileId: profile.id, weight: w, weightUnit: profile.weightUnit, date: new Date().toISOString().split('T')[0] }
    addEntry(entry)

    const hit = MILESTONES.find(m => !entries.find(e => e.milestoneHit === m.key) && m.check(startWeight, w, goalWeight))
    if (hit) {
      setMilestone(hit.msg(profile.name))
      setConfetti(c => !c) // toggle to re-trigger
    }
    setWeight('')
  }

  const chartData = entries.map((e, i) => ({ date: e.date.slice(5), weight: e.weight, trend: trend[i]?.trend }))

  return (
    <div className="screen">
      <Confetti trigger={confetti} />
      <h1>Progress 📈</h1>

      {milestone && (
        <div className="card" style={{ borderLeft: '3px solid var(--saffron)', marginBottom: 16 }}>
          <div style={{ fontSize: 20, fontWeight: 700 }}>{milestone}</div>
        </div>
      )}

      <div style={{ display: 'flex', gap: 12, marginBottom: 16 }}>
        {[
          { label: 'Start', val: `${startWeight} ${profile.weightUnit}` },
          { label: 'Current', val: `${latestWeight} ${profile.weightUnit}` },
          { label: 'Goal', val: `${goalWeight} ${profile.weightUnit}` },
          { label: 'Est. weeks', val: weeksLeft === Infinity ? '—' : String(weeksLeft) },
        ].map(({ label, val }) => (
          <div key={label} className="card" style={{ flex: 1, textAlign: 'center', padding: 12 }}>
            <div style={{ fontSize: 16, fontWeight: 700 }}>{val}</div>
            <div className="label">{label}</div>
          </div>
        ))}
      </div>

      {chartData.length > 1 && (
        <div className="card" style={{ height: 200, padding: 8 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={chartData}>
              <XAxis dataKey="date" tick={{ fill: '#888', fontSize: 11 }} />
              <YAxis domain={['auto','auto']} tick={{ fill: '#888', fontSize: 11 }} />
              <Tooltip contentStyle={{ background: '#1A1A1A', border: 'none', color: '#fff' }} />
              <ReferenceLine y={goalWeight} stroke="#4CAF6F" strokeDasharray="4 4" label={{ value: 'Goal', fill: '#4CAF6F', fontSize: 11 }} />
              <Line type="monotone" dataKey="weight" stroke="#F5A623" dot={{ fill: '#F5A623' }} strokeWidth={2} />
              <Line type="monotone" dataKey="trend" stroke="#888" strokeDasharray="4 4" dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="card">
        <h2>Log weigh-in ⚖️</h2>
        <p style={{ marginBottom: 12 }}>Time to check in {profile.name} — how's the cut coming?</p>
        <input type="number" placeholder={`Weight in ${profile.weightUnit}`} value={weight}
          onChange={e => setWeight(e.target.value)} style={{ marginBottom: 12 }} />
        <button className="btn btn-primary" onClick={logWeight} disabled={!weight}>
          Log weight
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/ProgressScreen.jsx
git commit -m "feat: implement Progress screen with weight log, trend chart, and milestones"
```

---

### Task 16: Settings screen

**Files:**
- Modify: `src/screens/SettingsScreen.jsx`

- [ ] **Step 1: Replace `src/screens/SettingsScreen.jsx`**

```jsx
import { useState } from 'react'

export default function SettingsScreen({ profile, onUpdate, onBack }) {
  const [targets, setTargets] = useState({ ...profile.targets })
  const [guardrails, setGuardrails] = useState({ ...profile.calorieGuardrails })
  const [saved, setSaved] = useState(false)

  const save = () => {
    onUpdate({ ...profile, targets, calorieGuardrails: guardrails })
    setSaved(true)
    setTimeout(() => setSaved(false), 1500)
  }

  const t = (key, label, unit) => (
    <div key={key} style={{ marginBottom: 12 }}>
      <div className="label">{label} ({unit})</div>
      <input type="number" value={targets[key]}
        onChange={e => setTargets(t => ({ ...t, [key]: Number(e.target.value) }))} />
    </div>
  )

  return (
    <div className="screen">
      <button onClick={onBack} style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', marginBottom: 16, fontSize: 16 }}>
        ← Back
      </button>
      <h1>The Recipe ⚙️</h1>
      <p style={{ marginBottom: 20 }}>Adjust your daily targets and guardrails.</p>

      <div className="card">
        <h2>Daily targets</h2>
        {t('calories', 'Calories 🔥', 'kcal')}
        {t('protein', 'Protein 🍗', 'g')}
        {t('fat', 'Fat 🥑', 'g')}
        {t('carbs', 'Carbs 🍚', 'g')}
        {t('waterOz', 'Water 💧', 'oz')}
        {t('steps', 'Steps 👟', 'steps')}
      </div>

      <div className="card">
        <h2>Calorie guardrails</h2>
        <div style={{ marginBottom: 12 }}>
          <div className="label">Under-eating alert (% of target)</div>
          <input type="number" value={guardrails.underPercent}
            onChange={e => setGuardrails(g => ({ ...g, underPercent: Number(e.target.value) }))} />
        </div>
        <div>
          <div className="label">Over-eating alert (% of target)</div>
          <input type="number" value={guardrails.overPercent}
            onChange={e => setGuardrails(g => ({ ...g, overPercent: Number(e.target.value) }))} />
        </div>
      </div>

      <div className="card">
        <h2>Scanner status</h2>
        <p>The Claude API key is configured in your Netlify dashboard — it never touches the app.</p>
        <div style={{ marginTop: 8, padding: '8px 12px', background: 'var(--bg-input)', borderRadius: 8, fontSize: 14 }}>
          Scanner status: <span style={{ color: 'var(--green)' }}>✅ Ready (when deployed)</span>
        </div>
      </div>

      <button className="btn btn-primary" onClick={save} style={{ marginBottom: 8 }}>
        {saved ? '✅ Saved!' : 'Save changes'}
      </button>
    </div>
  )
}
```

- [ ] **Step 2: Commit**

```bash
git add src/screens/SettingsScreen.jsx
git commit -m "feat: implement Settings screen (The Recipe) with target and guardrail editing"
```

---

### Task 17: Deploy to Netlify

**Files:**
- No code changes — deployment steps only

- [ ] **Step 1: Create a GitHub repository**

Go to github.com → New repository → name it `challo-fit-friend` → Create (no README). Copy the remote URL shown.

- [ ] **Step 2: Push code to GitHub**

```bash
git remote add origin https://github.com/YOUR_USERNAME/challo-fit-friend.git
git push -u origin main
```

- [ ] **Step 3: Connect to Netlify**

1. Go to app.netlify.com → Add new site → Import from Git → GitHub
2. Select `challo-fit-friend` repository
3. Build settings (should auto-detect from `netlify.toml`):
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Click "Deploy site"

- [ ] **Step 4: Add Claude API key to Netlify**

1. In Netlify dashboard → Site settings → Environment variables
2. Add variable: `CLAUDE_API_KEY` = your key from console.anthropic.com
3. Click "Save" → trigger a new deploy (Deploys tab → Trigger deploy)

- [ ] **Step 5: Get your API key (if you don't have one yet)**

1. Go to console.anthropic.com
2. Sign up / log in
3. Go to API Keys → Create key
4. Copy it and paste into the Netlify environment variable from Step 4

- [ ] **Step 6: Test on your phone**

1. Open the Netlify URL on your phone (e.g. `https://challo-fit-friend.netlify.app`)
2. Tap the share icon in Safari → "Add to Home Screen" → this makes it feel like a native app
3. Run the full test checklist from the spec:
   - Complete onboarding
   - Add a second profile
   - Scan a nutrition label photo
   - Log a meal
   - Log water, steps, workout
   - Log a weigh-in

- [ ] **Step 7: Final commit if any fixes needed**

```bash
git add .
git commit -m "fix: post-deploy adjustments"
git push
```

---

## Post-Launch: Future Upgrade to Supabase (Option B)

When you're ready to move to cloud storage so data syncs across devices:

1. Create a free Supabase project at supabase.com
2. Replace `src/storage/index.js` with a Supabase version that exports identical function signatures
3. Add `SUPABASE_URL` and `SUPABASE_ANON_KEY` to Netlify environment variables
4. Run a one-time migration script to push localStorage data to Supabase
5. Add simple email/password auth — the profile switcher becomes a login screen

**No other files change.** All hooks and screens read/write through `src/storage/` exclusively.
