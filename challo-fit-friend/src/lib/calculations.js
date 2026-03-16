// Harris-Benedict BMR → TDEE

export const calcAge = (dob) =>
  Math.floor((Date.now() - new Date(dob).getTime()) / (365.25 * 24 * 60 * 60 * 1000))

export const calcCalorieTarget = ({ weight, height, age, dob, sex = 'm', activityLevel = 'moderate' }) => {
  const derivedAge = dob ? calcAge(dob) : (age ?? 30)
  const weightKg = weight * 0.453592
  const heightCm = height * 2.54
  const bmr = sex === 'm'
    ? 88.362 + (13.397 * weightKg) + (4.799 * heightCm) - (5.677 * derivedAge)
    : 447.593 + (9.247 * weightKg) + (3.098 * heightCm) - (4.330 * derivedAge)
  const multipliers = { sedentary: 1.2, light: 1.375, moderate: 1.55, active: 1.725 }
  return Math.round(bmr * (multipliers[activityLevel] ?? 1.55))
}

// 0.8g protein per lb bodyweight
export const calcProteinTarget = (weightLbs) => Math.round(weightLbs * 0.8)

// 30% of calories from fat (fat has 9 kcal/g)
export const calcFatTarget = (calories) => Math.round(calories * 0.30 / 9)

// Remaining calories from carbs (carbs have 4 kcal/g)
export const calcCarbTarget = (calories, proteinG, fatG) =>
  Math.round((calories - proteinG * 4 - fatG * 9) / 4)

// Half of bodyweight (lbs) in oz — standard hydration formula
export const calcWaterTarget = (weightLbs = 160) => Math.round(weightLbs * 0.5)

export const calcMacrosForQuantity = (item, quantity) => ({
  calories: item.perServing.calories * quantity,
  protein: item.perServing.protein * quantity,
  fat: item.perServing.fat * quantity,
  carbs: item.perServing.carbs * quantity,
})

export const calcWeeklyAverage = (logs, key) => {
  if (!logs.length) return 0
  return Math.round(logs.reduce((sum, l) => sum + (l[key] ?? 0), 0) / logs.length)
}

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

export const calcWeeksToGoal = (currentWeight, goalWeight, weeklyLossRate) => {
  if (weeklyLossRate <= 0) return Infinity
  return Math.ceil((currentWeight - goalWeight) / weeklyLossRate)
}

export const todayKey = () => new Date().toISOString().split('T')[0]

export const greetingIndex = () => {
  const now = new Date()
  const start = new Date(now.getFullYear(), 0, 0)
  const dayOfYear = Math.floor((now - start) / (1000 * 60 * 60 * 24))
  return dayOfYear % 6
}
