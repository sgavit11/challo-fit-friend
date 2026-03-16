export default function ProgressBar({ value, max, color = 'var(--saffron)', label, sublabel }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  const over = value > max && max > 0

  return (
    <div style={{ marginBottom: 16 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span style={{ fontSize: 13, color: over ? 'var(--chili)' : 'var(--text)' }}>{label}</span>
        <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{sublabel}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        style={{
          background: '#333', borderRadius: 8, height: 12, overflow: 'hidden',
        }}
      >
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: over ? 'var(--chili)' : color,
          borderRadius: 8,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}
