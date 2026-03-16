import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import { vi, describe, it, expect, beforeEach, afterEach } from 'vitest'
import SettingsScreen from './SettingsScreen'

const profile = {
  id: 'p1',
  name: 'Test',
  currentWeight: 180,
  goalWeight: 150,
  targetDate: '2026-12-01',
  weightUnit: 'lbs',
  waterUnit: 'oz',
  waterReminders: true,
  workoutLabels: [],
  targets: { calories: 2000, protein: 150, fat: 60, carbs: 200, waterOz: 64, steps: 8000 },
  calorieGuardrails: { underPercent: 80, overPercent: 120 },
}

vi.mock('../storage', () => ({
  exportAllData: vi.fn(() => ({
    version: 1,
    exportedAt: new Date().toISOString(),
    profileId: 'p1',
    foodLibrary: [],
    dailyLogs: {},
    weightLog: [],
  })),
  importAllData: vi.fn(() => ({ foods: 2, days: 1, weights: 0 })),
  getActiveProfileId: vi.fn(() => 'p1'),
}))

global.URL.createObjectURL = vi.fn(() => 'blob:mock')
global.URL.revokeObjectURL = vi.fn()

describe('SettingsScreen — Data card', () => {
  let originalFileReader

  beforeEach(() => {
    vi.clearAllMocks()
    originalFileReader = global.FileReader
  })

  afterEach(() => {
    global.FileReader = originalFileReader
  })

  it('renders Export and Import buttons', () => {
    render(<SettingsScreen profile={profile} onUpdate={() => {}} onBack={() => {}} />)
    expect(screen.getByRole('button', { name: /export my data/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /import from backup/i })).toBeInTheDocument()
  })

  it('shows success toast after valid import', async () => {
    render(<SettingsScreen profile={profile} onUpdate={() => {}} onBack={() => {}} />)

    const backup = JSON.stringify({ version: 1, profileId: 'p1', foodLibrary: [], dailyLogs: {}, weightLog: [] })
    const input = document.querySelector('input[type="file"]')
    global.FileReader = class {
      readAsText() { setTimeout(() => { this.onload({ target: { result: backup } }) }, 0) }
    }

    fireEvent.change(input, { target: { files: [new File([backup], 'challo-backup.json')] } })

    await waitFor(() => {
      expect(screen.getByText(/imported 2 foods/i)).toBeInTheDocument()
    })
  })

  it('shows error toast for invalid JSON', async () => {
    render(<SettingsScreen profile={profile} onUpdate={() => {}} onBack={() => {}} />)

    const input = document.querySelector('input[type="file"]')
    global.FileReader = class {
      readAsText() { setTimeout(() => { this.onload({ target: { result: 'not json' } }) }, 0) }
    }

    fireEvent.change(input, { target: { files: [new File(['not json'], 'bad.json')] } })

    await waitFor(() => {
      expect(screen.getByText(/invalid backup file/i)).toBeInTheDocument()
    })
  })

  it('shows "nothing new" toast when all counts are zero', async () => {
    const { importAllData } = await import('../storage')
    importAllData.mockReturnValueOnce({ foods: 0, days: 0, weights: 0 })

    render(<SettingsScreen profile={profile} onUpdate={() => {}} onBack={() => {}} />)

    const backup = JSON.stringify({ version: 1, profileId: 'p1', foodLibrary: [], dailyLogs: {}, weightLog: [] })
    const input = document.querySelector('input[type="file"]')
    global.FileReader = class {
      readAsText() { setTimeout(() => { this.onload({ target: { result: backup } }) }, 0) }
    }

    fireEvent.change(input, { target: { files: [new File([backup], 'challo-backup.json')] } })

    await waitFor(() => {
      expect(screen.getByText(/nothing new to import/i)).toBeInTheDocument()
    })
  })
})
