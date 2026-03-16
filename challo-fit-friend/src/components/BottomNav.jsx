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
      background: '#111', borderTop: '1px solid #222',
      display: 'flex', height: 'var(--nav-height)',
      zIndex: 100,
    }}>
      {TABS.map(tab => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            background: 'none', border: 'none', cursor: 'pointer',
            color: activeTab === tab.id ? 'var(--saffron)' : 'var(--text-muted)',
            fontSize: 10, gap: 2,
          }}
        >
          <span style={{ fontSize: 22 }}>{tab.icon}</span>
          {tab.label}
        </button>
      ))}
    </nav>
  )
}
