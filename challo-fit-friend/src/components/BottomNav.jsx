const TABS = [
  { id: 'home', label: 'Home', icon: '🏠' },
  { id: 'food', label: 'Food', icon: '🍽️' },
  { id: 'water', label: 'Water', icon: '💧' },
  { id: 'progress', label: 'Progress', icon: '📈' },
  { id: 'workout', label: 'Workout', icon: '💪' },
]

export default function BottomNav({ activeTab, onTabChange }) {
  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: '50%', transform: 'translateX(-50%)',
      width: '100%', maxWidth: 430,
      background: 'var(--bg-card)', borderTop: '1px solid var(--border)',
      display: 'flex', height: 'calc(var(--nav-height) + env(safe-area-inset-bottom, 0px))',
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      zIndex: 100,
    }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          aria-current={activeTab === tab.id ? 'page' : undefined}
          style={{
            flex: 1, height: '100%',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: activeTab === tab.id ? 'var(--saffron)' : 'var(--text-muted)',
            fontSize: 10, gap: 2,
          }}
        >
          <span aria-hidden="true" style={{ fontSize: 22 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
