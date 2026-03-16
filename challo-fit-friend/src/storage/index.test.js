import { describe, it, expect, beforeEach } from 'vitest'
import {
  getProfiles, saveProfile, getActiveProfileId, setActiveProfileId,
  getFoodLibrary, saveFoodItem,
  getDailyLog, updateDailyLog,
  getWeightLog, saveWeightEntry,
} from './index'

beforeEach(() => localStorage.clear())

describe('profiles', () => {
  it('returns empty array when no profiles', () => {
    expect(getProfiles()).toEqual([])
  })
  it('saves and retrieves a profile', () => {
    const p = { id: '1', name: 'Shreyas' }
    saveProfile(p)
    expect(getProfiles()).toEqual([p])
  })
  it('updates existing profile by id', () => {
    saveProfile({ id: '1', name: 'Old' })
    saveProfile({ id: '1', name: 'New' })
    expect(getProfiles()).toHaveLength(1)
    expect(getProfiles()[0].name).toBe('New')
  })
})

describe('activeProfileId', () => {
  it('returns null when not set', () => expect(getActiveProfileId()).toBeNull())
  it('sets and gets id', () => {
    setActiveProfileId('abc')
    expect(getActiveProfileId()).toBe('abc')
  })
})

describe('foodLibrary', () => {
  it('returns empty array initially', () => expect(getFoodLibrary()).toEqual([]))
  it('saves and retrieves items', () => {
    const item = { id: '1', name: 'Oats' }
    saveFoodItem(item)
    expect(getFoodLibrary()).toEqual([item])
  })
})

describe('dailyLog', () => {
  it('returns zeroed log when no entry', () => {
    const log = getDailyLog('p1', '2026-03-15')
    expect(log.calories).toBe(0)
    expect(log.workoutLogged).toBe(false)
  })
  it('saves and retrieves log', () => {
    updateDailyLog('p1', '2026-03-15', { calories: 500 })
    expect(getDailyLog('p1', '2026-03-15').calories).toBe(500)
  })
  it('merges updates into existing log', () => {
    updateDailyLog('p1', '2026-03-15', { calories: 500 })
    updateDailyLog('p1', '2026-03-15', { protein: 30 })
    const log = getDailyLog('p1', '2026-03-15')
    expect(log.calories).toBe(500)
    expect(log.protein).toBe(30)
  })
})

describe('weightLog', () => {
  it('returns empty array initially', () => expect(getWeightLog('p1')).toEqual([]))
  it('saves and retrieves entries for profile', () => {
    saveWeightEntry({ id: '1', profileId: 'p1', weight: 180, date: '2026-03-15' })
    expect(getWeightLog('p1')).toHaveLength(1)
  })
  it('does not return entries for other profiles', () => {
    saveWeightEntry({ id: '1', profileId: 'p1', weight: 180, date: '2026-03-15' })
    expect(getWeightLog('p2')).toHaveLength(0)
  })
})
