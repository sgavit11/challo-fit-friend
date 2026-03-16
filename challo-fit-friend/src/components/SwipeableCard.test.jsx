import { render, screen } from '@testing-library/react'
import SwipeableCard from './SwipeableCard'

describe('SwipeableCard', () => {
  it('renders children', () => {
    render(<SwipeableCard onDelete={() => {}}><span>Food item</span></SwipeableCard>)
    expect(screen.getByText('Food item')).toBeInTheDocument()
  })

  it('renders the delete zone element in the DOM', () => {
    const { container } = render(
      <SwipeableCard onDelete={() => {}}><span>Item</span></SwipeableCard>
    )
    expect(container.querySelector('[data-testid="delete-zone"]')).toBeInTheDocument()
  })
})
