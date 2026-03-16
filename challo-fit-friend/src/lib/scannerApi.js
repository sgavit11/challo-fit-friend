export const scanLabel = async (imageBase64, mediaType = 'image/jpeg') => {
  const res = await fetch('/.netlify/functions/claude-vision', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ imageBase64, mediaType }),
  })
  const json = await res.json()
  if (!res.ok || json.error) throw new Error(json.error || 'Scan failed')
  return json.data
}
