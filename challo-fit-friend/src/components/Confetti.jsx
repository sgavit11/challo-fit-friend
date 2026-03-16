import { useEffect } from 'react'
import confetti from 'canvas-confetti'

const FOOD_EMOJIS = ['🌮', '🍣', '🍝', '🥟', '🥤', '🍱', '🍗', '🥑']

export default function Confetti({ trigger }) {
  useEffect(() => {
    if (!trigger) return
    const duration = 2500
    const end = Date.now() + duration
    // Register food emoji shapes for canvas-confetti
    const shapes = FOOD_EMOJIS.map(emoji =>
      confetti.shapeFromText({ text: emoji, scalar: 2 })
    )
    const frame = () => {
      confetti({
        particleCount: 2,
        angle: 60,
        spread: 55,
        origin: { x: 0 },
        shapes,
        scalar: 2,
      })
      confetti({
        particleCount: 2,
        angle: 120,
        spread: 55,
        origin: { x: 1 },
        shapes,
        scalar: 2,
      })
      if (Date.now() < end) requestAnimationFrame(frame)
    }
    frame()
  }, [trigger])

  return null
}
