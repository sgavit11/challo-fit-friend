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
