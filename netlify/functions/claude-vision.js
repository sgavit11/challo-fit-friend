export default async (req, context) => {
  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405 })
  }

  const apiKey = process.env.CLAUDE_API_KEY
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'Scanner not configured' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }

  let body
  try { body = await req.json() } catch {
    return new Response(JSON.stringify({ error: 'Invalid request body' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  const { imageBase64, mediaType = 'image/jpeg' } = body

  if (!imageBase64) {
    return new Response(JSON.stringify({ error: 'No image provided' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-6',
        max_tokens: 512,
        messages: [{
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mediaType, data: imageBase64 },
            },
            {
              type: 'text',
              text: `Extract the nutrition information from this label. Return ONLY valid JSON in this exact format, nothing else:
{"name":"product name","brand":"brand name or empty string","servingSize":100,"servingUnit":"g","calories":0,"protein":0,"fat":0,"carbs":0}
Use numbers only for numeric fields. If you cannot read a value clearly, use 0. If this is not a nutrition label, return {"error":"not a nutrition label"}.`,
            },
          ],
        }],
      }),
    })

    if (!response.ok) {
      return new Response(JSON.stringify({ error: 'Scanner is having a moment — try again in a few seconds 🍳' }), {
        status: 502, headers: { 'Content-Type': 'application/json' }
      })
    }

    const result = await response.json()
    const text = result.content?.[0]?.text ?? ''

    let parsed
    try { parsed = JSON.parse(text) } catch {
      return new Response(JSON.stringify({ error: "Couldn't read that label — try better lighting 📸" }), {
        status: 422, headers: { 'Content-Type': 'application/json' }
      })
    }

    if (parsed.error) {
      return new Response(JSON.stringify({ error: parsed.error }), {
        status: 422, headers: { 'Content-Type': 'application/json' }
      })
    }

    return new Response(JSON.stringify({ data: parsed }), {
      status: 200, headers: { 'Content-Type': 'application/json' }
    })

  } catch (err) {
    return new Response(JSON.stringify({ error: 'Scanner is having a moment — try again 🍳' }), {
      status: 500, headers: { 'Content-Type': 'application/json' }
    })
  }
}
