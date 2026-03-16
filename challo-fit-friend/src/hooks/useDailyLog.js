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
