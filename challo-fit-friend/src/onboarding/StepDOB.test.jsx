import { render, screen, fireEvent } from '@testing-library/react'
import StepDOB from './StepDOB'

describe('StepDOB', () => {
  it('renders month, day, year selects', () => {
    render(<StepDOB onNext={() => {}} />)
    expect(screen.getByLabelText('Month')).toBeInTheDocument()
    expect(screen.getByLabelText('Day')).toBeInTheDocument()
    expect(screen.getByLabelText('Year')).toBeInTheDocument()
  })

  it('Next button is disabled until a valid date is selected', () => {
    render(<StepDOB onNext={() => {}} />)
    expect(screen.getByRole('button', { name: /next/i })).toBeDisabled()
  })

  it('calls onNext with dob in YYYY-MM-DD format', () => {
    const onNext = vi.fn()
    render(<StepDOB onNext={onNext} />)
    fireEvent.change(screen.getByLabelText('Month'), { target: { value: '6' } })
    fireEvent.change(screen.getByLabelText('Day'), { target: { value: '15' } })
    fireEvent.change(screen.getByLabelText('Year'), { target: { value: '1992' } })
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith({ dob: '1992-06-15' })
  })
})
