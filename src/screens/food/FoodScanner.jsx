export default function FoodScanner({ onSave, onCancel }) {
  return (
    <div className="screen">
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', marginBottom: 16 }}>
        ← Back
      </button>
      <h1>Scan a label 📸</h1>
      <p>Food scanner coming in the next step.</p>
    </div>
  )
}
