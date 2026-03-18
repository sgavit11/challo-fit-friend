import { useRef, useState } from 'react'
import { supabase } from '../../lib/supabase'

/**
 * Props:
 *   value    — { preview: string (blob URL), url: string|null (public URL) } | null
 *   onChange — called with value object on select/upload, or null on clear
 */
export default function PhotoUpload({ value, onChange }) {
  const inputRef = useRef(null)
  const [uploading, setUploading] = useState(false)

  const handleFile = async (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    const preview = URL.createObjectURL(file)
    onChange({ preview, url: null })

    setUploading(true)
    const ext = file.name.split('.').pop() || 'jpg'
    const path = `${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`
    const { error } = await supabase.storage.from('recipe-photos').upload(path, file, { upsert: true })
    if (!error) {
      const { data: { publicUrl } } = supabase.storage.from('recipe-photos').getPublicUrl(path)
      onChange({ preview, url: publicUrl })
    }
    setUploading(false)
  }

  const clear = (e) => {
    e.stopPropagation()
    onChange(null)
    if (inputRef.current) inputRef.current.value = ''
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      style={{
        width: '100%', height: 140,
        background: value?.preview ? 'none' : 'var(--bg-card)',
        border: `1.5px dashed ${value?.preview ? 'transparent' : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
        gap: 8, marginBottom: 16,
        cursor: 'pointer', position: 'relative', overflow: 'hidden',
      }}
    >
      {value?.preview ? (
        <>
          <img src={value.preview} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          {uploading && (
            <div style={{
              position: 'absolute', inset: 0,
              background: 'rgba(0,0,0,0.5)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 12, color: 'var(--text-muted)',
            }}>
              Uploading…
            </div>
          )}
          <button
            type="button"
            onClick={clear}
            style={{
              position: 'absolute', top: 8, right: 8,
              width: 26, height: 26, borderRadius: '50%',
              background: 'rgba(0,0,0,0.6)', border: 'none',
              color: 'white', fontSize: 16, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >×</button>
        </>
      ) : (
        <>
          <svg width="28" height="28" fill="none" stroke="var(--text-muted)" strokeWidth="1.5"
            strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <polyline points="21 15 16 10 5 21"/>
          </svg>
          <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            Add photo <span style={{ color: 'var(--primary)' }}>(optional)</span>
          </div>
        </>
      )}
      <input ref={inputRef} type="file" accept="image/*" onChange={handleFile} style={{ display: 'none' }} />
    </div>
  )
}
