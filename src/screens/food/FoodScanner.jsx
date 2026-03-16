import { useState, useRef } from 'react'
import { scanLabel } from '../../lib/scannerApi'

const genId = () => Math.random().toString(36).slice(2)

const EMPTY_FORM = { name: '', brand: '', servingSize: '', servingUnit: 'g', calories: '', protein: '', fat: '', carbs: '' }

export default function FoodScanner({ onSave, onCancel }) {
  const [stage, setStage] = useState('upload') // 'upload' | 'scanning' | 'confirm' | 'error'
  const [form, setForm] = useState(EMPTY_FORM)
  const [errorMsg, setErrorMsg] = useState('')
  const [firstUse] = useState(() => localStorage.getItem('cff_scanner_used') !== 'yes')
  const fileRef = useRef()

  const handleFile = async (file) => {
    if (!file) return
    if (!navigator.onLine) {
      setErrorMsg("You're offline — scanner needs a connection 📡")
      setStage('error')
      return
    }
    setStage('scanning')
    try {
      const base64 = await fileToBase64(file)
      const data = await scanLabel(base64, file.type || 'image/jpeg')
      setForm({
        name: data.name || '',
        brand: data.brand || '',
        servingSize: String(data.servingSize || ''),
        servingUnit: data.servingUnit || 'g',
        calories: String(data.calories || ''),
        protein: String(data.protein || ''),
        fat: String(data.fat || ''),
        carbs: String(data.carbs || ''),
      })
      localStorage.setItem('cff_scanner_used', 'yes')
      setStage('confirm')
    } catch (err) {
      setErrorMsg(err.message || "Couldn't read that label — try better lighting 📸")
      setStage('error')
    }
  }

  const handleSave = () => {
    const required = ['name', 'servingSize', 'calories', 'protein', 'fat', 'carbs']
    const missing = required.filter(k => !form[k])
    if (missing.length) { setErrorMsg(`Please fill in: ${missing.join(', ')}`); return }
    const item = {
      id: genId(),
      name: form.name,
      brand: form.brand,
      servingSize: Number(form.servingSize),
      servingUnit: form.servingUnit,
      perServing: {
        calories: Number(form.calories),
        protein: Number(form.protein),
        fat: Number(form.fat),
        carbs: Number(form.carbs),
      },
      dateAdded: new Date().toISOString().split('T')[0],
    }
    onSave(item)
  }

  const field = (key, label, type = 'text') => (
    <div key={key} style={{ marginBottom: 12 }}>
      <div className="label">{label}</div>
      <input type={type} value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        style={{ borderColor: !form[key] ? 'var(--chili)' : undefined }}
      />
    </div>
  )

  return (
    <div className="screen">
      <button onClick={onCancel} style={{ background: 'none', border: 'none', color: 'var(--saffron)', cursor: 'pointer', marginBottom: 16, fontSize: 16 }}>
        ← Back
      </button>

      {stage === 'upload' && (
        <>
          <h1>Scan a label 📸</h1>
          {firstUse && <div className="nudge">Best results with clear, well-lit label photos 📸</div>}
          <div className="card" style={{ textAlign: 'center', padding: 40 }}
            onClick={() => fileRef.current?.click()}>
            <div style={{ fontSize: 56 }}>📸</div>
            <p style={{ marginTop: 8 }}>Tap to upload or take a photo</p>
          </div>
          <input ref={fileRef} type="file" accept="image/*" capture="environment"
            style={{ display: 'none' }}
            onChange={e => handleFile(e.target.files?.[0])}
          />
          <button className="btn btn-primary" onClick={() => fileRef.current?.click()}>
            Choose photo
          </button>
        </>
      )}

      {stage === 'scanning' && (
        <div style={{ textAlign: 'center', paddingTop: 80 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>🔍</div>
          <h2>Reading label...</h2>
          <p>Claude is extracting the macros</p>
        </div>
      )}

      {stage === 'confirm' && (
        <>
          <h1>Review & save</h1>
          <p style={{ marginBottom: 16 }}>Check the values — edit anything that looks wrong.</p>
          {field('name', 'Product name *')}
          {field('brand', 'Brand')}
          <div style={{ display: 'flex', gap: 8 }}>
            <div style={{ flex: 2 }}>{field('servingSize', 'Serving size *', 'number')}</div>
            <div style={{ flex: 1 }}>
              <div className="label">Unit</div>
              <select value={form.servingUnit} onChange={e => setForm(f => ({ ...f, servingUnit: e.target.value }))}
                style={{ width: '100%', background: 'var(--bg-input)', color: 'var(--text)', border: '1px solid var(--border)', borderRadius: 8, padding: 12, fontSize: 16 }}>
                {['g','ml','oz','cup','tbsp','tsp','piece'].map(u => <option key={u} value={u}>{u}</option>)}
              </select>
            </div>
          </div>
          {field('calories', 'Calories (kcal) *', 'number')}
          {field('protein', 'Protein (g) *', 'number')}
          {field('fat', 'Fat (g) *', 'number')}
          {field('carbs', 'Carbs (g) *', 'number')}
          {errorMsg && <p style={{ color: 'var(--chili)', marginBottom: 12 }}>{errorMsg}</p>}
          <button className="btn btn-primary" onClick={handleSave} style={{ marginBottom: 8 }}>
            Looks good → Save 👨‍🍳
          </button>
          <button className="btn btn-secondary" onClick={() => setStage('upload')}>Re-scan</button>
        </>
      )}

      {stage === 'error' && (
        <div style={{ textAlign: 'center', paddingTop: 60 }}>
          <div style={{ fontSize: 56, marginBottom: 16 }}>😅</div>
          <h2>Scan failed</h2>
          <p style={{ marginBottom: 24 }}>{errorMsg}</p>
          <button className="btn btn-primary" onClick={() => setStage('upload')}>Try again</button>
        </div>
      )}
    </div>
  )
}

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result.split(',')[1])
    reader.onerror = reject
    reader.readAsDataURL(file)
  })
}
