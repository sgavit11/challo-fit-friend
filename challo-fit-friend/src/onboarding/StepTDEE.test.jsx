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
})
