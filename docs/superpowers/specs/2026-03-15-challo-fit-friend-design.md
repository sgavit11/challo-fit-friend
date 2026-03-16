# Challo Fit Friend — Design Spec
**Date:** 2026-03-15
**Tagline:** "Eat smart. Move more. Live delicious. 🍽️"

---

## Overview

A mobile-first personal fitness tracking web app for a small shared-device household (2 profiles). Built with React + Vite, deployed to Netlify, all data stored in localStorage. Claude AI vision API powers the food label scanner via a Netlify serverless function proxy. Architecture is intentionally designed for future migration to Supabase (cloud database) without app-wide rewrites.

---

## Architecture

### Tech Stack
- **Frontend:** React + Vite
- **Deployment:** Netlify (free tier)
- **Storage:** localStorage via a single `storage.js` module (swap point for Supabase)
- **AI:** Claude vision API (`claude-sonnet-4-6`) proxied via Netlify Function
- **Styling:** CSS with dark mode default

### API Key Security
The Claude API key is **never stored in the app or localStorage**. It lives exclusively in Netlify environment variables (`CLAUDE_API_KEY`), set once in the Netlify dashboard. The Netlify Function reads `process.env.CLAUDE_API_KEY` server-side. The client never touches the key. "The Recipe" settings has no API key field — instead it shows a status indicator: "Scanner ready ✅" or "Scanner offline — contact your admin 🔑" depending on whether the function can reach the API.

### Project Structure
```
challo-fit-friend/
├── src/
│   ├── components/       # Reusable UI (buttons, progress bars, confetti, etc.)
│   ├── screens/          # One folder per tab (Home, Food, Water, Progress, Workout)
│   ├── onboarding/       # Onboarding flow screens (one question per screen)
│   ├── storage/          # All localStorage read/write (single swap point for Supabase)
│   ├── hooks/            # Shared logic (useProfile, useDailyLog, useFoodLibrary)
│   └── lib/              # Claude API client, health calculation utilities
├── netlify/functions/    # claude-vision.js — proxies food label scans securely
└── public/               # App icons, web manifest (enables "Add to Home Screen")
```

### Data Model (localStorage keys)

**`profiles`** — array of profile objects:

> **Unit convention:** Water is always stored internally in oz regardless of the user's display unit. `storage.js` converts to ml on read when the profile unit is ml. This keeps all water math consistent.

```json
{
  "id": "uuid",
  "name": "Shreyas",
  "currentWeight": 180,
  "height": 70,
  "goalWeight": 165,
  "targetDate": "2026-08-01",
  "weightUnit": "lbs",
  "heightUnit": "in",
  "trainingDaysPerWeek": 4,
  "trainingDays": ["Monday", "Tuesday", "Thursday", "Saturday"],
  "workoutLabels": ["Push", "Pull", "Legs", "Cardio"],
  "targets": {
    "calories": 2200,
    "protein": 165,
    "fat": 70,
    "carbs": 250,
    "waterOz": 96,
    "steps": 10000
  },
  "calorieGuardrails": {
    "underPercent": 60,
    "overPercent": 110
  },
  "createdAt": "2026-03-15"
}
```

**`activeProfileId`** — string (UUID of current profile)

**`foodLibrary`** — array of food items:
```json
{
  "id": "uuid",
  "name": "Greek Yogurt",
  "brand": "Chobani",
  "servingSize": 170,
  "servingUnit": "g",
  "perServing": {
    "calories": 100,
    "protein": 17,
    "fat": 0,
    "carbs": 6
  },
  "dateAdded": "2026-03-15"
}
```

**`dailyLogs`** — object keyed by `{profileId}_{YYYY-MM-DD}`:
```json
{
  "calories": 1450,
  "protein": 120,
  "fat": 45,
  "carbs": 160,
  "waterOz": 64,
  "steps": 7200,
  "workoutLogged": true,
  "workoutLabel": "Push",
  "meals": [
    {
      "foodItemId": "uuid",
      "name": "Greek Yogurt",
      "quantity": 1.5,
      "macros": { "calories": 150, "protein": 25, "fat": 0, "carbs": 9 }
    }
  ],
  "loggedAt": "2026-03-15"
}
```

**`weightLog`** — array of weigh-in entries:
```json
{
  "id": "uuid",
  "profileId": "uuid",
  "weight": 178,
  "weightUnit": "lbs",
  "date": "2026-03-15"
}
```

---

## User Flow

### First Launch — Onboarding
1. App detects no profiles in storage → launches onboarding
2. Opening screen: *"Challo — let's set you up in 60 seconds 🚀"*
3. One question per screen with progress indicator:
   - Name
   - Current weight + height (with unit selector: lbs/kg, in/cm)
   - Goal weight + target date
   - Training days per week + which days (tap to select from Mon–Sun)
   - Workout labels: what do you call your training sessions? (e.g., Push, Pull, Legs, Cardio — user can customise or accept defaults)
   - Daily targets: calories / protein (g) / water / steps — app suggests smart defaults using Harris-Benedict formula for calories, 0.8g/lb for protein, 96oz (12 cups) water, 10,000 steps
4. Completion screen: *"You're all set [Name]. Your journey starts now. Challo let's go 🍽️🔥"*
5. All data written to `profiles[]`, `activeProfileId` set

### Every Subsequent Launch — Profile Switcher
- Netflix-style profile picker: "Who's using the app?"
- Tap name → loads that profile's data → lands on Home screen
- "Add profile +" button triggers the same full onboarding flow for the new person
- Minimum 1 profile always enforced — no delete button shown when only 1 profile exists

---

## Features

### 1. Home Screen
- Rotating morning greeting (changes daily at midnight, 6 options, uses active profile name)
- 4 summary cards: Macros / Water / Steps / Workout — tap any to go deep
- Weekly streak counter (top-right corner)
- All values read from today's `dailyLogs` entry (initialised to zeros if no entry exists)

**Greeting rotation (selected by day-of-year mod 6):**
1. "Challo [Name], today's plate is waiting to be filled 🍽️"
2. "Rise and grind — the gains don't slow-cook themselves 🍲"
3. "Good morning [Name] — let's cook up a great day 🔥"
4. "New day, new menu [Name] — let's make it count 🌮"
5. "Your bento box of goals is empty — let's fill it 🍱"
6. "Ciao [Name] — today's session won't prep itself 🍝"

### 2. Food Scanner & Macro Library (Food tab)

**Scanning:**
- Upload or photograph a nutrition label
- Photo sent to Netlify Function → Claude vision API (`claude-sonnet-4-6`) extracts: name, serving size, serving unit, calories, protein, fat, carbs per serving
- **Confirmation screen:** user sees every extracted field in an editable form before saving. They can correct any value manually. A "Looks good → Save" button commits to `foodLibrary[]`. This prevents bad extractions from polluting the library.
- First-use tip: *"Best results with clear, well-lit label photos 📸"*

**Library & meal builder:**
- Select saved items from library + enter quantity (as multiples of serving size) → instant macro calculation (client-side multiplication, zero API call, zero delay)
- "Log meal" writes summed macros to today's `dailyLogs`
- Empty state: *"Your menu is empty — scan your first item 📸"*
- First item saved: *"First ingredient in — your kitchen is open 👨‍🍳"*
- Meal logged: *"Meal locked in — macros calculated, chef approved 🤌"*

**Daily Macro Tracker (also on Food tab):**
- Progress bars for calories, protein, fat, carbs — styled as filling bowls/bento boxes with smooth fill animations
- Labels: Calories = "Energy on the plate 🔥" | Protein = "The main course 🍗" | Carbs = "Fuel for the dance floor 🍚" | Fat = "The good stuff 🥑"
- Shows remaining vs consumed at all times
- Targets pulled from active profile — nothing hardcoded
- Nudges fire at thresholds set in profile's `calorieGuardrails`:
  - Under calories threshold: *"You're running on empty — time to refuel [Name] 🫓"*
  - Over calories threshold: *"Easy there — even omakase has a last course 😅"*
  - Protein target hit: *"Main course done. Chef's kiss 🤌"*
  - All 4 targets hit: *"Clean plate. Perfect day ✅🍽️"*
- Weekly average view (average daily macros for current week)

### 3. Water Tracker (Water tab)
- Tap-to-log: one tap = 16oz (if unit is oz) or 470ml (if unit is ml) — unit determined by profile setting, consistent throughout
- Daily target from active profile (`targets.waterOz` converted to display unit)
- Visual: filling tank or progress ring with animated fill
- 2-hour browser notifications (requires user permission on first use): *"Oi [Name] — you're drier than overcooked pasta right now 💧 Drink up"*
- 50% hit: *"Halfway there — keep the flow going 🌊"*
- 100% hit: *"Fully hydrated. You're basically a fresh cucumber 🥒"*

### 4. Workout Check-In (Workout tab)
- Daily prompt: *"Did you get a session in today [Name]? 💪"*
- Yes → show active profile's `workoutLabels` as tappable options to select session type → logs `workoutLogged: true` + `workoutLabel` to today's `dailyLogs`
- Rest day (day not in `trainingDays`): *"Rest day — even Michelin star chefs take Sundays off 👨‍🍳"*
- Session logged: *"Session served. You showed up. 🔥"*
- Missed training day (past the day, not logged): *"The gym missed you today [Name] — come back strong tomorrow 💪"*
- Weekly streak counter on Home screen (consecutive weeks with all training days hit)
- Full week complete: *"Perfect week. Clean plate. Nothing left on the table 🍽️🔥"*

### 5. Steps (Home card)
- Manual input only — user types step count and taps "Log"
- Note displayed below input: *"Auto-sync coming soon — manual entry keeps you in control for now 👟"*
- Daily target from active profile (`targets.steps`)
- Under 5k: *"You've barely left the kitchen — get moving [Name] 👟"*
- 5k–9k: *"Almost at your target — a few more steps to go 🚶"*
- Target hit: *"[target] steps DONE. You earned that extra dumpling 😂🥟"* — render the profile's `targets.steps` value in place of `[target]`, never hardcode 10k

### 6. Progress Dashboard (Progress tab)
- Starting weight (first `weightLog` entry) and goal from active profile
- Weekly weight log with trend line graph — simple linear regression client-side
- Estimated weeks to goal = (current weight − goal weight) / average weekly loss rate
- Weekly weigh-in prompt (shown every 7 days from last entry): *"Time to check in [Name] — how's the cut coming? ⚖️"*
- Weigh-in input saves new entry to `weightLog[]`

**Milestones (checked after every weigh-in — trigger confetti + bold callout):**
- First full day all targets hit: *"Full day nailed. Clean plate ✅"*
- Down 2 lbs from start: *"2 lbs down 🔥 The cut is real"*
- Down 5 lbs from start: *"5 lbs gone 💪 A whole bag of flour lighter"*
- 50% of way to goal: *"Halfway there [Name] — the best course is still coming 🌶️"*
- Goal weight reached: *"GOAL HIT. Table for one — and you're the main event 🎉🍽️🔥"*

**Confetti component:** full-screen burst of flying food emojis (🌮🍣🍝🥟🥤) — reusable, triggered from any screen on milestone hit

---

## UI/UX

| Attribute | Spec |
|-----------|------|
| Mode | Dark default |
| Base color | #0F0F0F |
| Accent 1 | Saffron #F5A623 |
| Accent 2 | Chili red #E8341C |
| Accent 3 | Fresh green #4CAF6F |
| Navigation | Bottom tab bar, 5 tabs |
| Profile/Settings access | Top-right profile icon |
| Profile tab name | "My Kitchen" |
| Settings tab name | "The Recipe" |
| Progress bars | Fill animation styled as bowls / bento boxes |
| Milestones | Full-screen confetti burst (food emoji) |
| Min width | 375px |

**Bottom navigation tabs:**
1. Home 🏠
2. Food 🍽️
3. Water 💧
4. Progress 📈
5. Workout 💪

---

## Settings ("The Recipe")
- Units: weight (lbs / kg), volume (oz / ml)
- Calorie guardrail thresholds (under % and over % of daily target)
- Notification preferences (water reminders on/off)
- Training day labels (edit workout session names)
- Target adjustments (update calories, protein, water, steps at any time)
- Scanner status indicator: "Scanner ready ✅" or "Scanner offline 🔑" (no key input — key lives in Netlify env vars)
- "Edit Profile" button → opens edit form for name, weight, goal, training days

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| Scanner offline (Netlify env var not set) | Settings shows "Scanner offline 🔑" — no key input in UI |
| Bad photo / unreadable label | *"Couldn't read that label — try better lighting 📸"* + retry button |
| Partial extraction (some fields missing) | Confirmation screen pre-fills what was found, highlights empty fields in red — user must fill before saving |
| Claude returns plausible but wrong values | Confirmation screen always shown — user reviews and corrects before save |
| Offline | *"You're offline — scanner needs a connection 📡"* — all other features work offline |
| localStorage near limit (~4.5MB) | Warning banner in Settings: "Storage almost full — consider clearing old logs" |
| No profile found | Always routes to onboarding — never shows broken empty state |
| Missing daily log entry | Initialize with all-zeros for today on first read — no null/undefined crashes |
| Delete last profile | Delete button hidden when only 1 profile exists |
| Claude API error (5xx, rate limit) | *"Scanner is having a moment — try again in a few seconds 🍳"* — raw API error never shown |
| Invalid quantity in meal builder | Reject non-numeric input immediately, no calculation attempted |

---

## Future Upgrade Path (Option B — Supabase)

When ready to migrate to Supabase cloud storage:
1. Replace `src/storage/localStorage.js` with `src/storage/supabase.js` — same exported function signatures
2. Add Supabase project URL + anon key to Netlify environment variables
3. Add simple email/password auth (Supabase Auth) — profile switcher becomes login screen
4. Run one-time data migration script to push localStorage data to Supabase
5. **No other files change** — all hooks, screens, and components stay identical

This works because all data access goes exclusively through `src/storage/` — nothing else reads or writes localStorage directly.

---

## Testing Plan

Manual testing on a real phone browser (Chrome on Android or Safari on iPhone). For each feature, there is a clear pass/fail check.

**How to verify localStorage writes:**
Open browser → three-dot menu → Developer Tools → Application tab → Local Storage → select the app URL. You can see every key and value written.

**How to verify the Netlify Function is called (not a direct API call):**
DevTools → Network tab → scan a photo → look for a request to `/.netlify/functions/claude-vision` (not to `api.anthropic.com`). If you see `api.anthropic.com` directly, something is wrong.

**Feature test checklist:**

| Feature | Test | Pass criteria |
|---------|------|---------------|
| Onboarding | Complete full flow | Profile appears in localStorage under `profiles` key |
| Profile switcher | Add second profile | Both names appear on switcher; switching shows correct name on Home |
| Home greeting | Open app on different days | Greeting changes (or test by manually changing device date) |
| Food scanner | Scan a real nutrition label | Confirmation screen shows correct values; item appears in food library after save |
| Macro calculation | Log a meal with quantity 2x | Macros exactly double vs single serving |
| Macro tracker | Log food | Progress bars on Food tab update immediately; Home card updates |
| Water logging | Tap log button 6 times | Water value in localStorage = 6 × 16oz (96oz) |
| Workout check-in | Log a session | `workoutLogged: true` in today's dailyLog; Home card shows ✅ |
| Steps | Enter 10000 | Home card shows 10k; nudge message updates |
| Weigh-in | Enter weight below start | Progress graph shows downward trend |
| Milestone | Enter weight = goal weight | Confetti fires; milestone message displays |
| Profile persistence | Close and reopen browser tab | All data still present; active profile remembered |
| Settings units | Switch to kg/ml | All displays update; water tap logs 470ml |
