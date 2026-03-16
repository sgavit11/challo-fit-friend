import { render, screen, fireEvent } from '@testing-library/react'
import BottomSheet from './BottomSheet'
import { vi } from 'vitest'

describe('BottomSheet', () => {
  it('renders children and title when open', () => {
    render(
      <BottomSheet isOpen title="Edit calories" onClose={() => {}}>
        <p>Sheet content</p>
      </BottomSheet>
    )
    expect(screen.getByText('Sheet content')).toBeInTheDocument()
    expect(screen.getByText('Edit calories')).toBeInTheDocument()
  })

  it('does not render children when closed', () => {
    render(
      <BottomSheet isOpen={false} title="Edit" onClose={() => {}}>
        <p>Hidden</p>
      </BottomSheet>
    )
    expect(screen.queryByText('Hidden')).not.toBeInTheDocument()
  })

  it('calls onClose when backdrop is clicked', () => {
    const onClose = vi.fn()
    render(
      <BottomSheet isOpen title="Edit" onClose={onClose}>
        <p>Content</p>
      </BottomSheet>
    )
    fireEvent.click(screen.getByTestId('bottom-sheet-backdrop'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
