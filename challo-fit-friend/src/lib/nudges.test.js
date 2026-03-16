import { describe, it, expect } from 'vitest'
import { getMacroNudge, getWaterNudge, getStepsNudge, getWorkoutNudge } from './nudges'

const profile = {
  name: 'Shreyas',
  targets: { calories: 2000, protein: 150, waterOz: 96, steps: 10000 },
  calorieGuardrails: { underPercent: 60, overPercent: 110 },
}

describe('getMacroNudge', () => {
  it('returns under-calories nudge when below guardrail', () => {
    const msg = getMacroNudge({ calories: 900, protein: 50 }, profile)
    expect(msg).toContain('running on empty')
  })
  it('returns over-calories nudge when above guardrail', () => {
    const msg = getMacroNudge({ calories: 2300, protein: 50 }, profile)
    expect(msg).toContain('omakase')
  })
  it('returns protein nudge when protein goal hit', () => {
    const msg = getMacroNudge({ calories: 1800, protein: 150 }, profile)
    expect(msg).toContain("Chef's kiss")
  })
  it('returns clean plate when all targets hit', () => {
    const msg = getMacroNudge({ calories: 2000, protein: 150 }, profile)
    expect(msg).toContain('Clean plate')
  })
  it('returns null when no threshold crossed', () => {
    const msg = getMacroNudge({ calories: 1500, protein: 100 }, profile)
    expect(msg).toBeNull()
  })
})

describe('getWaterNudge', () => {
  it('returns 50% nudge at halfway', () => {
    expect(getWaterNudge(48, profile)).toContain('Halfway there')
  })
  it('returns 100% nudge when full', () => {
    expect(getWaterNudge(96, profile)).toContain('cucumber')
  })
  it('returns null below 50%', () => {
    expect(getWaterNudge(30, profile)).toBeNull()
  })
})

describe('getStepsNudge', () => {
  it('returns under 5k message', () => {
    expect(getStepsNudge(3000, profile)).toContain('kitchen')
  })
  it('returns 5k-9k message', () => {
    expect(getStepsNudge(7000, profile)).toContain('Almost')
  })
  it('returns target hit message with dynamic target', () => {
    const msg = getStepsNudge(10000, profile)
    expect(msg).toContain('10000')
    expect(msg).toContain('dumpling')
  })
})

describe('getWorkoutNudge', () => {
  it('returns logged message when workout done', () => {
    expect(getWorkoutNudge(true, false, 'Shreyas')).toContain('showed up')
  })
  it('returns missed message on missed training day', () => {
    expect(getWorkoutNudge(false, true, 'Shreyas')).toContain('missed you')
  })
  it('returns rest day message on non-training day', () => {
    expect(getWorkoutNudge(false, false, 'Shreyas')).toContain('Sundays off')
  })
})
