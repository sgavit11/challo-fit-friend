# Challo Fit Friend V2 — Design Spec

**Date:** 2026-03-16
**Status:** Approved
**Project:** `challo-fit-friend`

---

## Overview

V2 addresses critical bugs, onboarding UX gaps, and a modern animated UI feel. Four areas of change: storage reliability, onboarding redesign, food entry flow, and Framer Motion animations.

---

## 1. Storage Audit & Fix

**Problem:** The storage layer (`src/storage/index.js`) writes all data to localStorage via well-defined hooks, but a race condition in the onboarding completion flow can leave `activeId` unset. The 1800ms delay in `OnboardingFlow` before calling `onComplete` means a page reload during that window results in profiles existing but no active profile ID written — the app shows an empty profile switcher instead of the main screen.

**Fix:**
- Call `setActiveProfileId` synchronously when `setCompletionProfile` fires, not after the delay.
- Add a boot-time integrity check in `useProfile`: if `activeId` is set but no matching profile exists, clear the stale ID from localStorage.
- Audit all hooks (`useDailyLog`, `useWeightLog`, `useFoodLibrary`) to confirm reads are consistent on mount after a hard refresh.

---

## 2. Onboarding Redesign

### New 6-step flow (was 5)

| Step | Component | Change |
|------|-----------|--------|
| 1 | `StepName` | Unchanged |
| 2 | `StepDOB` | **New.** Month/day/year inputs. App calculates age at runtime. |
| 3 | `StepStats` | **Rewritten.** ScrollPicker for weight + height. Sex toggle (Male/Female). |
| 4 | `StepGoal` | **Updated.** Goal weight uses ScrollPicker. |
| 5 | `StepTraining` | Unchanged (collects training days + activity level). |
| 6 | `StepTDEE` | **Replaces StepTargets.** Auto-calculated plan reveal with inline tweaking. |

### StepDOB
- Three numeric inputs: Month / Day / Year.
- Validates that the entered date is a real date and results in an age between 10–100.
- Profile stores `dob` as `YYYY-MM-DD` string; age is computed at calculation time.

### StepStats
- **Weight:** `ScrollPicker` with numeric values. Lbs/kg toggle switches the value range.
- **Height (imperial):** Two `ScrollPicker`s side by side — feet (3–7) and inches (0–11). Displayed as e.g. `5' 11"`.
- **Height (metric):** Single `ScrollPicker` for cm (100–250).
- **Sex toggle:** Male / Female pill toggle. Affects Harris-Benedict BMR formula.
- Unit selection (imperial/metric) shown at top, switches both height and weight pickers.

### StepGoal
- Goal weight uses same `ScrollPicker` as StepStats (same unit as chosen in step 3).
- Target date input unchanged (date picker or manual entry).

### StepTDEE (replaces StepTargets)
- Headline: *"Based on your stats, here's your plan 👇"*
- Displays auto-calculated values in read-only cards: Calories, Protein, Fat, Carbs, Water.
- Each card has a small pencil/edit icon. Tapping opens a `BottomSheet` with a number input.
- **Water unit selection** is on this screen: a unit toggle (glasses · cups · oz · litres) sits next to the water card. Internally water is always stored in oz; display and input convert accordingly.
- After tweaking (or not), user taps "Let's go 🚀" to confirm.

### calculations.js updates
- `calcCalorieTarget` accepts `dob` (string `YYYY-MM-DD`) and derives `age` at call time.
- `calcCalorieTarget` accepts `sex` (`'m'` | `'f'`).
- `calcWaterTarget` updated to accept `weightLbs` and return `weightLbs * 0.5` oz (standard hydration formula), replacing the hardcoded `96`.

---

## 3. Food Entry Redesign

### Primary flow: Manual entry
- `FoodScreen`'s "Add food" button goes directly to a clean `ManualEntryForm` component (extracted from the current `confirm` stage of `FoodScanner`).
- Fields: name, brand, serving size + unit, calories, protein, fat, carbs.
- **"Scan label instead 📸"** link at the top of the form opens the existing scanner flow.

### Secondary flow: Scanner
- `FoodScanner` remains intact but is accessed only via the secondary link.
- No changes to scanner logic; it still populates the form on success.

### FoodLibrary
- Items rendered as `SwipeableCard`s.
- Swipe left reveals a red delete zone with a trash icon. Release past threshold confirms delete.

---

## 4. Framer Motion UI

### Dependency
- Add `framer-motion` to `package.json`.

### Screen transitions
- `AnimatePresence` wraps the active screen in `App.jsx`.
- Variant: slide in from right on forward navigation, slide out to left on back.
- Onboarding steps use the same pattern — step direction (forward/back) determines slide direction.
- Duration: 280ms, ease: `easeInOut`.

### Micro-animations
- All `.btn-primary` and `.btn-secondary` elements get `whileTap={{ scale: 0.96 }}`.
- Water tap button gets `whileTap={{ scale: 0.90 }}` for a more satisfying press.
- MacroCards on HomeScreen animate in with staggered `fadeInUp` (delay: `index * 0.06s`).
- Confetti component already exists — no changes needed.

### SwipeableCard component
- `motion.div` with `drag="x"`.
- `dragConstraints={{ left: -80, right: 0 }}` — can only drag left.
- When dragged past –60px threshold and released, triggers delete callback.
- Red delete zone (`position: absolute`, right side) fades in as drag progresses using `useMotionValueEvent`.

### BottomSheet component
- `motion.div` fixed to bottom of viewport, slides up with `initial={{ y: '100%' }}` → `animate={{ y: 0 }}`.
- Spring config: `{ type: 'spring', damping: 30, stiffness: 300 }`.
- Drag handle at top (`height: 4px`, centered, rounded).
- Drag down past 80px threshold dismisses (`onDragEnd` handler).
- Semi-transparent backdrop (`motion.div`) fades in/out behind it.

### ScrollPicker component
- Pure CSS implementation using `overflow-y: scroll` + `scroll-snap-type: y mandatory`.
- Each option: fixed height (44px), `scroll-snap-align: center`.
- Active item (center position) highlighted via a fixed overlay band.
- `onScroll` event reads `scrollTop / itemHeight` to derive selected value.
- No Framer Motion — native scroll snap is smoother on mobile.

---

## Component Map

### New components
| Component | Path | Purpose |
|-----------|------|---------|
| `ScrollPicker` | `src/components/ScrollPicker.jsx` | Drum-roll style scroll selector |
| `BottomSheet` | `src/components/BottomSheet.jsx` | Slide-up modal with drag dismiss |
| `SwipeableCard` | `src/components/SwipeableCard.jsx` | Horizontal swipe with action reveal |
| `ManualEntryForm` | `src/screens/food/ManualEntryForm.jsx` | Primary food entry form |

### Modified components
| Component | Path | Change |
|-----------|------|--------|
| `StepStats` | `src/onboarding/StepStats.jsx` | Rewrite with ScrollPicker + sex toggle |
| `StepGoal` | `src/onboarding/StepGoal.jsx` | Goal weight → ScrollPicker |
| `StepTargets → StepTDEE` | `src/onboarding/StepTDEE.jsx` | Replace with auto-calc reveal |
| `OnboardingFlow` | `src/onboarding/OnboardingFlow.jsx` | Add StepDOB, replace StepTargets with StepTDEE |
| `App` | `src/App.jsx` | Add AnimatePresence, fix storage race |
| `FoodScanner` | `src/screens/food/FoodScanner.jsx` | Demote to secondary flow |
| `FoodScreen` | `src/screens/FoodScreen.jsx` | Default to ManualEntryForm |
| `FoodLibrary` | `src/screens/food/FoodLibrary.jsx` | Wrap items in SwipeableCard |
| `calculations` | `src/lib/calculations.js` | Accept dob + sex, update water formula |
| `useProfile` | `src/hooks/useProfile.js` | Add boot-time integrity check |

### New onboarding step
| Component | Path | Purpose |
|-----------|------|---------|
| `StepDOB` | `src/onboarding/StepDOB.jsx` | Date of birth collection |

---

## Data Model Changes

```js
// Profile (additions)
{
  dob: 'YYYY-MM-DD',       // replaces implicit age=25 default
  sex: 'm' | 'f',          // new
  waterUnit: 'oz' | 'ml' | 'glasses' | 'cups',  // already on profile, now set during onboarding
}
```

Existing profiles without `dob` or `sex` fall back to `age: 30` and `sex: 'm'` at calculation time — no migration needed.

---

## Out of Scope

- React Router / browser history navigation
- Server-side persistence or user accounts
- Barcode scanning (separate from label photo scanning)
- Workout logging redesign
