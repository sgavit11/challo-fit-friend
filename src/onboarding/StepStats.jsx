import { useState } from 'react'

export default function StepStats({ onNext }) {
  const [weight, setWeight] = useState('')
  const [height, setHeight] = useState('')
  const [weightUnit, setWeightUnit] = useState('lbs')
  const [heightUnit, setHeightUnit] = useState('in')

  const valid = weight && height && !isNaN(Number(weight)) && !isNaN(Number(height))

  return (
    <div className="screen" style={{ paddingTop: 48 }}>
      <h2>Your current stats</h2>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <div style={{ flex: 1 }}>
          <div className="label">Weight</div>
          <input type="number" placeholder="180" value={weight} onChange={e => setWeight(e.target.value)} />
        </div>
        <div>
          <div className="label">Unit</div>
          <select value={weightUnit} onChange={e => setWeightUnit(e.target.value)}
            style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 8px', fontSize: 16 }}>
            <option value="lbs">lbs</option>
            <option value="kg">kg</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
        <div style={{ flex: 1 }}>
          <div className="label">Height</div>
          <input type="number" placeholder="70" value={height} onChange={e => setHeight(e.target.value)} />
        </div>
        <div>
          <div className="label">Unit</div>
          <select value={heightUnit} onChange={e => setHeightUnit(e.target.value)}
            style={{ background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: '12px 8px', fontSize: 16 }}>
            <option value="in">in</option>
            <option value="cm">cm</option>
          </select>
        </div>
      </div>
      <button className="btn btn-primary" disabled={!valid}
        onClick={() => onNext({ currentWeight: Number(weight), height: Number(height), weightUnit, heightUnit })}>
        Next →
      </button>
    </div>
  )
}
