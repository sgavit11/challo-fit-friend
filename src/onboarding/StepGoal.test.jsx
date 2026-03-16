import { render, screen, fireEvent } from '@testing-library/react'
import StepGoal from './StepGoal'

describe('StepGoal', () => {
  it('renders goal weight picker and target date input', () => {
    render(<StepGoal weightUnit="lbs" onNext={() => {}} />)
    expect(screen.getByText(/goal weight/i)).toBeInTheDocument()
    expect(screen.getByDisplayValue('')).toBeInTheDocument() // date input empty by default
  })

  it('Next button is disabled without a target date', () => {
    render(<StepGoal weightUnit="lbs" onNext={() => {}} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('calls onNext with goalWeight and targetDate when date is set', () => {
    const onNext = vi.fn()
    render(<StepGoal weightUnit="lbs" onNext={onNext} />)
    fireEvent.change(screen.getByDisplayValue(''), { target: { value: '2026-12-01' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({
      goalWeight: expect.any(Number),
      targetDate: '2026-12-01',
    }))
  })
})
