import { render, screen, fireEvent } from '@testing-library/react'
import ScrollPicker from './ScrollPicker'
import { describe, it, expect, vi } from 'vitest'

const OPTIONS = ['80', '81', '82', '83', '84']

describe('ScrollPicker', () => {
  it('renders all options', () => {
    render(<ScrollPicker options={OPTIONS} value="82" onChange={() => {}} />)
    OPTIONS.forEach(o => expect(screen.getByText(o)).toBeInTheDocument())
  })

  it('marks the selected value with data-selected="true"', () => {
    const { container } = render(<ScrollPicker options={OPTIONS} value="82" onChange={() => {}} />)
    const selected = container.querySelector('[data-selected="true"]')
    expect(selected).toHaveTextContent('82')
  })

  it('calls onChange with correct value on scroll', () => {
    const onChange = vi.fn()
    const { container } = render(<ScrollPicker options={OPTIONS} value="82" onChange={onChange} />)
    const list = container.querySelector('[data-testid="scroll-picker-list"]')
    // Scroll to index 3 (value "83"), ITEM_HEIGHT = 44
    Object.defineProperty(list, 'scrollTop', { value: 44 * 3, configurable: true })
    fireEvent.scroll(list)
    expect(onChange).toHaveBeenCalledWith('83')
  })
})
