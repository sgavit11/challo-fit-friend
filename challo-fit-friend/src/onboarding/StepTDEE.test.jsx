import { render, screen, fireEvent } from '@testing-library/react'
import StepTDEE from './StepTDEE'

const profile = {
  currentWeight: 180, weightUnit: 'lbs',
  height: 70, heightUnit: 'in',
  dob: '1993-01-01', sex: 'm',
  trainingDaysPerWeek: 4,
}

describe('StepTDEE', () => {
  it('renders the plan headline', () => {
    render(<StepTDEE profile={profile} onNext={() => {}} />)
    expect(screen.getByText(/based on your stats/i)).toBeInTheDocument()
  })

  it('renders calculated calorie target', () => {
    render(<StepTDEE profile={profile} onNext={() => {}} />)
    expect(screen.getByTestId('target-calories')).toBeInTheDocument()
  })

  it('calls onNext with full targets object', () => {
    const onNext = vi.fn()
    render(<StepTDEE profile={profile} onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: /let/i }))
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({
      calories: expect.any(Number),
      protein: expect.any(Number),
      fat: expect.any(Number),
      carbs: expect.any(Number),
      waterOz: expect.any(Number),
      steps: expect.any(Number),
      waterUnit: expect.any(String),
    }))
  })

  it('water display updates when unit changes to cups', () => {
    render(<StepTDEE profile={profile} onNext={() => {}} />)
    // Switch to cups — default waterOz for 180 lbs is 90 oz = 90/8 = ~11 cups
    fireEvent.click(screen.getByRole('button', { name: 'cups' }))
    const waterEl = screen.getByTestId('target-water')
    // Should show a number (not NaN, not the raw oz value)
    // textContent includes the unit label (e.g. "11cups"), so parse as int
    expect(parseInt(waterEl.textContent, 10)).toBeGreaterThan(0)
    expect(parseInt(waterEl.textContent, 10)).toBeLessThan(90) // less than raw oz
  })

  it('waterOz in onNext payload uses oz internally regardless of display unit', () => {
    const onNext = vi.fn()
    render(<StepTDEE profile={profile} onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: 'cups' }))
    fireEvent.click(screen.getByRole('button', { name: /let/i }))
    const call = onNext.mock.calls[0][0]
    // waterOz should be a reasonable oz value (not cups)
    expect(call.waterOz).toBeGreaterThan(10) // not a cups value
    expect(call.waterUnit).toBe('cups')
  })
})
