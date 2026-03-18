# Plan: Food Tab Bug Fixes + Edit Recipes/Ingredients
Date: 2026-03-18
Spec: docs/superpowers/specs/2026-03-18-food-bugs-and-edit.md

## Step 1 — Fix NaN targets in DailyLogView
**File:** `src/components/food/DailyLogView.jsx`

Replace the entire `targets` useMemo (lines ~50–57) with:
```js
const targets = useMemo(() => {
  if (!activeProfile?.targets) return { calories: 2000, protein: 150, carbs: 200, fat: 65 }
  const { calories, protein, carbs, fat } = activeProfile.targets
  return { calories, protein, carbs, fat }
}, [activeProfile])
```
Also remove the now-unused imports: `calcCalorieTarget, calcProteinTarget, calcFatTarget, calcCarbTarget` from `../../lib/calculations`.

Verify: no NaN in MacroRings after a profile with saved targets loads.

---

## Step 2 — Sync food log entries to localStorage for home screen
**File:** `src/hooks/useFoodLog.js`

1. Add imports at top:
```js
import { getActiveProfileId, getDailyLog, updateDailyLog } from '../storage'
```

2. Add sync helper inside the hook (after `refetch`):
```js
const syncToLocalStorage = useCallback((updatedEntries, date) => {
  const profileId = getActiveProfileId()
  if (!profileId) return
  const totals = sumMacros(updatedEntries)
  updateDailyLog(profileId, date, {
    calories: totals.calories,
    protein: totals.protein,
    carbs: totals.carbs,
    fat: totals.fat,
  })
}, [])
```

3. In `addEntry`: after `setEntries(prev => [...prev, data])`, call:
```js
syncToLocalStorage([...entries, data], dateStr)
```

4. In `removeEntry`: after `setEntries(prev => prev.filter(e => e.id !== id))`, call:
```js
syncToLocalStorage(entries.filter(e => e.id !== id), dateStr)
```

Verify: log a meal in Food tab → switch to Home tab → macros update.

---

## Step 3 — Add updateIngredient to useIngredients
**File:** `src/hooks/useIngredients.js`

Add after `deleteIngredient`:
```js
const updateIngredient = async (id, fields) => {
  const { data, error } = await supabase
    .from('ingredients')
    .update(fields)
    .eq('id', id)
    .select()
    .single()
  if (error) return { error }
  setIngredients(prev =>
    prev.map(i => i.id === id ? data : i)
  )
  return { data }
}
```

Add `updateIngredient` to the return object.

---

## Step 4 — Edit UI in IngredientLibrary
**File:** `src/components/food/IngredientLibrary.jsx`

1. Import `updateIngredient` (destructure from `useIngredients`).

2. Add state:
```js
const [editingId, setEditingId] = useState(null)
const [editForm, setEditForm] = useState({})
```

3. On each ingredient row, add a pencil icon button:
```jsx
<button onClick={() => { setEditingId(i.id); setEditForm({ name: i.name, serving_size: i.serving_size, calories: i.calories, protein: i.protein, carbs: i.carbs, fat: i.fat }) }}
  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: '4px 6px' }}>
  ✏️
</button>
```

4. When `editingId === i.id`, replace the row with an inline edit form:
- Text input for name
- Number inputs (stepper style or plain) for serving_size, calories, protein, carbs, fat
- "Save" button: calls `await updateIngredient(editingId, editForm)`, then `setEditingId(null)`
- "Cancel" button: `setEditingId(null)`

Keep the same card/row styling as the existing ingredient display.

---

## Step 5 — Add updateRecipe to useRecipes
**File:** `src/hooks/useRecipes.js`

Add after `deleteRecipe`:
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

Add `updateRecipe` to the return object.

---

## Step 6 — Add onEdit prop to RecipeCard
**File:** `src/components/food/RecipeCard.jsx`

1. Add `onEdit` to props.
2. Add a pencil icon button in the card header/actions area (alongside the existing delete button):
```jsx
<button onClick={onEdit}
  style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 4 }}>
  ✏️
</button>
```

---

## Step 7 — Edit BottomSheet in RecipeLibrary
**File:** `src/components/food/RecipeLibrary.jsx`

1. Import `BottomSheet` from `../../components/BottomSheet` and `PhotoUpload` from `./PhotoUpload`.
2. Import `updateRecipe` from `useRecipes`.
3. Add state:
```js
const [editingRecipe, setEditingRecipe] = useState(null)
const [editName, setEditName] = useState('')
const [editNotes, setEditNotes] = useState('')
const [editPhoto, setEditPhoto] = useState('')
const [saving, setSaving] = useState(false)
```

4. Pass `onEdit` to each `RecipeCard`:
```jsx
onEdit={() => {
  setEditingRecipe(recipe)
  setEditName(recipe.name)
  setEditNotes(recipe.notes || '')
  setEditPhoto(recipe.photo_url || '')
}}
```

5. Render BottomSheet after the recipe list:
```jsx
<BottomSheet
  isOpen={!!editingRecipe}
  onClose={() => setEditingRecipe(null)}
  title="Edit Recipe"
>
  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
    <div>
      <div className="label">Name</div>
      <input value={editName} onChange={e => setEditName(e.target.value)} />
    </div>
    <div>
      <div className="label">Notes</div>
      <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)}
        style={{ width: '100%', minHeight: 72, resize: 'vertical' }} />
    </div>
    <PhotoUpload value={editPhoto} onChange={setEditPhoto} />
    <button
      className="btn btn-primary"
      disabled={saving || !editName.trim()}
      onClick={async () => {
        setSaving(true)
        await updateRecipe(editingRecipe.id, { name: editName, notes: editNotes, photo_url: editPhoto })
        setSaving(false)
        setEditingRecipe(null)
      }}
    >
      {saving ? 'Saving…' : 'Save'}
    </button>
  </div>
</BottomSheet>
```

---

## Step 8 — Commit and push
```
git add src/components/food/DailyLogView.jsx src/hooks/useFoodLog.js src/hooks/useIngredients.js src/components/food/IngredientLibrary.jsx src/hooks/useRecipes.js src/components/food/RecipeCard.jsx src/components/food/RecipeLibrary.jsx
git commit -m "feat: fix NaN macros, home screen sync, edit recipes/ingredients"
git push
```

---

## Verification Checklist
- [ ] MacroRings shows correct targets (no NaN)
- [ ] Logging a meal in Food tab → Home tab shows updated calories/macros
- [ ] Removing a meal → Home tab totals decrease
- [ ] Edit ingredient → changes persist and show immediately
- [ ] Edit recipe name/notes/photo → BottomSheet saves and closes
