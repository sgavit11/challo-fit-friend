import { useState, useCallback } from 'react'
import { getDailyLog, updateDailyLog, addWaterEntry, removeWaterEntry } from '../storage'
import { todayKey } from '../lib/calculations'

export const useDailyLog = (profileId) => {
  const [log, setLog] = useState(() => getDailyLog(profileId, todayKey()))

  const update = useCallback((updates) => {
    const today = todayKey()
    updateDailyLog(profileId, today, updates)
    setLog(getDailyLog(profileId, today))
  }, [profileId])

  const logMeal = useCallback((meal) => {
    const today = todayKey()
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
  }, [profileId])

  const logWater = useCallback((entry) => {
    const today = todayKey()
    addWaterEntry(profileId, today, entry)
    setLog(getDailyLog(profileId, today))
  }, [profileId])

  const deleteWaterEntry = useCallback((entryId) => {
    const today = todayKey()
    removeWaterEntry(profileId, today, entryId)
    setLog(getDailyLog(profileId, today))
  }, [profileId])

  return { log, update, logMeal, logWater, deleteWaterEntry }
}
