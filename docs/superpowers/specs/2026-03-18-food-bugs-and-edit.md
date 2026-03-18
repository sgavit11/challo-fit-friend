# Spec: Food Tab Bug Fixes + Edit Recipes/Ingredients
Date: 2026-03-18

## Scope
1. Bug: NaN fat/carbs targets in MacroRings (DailyLogView)
2. Bug: Food tab meals not syncing to home screen
3. Feature: Edit ingredients (all fields)
4. Feature: Edit recipe metadata (name, notes, photo only — not ingredients list)

---

## Bug 1 — NaN Targets in MacroRings

**Root cause:** `DailyLogView.jsx` recalculates targets using `calcCalorieTarget(activeProfile)` but the profile stores `currentWeight` not `weight`. Result: all derived targets (fat, carbs, calories) are NaN. Protein accidentally works via a `?? 160` fallback.

**Fix:** Replace the useMemo recalculation with `activeProfile.targets` directly. The profile already stores `{ calories, protein, fat, carbs }` from onboarding. No recalculation needed.

```js
const targets = useMemo(() => {
  if (!activeProfile?.targets) return { calories: 2000, protein: 150, carbs: 200, fat: 65 }
  const { calories, protein, carbs, fat } = activeProfile.targets
  return { calories, protein, carbs, fat }
}, [activeProfile])
```

**Files:** `src/components/food/DailyLogView.jsx` — replace targets useMemo only.

---

## Bug 2 — Food Tab Meals Not Syncing to Home Screen

**Root cause:** Home screen reads from localStorage via `useDailyLog(profile.id)`. Food tab writes to Supabase `daily_log`. The two stores never sync.

**Fix:** After every successful `addEntry` or `removeEntry` in `useFoodLog`, mirror the new macro totals to localStorage using `updateDailyLog`. Use `getActiveProfileId()` from storage to get the profile ID without needing a prop.

```js
// After setEntries in addEntry and removeEntry:
import { getActiveProfileId } from '../storage'
import { getDailyLog, updateDailyLog } from '../storage'

const syncLocalStorage = (updatedEntries, date) => {
  const profileId = getActiveProfileId()
  if (!profileId) return
  const totals = sumMacros(updatedEntries)
  updateDailyLog(profileId, date, {
    calories: totals.calories,
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
  })
}
```

Call `syncLocalStorage(newEntries, dateStr)` after updating `entries` state in both `addEntry` and `removeEntry`.

**Files:** `src/hooks/useFoodLog.js` only.

---

## Feature 3 — Edit Ingredients

**Scope:** All fields — name, serving_size, calories, protein, carbs, fat.

**UX:** In `IngredientLibrary.jsx`, add a pencil icon button on each ingredient row. Tapping sets `editingId` state. The row expands inline (or replaces with) a pre-filled form matching the existing add-ingredient form fields. Save / Cancel buttons. On save, call `updateIngredient`.

**New hook function** in `useIngredients.js`:
```js
const updateIngredient = async (id, fields) => {
  const { data, error } = await supabase
    .from('ingredients')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) return { error }
  setIngredients(prev => prev.map(i => i.id === id ? data : i))
  return { data }
}
```
Return `updateIngredient` from the hook.

**Files:** `src/hooks/useIngredients.js`, `src/components/food/IngredientLibrary.jsx`

---

## Feature 4 — Edit Recipe Metadata

**Scope:** name, notes, photo_url only. Ingredient list is not editable.

**UX:** Add a pencil icon button to `RecipeCard.jsx`. Tapping calls an `onEdit` prop passed down from `RecipeLibrary`. `RecipeLibrary` manages `editingRecipe` state. When set, renders a `BottomSheet` containing:
- Text input for name (pre-filled)
- Textarea for notes (pre-filled)
- `PhotoUpload` component for photo (pre-filled with existing photo_url)
- Save / Cancel buttons

On save, call `updateRecipe`. BottomSheet closes.

**New hook function** in `useRecipes.js`:
```js
const updateRecipe = async (id, { name, notes, photo_url }) => {
  const { data, error } = await supabase
    .from('recipes')
    .update({ name, notes: notes || null, photo_url: photo_url || null })
    .eq('id', id)
    .select()
    .single()
  if (error) return { error: error.message }
  setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
  return { data }
}
```

**Files:** `src/hooks/useRecipes.js`, `src/components/food/RecipeCard.jsx`, `src/components/food/RecipeLibrary.jsx`

---

## File Change Summary

| File | Change |
|------|--------|
| `src/components/food/DailyLogView.jsx` | Fix targets useMemo |
| `src/hooks/useFoodLog.js` | Add localStorage sync after mutations |
| `src/hooks/useIngredients.js` | Add updateIngredient |
| `src/components/food/IngredientLibrary.jsx` | Add edit UI per row |
| `src/hooks/useRecipes.js` | Add updateRecipe |
| `src/components/food/RecipeCard.jsx` | Add onEdit prop + pencil button |
| `src/components/food/RecipeLibrary.jsx` | Manage editingRecipe state + BottomSheet |

No new files needed. No schema changes needed.
