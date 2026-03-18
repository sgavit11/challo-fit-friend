/**
 * SUPABASE SETUP — run once in the Supabase SQL editor:
 *
 * create table daily_log (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users not null,
 *   log_date date not null,
 *   name text not null,
 *   calories numeric not null default 0,
 *   protein  numeric not null default 0,
 *   carbs    numeric not null default 0,
 *   fat      numeric not null default 0,
 *   photo_url text,
 *   logged_at timestamptz default now()
 * );
 * alter table daily_log enable row level security;
 * create policy "Users manage their daily_log"
 *   on daily_log for all
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'
import { sumMacros, scaleMacros } from '../utils/macros'

export function useFoodLog(dateStr) {
  // dateStr: 'YYYY-MM-DD'
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    if (!dateStr) {
      setLoading(false)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('daily_log')
      .select('*')
      .eq('log_date', dateStr)
      .order('logged_at')
    if (error) {
      setError(error.message)
    } else {
      setEntries(data)
    }
    setLoading(false)
  }, [dateStr])

  useEffect(() => { refetch() }, [refetch])

  // Add a recipe as a meal entry (macros calculated from recipe_ingredients)
  const addEntry = useCallback(async (recipe) => {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Not authenticated' }

    // Sum macros from recipe_ingredients (already fetched with ingredient data)
    const macros = sumMacros(
      (recipe.recipe_ingredients ?? []).map(ri =>
        scaleMacros(ri.ingredient, ri.quantity)
      )
    )

    const { data, error } = await supabase
      .from('daily_log')
      .insert({
        user_id: user.id,
        log_date: dateStr,
        name: recipe.name,
        calories: macros.calories,
        protein: macros.protein,
        carbs: macros.carbs,
        fat: macros.fat,
        photo_url: recipe.photo_url ?? null,
      })
      .select()
      .single()

    if (error) return { error: error.message }
    setEntries(prev => [...prev, data])
    return { data }
  }, [dateStr])

  const removeEntry = useCallback(async (id) => {
    const { error } = await supabase
      .from('daily_log')
      .delete()
      .eq('id', id)
    if (!error) setEntries(prev => prev.filter(e => e.id !== id))
    return { error }
  }, [])

  // Totals for the day
  const totals = sumMacros(entries)

  return { entries, totals, loading, error, addEntry, removeEntry, refetch }
}
