// Harris-Benedict BMR → TDEE
export const calcCalorieTarget = ({ weight, height, age = 25, sex = 'm', activityLevel = 'moderate' }) => {
  // weight in lbs, height in inches
  const weightKg = weight * 0.453592
  const heightCm = height * 2.54
  const bmr = sex === 'm'
    ? 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * age)
    : 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * age)
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
  return Math.round(bmr * (multipliers[activityLevel] ?? 1.55))
}

// 0.8g protein per lb bodyweight
export const calcProteinTarget = (weightLbs) => Math.round(weightLbs * 0.8)

// Default water target
export const calcWaterTarget = () => 96

// Scale food item macros by serving quantity multiplier
export const calcMacrosForQuantity = (item, quantity) => ({
  calories: item.perServing.calories * quantity,
  protein: item.perServing.protein * quantity,
  fat: item.perServing.fat * quantity,
  carbs: item.perServing.carbs * quantity,
})

// Weekly average from array of daily log values
export const calcWeeklyAverage = (logs, key) => {
  if (!logs.length) return 0
  return Math.round(logs.reduce((sum, l) => sum + (l[key] ?? 0), 0) / logs.length)
}

// Simple linear regression for weight trend
export const calcTrendLine = (entries) => {
  if (entries.length < 2) return entries.map(e => ({ date: e.date, trend: e.weight }))
  const n = entries.length
  const xs = entries.map((_, i) => i)
  const ys = entries.map(e => e.weight)
  const xMean = xs.reduce((a, b) => a + b, 0) / n
  const yMean = ys.reduce((a, b) => a + b, 0) / n
  const slope = xs.reduce((sum, x, i) => sum + (x - xMean) * (ys[i] - yMean), 0) /
    xs.reduce((sum, x) => sum + (x - xMean) ** 2, 0)
  const intercept = yMean - slope * xMean
  return entries.map((e, i) => ({ date: e.date, trend: +(intercept + slope * i).toFixed(1) }))
}

// Estimated weeks to goal given current weekly loss rate
export const calcWeeksToGoal = (currentWeight, goalWeight, weeklyLossRate) => {
  if (weeklyLossRate <= 0) return Infinity
  return Math.ceil((currentWeight - goalWeight) / weeklyLossRate)
}

// Today as YYYY-MM-DD
export const todayKey = () => new Date().toISOString().split('T')[0]

// Returns 0-5 index based on day of year for greeting rotation
export const greetingIndex = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return dayOfYear % 6
}
