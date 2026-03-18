/**
 * SUPABASE SETUP — run once in the Supabase SQL editor:
 *
 * create table recipes (
 *   id uuid default gen_random_uuid() primary key,
 *   user_id uuid references auth.users not null,
 *   name text not null,
 *   notes text,
 *   photo_url text,
 *   created_at timestamptz default now()
 * );
 * alter table recipes enable row level security;
 * create policy "Users manage their recipes"
 *   on recipes for all
 *   using (auth.uid() = user_id)
 *   with check (auth.uid() = user_id);
 *
 * create table recipe_ingredients (
 *   id uuid default gen_random_uuid() primary key,
 *   recipe_id uuid references recipes(id) on delete cascade not null,
 *   ingredient_id uuid references ingredients(id) on delete cascade not null,
 *   quantity numeric not null default 1
 * );
 * alter table recipe_ingredients enable row level security;
 * create policy "Users manage their recipe_ingredients"
 *   on recipe_ingredients for all
 *   using (exists (select 1 from recipes where id = recipe_id and user_id = auth.uid()))
 *   with check (exists (select 1 from recipes where id = recipe_id and user_id = auth.uid()));
 *
 * SUPABASE STORAGE — create a bucket named "recipe-photos" with public access.
 */

import { useState, useEffect, useCallback } from 'react'
import { supabase } from '../lib/supabase'

export function useRecipes() {
  const [recipes, setRecipes] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refetch = useCallback(async () => {
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('recipes')
      .select('*, recipe_ingredients(id, quantity, ingredient:ingredients(*))')
      .order('name')
    if (error) {
      setError(error.message)
    } else {
      setRecipes(data)
    }
    setLoading(false)
  }, [])

  useEffect(() => { refetch() }, [refetch])

  const addRecipe = async ({ name, notes, photo_url, items }) => {
    const { data: { user } } = await supabase.auth.getUser()
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .insert({ name, notes: notes || null, photo_url: photo_url || null, user_id: user.id })
      .select()
      .single()
    if (recipeError) return { error: recipeError.message }

    if (items.length > 0) {
      const { error: riError } = await supabase
        .from('recipe_ingredients')
        .insert(items.map(item => ({
          recipe_id: recipe.id,
          ingredient_id: item.ingredient.id,
          quantity: item.quantity,
        })))
      if (riError) return { error: riError.message }
    }

    await refetch()
    return { data: recipe }
  }

  const deleteRecipe = async (id) => {
    const { error } = await supabase.from('recipes').delete().eq('id', id)
    if (!error) setRecipes(prev => prev.filter(r => r.id !== id))
    return { error }
  }

  const updateRecipe = async (id, { name, notes, photo_url }) => {
    const { data, error } = await supabase
      .from('recipes')
      .update({ name, notes: notes || null, photo_url: photo_url || null })
      .eq('id', id)
      .select()
      .single()
    if (error) return { error: error.message }
    setRecipes(prev => prev.map(r => r.id === id ? { ...r, ...data } : r))
    return { data }
  }

  return { recipes, loading, error, addRecipe, deleteRecipe, updateRecipe, refetch }
}
