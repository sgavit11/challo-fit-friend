import { useState, useCallback } from 'react'
import { getWeightLog, saveWeightEntry } from '../storage'

export const useWeightLog = (profileId) => {
  const [entries, setEntries] = useState(() => getWeightLog(profileId))

  const addEntry = useCallback((entry) => {
    saveWeightEntry(entry)
    setEntries(getWeightLog(profileId))
  }, [profileId])

  return { entries, addEntry }
}
