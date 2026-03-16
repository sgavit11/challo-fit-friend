export default function ProgressBar({ value, max, color = 'var(--primary)', label, sublabel }) {
  const pct = Math.min(100, max > 0 ? (value / max) * 100 : 0)
  const over = value > max && max > 0

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 5 }}>
        <span style={{
          fontSize: 13, fontWeight: 500,
          color: over ? 'var(--chili)' : 'var(--text)',
        }}>{label}</span>
        <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 500 }}>{sublabel}</span>
      </div>
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        aria-label={label}
        style={{
          background: 'rgba(255, 255, 255, 0.06)',
          borderRadius: 99,
          height: 8,
          overflow: 'hidden',
        }}
      >
        <div style={{
          width: `${pct}%`,
          height: '100%',
          background: over ? 'var(--chili)' : color,
          borderRadius: 99,
          transition: 'width 0.4s ease',
        }} />
      </div>
    </div>
  )
}
