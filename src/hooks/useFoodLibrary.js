import { useState, useCallback } from 'react'
import { getFoodLibrary, saveFoodItem, deleteFoodItem } from '../storage'

export const useFoodLibrary = () => {
  const [library, setLibrary] = useState(() => getFoodLibrary())

  const addItem = useCallback((item) => {
    saveFoodItem(item)
    setLibrary(getFoodLibrary())
  }, [])

  const removeItem = useCallback((id) => {
    deleteFoodItem(id)
    setLibrary(getFoodLibrary())
  }, [])

  return { library, addItem, removeItem }
}
