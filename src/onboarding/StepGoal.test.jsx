import { render, screen, fireEvent } from '@testing-library/react'
import StepGoal from './StepGoal'

describe('StepGoal', () => {
  it('renders goal weight label and target date selects', () => {
    render(<StepGoal weightUnit="lbs" onNext={() => {}} />)
    expect(screen.getByText(/goal weight/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/month/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/day/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/year/i)).toBeInTheDocument()
  })

  it('Next button is disabled without a target date', () => {
    render(<StepGoal weightUnit="lbs" onNext={() => {}} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('calls onNext with goalWeight and targetDate when date is set', () => {
    const onNext = vi.fn()
    render(<StepGoal weightUnit="lbs" onNext={onNext} />)
    fireEvent.change(screen.getByLabelText(/month/i), { target: { value: '12' } })
    fireEvent.change(screen.getByLabelText(/day/i), { target: { value: '1' } })
    fireEvent.change(screen.getByLabelText(/year/i), { target: { value: '2026' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({
      goalWeight: expect.any(Number),
      targetDate: '2026-12-01',
    }))
  })
})
