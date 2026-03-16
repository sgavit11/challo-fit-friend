import { render, screen, fireEvent } from '@testing-library/react'
import ManualEntryForm from './ManualEntryForm'

describe('ManualEntryForm', () => {
  it('renders required fields', () => {
    render(<ManualEntryForm onSave={() => {}} onCancel={() => {}} />)
    expect(screen.getByPlaceholderText('Product name')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Calories')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('Protein')).toBeInTheDocument()
  })

  it('calls onSave with correct food item shape on valid submission', () => {
    const onSave = vi.fn()
    render(<ManualEntryForm onSave={onSave} onCancel={() => {}} />)
    fireEvent.change(screen.getByPlaceholderText('Product name'), { target: { value: 'Oats' } })
    fireEvent.change(screen.getByPlaceholderText('Serving size'), { target: { value: '100' } })
    fireEvent.change(screen.getByPlaceholderText('Calories'), { target: { value: '389' } })
    fireEvent.change(screen.getByPlaceholderText('Protein'), { target: { value: '17' } })
    fireEvent.change(screen.getByPlaceholderText('Fat'), { target: { value: '7' } })
    fireEvent.change(screen.getByPlaceholderText('Carbs'), { target: { value: '66' } })
    fireEvent.click(screen.getByRole('button', { name: /save/i }))
    expect(onSave).toHaveBeenCalledWith(expect.objectContaining({
      name: 'Oats',
      perServing: expect.objectContaining({ calories: 389, protein: 17 }),
    }))
  })

  it('renders scan link when onScanInstead provided', () => {
    const onScanInstead = vi.fn()
    render(<ManualEntryForm onSave={() => {}} onCancel={() => {}} onScanInstead={onScanInstead} />)
    fireEvent.click(screen.getByText(/scan label instead/i))
    expect(onScanInstead).toHaveBeenCalledTimes(1)
  })
})
