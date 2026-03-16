import { useRef, useEffect } from 'react'

const ITEM_HEIGHT = 44

export default function ScrollPicker({ options, value, onChange }) {
  const ref = useRef()

  useEffect(() => {
    const idx = options.indexOf(value)
    if (idx >= 0 && ref.current) {
      ref.current.scrollTop = idx * ITEM_HEIGHT
    }
  }, [value, options])

  const handleScroll = () => {
    const idx = Math.round(ref.current.scrollTop / ITEM_HEIGHT)
    const clamped = Math.max(0, Math.min(idx, options.length - 1))
    if (options[clamped] !== value) onChange(options[clamped])
  }

  return (
    <div style={{ position: 'relative', height: ITEM_HEIGHT * 3, overflow: 'hidden', userSelect: 'none' }}>
      {/* Selection band */}
      <div style={{
        position: 'absolute', top: ITEM_HEIGHT, left: 0, right: 0,
        height: ITEM_HEIGHT, background: 'var(--bg-input)',
        borderRadius: 8, pointerEvents: 'none', zIndex: 1,
        border: '1px solid var(--saffron)',
      }} />
      {/* Top fade */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: ITEM_HEIGHT,
        background: 'linear-gradient(to bottom, var(--bg), transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      {/* Bottom fade */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: ITEM_HEIGHT,
        background: 'linear-gradient(to top, var(--bg), transparent)',
        pointerEvents: 'none', zIndex: 2,
      }} />
      {/* Scrollable list */}
      <div
        ref={ref}
        data-testid="scroll-picker-list"
        onScroll={handleScroll}
        style={{
          height: '100%', overflowY: 'scroll',
          scrollSnapType: 'y mandatory', scrollbarWidth: 'none',
          WebkitOverflowScrolling: 'touch',
          paddingTop: ITEM_HEIGHT, paddingBottom: ITEM_HEIGHT,
        }}
      >
        {options.map(opt => (
          <div
            key={opt}
            data-selected={opt === value ? 'true' : 'false'}
            style={{
              height: ITEM_HEIGHT, display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              scrollSnapAlign: 'center', fontSize: 18,
              fontWeight: opt === value ? 600 : 400,
              color: opt === value ? 'var(--text)' : 'var(--text-muted)',
            }}
          >
            {opt}
          </div>
        ))}
      </div>
    </div>
  )
}
