import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useIngredients() {
  const [ingredients, setIngredients] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('ingredients')
      .select('*')
      .order('name')
    if (error) {
      setError(error.message)
    } else {
      setIngredients(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const addIngredient = async (ingredient) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data, error } = await supabase
      .from('ingredients')
      .insert({ ...ingredient, user_id: user.id })
      .select()
      .single()
    if (error) return { error }
    setIngredients(prev =>
      [...prev, data].sort((a, b) => a.name.localeCompare(b.name))
    )
    return { data }
  }

  const deleteIngredient = async (id) => {
    const { error } = await supabase
      .from('ingredients')
      .delete()
      .eq('id', id)
    if (!error) setIngredients(prev => prev.filter(i => i.id !== id))
    return { error }
  }

  const searchIngredients = useCallback(
    (query) => {
      if (!query?.trim()) return ingredients
      const q = query.toLowerCase()
      return ingredients.filter(i => i.name.toLowerCase().includes(q))
    },
    [ingredients]
  )

  return { ingredients, loading, error, addIngredient, deleteIngredient, searchIngredients, refetch }
}
