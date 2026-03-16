const HomeIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
    <polyline points="9 22 9 12 15 12 15 22"/>
  </svg>
)

const FoodIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2"/>
    <line x1="7" y1="2" x2="7" y2="22"/>
    <path d="M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3zm0 0v7"/>
  </svg>
)

const WaterIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>
  </svg>
)

const ProgressIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/>
    <polyline points="16 7 22 7 22 13"/>
  </svg>
)

const WorkoutIcon = () => (
  <svg width="21" height="21" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <rect x="2" y="10" width="4" height="4" rx="1"/>
    <rect x="18" y="10" width="4" height="4" rx="1"/>
    <rect x="8" y="7" width="2" height="10" rx="1"/>
    <rect x="14" y="7" width="2" height="10" rx="1"/>
    <line x1="6" y1="12" x2="8" y2="12"/>
    <line x1="16" y1="12" x2="18" y2="12"/>
  </svg>
)

const TABS = [
  { id: 'home',     label: 'Home',     Icon: HomeIcon },
  { id: 'food',     label: 'Food',     Icon: FoodIcon },
  { id: 'water',    label: 'Water',    Icon: WaterIcon },
  { id: 'progress', label: 'Progress', Icon: ProgressIcon },
  { id: 'workout',  label: 'Workout',  Icon: WorkoutIcon },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'rgba(13, 13, 17, 0.96)',
      borderTop: '1px solid var(--border)',
      backdropFilter: 'blur(12px)',
      WebkitBackdropFilter: 'blur(12px)',
      display: 'flex',
      height: 'calc(var(--nav-height) + env(safe-area-inset-bottom, 0px))',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 100,
    }}>
      {TABS.map(({ id, label, Icon }) => {
        const active = activeTab === id
        return (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            aria-current={active ? 'page' : undefined}
            style={{
              flex: 1, height: '100%',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center',
              background: 'none', border: 'none', cursor: 'pointer',
              color: active ? 'var(--primary)' : 'var(--text-muted)',
              fontSize: 10, fontFamily: "'DM Sans', sans-serif",
              fontWeight: 500, gap: 4,
              position: 'relative',
              transition: 'color 0.15s',
            }}
          >
            {active && (
              <span style={{
                position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                width: 28, height: 3,
                background: 'var(--primary)',
                borderRadius: '0 0 4px 4px',
              }} />
            )}
            <Icon />
            {label}
          </button>
        )
      })}
    </nav>
  )
}
