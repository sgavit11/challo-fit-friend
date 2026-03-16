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
- **AI:** Claude vision API (`claude-sonnet-4-20250514`) proxied via Netlify Function
- **Styling:** CSS with dark mode default

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
| Key | Contents |
|-----|----------|
| `profiles` | Array of user profiles (name, stats, targets, training days) |
| `activeProfileId` | Currently active profile ID |
| `foodLibrary` | Array of saved food items with macro data |
| `dailyLogs` | Object keyed by `{profileId}_{YYYY-MM-DD}` — macros, water, steps, workout |
| `weightLog` | Array of weekly weigh-ins per profile |

---

## User Flow

### First Launch — Onboarding
1. App detects no profiles in storage → launches onboarding
2. Opening screen: *"Challo — let's set you up in 60 seconds 🚀"*
3. One question per screen with progress indicator:
   - Name
   - Current weight + height
   - Goal weight + target date
   - Training days per week + which days
   - Daily targets (calories / protein / water / steps) — app suggests smart defaults using Harris-Benedict formula for calories, 0.8g/lb for protein, 8 cups water
4. Completion screen: *"You're all set [Name]. Your journey starts now. Challo let's go 🍽️🔥"*
5. All data written to `profiles[]`, `activeProfileId` set

### Every Subsequent Launch — Profile Switcher
- Netflix-style profile picker: "Who's using the app?"
- Tap name → loads that profile's data → lands on Home screen

---

## Features

### 1. Home Screen
- Rotating morning greeting (changes daily, 6 options, references user's name)
- 4 summary cards: Macros / Water / Steps / Workout — tap any to go deep
- Weekly streak counter (top-right)
- All values read from today's `dailyLogs` entry

**Greeting rotation:**
- "Challo [Name], today's plate is waiting to be filled 🍽️"
- "Rise and grind — the gains don't slow-cook themselves 🍲"
- "Good morning [Name] — let's cook up a great day 🔥"
- "New day, new menu [Name] — let's make it count 🌮"
- "Your bento box of goals is empty — let's fill it 🍱"
- "Ciao [Name] — today's session won't prep itself 🍝"

### 2. Food Scanner & Macro Library (Food tab)
- Upload or photograph a nutrition label
- Photo sent to Netlify Function → Claude vision API extracts: calories, protein, fat, carbs per serving
- User reviews extracted data → confirms → saved to `foodLibrary[]`
- Meal builder: select saved items + enter quantity → instant macro calculation (client-side, zero delay)
- Empty state: *"Your menu is empty — scan your first item 📸"*
- First item saved: *"First ingredient in — your kitchen is open 👨‍🍳"*
- Meal built: *"Meal locked in — macros calculated, chef approved 🤌"*
- First-use tip: *"Best results with clear, well-lit label photos 📸"*

**Daily Macro Tracker (also on Food tab):**
- Progress bars for calories, protein, fat, carbs — styled as filling bowls/bento boxes
- Labels: Calories = "Energy on the plate 🔥" | Protein = "The main course 🍗" | Carbs = "Fuel for the dance floor 🍚" | Fat = "The good stuff 🥑"
- Targets pulled from profile — nothing hardcoded
- Nudges: under calories → *"You're running on empty — time to refuel [Name] 🫓"* | over calories → *"Easy there — even omakase has a last course 😅"* | protein hit → *"Main course done. Chef's kiss 🤌"* | all targets hit → *"Clean plate. Perfect day ✅🍽️"*
- Weekly average view

### 3. Water Tracker (Water tab)
- Tap-to-log: one tap = 16oz logged
- Daily target from profile
- Visual: filling tank or progress ring
- 2-hour reminders: *"Oi [Name] — you're drier than overcooked pasta right now 💧 Drink up"*
- 50% hit: *"Halfway there — keep the flow going 🌊"*
- 100% hit: *"Fully hydrated. You're basically a fresh cucumber 🥒"*

### 4. Workout Check-In (Workout tab)
- Daily prompt: *"Did you get a session in today [Name]? 💪"*
- Yes → show training day labels to select
- Rest day: *"Rest day — even Michelin star chefs take Sundays off 👨‍🍳"*
- Logged: *"Session served. You showed up. 🔥"*
- Missed training day: *"The gym missed you today [Name] — come back strong tomorrow 💪"*
- Weekly streak counter on Home screen
- Full week complete: *"Perfect week. Clean plate. Nothing left on the table 🍽️🔥"*

### 5. Steps Tracking (Home card + Progress tab)
- Manual input always available
- Attempt Apple Health / Google Fit Web API bridge — if unsupported, show: *"Apple Health integration coming soon"*
- Under 5k: *"You've barely left the kitchen — get moving [Name] 👟"*
- 5k–9k: *"Almost at your target — a few more steps to go 🚶"*
- 10k hit: *"10k steps DONE. You earned that extra dumpling 😂🥟"*

### 6. Progress Dashboard (Progress tab)
- Starting weight and goal from profile
- Weekly weight log with trend line graph (client-side moving average)
- Estimated weeks to goal based on current loss rate
- Weekly weigh-in prompt: *"Time to check in [Name] — how's the cut coming? ⚖️"*

**Milestones (trigger confetti + bold callout):**
- First full day on target: *"Full day nailed. Clean plate ✅"*
- Down 2 lbs: *"2 lbs down 🔥 The cut is real"*
- Down 5 lbs: *"5 lbs gone 💪 A whole bag of flour lighter"*
- Halfway to goal: *"Halfway there [Name] — the best course is still coming 🌶️"*
- Goal reached: *"GOAL HIT. Table for one — and you're the main event 🎉🍽️🔥"*

**Confetti:** flying food emojis — tacos, sushi rolls, pasta, dumplings, protein shakers

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
| Profile tab | "My Kitchen" |
| Settings tab | "The Recipe" |
| Progress bars | Fill animation styled as bowls / bento boxes |
| Milestones | Full-screen confetti burst (food emoji) |

**Bottom navigation tabs:**
1. Home 🏠
2. Food 🍽️
3. Water 💧
4. Progress 📈
5. Workout 💪

**Profile / Settings access:** Top-right profile icon → "My Kitchen" (profile) + "The Recipe" (settings)

---

## Settings ("The Recipe")
- Claude API key input (required for food scanner)
- Units (lbs/kg, oz/ml)
- Calorie guardrails (over/under thresholds for nudges)
- Notification preferences
- Training day labels
- Target adjustments (user updates weekly)

---

## Error Handling

| Scenario | Behavior |
|----------|----------|
| No Claude API key | Redirect to Settings with: *"Add your Claude API key to unlock the scanner 🔑"* |
| Bad photo / unreadable label | *"Couldn't read that label — try better lighting 📸"* + retry |
| Offline | *"You're offline — scanner needs a connection 📡"* — rest of app works fine |
| localStorage full (~5MB) | Gentle warning in Settings |
| No profile found | Always routes to onboarding — never shows broken empty state |
| Missing daily log | Initialize with zeros for today — no null crashes |
| Can't delete last profile | Minimum 1 profile enforced |
| Claude API error | Clean user-facing message — raw API errors never shown |

---

## Future Upgrade Path (Option B)

When ready to migrate to Supabase cloud storage:
1. Replace `src/storage/localStorage.js` with `src/storage/supabase.js`
2. Add Supabase project + env vars to Netlify
3. Run one-time data migration script
4. No other files change — all hooks and screens stay identical

This is the only file that needs to change. All reads/writes go through `storage/` exclusively.

---

## Testing Plan

- Each feature manually tested on a real phone browser before moving to next
- Onboarding tested with real user data to validate smart defaults
- Food scanner tested with a real nutrition label photo
- Nudge thresholds verified against actual values
- Confetti verified on each milestone
- All 5 tabs verified at 375px minimum width
- Full user journey: onboarding → daily log → weigh-in → milestone hit
