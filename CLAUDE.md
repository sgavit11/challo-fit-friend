# Challo Fit Friend — Project Context

## Who I am
- My name is Shrey
- I'm a Product Marketing Manager (PMM) learning Claude Code in my personal time
- I prefer **one change at a time** — always keep other sections untouched unless explicitly told otherwise

## The Project
- **Challo Fit Friend**: a fitness companion app
- GitHub repo: `sgavit11/challo-fit-friend`
- Netlify: connected to that repo, auto-deploys on push to `main`
- **Push once per session** — accumulate all changes, then push at the end. Free tier = 300 build minutes/month (~2-3 min per build). Resets on the 1st of each month.

## Stack
- React + Vite + Supabase (Postgres + Auth + Storage) + Netlify
- Netlify: static hosting + serverless functions in `netlify/functions/`
- Build output: `dist/`
- Recharts already in `package.json` — use for analytics charts
- `@supabase/supabase-js` installed — client at `src/lib/supabase.js`

## Repo Structure
- The repo root IS the app root (`src/`, `package.json`, `index.html` at root level)
- There is a stale copy of the app in the `challo-fit-friend/` subdirectory — ignore it
- Always make changes at the repo root

## Netlify Gotcha
- `base = "challo-fit-friend"` was removed from `netlify.toml` on 2026-03-16
- If Netlify ever stops reflecting changes, check the `netlify.toml` base setting first

## Env Vars
- `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` in `.env.local` (never committed)
- Also set these in Netlify environment settings

## UI Design Tokens
- Primary gradient: `#2DD4BF → #38BDF8` (glacier)
- Headings font: **Outfit**
- Body font: **DM Sans**
- Cards: `border: 1px solid var(--border)` + `box-shadow: var(--shadow-sm)`
- SVG nav icons — no emojis as icons
- Macro colors: Protein `#6EE7B7`, Carbs `#7DD3FC`, Fat `#C084FC`, Calories gradient
- Error/flagged: `#F87171`, Caution: `#FBBF24`

## Food Tab — Component File Tree
All new Food Tab components live under `src/components/food/`:
```
src/
├── lib/supabase.js              ✅ done
├── hooks/
│   ├── useAuth.js               ✅ done
│   ├── useIngredients.js        ✅ done
│   ├── useRecipes.js
│   └── useDailyLog.js
├── utils/macros.js              ✅ done
├── screens/
│   └── AuthScreen.jsx           ✅ done
└── components/food/
    ├── FoodTab.jsx              ✅ done (top-level, internal view router)
    ├── DailyLogView.jsx
    ├── MacroRings.jsx
    ├── RecipeLibrary.jsx
    ├── RecipeCard.jsx
    ├── RecipeBuilder.jsx
    ├── IngredientSearch.jsx     ✅ done
    ├── IngredientLibrary.jsx    ✅ done
    ├── PhotoUpload.jsx
    └── AnalyticsView.jsx
```

## Food Tab — Internal Navigation
FoodTab has a persistent sub-nav: **Log · Recipes · Analytics**
Internal view state: `'log' | 'recipes' | 'builder' | 'ingredients' | 'analytics'`
Builder and ingredients are accessed via buttons within Log/Recipes views — not in the sub-nav.

## Food Tab — Auth Gate
The Food tab requires Supabase auth. Other tabs (Home, Water, Progress, Workout) do not.
In App.jsx: when `tab === 'food'` and no session → render `<AuthScreen />` instead.

## Food Tab — Key UX Decisions (locked, do not re-brainstorm)
1. **Ingredient library is shared** — ingredients are saved once, reused across all recipes. RecipeBuilder searches the library; never asks user to re-enter a known ingredient.
2. **Macro inputs use steppers** — `−` button · typed value · `+` button. No browser number spinners (`type="text" inputmode="decimal"`).
3. **Analytics tolerance zones:**
   - On track: within ±10% of target → teal bar
   - Caution: ±10–25% → amber bar
   - Off track: >25% → red bar + flag
   - In progress (today): dashed outline ghost bar
4. **Analytics insight cards** — only surface when actionable (flagged day, caution day, positive streak).
5. **Recipe macro totals** — always calculated on-the-fly from `recipe_ingredients`, never stored.

## Build Session Plan
| Session | Scope | Status |
|---------|-------|--------|
| 0 | **P0 bugs:** active/selected state CSS fix (systemic — heals StepStats, StepTraining, StepTDEE in one go) + StepTraining day chip black state | ✅ done |
| A | App.jsx auth gate · useIngredients · macros.js · IngredientLibrary · IngredientSearch | ✅ done |
| B1 | P1 bugs: steppers for weight/height/goal weight · date input consistency · Workout Split presets | ✅ done |
| B2 | WaterScreen visual overhaul (arc ring · unit chips · quick-add · stepper · streak · keep-logging) | ✅ done |
| B3 | useRecipes · RecipeBuilder · RecipeCard · RecipeLibrary · PhotoUpload · FoodTab wiring | ✅ done |
| C | useDailyLog · DailyLogView · MacroRings | ✅ done |
| D | AnalyticsView + fetchLogRange in useDailyLog · Progress screen time range toggles + color fixes + weekly rate insight | ✅ done |
| E | Polish: empty states, loading skeletons, error handling, mobile | ✅ done |

## Bug & UX Issue Log (V3)

### P0 — Fix immediately (Session 0)
**Active/selected state invisible text — systemic, 3 screens**
- Affects: StepStats metric toggle, StepTraining day chips, StepTDEE water unit toggle
- Root cause: active state applies dark background without flipping text to light color
- Fix: active chip = `var(--primary-tint)` background + teal border + teal text — apply once to shared chip/pill style
- StepTraining day chips specifically turn solid black = unreadable

### P1 — Session B
**StepStats — Weight & Height input**
- Add − / + stepper buttons flanking a typed input (same pattern as macro steppers)

**StepGoal — Goal Weight input**
- Same fix: typed input + stepper, not just picker

**Date input consistency**
- DOB (StepDOB): custom dropdown approach
- Target Date (StepGoal): native `<input type="date">`
- Fix: make both use the same approach — recommend styled `type="date"` or MM/DD/YYYY separate fields matching DOB exactly

**StepTraining — Workout Split**
- Rename "Workout Labels" → "Workout Split"
- Replace freeform input with preset chips: Push · Pull · Legs · Cardio · Yoga · Upper Body · Lower Body
- Keep "Custom…" option that reveals a comma-separated text input

**WaterScreen — unit flexibility + visual overhaul (design locked)**
- Prototype: `docs/prototype-water-tab.html`
- Unit selector chips at top: oz · glass · ml/L · custom — controls display unit across whole screen
- All entries convert to the target unit and sum toward the daily goal
- Visual: large SVG arc ring, amount + unit + "of Xtarget · Y% done" inside ring
- Streak badge top-right: amber when active, red when lost
- Quick-add grid (4 buttons): glass · can · bottle · large — label on top, amount below in muted water-blue. NO emojis, NO icons
- Custom amount: stepper (grid: 44px · 1fr · 44px) — − and + buttons identical style, value + unit label stacked in centre column
- "Log custom amount" full-width button below stepper
- Goal reached state: ring fills, nudge card celebrates, quick-add relabelled "Keep logging" — fully active, same styling. Never blocks further logging
- Behind-pace state: red nudge card with contextual tip
- Today's log: timestamped list with delete, shown below
- h1/h2 headlines: Outfit 800 weight, explicit `#EDEDF0` color

### P2 — Session D (Progress screen)
**Progress screen — partial update for consistency**
- Time range toggle: Last 30 days / Last 3 months / All time (NOT Day/Week — daily weight is noise)
- Fix hardcoded colors: `#F5A623` → `var(--primary)`, `#4CAF6F` → `var(--green)`
- Weekly rate insight card: 0.5–1 lb/week = healthy (teal), >1.5 lb/week = aggressive (amber), <0.2 lb/week = stalling (muted)
- Keep milestone celebration cards — they are unique to Progress and working well
- Weight log input: stepper + typed value (same pattern as macro inputs)

## Prototype
UI prototype for all screens: `docs/prototype-food-tab.html`
Spec + analytics addendum: `docs/superpowers/specs/`
Design is locked — reference prototype, do not re-design.
