export const getMacroNudge = (log, profile) => {
  const { calories, protein } = log
  const { targets, calorieGuardrails, name } = profile
  const underThreshold = targets.calories * (calorieGuardrails.underPercent / 100)
  const overThreshold = targets.calories * (calorieGuardrails.overPercent / 100)

  if (calories >= targets.calories && protein >= targets.protein) {
    return `Clean plate. Perfect day ✅🍽️`
  }
  if (protein >= targets.protein) {
    return `Main course done. Chef's kiss 🤌`
  }
  if (calories > overThreshold) {
    return `Easy there — even omakase has a last course 😅`
  }
  if (calories < underThreshold && calories > 0) {
    return `You're running on empty — time to refuel ${name} 🫓`
  }
  return null
}

export const getWaterNudge = (waterOz, profile) => {
  const target = profile.targets.waterOz
  if (waterOz >= target) return `Fully hydrated. You're basically a fresh cucumber 🥒`
  if (waterOz >= target * 0.5) return `Halfway there — keep the flow going 🌊`
  return null
}

export const getStepsNudge = (steps, profile) => {
  const target = profile.targets.steps
  const name = profile.name
  if (steps >= target) return `${target} steps DONE. You earned that extra dumpling 😂🥟`
  if (steps >= 5000) return `Almost at your target — a few more steps to go 🚶`
  if (steps > 0) return `You've barely left the kitchen — get moving ${name} 👟`
  return null
}

export const getWorkoutNudge = (workoutLogged, isMissedTrainingDay, name) => {
  if (workoutLogged) return `Session served. You showed up. 🔥`
  if (isMissedTrainingDay) return `The gym missed you today ${name} — come back strong tomorrow 💪`
  return `Rest day — even Michelin star chefs take Sundays off 👨‍🍳`
}
