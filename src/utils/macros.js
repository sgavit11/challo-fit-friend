/**
 * Scale an ingredient's macros to a given quantity.
 * @param {Object} ingredient - { serving_size, calories, protein, carbs, fat }
 * @param {number} qty - number of servings
 */
export function scaleMacros(ingredient, qty) {
  const ratio = qty / ingredient.serving_size
  return {
    calories: Math.round(ingredient.calories * ratio),
    protein:  Math.round(ingredient.protein  * ratio * 10) / 10,
    carbs:    Math.round(ingredient.carbs    * ratio * 10) / 10,
    fat:      Math.round(ingredient.fat      * ratio * 10) / 10,
  }
}

/**
 * Sum an array of macro objects { calories, protein, carbs, fat }.
 */
export function sumMacros(entries) {
  return entries.reduce(
    (acc, e) => ({
      calories: acc.calories + (e.calories ?? 0),
      protein:  acc.protein  + (e.protein  ?? 0),
      carbs:    acc.carbs    + (e.carbs    ?? 0),
      fat:      acc.fat      + (e.fat      ?? 0),
    }),
    { calories: 0, protein: 0, carbs: 0, fat: 0 }
  )
}

/**
 * Round a macro gram value for display (1 decimal, no trailing .0).
 */
export function fmtG(val) {
  const n = Math.round(val * 10) / 10
  return Number.isInteger(n) ? String(n) : String(n)
}
