import { useEffect } from 'react'
import confetti from 'canvas-confetti'

const FOOD_EMOJIS = ['🌮', '🍣', '🍝', '🥟', '🥤', '🍱', '🍗', '🥑']

export default function Confetti({ trigger }) {
  useEffect(() => {
    if (!trigger) return
    const duration = 2500
    const end = Date.now() + duration
    const shapes = FOOD_EMOJIS.map(emoji =>
      confetti.shapeFromText({ text: emoji, scalar: 2 })
    )
    let animId
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
      if (Date.now() < end) {
        animId = requestAnimationFrame(frame)
      }
    }
    animId = requestAnimationFrame(frame)
    return () => {
      cancelAnimationFrame(animId)
      confetti.reset()
    }
  }, [trigger])

  return null
}
