import { describe, it, expect } from 'vitest'
import {
  calcCalorieTarget, calcProteinTarget, calcWaterTarget,
  calcMacrosForQuantity, calcWeeklyAverage, calcTrendLine,
  calcWeeksToGoal, todayKey, greetingIndex,
} from './calculations'

describe('calcCalorieTarget', () => {
  it('returns reasonable range for male 180lb 70in 25yo moderate activity', () => {
    const cals = calcCalorieTarget({ weight: 180, height: 70, age: 25, sex: 'm', activityLevel: 'moderate' })
    expect(cals).toBeGreaterThan(2000)
    expect(cals).toBeLessThan(3500)
  })
})

describe('calcProteinTarget', () => {
  it('returns 0.8g per lb of bodyweight', () => {
    expect(calcProteinTarget(180)).toBe(144)
  })
})

describe('calcWaterTarget', () => {
  it('returns 96oz as default', () => {
    expect(calcWaterTarget()).toBe(96)
  })
})

describe('calcMacrosForQuantity', () => {
  it('scales macros by quantity multiplier', () => {
    const item = { perServing: { calories: 100, protein: 10, fat: 5, carbs: 15 } }
    const result = calcMacrosForQuantity(item, 2.5)
    expect(result.calories).toBe(250)
    expect(result.protein).toBe(25)
    expect(result.fat).toBe(12.5)
    expect(result.carbs).toBe(37.5)
  })
})

describe('calcWeeksToGoal', () => {
  it('returns Infinity when no weight loss recorded', () => {
    expect(calcWeeksToGoal(180, 160, 0)).toBe(Infinity)
  })
  it('calculates weeks based on weekly loss rate', () => {
    expect(calcWeeksToGoal(175, 160, 1)).toBe(15)
  })
})

describe('todayKey', () => {
  it('returns YYYY-MM-DD string', () => {
    expect(todayKey()).toMatch(/^\d{4}-\d{2}-\d{2}$/)
  })
})

describe('greetingIndex', () => {
  it('returns a number 0-5', () => {
    const idx = greetingIndex()
    expect(idx).toBeGreaterThanOrEqual(0)
    expect(idx).toBeLessThanOrEqual(5)
  })
})
