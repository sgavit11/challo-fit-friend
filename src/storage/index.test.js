import { describe, it, expect, beforeEach } from 'vitest'
import {
  getProfiles, saveProfile, getActiveProfileId, setActiveProfileId,
  getFoodLibrary, saveFoodItem,
  getDailyLog, updateDailyLog,
  getWeightLog, saveWeightEntry,
  exportAllData, importAllData,
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

describe('exportAllData', () => {
  it('returns correct shape with version, exportedAt, profileId, foodLibrary, dailyLogs, weightLog', () => {
    setActiveProfileId('p1')
    saveFoodItem({ id: 'f1', name: 'Oats' })
    updateDailyLog('p1', '2026-03-15', { calories: 500 })
    saveWeightEntry({ id: 'w1', profileId: 'p1', date: '2026-03-15', weight: 180 })

    const result = exportAllData()

    expect(result.version).toBe(1)
    expect(typeof result.exportedAt).toBe('string')
    expect(result.profileId).toBe('p1')
    expect(result.foodLibrary).toEqual([{ id: 'f1', name: 'Oats' }])
    expect(result.dailyLogs).toHaveProperty('p1_2026-03-15')
    expect(result.weightLog).toEqual([{ id: 'w1', profileId: 'p1', date: '2026-03-15', weight: 180 }])
  })

  it('only exports daily logs for the active profile', () => {
    setActiveProfileId('p1')
    updateDailyLog('p1', '2026-03-15', { calories: 100 })
    updateDailyLog('p2', '2026-03-15', { calories: 999 })

    const result = exportAllData()

    expect(Object.keys(result.dailyLogs)).toEqual(['p1_2026-03-15'])
  })

  it('only exports weight entries for the active profile', () => {
    setActiveProfileId('p1')
    saveWeightEntry({ id: 'w1', profileId: 'p1', date: '2026-03-15', weight: 180 })
    saveWeightEntry({ id: 'w2', profileId: 'p2', date: '2026-03-15', weight: 150 })

    const result = exportAllData()

    expect(result.weightLog).toHaveLength(1)
    expect(result.weightLog[0].id).toBe('w1')
  })
})

describe('importAllData', () => {
  it('adds new food items and returns correct count', () => {
    const backup = {
      version: 1,
      profileId: 'exported-profile',
      foodLibrary: [{ id: 'f1', name: 'Oats' }, { id: 'f2', name: 'Eggs' }],
      dailyLogs: {},
      weightLog: [],
    }
    const result = importAllData(backup, 'current-profile')
    expect(result.foods).toBe(2)
    expect(getFoodLibrary()).toHaveLength(2)
  })

  it('skips duplicate food items (same id) and does not count them', () => {
    saveFoodItem({ id: 'f1', name: 'Oats' })
    const backup = {
      version: 1,
      profileId: 'exported-profile',
      foodLibrary: [{ id: 'f1', name: 'Oats Modified' }, { id: 'f2', name: 'Eggs' }],
      dailyLogs: {},
      weightLog: [],
    }
    const result = importAllData(backup, 'current-profile')
    expect(result.foods).toBe(1)
    expect(getFoodLibrary().find(i => i.id === 'f1').name).toBe('Oats') // not overwritten
  })

  it('remaps daily log keys from exported profile to current profile', () => {
    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [],
      dailyLogs: { 'old-profile_2026-03-15': { calories: 500, protein: 30 } },
      weightLog: [],
    }
    importAllData(backup, 'new-profile')
    expect(getDailyLog('new-profile', '2026-03-15').calories).toBe(500)
  })

  it('skips log entries for dates already present on current profile', () => {
    updateDailyLog('new-profile', '2026-03-15', { calories: 100 })
    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [],
      dailyLogs: { 'old-profile_2026-03-15': { calories: 999 } },
      weightLog: [],
    }
    const result = importAllData(backup, 'new-profile')
    expect(result.days).toBe(0)
    expect(getDailyLog('new-profile', '2026-03-15').calories).toBe(100) // unchanged
  })

  it('remaps weight entry profileId to current profile', () => {
    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [],
      dailyLogs: {},
      weightLog: [{ id: 'w1', profileId: 'old-profile', date: '2026-03-15', weight: 180 }],
    }
    importAllData(backup, 'new-profile')
    expect(getWeightLog('new-profile')).toHaveLength(1)
    expect(getWeightLog('new-profile')[0].profileId).toBe('new-profile')
  })

  it('skips duplicate weight entries by id', () => {
    saveWeightEntry({ id: 'w1', profileId: 'new-profile', date: '2026-03-15', weight: 180 })
    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [],
      dailyLogs: {},
      weightLog: [{ id: 'w1', profileId: 'old-profile', date: '2026-03-15', weight: 200 }],
    }
    const result = importAllData(backup, 'new-profile')
    expect(result.weights).toBe(0)
    expect(getWeightLog('new-profile')[0].weight).toBe(180) // unchanged
  })

  it('returns correct counts for a mixed batch (some new, some duplicate)', () => {
    saveFoodItem({ id: 'f1', name: 'Oats' })
    updateDailyLog('new-profile', '2026-03-15', { calories: 100 })
    saveWeightEntry({ id: 'w1', profileId: 'new-profile', date: '2026-03-15', weight: 180 })

    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [
        { id: 'f1', name: 'Oats' },
        { id: 'f2', name: 'Eggs' },
      ],
      dailyLogs: {
        'old-profile_2026-03-15': { calories: 999 },
        'old-profile_2026-03-16': { calories: 400 },
      },
      weightLog: [
        { id: 'w1', profileId: 'old-profile', date: '2026-03-15', weight: 200 },
        { id: 'w2', profileId: 'old-profile', date: '2026-03-16', weight: 179 },
      ],
    }

    const result = importAllData(backup, 'new-profile')
    expect(result).toEqual({ foods: 1, days: 1, weights: 1 })
  })

  it('returns zero counts when everything is already present', () => {
    saveFoodItem({ id: 'f1', name: 'Oats' })
    updateDailyLog('new-profile', '2026-03-15', { calories: 100 })
    saveWeightEntry({ id: 'w1', profileId: 'new-profile', date: '2026-03-15', weight: 180 })

    const backup = {
      version: 1,
      profileId: 'old-profile',
      foodLibrary: [{ id: 'f1', name: 'Oats' }],
      dailyLogs: { 'old-profile_2026-03-15': { calories: 100 } },
      weightLog: [{ id: 'w1', profileId: 'old-profile', date: '2026-03-15', weight: 180 }],
    }

    const result = importAllData(backup, 'new-profile')
    expect(result).toEqual({ foods: 0, days: 0, weights: 0 })
  })

  it('returns { foods: 0, days: 0, weights: 0 } on a backup with missing sections', () => {
    const backup = { version: 1, profileId: 'old-profile' }
    const result = importAllData(backup, 'new-profile')
    expect(result).toEqual({ foods: 0, days: 0, weights: 0 })
  })

  it('correctly extracts the date when backup.profileId contains an underscore', () => {
    const backup = {
      version: 1,
      profileId: 'abc_123',
      foodLibrary: [],
      dailyLogs: { 'abc_123_2026-03-16': { calories: 300 } },
      weightLog: [],
    }
    importAllData(backup, 'new-profile')
    expect(getDailyLog('new-profile', '2026-03-16').calories).toBe(300)
  })
})
