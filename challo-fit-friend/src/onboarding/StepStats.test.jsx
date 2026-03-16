import { render, screen, fireEvent } from '@testing-library/react'
import StepStats from './StepStats'

describe('StepStats', () => {
  it('renders Weight and Height labels', () => {
    render(<StepStats onNext={() => {}} />)
    expect(screen.getByText('Weight')).toBeInTheDocument()
    expect(screen.getByText('Height')).toBeInTheDocument()
  })

  it('renders Male and Female sex toggle buttons', () => {
    render(<StepStats onNext={() => {}} />)
    expect(screen.getByRole('button', { name: 'Male' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Female' })).toBeInTheDocument()
  })

  it('Next button is enabled with default values', () => {
    render(<StepStats onNext={() => {}} />)
    expect(screen.getByRole('button', { name: /next/i })).not.toBeDisabled()
  })

  it('calls onNext with required shape', () => {
    const onNext = vi.fn()
    render(<StepStats onNext={onNext} />)
    fireEvent.click(screen.getByRole('button', { name: /next/i }))
    expect(onNext).toHaveBeenCalledWith(expect.objectContaining({
      currentWeight: expect.any(Number),
      height: expect.any(Number),
      weightUnit: expect.any(String),
      heightUnit: expect.any(String),
      sex: expect.any(String),
    }))
  })
})
