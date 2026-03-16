# Challo Fit Friend V2 Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Ship V2 with reliable localStorage persistence, a redesigned 6-step onboarding (DOB, ScrollPicker inputs, auto-TDEE reveal), manual-first food entry, and Framer Motion animations throughout.

**Architecture:** Shared primitive components (ScrollPicker, BottomSheet, SwipeableCard) built first, then consumed by rewritten onboarding steps and food screens. AnimatePresence wraps the App-level tab switcher and OnboardingFlow step runner. All data stays in localStorage — no new persistence layer.

**Tech Stack:** React 19, Vite 8, Framer Motion (new), Vitest + @testing-library/react, localStorage

---

## Chunk 1: Setup, Storage Fix, Calculations

### Task 1: Install Framer Motion

**Files:**
- Modify: `challo-fit-friend/package.json` (via npm)

- [ ] **Step 1: Install the dependency**

```bash
cd challo-fit-friend && npm install framer-motion
```

Expected: `framer-motion` appears in `package.json` dependencies.

- [ ] **Step 2: Commit**

```bash
cd challo-fit-friend && git add package.json package-lock.json
git commit -m "chore: add framer-motion dependency"
```

---

### Task 2: Fix storage race condition and boot integrity

**Files:**
- Modify: `challo-fit-friend/src/hooks/useProfile.js`
- Modify: `challo-fit-friend/src/onboarding/OnboardingFlow.jsx`

**Problem 1:** `useProfile` initializes `activeId` from localStorage without checking the profile still exists. If data is corrupt or the profile was deleted, the app is stuck showing a blank profile switcher.

**Problem 2:** `OnboardingFlow` calls `onComplete` (which writes to localStorage) after a 1800ms animation delay. A page reload in that window creates no active profile ID — the app shows an empty profile switcher on next load.

- [ ] **Step 1: Write the failing test**

Create `challo-fit-friend/src/hooks/useProfile.test.js`:

```js
import { renderHook } from '@testing-library/react'
import { useProfile } from './useProfile'

beforeEach(() => localStorage.clear())

describe('useProfile boot integrity', () => {
  it('clears stale activeId when referenced profile does not exist', () => {
    localStorage.setItem('cff_active_profile', 'ghost-id')
    localStorage.setItem('cff_profiles', JSON.stringify([]))
    const { result } = renderHook(() => useProfile())
    expect(result.current.activeProfile).toBeNull()
    expect(localStorage.getItem('cff_active_profile')).toBeNull()
  })

  it('keeps valid activeId when referenced profile exists', () => {
    const p = { id: 'abc', name: 'Test' }
    localStorage.setItem('cff_active_profile', 'abc')
    localStorage.setItem('cff_profiles', JSON.stringify([p]))
    const { result } = renderHook(() => useProfile())
    expect(result.current.activeProfile).toEqual(p)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd challo-fit-friend && npx vitest run src/hooks/useProfile.test.js
```

Expected: FAIL — "clears stale activeId" test fails because no integrity check exists.

- [ ] **Step 3: Update useProfile.js**

Replace `challo-fit-friend/src/hooks/useProfile.js`:

```js
import { useState, useCallback } from 'react'
import { getProfiles, saveProfile, deleteProfile, getActiveProfileId, setActiveProfileId } from '../storage'

export const useProfile = () => {
  const [profiles, setProfiles] = useState(() => getProfiles())
  const [activeId, setActiveId] = useState(() => {
    const id = getActiveProfileId()
    if (!id) return null
    const all = getProfiles()
    if (!all.find(p => p.id === id)) {
      localStorage.removeItem('cff_active_profile')
      return null
    }
    return id
  })

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

- [ ] **Step 4: Run test to verify it passes**

```bash
cd challo-fit-friend && npx vitest run src/hooks/useProfile.test.js
```

Expected: PASS

**Fix 2:** In `OnboardingFlow`, write profile and activeId to localStorage synchronously before the 1800ms animation delay.

- [ ] **Step 5: Add sync storage calls to OnboardingFlow.jsx**

In `challo-fit-friend/src/onboarding/OnboardingFlow.jsx`, add these two imports at the top:

```js
import { saveProfile as persistProfile, setActiveProfileId } from '../storage'
```

Then inside the `advance` function, in the final `else` block that builds the profile object, add these two lines immediately after the profile object is built and before `setDone(true)`:

```js
persistProfile(profile)
setActiveProfileId(profile.id)
```

The `else` block should now end:
```js
      persistProfile(profile)   // ← add this line
      setActiveProfileId(profile.id)  // ← add this line
      setFinalName(data.name)
      setDone(true)
      setCompletionProfile(profile)
    }
```

Note: `onComplete` still fires after 1800ms to update React state (switching the view). The sync calls above ensure the data is in localStorage regardless of a reload during that window. The duplicate `saveProfile` call from `onComplete → addOrUpdateProfile` is harmless (same profile object).

- [ ] **Step 6: Commit**

```bash
cd challo-fit-friend && git add src/hooks/useProfile.js src/hooks/useProfile.test.js src/onboarding/OnboardingFlow.jsx
git commit -m "fix: storage race condition and stale activeId boot integrity"
```

---

### Task 3: Update calculations.js

**Files:**
- Modify: `challo-fit-friend/src/lib/calculations.js`
- Modify: `challo-fit-friend/src/lib/calculations.test.js`

Changes: `calcCalorieTarget` accepts `dob` as alternative to `age`; `calcWaterTarget` accepts `weightLbs`; add `calcAge`, `calcFatTarget`, `calcCarbTarget`.

- [ ] **Step 1: Write failing tests**

Add to `challo-fit-friend/src/lib/calculations.test.js` (keep all existing tests, add these below):

```js
import {
  calcCalorieTarget, calcProteinTarget, calcWaterTarget,
  calcMacrosForQuantity, calcWeeklyAverage, calcTrendLine,
  calcWeeksToGoal, todayKey, greetingIndex,
  calcAge, calcFatTarget, calcCarbTarget,
} from './calculations'

describe('calcAge', () => {
  it('calculates age from YYYY-MM-DD string', () => {
    const age = calcAge('1995-01-01')
    expect(age).toBeGreaterThanOrEqual(29)
    expect(age).toBeLessThanOrEqual(32)
  })
})

describe('calcCalorieTarget with dob', () => {
  it('accepts dob and produces a valid calorie range', () => {
    const cals = calcCalorieTarget({ weight: 180, height: 70, dob: '1995-01-01', sex: 'm', activityLevel: 'moderate' })
    expect(cals).toBeGreaterThan(2000)
    expect(cals).toBeLessThan(3500)
  })
})

describe('calcWaterTarget', () => {
  it('returns half of bodyweight in oz', () => {
    expect(calcWaterTarget(180)).toBe(90)
  })
  it('falls back gracefully with no argument', () => {
    expect(calcWaterTarget()).toBe(80)
  })
})

describe('calcFatTarget', () => {
  it('returns 30% of calories divided by 9', () => {
    expect(calcFatTarget(2400)).toBe(80)
  })
})

describe('calcCarbTarget', () => {
  it('returns remaining calories from carbs after protein and fat', () => {
    // 2400 kcal - 160g protein (640 kcal) - 80g fat (720 kcal) = 1040 kcal → 260g carbs
    expect(calcCarbTarget(2400, 160, 80)).toBe(260)
  })
})
```

**Important:** The new `calcWaterTarget` tests above replace (not add to) the existing `calcWaterTarget` describe block in the file. Find the existing block that reads `it('returns 96oz as default', ...)` and delete it — only the new block above should remain.

- [ ] **Step 2: Run tests to verify they fail**

```bash
cd challo-fit-friend && npx vitest run src/lib/calculations.test.js
```

Expected: FAIL — `calcAge` not exported, `calcWaterTarget` signature mismatch.

- [ ] **Step 3: Replace calculations.js**

```js
// Harris-Benedict BMR → TDEE

export const calcAge = (dob) =>
  Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))

export const calcCalorieTarget = ({ weight, height, age, dob, sex = 'm', activityLevel = 'moderate' }) => {
  const derivedAge = dob ? calcAge(dob) : (age ?? 30)
  const weightKg = weight * 0.453592
  const heightCm = height * 2.54
  const bmr = sex === 'm'
    ? 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * derivedAge)
    : 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * derivedAge)
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
  return Math.round(bmr * (multipliers[activityLevel] ?? 1.55))
}

// 0.8g protein per lb bodyweight
export const calcProteinTarget = (weightLbs) => Math.round(weightLbs * 0.8)

// 30% of calories from fat (fat has 9 kcal/g)
export const calcFatTarget = (calories) => Math.round(calories * 0.30 / 9)

// Remaining calories from carbs (carbs have 4 kcal/g)
export const calcCarbTarget = (calories, proteinG, fatG) =>
  Math.round((calories - proteinG * 4 - fatG * 9) / 4)

// Half of bodyweight (lbs) in oz — standard hydration formula
export const calcWaterTarget = (weightLbs = 160) => Math.round(weightLbs * 0.5)

export const calcMacrosForQuantity = (item, quantity) => ({
  calories: item.perServing.calories * quantity,
  protein: item.perServing.protein * quantity,
  fat: item.perServing.fat * quantity,
  carbs: item.perServing.carbs * quantity,
})

export const calcWeeklyAverage = (logs, key) => {
  if (!logs.length) return 0
  return Math.round(logs.reduce((sum, l) => sum + (l[key] ?? 0), 0) / logs.length)
}

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

export const calcWeeksToGoal = (currentWeight, goalWeight, weeklyLossRate) => {
  if (weeklyLossRate <= 0) return Infinity
  return Math.ceil((currentWeight - goalWeight) / weeklyLossRate)
}

export const todayKey = () => new Date().toISOString().split('T')[0]

export const greetingIndex = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return dayOfYear % 6
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd challo-fit-friend && npx vitest run src/lib/calculations.test.js
```

Expected: PASS (all tests including updated `calcWaterTarget`)

- [ ] **Step 5: Check for existing callers of calcWaterTarget with no args**

```bash
cd challo-fit-friend && grep -r "calcWaterTarget()" src/
```

If any callers exist without arguments, update them to pass `profile.currentWeight` converted to lbs. The default fallback of `160` lbs → `80oz` is safe for uncaught cases.

- [ ] **Step 6: Commit**

```bash
cd challo-fit-friend && git add src/lib/calculations.js src/lib/calculations.test.js
git commit -m "feat: update calculations — dob/sex support, water formula, fat/carb targets"
```

---

## Chunk 2: Shared UI Primitives

### Task 4: ScrollPicker component

**Files:**
- Create: `challo-fit-friend/src/components/ScrollPicker.jsx`
- Create: `challo-fit-friend/src/components/ScrollPicker.test.jsx`

CSS scroll-snap picker. Shows 3 visible items; center item is selected. No Framer Motion — native scroll snap is smoother on mobile for this use case.

- [ ] **Step 1: Write the failing test**

Create `challo-fit-friend/src/components/ScrollPicker.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import ScrollPicker from './ScrollPicker'

const OPTIONS = ['80', '81', '82', '83', '84']

describe('ScrollPicker', () => {
  it('renders all options', () => {
    render(<ScrollPicker options={OPTIONS} value="82" onChange={() => {}} />)
    OPTIONS.forEach(o => expect(screen.getByText(o)).toBeInTheDocument())
  })

  it('marks the selected value with data-selected="true"', () => {
    const { container } = render(<ScrollPicker options={OPTIONS} value="82" onChange={() => {}} />)
    const selected = container.querySelector('[data-selected="true"]')
    expect(selected).toHaveTextContent('82')
  })

  it('calls onChange with correct value on scroll', () => {
    const onChange = vi.fn()
    const { container } = render(<ScrollPicker options={OPTIONS} value="82" onChange={onChange} />)
    const list = container.querySelector('[data-testid="scroll-picker-list"]')
    // Scroll to index 3 (value "83"), ITEM_HEIGHT = 44
    Object.defineProperty(list, 'scrollTop', { value: 44 * 3, configurable: true })
    fireEvent.scroll(list)
    expect(onChange).toHaveBeenCalledWith('83')
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd challo-fit-friend && npx vitest run src/components/ScrollPicker.test.jsx
```

Expected: FAIL — cannot find module ScrollPicker.

- [ ] **Step 3: Create ScrollPicker.jsx**

Create `challo-fit-friend/src/components/ScrollPicker.jsx`:

```jsx
import { useRef, useEffect } from 'react'

const ITEM_HEIGHT = 44

export default function ScrollPicker({ options, value, onChange }) {
  const ref = useRef()

  useEffect(() => {
    const idx = options.indexOf(value)
    if (idx >= 0 && ref.current) {
      ref.current.scrollTop = idx * ITEM_HEIGHT
    }
  }, [value, options])

  const handleScroll = () => {
    const idx = Math.round(ref.current.scrollTop / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(idx, options.length - 1))
    if (options[clamped] !== value) onChange(options[clamped])
  }

  return (
    <div style={{ position: 'relative', height: ITEM_HEIGHT * 3, overflow: 'hidden', userSelect: 'none' }}>
      {/* Selection band */}
      <div style={{
        position: 'absolute', top: ITEM_HEIGHT, left: 0, right: 0,
        height: ITEM_HEIGHT, background: 'var(--bg-input)',
        borderRadius: 8, pointerEvents: 'none', zIndex: 1,
        border: '1px solid var(--saffron)',
      }} />
      {/* Top fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_HEIGHT,
        background: 'linear-gradient(to bottom, var(--bg), transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_HEIGHT,
        background: 'linear-gradient(to top, var(--bg), transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      {/* Scrollable list */}
      <div
        ref={ref}
        data-testid="scroll-picker-list"
        onScroll={handleScroll}
        style={{
          height: '100%', overflowY: 'scroll',
          scrollSnapType: 'y mandatory', scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingTop: ITEM_HEIGHT, paddingBottom: ITEM_HEIGHT,
        }}
      >
        {options.map(opt => (
          <div
            key={opt}
            data-selected={opt === value ? 'true' : 'false'}
            style={{
              height: ITEM_HEIGHT, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              scrollSnapAlign: 'center', fontSize: 18,
              fontWeight: opt === value ? 600 : 400,
              color: opt === value ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd challo-fit-friend && npx vitest run src/components/ScrollPicker.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd challo-fit-friend && git add src/components/ScrollPicker.jsx src/components/ScrollPicker.test.jsx
git commit -m "feat: add ScrollPicker component"
```

---

### Task 5: BottomSheet component

**Files:**
- Create: `challo-fit-friend/src/components/BottomSheet.jsx`
- Create: `challo-fit-friend/src/components/BottomSheet.test.jsx`

Slides up from the bottom using Framer Motion. Drag handle at top, drag down 80px to dismiss. Semi-transparent backdrop.

- [ ] **Step 1: Write the failing test**

Create `challo-fit-friend/src/components/BottomSheet.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import BottomSheet from './BottomSheet'

describe('BottomSheet', () => {
  it('renders children and title when open', () => {
    render(
      <BottomSheet isOpen title="Edit calories" onClose={() => {}}>
        <p>Sheet content</p>
      </BottomSheet>
    )
    expect(screen.getByText('Sheet content')).toBeInTheDocument()
    expect(screen.getByText('Edit calories')).toBeInTheDocument()
  })

  it('does not render children when closed', () => {
    render(
      <BottomSheet isOpen={false} title="Edit" onClose={() => {}}>
        <p>Hidden</p>
      </BottomSheet>
    )
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet isOpen title="Edit" onClose={onClose}>
        <p>Content</p>
      </BottomSheet>
    )
    fireEvent.click(screen.getByTestId('bottom-sheet-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd challo-fit-friend && npx vitest run src/components/BottomSheet.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Create BottomSheet.jsx**

Create `challo-fit-friend/src/components/BottomSheet.jsx`:

```jsx
import { motion, AnimatePresence } from 'framer-motion'

export default function BottomSheet({ isOpen, onClose, title, children }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            data-testid="bottom-sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0,
              background: 'rgba(0,0,0,0.5)', zIndex: 40,
            }}
          />
          <motion.div
            drag="y"
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0, bottom: 0.5 }}
            onDragEnd={(_, info) => { if (info.offset.y > 80) onClose() }}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            style={{
              position: 'fixed', bottom: 0, left: 0, right: 0,
              background: 'var(--bg-card)',
              borderRadius: '16px 16px 0 0',
              padding: '16px 20px 40px', zIndex: 41,
            }}
          >
            <div style={{
              width: 40, height: 4, background: 'var(--border)',
              borderRadius: 2, margin: '0 auto 16px',
            }} />
            {title && <h3 style={{ marginBottom: 16 }}>{title}</h3>}
            {children}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd challo-fit-friend && npx vitest run src/components/BottomSheet.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd challo-fit-friend && git add src/components/BottomSheet.jsx src/components/BottomSheet.test.jsx
git commit -m "feat: add BottomSheet component with drag-to-dismiss"
```

---

### Task 6: SwipeableCard component

**Files:**
- Create: `challo-fit-friend/src/components/SwipeableCard.jsx`
- Create: `challo-fit-friend/src/components/SwipeableCard.test.jsx`

Horizontal drag via Framer Motion. Swipe left past –60px triggers `onDelete`. Red delete zone revealed as card slides.

- [ ] **Step 1: Write the failing test**

Create `challo-fit-friend/src/components/SwipeableCard.test.jsx`:

```jsx
import { render, screen } from '@testing-library/react'
import SwipeableCard from './SwipeableCard'

describe('SwipeableCard', () => {
  it('renders children', () => {
    render(<SwipeableCard onDelete={() => {}}><span>Food item</span></SwipeableCard>)
    expect(screen.getByText('Food item')).toBeInTheDocument()
  })

  it('renders the delete zone element in the DOM', () => {
    const { container } = render(
      <SwipeableCard onDelete={() => {}}><span>Item</span></SwipeableCard>
    )
    expect(container.querySelector('[data-testid="delete-zone"]')).toBeInTheDocument()
  })
})
```

Note: drag interaction cannot be reliably simulated in jsdom. Delete trigger is verified manually in the browser.

- [ ] **Step 2: Run test to verify it fails**

```bash
cd challo-fit-friend && npx vitest run src/components/SwipeableCard.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Create SwipeableCard.jsx**

Create `challo-fit-friend/src/components/SwipeableCard.jsx`:

```jsx
import { motion, useMotionValue, useTransform } from 'framer-motion'

export default function SwipeableCard({ children, onDelete }) {
  const x = useMotionValue(0)
  const deleteOpacity = useTransform(x, [-80, -20], [1, 0])

  return (
    <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 12, marginBottom: 8 }}>
      <motion.div
        data-testid="delete-zone"
        style={{
          position: 'absolute', right: 0, top: 0, bottom: 0, width: 80,
          background: 'var(--chili)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          opacity: deleteOpacity,
        }}
      >
        <span style={{ fontSize: 22 }}>🗑️</span>
      </motion.div>
      <motion.div
        drag="x"
        dragConstraints={{ left: -80, right: 0 }}
        dragElastic={0.05}
        style={{ x }}
        onDragEnd={(_, info) => { if (info.offset.x < -60) onDelete() }}
      >
        {children}
      </motion.div>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd challo-fit-friend && npx vitest run src/components/SwipeableCard.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd challo-fit-friend && git add src/components/SwipeableCard.jsx src/components/SwipeableCard.test.jsx
git commit -m "feat: add SwipeableCard component with swipe-to-delete"
```

---

## Chunk 3: Onboarding Redesign

### Task 7: StepDOB

**Files:**
- Create: `challo-fit-friend/src/onboarding/StepDOB.jsx`
- Create: `challo-fit-friend/src/onboarding/StepDOB.test.jsx`

Collects date of birth via month/day/year `<select>` inputs. Validates age is between 10–100.

- [ ] **Step 1: Write the failing test**

Create `challo-fit-friend/src/onboarding/StepDOB.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import StepDOB from './StepDOB'

describe('StepDOB', () => {
  it('renders month, day, year selects', () => {
    render(<StepDOB onNext={() => {}} />)
    expect(screen.getByLabelText('Month')).toBeInTheDocument()
    expect(screen.getByLabelText('Day')).toBeInTheDocument()
    expect(screen.getByLabelText('Year')).toBeInTheDocument()
  })

  it('Next button is disabled until a valid date is selected', () => {
    render(<StepDOB onNext={() => {}} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('calls onNext with dob in YYYY-MM-DD format', () => {
    const onNext = vi.fn()
    render(<StepDOB onNext={onNext} />)
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '15' } })
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '1992' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith({ dob: '1992-06-15' })
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd challo-fit-friend && npx vitest run src/onboarding/StepDOB.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Create StepDOB.jsx**

Create `challo-fit-friend/src/onboarding/StepDOB.jsx`:

```jsx
import { useState } from 'react'

const MONTHS = [
  '', 'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
]
const currentYear = new Date().getFullYear()
const YEARS = Array.from({ length: 91 }, (_, i) => currentYear - 10 - i)
const DAYS = Array.from({ length: 31 }, (_, i) => i + 1)

const selectStyle = {
  background: 'var(--bg-input)', color: 'var(--text)',
  border: '1px solid var(--border)', borderRadius: 8,
  padding: '12px 8px', fontSize: 16, width: '100%',
}

function isValidDOB(month, day, year) {
  if (!month || !day || !year) return false
  const d = new Date(year, month - 1, day)
  if (d.getMonth() !== month - 1 || d.getDate() !== day) return false
  const age = (Date.now() - d.getTime()) / (365.25 * 24 * 60 * 60 * 1000)
  return age >= 10 && age <= 100
}

function toDobString(month, day, year) {
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export default function StepDOB({ onNext }) {
  const [month, setMonth] = useState('')
  const [day, setDay] = useState('')
  const [year, setYear] = useState('')
  const valid = isValidDOB(Number(month), Number(day), Number(year))

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>When were you born?</h2>
      <p style={{ marginBottom: 24, color: 'var(--text-muted)' }}>
        Used to calculate your calorie target.
      </p>
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <div style={{ flex: 2 }}>
          <label className="label" htmlFor="dob-month">Month</label>
          <select id="dob-month" aria-label="Month" value={month} onChange={e => setMonth(e.target.value)} style={selectStyle}>
            <option value="">Month</option>
            {MONTHS.slice(1).map((m, i) => (
              <option key={m} value={i + 1}>{m}</option>
            ))}
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <label className="label" htmlFor="dob-day">Day</label>
          <select id="dob-day" aria-label="Day" value={day} onChange={e => setDay(e.target.value)} style={selectStyle}>
            <option value="">Day</option>
            {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div style={{ flex: 2 }}>
          <label className="label" htmlFor="dob-year">Year</label>
          <select id="dob-year" aria-label="Year" value={year} onChange={e => setYear(e.target.value)} style={selectStyle}>
            <option value="">Year</option>
            {YEARS.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>
      <button
        className="btn btn-primary"
        disabled={!valid}
        onClick={() => onNext({ dob: toDobString(Number(month), Number(day), Number(year)) })}
      >
        Next →
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd challo-fit-friend && npx vitest run src/onboarding/StepDOB.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd challo-fit-friend && git add src/onboarding/StepDOB.jsx src/onboarding/StepDOB.test.jsx
git commit -m "feat: add StepDOB onboarding step"
```

---

### Task 8: Rewrite StepStats

**Files:**
- Modify: `challo-fit-friend/src/onboarding/StepStats.jsx`
- Create: `challo-fit-friend/src/onboarding/StepStats.test.jsx`

Replaces raw number inputs with ScrollPickers. Adds sex toggle and imperial/metric toggle.

- [ ] **Step 1: Write the failing test**

Create `challo-fit-friend/src/onboarding/StepStats.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import StepStats from './StepStats'

describe('StepStats', () => {
  it('renders Weight and Height labels', () => {
    render(<StepStats onNext={() => {}} />)
    expect(screen.getByText('Weight')).toBeInTheDocument()
    expect(screen.getByText('Height')).toBeInTheDocument()
  })

  it('renders Male and Female sex toggle buttons', () => {
    render(<StepStats onNext={() => {}} />)
    expect(screen.getByRole('button', { name: 'Male' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Female' })).toBeInTheDocument()
  })

  it('Next button is enabled with default values', () => {
    render(<StepStats onNext={() => {}} />)
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
  })

  it('calls onNext with required shape', () => {
    const onNext = vi.fn()
    render(<StepStats onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({
      currentWeight: expect.any(Number),
      height: expect.any(Number),
      weightUnit: expect.any(String),
      heightUnit: expect.any(String),
      sex: expect.any(String),
    }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd challo-fit-friend && npx vitest run src/onboarding/StepStats.test.jsx
```

Expected: FAIL — Next button is disabled (old impl requires manual input).

- [ ] **Step 3: Rewrite StepStats.jsx**

Replace `challo-fit-friend/src/onboarding/StepStats.jsx`:

```jsx
import { useState } from 'react'
import ScrollPicker from '../components/ScrollPicker'

const LBS_OPTIONS = Array.from({ length: 321 }, (_, i) => String(80 + i))
const KG_OPTIONS = Array.from({ length: 166 }, (_, i) => String(35 + i))
const FEET_OPTIONS = ['3', '4', '5', '6', '7']
const INCHES_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i))
const CM_OPTIONS = Array.from({ length: 101 }, (_, i) => String(130 + i))

const pillBtn = (active) => ({
  flex: 1, padding: '10px 0', borderRadius: 8, border: 'none',
  cursor: 'pointer', fontWeight: 600,
  background: active ? 'var(--saffron)' : 'var(--bg-input)',
  color: active ? '#000' : 'var(--text-muted)',
})

export default function StepStats({ onNext }) {
  const [isMetric, setIsMetric] = useState(false)
  const [sex, setSex] = useState('m')
  const [weightLbs, setWeightLbs] = useState('160')
  const [weightKg, setWeightKg] = useState('73')
  const [feet, setFeet] = useState('5')
  const [inches, setInches] = useState('10')
  const [cm, setCm] = useState('178')

  const handleNext = () => {
    const weightUnit = isMetric ? 'kg' : 'lbs'
    const heightUnit = isMetric ? 'cm' : 'in'
    const currentWeight = isMetric ? Number(weightKg) : Number(weightLbs)
    const height = isMetric ? Number(cm) : Number(feet) * 12 + Number(inches)
    onNext({ currentWeight, height, weightUnit, heightUnit, sex })
  }

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Your current stats</h2>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={pillBtn(!isMetric)} onClick={() => setIsMetric(false)}>Imperial</button>
        <button style={pillBtn(isMetric)} onClick={() => setIsMetric(true)}>Metric</button>
      </div>

      <div className="label">Sex</div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button style={pillBtn(sex === 'm')} onClick={() => setSex('m')} aria-label="Male">Male</button>
        <button style={pillBtn(sex === 'f')} onClick={() => setSex('f')} aria-label="Female">Female</button>
      </div>

      <div className="label">Weight</div>
      <div style={{ marginBottom: 24 }}>
        {isMetric
          ? <ScrollPicker options={KG_OPTIONS} value={weightKg} onChange={setWeightKg} />
          : <ScrollPicker options={LBS_OPTIONS} value={weightLbs} onChange={setWeightLbs} />
        }
        <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
          {isMetric ? `${weightKg} kg` : `${weightLbs} lbs`}
        </div>
      </div>

      <div className="label">Height</div>
      <div style={{ marginBottom: 32 }}>
        {isMetric ? (
          <>
            <ScrollPicker options={CM_OPTIONS} value={cm} onChange={setCm} />
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {cm} cm
            </div>
          </>
        ) : (
          <>
            <div style={{ display: 'flex', gap: 16 }}>
              <div style={{ flex: 1 }}>
                <ScrollPicker options={FEET_OPTIONS} value={feet} onChange={setFeet} />
              </div>
              <div style={{ flex: 1 }}>
                <ScrollPicker options={INCHES_OPTIONS} value={inches} onChange={setInches} />
              </div>
            </div>
            <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 4 }}>
              {feet}' {inches}"
            </div>
          </>
        )}
      </div>

      <button className="btn btn-primary" onClick={handleNext}>Next →</button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd challo-fit-friend && npx vitest run src/onboarding/StepStats.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd challo-fit-friend && git add src/onboarding/StepStats.jsx src/onboarding/StepStats.test.jsx
git commit -m "feat: rewrite StepStats with ScrollPicker and sex toggle"
```

---

### Task 9: Update StepGoal

**Files:**
- Modify: `challo-fit-friend/src/onboarding/StepGoal.jsx`
- Create: `challo-fit-friend/src/onboarding/StepGoal.test.jsx`

Replace the raw number input for goal weight with a ScrollPicker.

- [ ] **Step 1: Write the failing test**

Create `challo-fit-friend/src/onboarding/StepGoal.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import StepGoal from './StepGoal'

describe('StepGoal', () => {
  it('renders goal weight picker and target date input', () => {
    render(<StepGoal weightUnit="lbs" onNext={() => {}} />)
    expect(screen.getByText(/goal weight/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // date input empty by default
  })

  it('Next button is disabled without a target date', () => {
    render(<StepGoal weightUnit="lbs" onNext={() => {}} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('calls onNext with goalWeight and targetDate when date is set', () => {
    const onNext = vi.fn()
    render(<StepGoal weightUnit="lbs" onNext={onNext} />)
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '2026-12-01' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({
      goalWeight: expect.any(Number),
      targetDate: '2026-12-01',
    }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd challo-fit-friend && npx vitest run src/onboarding/StepGoal.test.jsx
```

Expected: FAIL — Next button enabled (old impl) or ScrollPicker not found.

- [ ] **Step 3: Replace StepGoal.jsx**

```jsx
import { useState } from 'react'
import ScrollPicker from '../components/ScrollPicker'

const LBS_OPTIONS = Array.from({ length: 321 }, (_, i) => String(80 + i))
const KG_OPTIONS = Array.from({ length: 166 }, (_, i) => String(35 + i))

export default function StepGoal({ weightUnit = 'lbs', onNext }) {
  const isMetric = weightUnit === 'kg'
  const [goalWeight, setGoalWeight] = useState(isMetric ? '68' : '150')
  const [targetDate, setTargetDate] = useState('')
  const valid = !!targetDate

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Your goal</h2>
      <div className="label" style={{ marginBottom: 8 }}>Goal weight ({weightUnit})</div>
      <ScrollPicker
        options={isMetric ? KG_OPTIONS : LBS_OPTIONS}
        value={goalWeight}
        onChange={setGoalWeight}
      />
      <div style={{ textAlign: 'center', fontSize: 13, color: 'var(--text-muted)', marginTop: 4, marginBottom: 24 }}>
        {goalWeight} {weightUnit}
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

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd challo-fit-friend && npx vitest run src/onboarding/StepGoal.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd challo-fit-friend && git add src/onboarding/StepGoal.jsx src/onboarding/StepGoal.test.jsx
git commit -m "feat: update StepGoal with ScrollPicker for goal weight"
```

---

### Task 10: StepTDEE

**Files:**
- Create: `challo-fit-friend/src/onboarding/StepTDEE.jsx`
- Create: `challo-fit-friend/src/onboarding/StepTDEE.test.jsx`

Auto-calculates the full plan from accumulated profile data. Shows each target as a tappable card that opens a BottomSheet to tweak. Water card includes a unit toggle (glasses/cups/oz/ml). Derives `activityLevel` from `trainingDaysPerWeek`.

- [ ] **Step 1: Write the failing test**

Create `challo-fit-friend/src/onboarding/StepTDEE.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import StepTDEE from './StepTDEE'

const profile = {
  currentWeight: 180, weightUnit: 'lbs',
  height: 70, heightUnit: 'in',
  dob: '1993-01-01', sex: 'm',
  trainingDaysPerWeek: 4,
}

describe('StepTDEE', () => {
  it('renders the plan headline', () => {
    render(<StepTDEE profile={profile} onNext={() => {}} />)
    expect(screen.getByText(/based on your stats/i)).toBeInTheDocument()
  })

  it('renders calculated calorie target', () => {
    render(<StepTDEE profile={profile} onNext={() => {}} />)
    expect(screen.getByTestId('target-calories')).toBeInTheDocument()
  })

  it('calls onNext with full targets object', () => {
    const onNext = vi.fn()
    render(<StepTDEE profile={profile} onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: /let/i }))
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({
      calories: expect.any(Number),
      protein: expect.any(Number),
      fat: expect.any(Number),
      carbs: expect.any(Number),
      waterOz: expect.any(Number),
      steps: expect.any(Number),
      waterUnit: expect.any(String),
    }))
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd challo-fit-friend && npx vitest run src/onboarding/StepTDEE.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Create StepTDEE.jsx**

Create `challo-fit-friend/src/onboarding/StepTDEE.jsx`:

```jsx
import { useState } from 'react'
import BottomSheet from '../components/BottomSheet'
import {
  calcCalorieTarget, calcProteinTarget,
  calcFatTarget, calcCarbTarget, calcWaterTarget,
} from '../lib/calculations'

const WATER_UNITS = {
  glasses: { label: 'glasses', ozPer: 8 },
  cups: { label: 'cups', ozPer: 12 },
  oz: { label: 'oz', ozPer: 1 },
  ml: { label: 'ml', ozPer: 1 / 29.5735 },
}

const toWeightLbs = (w, unit) => unit === 'kg' ? w / 0.453592 : w
const toHeightIn = (h, unit) => unit === 'cm' ? h / 2.54 : h
const getActivityLevel = (days) => {
  if (!days || days <= 1) return 'sedentary'
  if (days <= 3) return 'light'
  if (days <= 5) return 'moderate'
  return 'active'
}

export default function StepTDEE({ profile, onNext }) {
  const weightLbs = toWeightLbs(profile.currentWeight || 160, profile.weightUnit)
  const heightIn = toHeightIn(profile.height || 70, profile.heightUnit)
  const activityLevel = profile.activityLevel || getActivityLevel(profile.trainingDaysPerWeek)

  const defaultCals = calcCalorieTarget({ weight: weightLbs, height: heightIn, dob: profile.dob, sex: profile.sex || 'm', activityLevel })
  const defaultProtein = calcProteinTarget(weightLbs)
  const defaultFat = calcFatTarget(defaultCals)
  const defaultCarbs = calcCarbTarget(defaultCals, defaultProtein, defaultFat)
  const defaultWaterOz = calcWaterTarget(weightLbs)

  const [calories, setCalories] = useState(defaultCals)
  const [protein, setProtein] = useState(defaultProtein)
  const [fat, setFat] = useState(defaultFat)
  const [carbs, setCarbs] = useState(defaultCarbs)
  const [waterOz, setWaterOz] = useState(defaultWaterOz)
  const [steps, setSteps] = useState(10000)
  const [waterUnit, setWaterUnit] = useState('oz')
  const [editing, setEditing] = useState(null)
  const [editVal, setEditVal] = useState('')

  const waterDisplay = Math.round(waterOz / WATER_UNITS[waterUnit].ozPer)

  const TARGETS = [
    { key: 'calories', label: 'Calories 🔥', value: calories, unit: 'kcal', set: setCalories },
    { key: 'protein', label: 'Protein 🍗', value: protein, unit: 'g', set: setProtein },
    { key: 'fat', label: 'Fat 🥑', value: fat, unit: 'g', set: setFat },
    { key: 'carbs', label: 'Carbs 🍚', value: carbs, unit: 'g', set: setCarbs },
    { key: 'steps', label: 'Steps 👟', value: steps, unit: 'steps', set: setSteps },
  ]

  const openEdit = (key, currentVal) => { setEditing(key); setEditVal(String(currentVal)) }

  const confirmEdit = () => {
    const n = Number(editVal)
    if (!n || n <= 0) return
    if (editing === 'water') {
      setWaterOz(Math.round(n * WATER_UNITS[waterUnit].ozPer))
    } else {
      const t = TARGETS.find(t => t.key === editing)
      if (t) t.set(n)
    }
    setEditing(null)
  }

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Based on your stats, here's your plan 👇</h2>
      <p style={{ marginBottom: 24, color: 'var(--text-muted)' }}>Tap ✏️ to adjust anything.</p>

      {TARGETS.map(({ key, label, value, unit }) => (
        <div key={key} className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
          <div>
            <div className="label">{label}</div>
            <div data-testid={`target-${key}`} style={{ fontSize: 22, fontWeight: 700 }}>
              {value.toLocaleString()}
              <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 4 }}>{unit}</span>
            </div>
          </div>
          <button onClick={() => openEdit(key, value)}
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>
            ✏️
          </button>
        </div>
      ))}

      {/* Water card with unit toggle */}
      <div className="card" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <div className="label">Water 💧</div>
            <div data-testid="target-water" style={{ fontSize: 22, fontWeight: 700 }}>
              {waterDisplay}
              <span style={{ fontSize: 14, color: 'var(--text-muted)', marginLeft: 4 }}>{waterUnit}</span>
            </div>
          </div>
          <button onClick={() => openEdit('water', waterDisplay)}
            style={{ background: 'none', border: 'none', fontSize: 18, cursor: 'pointer', color: 'var(--text-muted)' }}>
            ✏️
          </button>
        </div>
        <div style={{ display: 'flex', gap: 6, marginTop: 12 }}>
          {Object.keys(WATER_UNITS).map(u => (
            <button key={u} onClick={() => setWaterUnit(u)} style={{
              flex: 1, padding: '6px 0', borderRadius: 6, border: 'none', cursor: 'pointer', fontSize: 12,
              background: waterUnit === u ? 'var(--saffron)' : 'var(--bg-input)',
              color: waterUnit === u ? '#000' : 'var(--text-muted)',
              fontWeight: waterUnit === u ? 700 : 400,
            }}>
              {u}
            </button>
          ))}
        </div>
      </div>

      <button className="btn btn-primary" onClick={() => onNext({ calories, protein, fat, carbs, waterOz, steps, waterUnit })}>
        Let's go 🚀
      </button>

      <BottomSheet isOpen={!!editing} onClose={() => setEditing(null)} title={`Edit ${editing}`}>
        <input
          type="number" value={editVal}
          onChange={e => setEditVal(e.target.value)}
          style={{ marginBottom: 16 }} autoFocus
        />
        <button className="btn btn-primary" onClick={confirmEdit}>Save</button>
      </BottomSheet>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd challo-fit-friend && npx vitest run src/onboarding/StepTDEE.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd challo-fit-friend && git add src/onboarding/StepTDEE.jsx src/onboarding/StepTDEE.test.jsx
git commit -m "feat: add StepTDEE with auto-calculated plan and BottomSheet tweaking"
```

---

### Task 11: Wire up OnboardingFlow

**Files:**
- Modify: `challo-fit-friend/src/onboarding/OnboardingFlow.jsx`

Adds StepDOB as step 2, replaces StepTargets with StepTDEE, adds animated step transitions, adds back button.

- [ ] **Step 1: Replace OnboardingFlow.jsx**

```jsx
import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import StepName from './StepName'
import StepDOB from './StepDOB'
import StepStats from './StepStats'
import StepGoal from './StepGoal'
import StepTraining from './StepTraining'
import StepTDEE from './StepTDEE'
import { saveProfile as persistProfile, setActiveProfileId } from '../storage'

const genId = () => Math.random().toString(36).slice(2)

const slideVariants = {
  enter: (dir) => ({ x: dir > 0 ? '100%' : '-100%', opacity: 0 }),
  center: { x: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeInOut' } },
  exit: (dir) => ({ x: dir > 0 ? '-100%' : '100%', opacity: 0, transition: { duration: 0.28, ease: 'easeInOut' } }),
}

export default function OnboardingFlow({ onComplete }) {
  const [step, setStep] = useState(0)
  const [direction, setDirection] = useState(1)
  const [data, setData] = useState({})
  const [done, setDone] = useState(false)
  const [finalName, setFinalName] = useState('')
  const [completionProfile, setCompletionProfile] = useState(null)

  useEffect(() => {
    if (!completionProfile) return
    const timer = setTimeout(() => onComplete(completionProfile), 1800)
    return () => clearTimeout(timer)
  }, [completionProfile, onComplete])

  const TOTAL_STEPS = 6

  const advance = (updates) => {
    setDirection(1)
    if (step < TOTAL_STEPS - 1) {
      setData(prev => ({ ...prev, ...updates }))
      setStep(s => s + 1)
    } else {
      const profile = {
        id: genId(),
        name: data.name,
        dob: data.dob,
        sex: data.sex || 'm',
        currentWeight: data.currentWeight,
        height: data.height,
        weightUnit: data.weightUnit,
        heightUnit: data.heightUnit,
        goalWeight: data.goalWeight,
        targetDate: data.targetDate,
        trainingDays: data.trainingDays,
        trainingDaysPerWeek: data.trainingDaysPerWeek,
        workoutLabels: data.workoutLabels,
        waterUnit: updates.waterUnit || 'oz',
        targets: {
          calories: updates.calories,
          protein: updates.protein,
          fat: updates.fat,
          carbs: updates.carbs,
          waterOz: updates.waterOz,
          steps: updates.steps,
        },
        calorieGuardrails: { underPercent: 60, overPercent: 110 },
        createdAt: new Date().toISOString().split('T')[0],
      }
      // Persist synchronously before animation delay — prevents data loss on reload
      persistProfile(profile)
      setActiveProfileId(profile.id)
      setFinalName(data.name)
      setDone(true)
      setCompletionProfile(profile)
    }
  }

  const goBack = () => {
    if (step === 0) return
    setDirection(-1)
    setStep(s => s - 1)
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
    <StepDOB onNext={advance} />,
    <StepStats onNext={advance} />,
    <StepGoal weightUnit={data.weightUnit || 'lbs'} onNext={advance} />,
    <StepTraining onNext={advance} />,
    <StepTDEE profile={data} onNext={advance} />,
  ]

  return (
    <div style={{ overflow: 'hidden' }}>
      <div style={{ padding: '16px 16px 0', display: 'flex', gap: 4 }}>
        {STEPS.map((_, i) => (
          <div key={i} style={{
            flex: 1, height: 3, borderRadius: 2,
            background: i <= step ? 'var(--saffron)' : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>
      {step > 0 && (
        <button onClick={goBack} style={{
          background: 'none', border: 'none', color: 'var(--saffron)',
          cursor: 'pointer', padding: '8px 16px', fontSize: 16,
        }}>
          ← Back
        </button>
      )}
      <AnimatePresence mode="wait" custom={direction}>
        <motion.div
          key={step}
          custom={direction}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
        >
          {STEPS[step]}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
```

- [ ] **Step 2: Verify build succeeds**

```bash
cd challo-fit-friend && npx vite build 2>&1 | tail -5
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd challo-fit-friend && git add src/onboarding/OnboardingFlow.jsx
git commit -m "feat: wire up 6-step onboarding with StepDOB, StepTDEE, slide transitions, back button"
```

---

## Chunk 4: Food Entry + UI Polish

### Task 12: ManualEntryForm

**Files:**
- Create: `challo-fit-friend/src/screens/food/ManualEntryForm.jsx`
- Create: `challo-fit-friend/src/screens/food/ManualEntryForm.test.jsx`

Primary food entry form. Accepts optional `initialValues` for scanner pre-fill. Has `onScanInstead` callback for the secondary scanner path.

- [ ] **Step 1: Write the failing test**

Create `challo-fit-friend/src/screens/food/ManualEntryForm.test.jsx`:

```jsx
import { render, screen, fireEvent } from '@testing-library/react'
import ManualEntryForm from './ManualEntryForm'

describe('ManualEntryForm', () => {
  it('renders required fields', () => {
    render(<ManualEntryForm onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByPlaceholderText('Product name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Calories')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Protein')).toBeInTheDocument()
  })

  it('calls onSave with correct food item shape on valid submission', () => {
    const onSave = vi.fn()
    render(<ManualEntryForm onSave={onSave} onCancel={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('Product name'), { target: { value: 'Oats' } })
    fireEvent.change(screen.getByPlaceholderText('Serving size'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('Calories'), { target: { value: '389' } })
    fireEvent.change(screen.getByPlaceholderText('Protein'), { target: { value: '17' } })
    fireEvent.change(screen.getByPlaceholderText('Fat'), { target: { value: '7' } })
    fireEvent.change(screen.getByPlaceholderText('Carbs'), { target: { value: '66' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Oats',
      perServing: expect.objectContaining({ calories: 389, protein: 17 }),
    }))
  })

  it('renders scan link when onScanInstead provided', () => {
    const onScanInstead = vi.fn()
    render(<ManualEntryForm onSave={() => {}} onCancel={() => {}} onScanInstead={onScanInstead} />)
    fireEvent.click(screen.getByText(/scan label instead/i))
    expect(onScanInstead).toHaveBeenCalledTimes(1)
  })
})
```

- [ ] **Step 2: Run test to verify it fails**

```bash
cd challo-fit-friend && npx vitest run src/screens/food/ManualEntryForm.test.jsx
```

Expected: FAIL

- [ ] **Step 3: Create ManualEntryForm.jsx**

Create `challo-fit-friend/src/screens/food/ManualEntryForm.jsx`:

```jsx
import { useState } from 'react'

const genId = () => Math.random().toString(36).slice(2)
const EMPTY = { name: '', brand: '', servingSize: '', servingUnit: 'g', calories: '', protein: '', fat: '', carbs: '' }
const SERVING_UNITS = ['g', 'ml', 'oz', 'cup', 'tbsp', 'tsp', 'piece']

export default function ManualEntryForm({ onSave, onCancel, onScanInstead, initialValues }) {
  const [form, setForm] = useState({ ...EMPTY, ...initialValues })
  const [error, setError] = useState('')
  const set = (key) => (e) => setForm(f => ({ ...f, [key]: e.target.value }))

  const handleSave = () => {
    const required = ['name', 'servingSize', 'calories', 'protein', 'fat', 'carbs']
    const missing = required.filter(k => !form[k])
    if (missing.length) { setError(`Please fill in: ${missing.join(', ')}`); return }
    onSave({
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
    })
  }

  return (
    <div className="screen">
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', marginBottom: 8, fontSize: 16 }}>
        ← Back
      </button>
      <h1>Add food item</h1>
      {onScanInstead && (
        <button onClick={onScanInstead} style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', marginBottom: 20, fontSize: 14, textDecoration: 'underline', padding: 0 }}>
          Scan label instead 📸
        </button>
      )}
      {[
        { key: 'name', label: 'Product name *', placeholder: 'Product name', type: 'text' },
        { key: 'brand', label: 'Brand', placeholder: 'Brand (optional)', type: 'text' },
      ].map(({ key, label, placeholder, type }) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <div className="label">{label}</div>
          <input type={type} placeholder={placeholder} value={form[key]} onChange={set(key)} />
        </div>
      ))}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <div style={{ flex: 2 }}>
          <div className="label">Serving size *</div>
          <input type="number" placeholder="Serving size" value={form.servingSize} onChange={set('servingSize')} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="label">Unit</div>
          <select value={form.servingUnit} onChange={set('servingUnit')}
            style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 16 }}>
            {SERVING_UNITS.map(u => <option key={u} value={u}>{u}</option>)}
          </select>
        </div>
      </div>
      {[
        { key: 'calories', label: 'Calories (kcal) *', placeholder: 'Calories' },
        { key: 'protein', label: 'Protein (g) *', placeholder: 'Protein' },
        { key: 'fat', label: 'Fat (g) *', placeholder: 'Fat' },
        { key: 'carbs', label: 'Carbs (g) *', placeholder: 'Carbs' },
      ].map(({ key, label, placeholder }) => (
        <div key={key} style={{ marginBottom: 12 }}>
          <div className="label">{label}</div>
          <input type="number" placeholder={placeholder} value={form[key]} onChange={set(key)} />
        </div>
      ))}
      {error && <p style={{ color: 'var(--chili)', marginBottom: 12 }}>{error}</p>}
      <button className="btn btn-primary" onClick={handleSave} style={{ marginBottom: 8 }}>
        Save to library 👨‍🍳
      </button>
    </div>
  )
}
```

- [ ] **Step 4: Run tests to verify they pass**

```bash
cd challo-fit-friend && npx vitest run src/screens/food/ManualEntryForm.test.jsx
```

Expected: PASS

- [ ] **Step 5: Commit**

```bash
cd challo-fit-friend && git add src/screens/food/ManualEntryForm.jsx src/screens/food/ManualEntryForm.test.jsx
git commit -m "feat: add ManualEntryForm as primary food entry"
```

---

### Task 13: Update FoodScreen

**Files:**
- Modify: `challo-fit-friend/src/screens/FoodScreen.jsx`

Default "Add" button opens ManualEntryForm. FoodScanner accessible from inside ManualEntryForm via "Scan label instead" link. Scanner cancel goes back to manual form.

- [ ] **Step 1: Replace FoodScreen.jsx**

```jsx
import { useState } from 'react'
import { useDailyLog } from '../hooks/useDailyLog'
import { useFoodLibrary } from '../hooks/useFoodLibrary'
import { getDailyLog } from '../storage'
import { calcWeeklyAverage } from '../lib/calculations'
import MacroTracker from './food/MacroTracker'
import FoodLibrary from './food/FoodLibrary'
import MealBuilder from './food/MealBuilder'
import FoodScanner from './food/FoodScanner'
import ManualEntryForm from './food/ManualEntryForm'

function WeeklyMacroAverage({ profileId }) {
  const today = new Date()
  const logs = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today)
    d.setDate(d.getDate() - i)
    const key = d.toISOString().split('T')[0]
    const log = getDailyLog(profileId, key)
    if (log.calories > 0) logs.push(log)
  }
  if (logs.length === 0) return null
  return (
    <div className="card" style={{ marginBottom: 12 }}>
      <div className="label" style={{ marginBottom: 8 }}>7-day average</div>
      <div style={{ display: 'flex', gap: 12 }}>
        {['calories', 'protein', 'fat', 'carbs'].map(k => (
          <div key={k} style={{ flex: 1, textAlign: 'center' }}>
            <div style={{ fontWeight: 700 }}>{calcWeeklyAverage(logs, k)}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k === 'calories' ? 'kcal' : 'g'}</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{k}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

export default function FoodScreen({ profile }) {
  const { log, logMeal } = useDailyLog(profile.id)
  const { library, addItem, removeItem } = useFoodLibrary()
  const [view, setView] = useState('main') // 'main' | 'manual' | 'scanner' | 'build'
  const [selectedItem, setSelectedItem] = useState(null)
  const [toast, setToast] = useState(null)

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 2500) }

  const handleSaveItem = (item) => {
    const isFirst = library.length === 0
    addItem(item)
    if (isFirst) showToast('First ingredient in — your kitchen is open 👨‍🍳')
    setView('main')
  }

  const handleLog = (mealEntry) => {
    logMeal({ foodItemId: mealEntry.id, name: mealEntry.name, quantity: mealEntry.quantity, macros: mealEntry.macros })
    showToast('Meal locked in — macros calculated, chef approved 🤌')
    setView('main')
    setSelectedItem(null)
  }

  if (view === 'manual') {
    return <ManualEntryForm onSave={handleSaveItem} onCancel={() => setView('main')} onScanInstead={() => setView('scanner')} />
  }
  if (view === 'scanner') {
    return <FoodScanner onSave={handleSaveItem} onCancel={() => setView('manual')} />
  }
  if (view === 'build' && selectedItem) {
    return <MealBuilder item={selectedItem} onLog={handleLog} onCancel={() => setView('main')} />
  }

  return (
    <div className="screen">
      {toast && <div className="nudge">{toast}</div>}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h1>Food 🍽️</h1>
        <button className="btn btn-primary" style={{ width: 'auto', padding: '8px 16px' }} onClick={() => setView('manual')}>
          + Add
        </button>
      </div>
      <MacroTracker log={log} profile={profile} />
      <WeeklyMacroAverage profileId={profile.id} />
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

- [ ] **Step 2: Verify build**

```bash
cd challo-fit-friend && npx vite build 2>&1 | tail -5
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
cd challo-fit-friend && git add src/screens/FoodScreen.jsx
git commit -m "feat: make ManualEntryForm primary food entry, scanner is secondary"
```

---

### Task 14: FoodLibrary with SwipeableCard

**Files:**
- Modify: `challo-fit-friend/src/screens/food/FoodLibrary.jsx`

- [ ] **Step 1: Replace FoodLibrary.jsx**

```jsx
import SwipeableCard from '../../components/SwipeableCard'

export default function FoodLibrary({ library, onSelect, onDelete }) {
  if (library.length === 0) {
    return (
      <div className="card" style={{ textAlign: 'center', padding: 32 }}>
        <div style={{ fontSize: 40, marginBottom: 8 }}>🍽️</div>
        <p>Your menu is empty — tap + Add to get started.</p>
      </div>
    )
  }

  return (
    <div>
      <p style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 8 }}>← Swipe left to delete</p>
      {library.map(item => (
        <SwipeableCard key={item.id} onDelete={() => onDelete(item.id)}>
          <div className="card" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: 12, marginBottom: 0 }}>
            <div>
              <div style={{ fontWeight: 600 }}>{item.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                {item.perServing.calories} kcal · {item.perServing.protein}g protein · per {item.servingSize}{item.servingUnit}
              </div>
            </div>
            <button onClick={() => onSelect(item)}
              style={{ background: 'var(--saffron)', color: '#000', border: 'none', borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontWeight: 600, flexShrink: 0 }}>
              Add
            </button>
          </div>
        </SwipeableCard>
      ))}
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd challo-fit-friend && npx vite build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd challo-fit-friend && git add src/screens/food/FoodLibrary.jsx
git commit -m "feat: FoodLibrary items wrapped in SwipeableCard for swipe-to-delete"
```

---

### Task 15: App.jsx screen transitions

**Files:**
- Modify: `challo-fit-friend/src/App.jsx`

- [ ] **Step 1: Replace App.jsx**

```jsx
import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
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

const pageVariants = {
  initial: { x: '100%', opacity: 0 },
  animate: { x: 0, opacity: 1, transition: { duration: 0.28, ease: 'easeInOut' } },
  exit: { x: '-100%', opacity: 0, transition: { duration: 0.28, ease: 'easeInOut' } },
}

export default function App() {
  const { profiles, activeProfile, addOrUpdateProfile, removeProfile, switchProfile } = useProfile()
  const [tab, setTab] = useState('home')
  const [showSettings, setShowSettings] = useState(false)

  if (profiles.length === 0) {
    return (
      <OnboardingFlow
        onComplete={(profile) => { addOrUpdateProfile(profile); switchProfile(profile.id) }}
      />
    )
  }

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
      <SettingsScreen
        profile={activeProfile}
        onUpdate={addOrUpdateProfile}
        onBack={() => setShowSettings(false)}
      />
    )
  }

  const screenProps = { profile: activeProfile, onOpenSettings: () => setShowSettings(true) }
  const SCREENS = {
    home: <HomeScreen {...screenProps} />,
    food: <FoodScreen {...screenProps} />,
    water: <WaterScreen {...screenProps} />,
    progress: <ProgressScreen {...screenProps} />,
    workout: <WorkoutScreen {...screenProps} />,
  }

  return (
    <div style={{ position: 'relative', overflow: 'hidden' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          variants={pageVariants}
          initial="initial"
          animate="animate"
          exit="exit"
          style={{ width: '100%' }}
        >
          {SCREENS[tab]}
        </motion.div>
      </AnimatePresence>
      <BottomNav activeTab={tab} onTabChange={setTab} />
    </div>
  )
}
```

- [ ] **Step 2: Verify build**

```bash
cd challo-fit-friend && npx vite build 2>&1 | tail -5
```

- [ ] **Step 3: Commit**

```bash
cd challo-fit-friend && git add src/App.jsx
git commit -m "feat: add AnimatePresence screen transitions"
```

---

### Task 16: Micro-animations

**Files:**
- Modify: `challo-fit-friend/src/screens/WaterScreen.jsx`
- Modify: `challo-fit-friend/src/components/MacroCard.jsx`

- [ ] **Step 1: Add whileTap to WaterScreen tap button**

In `challo-fit-friend/src/screens/WaterScreen.jsx`, add at top:

```jsx
import { motion } from 'framer-motion'
```

Replace the tap button (the one with `+ {tapAmount}{unit}`):

```jsx
<motion.button
  className="btn btn-primary"
  style={{ fontSize: 20, padding: 20, marginBottom: 12 }}
  whileTap={{ scale: 0.90 }}
  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
  onClick={logWater}
>
  + {tapAmount}{unit}
</motion.button>
```

- [ ] **Step 2: Add stagger animation to MacroCard rows**

Replace `challo-fit-friend/src/components/MacroCard.jsx`:

```jsx
import { motion } from 'framer-motion'
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
      {['calories', 'protein', 'carbs', 'fat'].map((key, index) => {
        const meta = MACRO_META[key]
        const value = log[key] ?? 0
        const target = targets[key] ?? 0
        const diff = target - value
        const sublabel = diff >= 0
          ? `${diff} ${meta.unit} left`
          : `${Math.abs(diff)} ${meta.unit} over`
        return (
          <motion.div
            key={key}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.06, duration: 0.25, ease: 'easeOut' }}
          >
            <ProgressBar
              value={value}
              max={target}
              color={meta.color}
              label={meta.label}
              sublabel={sublabel}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
```

- [ ] **Step 3: Run all tests**

```bash
cd challo-fit-friend && npx vitest run
```

Expected: all tests pass

- [ ] **Step 4: Verify build**

```bash
cd challo-fit-friend && npx vite build 2>&1 | tail -5
```

Expected: no errors

- [ ] **Step 5: Commit**

```bash
cd challo-fit-friend && git add src/screens/WaterScreen.jsx src/components/MacroCard.jsx
git commit -m "feat: micro-animations — water tap whileTap, MacroCard stagger fade-in"
```
