import { useState, useCallback } from 'react'
import { getWalkingMinutes } from '../utils/haversine'

const MELBOURNE_LAT = -37.8136
const MELBOURNE_LNG = 144.9631

function haversineKm(lat1, lng1, lat2, lng2) {
  const R = 6371
  const dLat = ((lat2 - lat1) * Math.PI) / 180
  const dLng = ((lng2 - lng1) * Math.PI) / 180
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
}

export const INTENT_LABELS = {
  cool_down:       'Just need to cool down',
  something_to_do: 'Something to do today',
  free_nearby:     'Free & nearby',
  easy_walk:       'Close enough to walk',
  quiet_sit:       'Quiet place to sit',
}

const INTENT_INSTRUCTIONS = {
  cool_down: 
    'Search specifically for venues with confirmed strong air conditioning — shopping centres, libraries, or indoor pools. Do NOT recommend outdoor parks or gardens.',
  
  something_to_do: 
    'Search specifically for a real event, class, exhibition or community program running TODAY that elderly people aged 65+ can attend — e.g. art exhibition opening, gentle yoga, craft workshop, morning tea. Do NOT recommend venues based on permanent features alone.',
  
  free_nearby: 
    'Search specifically for venues that are completely free to enter with no booking required — libraries, free galleries, public gardens with shade. Exclude any venue with an entry fee.',
  
  easy_walk: 
    'Only recommend venues under 10 minutes walk. Rank strictly by walking_minutes — closest first. Exclude any venue over 10 min walk even if it matches other criteria.',
  
  quiet_sit: 
    'Search specifically for quiet, calm indoor spaces — libraries reading rooms, botanical gardens conservatories, quiet gallery wings. Exclude shopping centres, markets, and any noisy or crowded venues.',
}

function buildWeatherForecast(hourly) {
  if (!hourly?.time || !hourly?.apparent_temperature) return 'Forecast unavailable'
  const now = new Date()
  const lines = []
  for (let i = 0; i < hourly.time.length && lines.length < 8; i++) {
    const t = new Date(hourly.time[i])
    if (t.toDateString() === now.toDateString() && t.getHours() >= now.getHours()) {
      const h = t.getHours()
      lines.push(`${h % 12 || 12}${h >= 12 ? 'pm' : 'am'}: ${Math.round(hourly.apparent_temperature[i])}°C`)
    }
  }
  return lines.join(', ') || 'Forecast unavailable'
}

function buildPrompt({ intent, extraNote, userLat, userLng, venues, suburb, weatherForecast }) {
  const now      = new Date()
  const time     = now.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: true })
  const fullDate = now.toLocaleDateString('en-AU', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const venueList = venues
    .map(v => `- id:${v.id} | "${v.name}" | ${v.address} | ${v.category ?? v.sub_theme ?? 'Unknown'} | ${v.walking_minutes} min walk`)
    .join('\n')

  return `You are a local guide helping elderly residents in Melbourne stay cool and safe on a hot day.

## Context
- Date: ${fullDate}, ${time}
- Location: ${suburb || 'Melbourne'}, Melbourne (${userLat}, ${userLng})
- User need: "${INTENT_LABELS[intent]}" — ${INTENT_INSTRUCTIONS[intent]}
${extraNote ? `- Extra note from user: ${extraNote}\n` : ''}- Forecast (feels-like): ${weatherForecast}

## Your task
1. Use Google Search to check TODAY'S (${fullDate}) status for the 5 venues below.
2. Specifically find ONE senior-friendly activity or feature for each (e.g., "Air-conditioned reading room," "Gentle exercise class at 10 AM," or "Opening hours").
3. Return the 3 best as JSON.

## Available venues
${venueList}

## Output
Return ONLY a raw JSON object (no markdown, no prose, nothing outside the braces):

{
  "best_outside_time": "<one sentence: coolest time window to go outside today based on forecast>",
  "events": [
    {
      "venue_id": "<id from list>",
      "venue": "<exact name from list>",
      "activity": "<specific event, class, or heat-relief feature found via search>",
      "address": "<exact address from list>",
      "walking_minutes": <number from list>,
      "is_free": true or false,
      "cost": "<Free / $X / Free with Seniors Card>",
      "seniors_discount": true or false,
      "accessible": true or false,
      "why_suitable": "<max 10 words: why this suits elderly visitors in the heat>",
      "disclaimer": "AI recommendation · Call ahead to confirm"
    }
  ],
  "health_reminder": "<max 15 words: heat safety tip based on today's forecast>"
}

## Rules
- Return 3 events, each from a DIFFERENT venue. Never duplicate a venue.
- ELDERLY SUITABILITY: Only recommend activities appropriate for people aged 65+. Exclude events targeting children, teenagers, or young adults — e.g. workshops for under-18s, youth programs, school holiday activities, high-intensity fitness classes.
- The user's need is "${INTENT_LABELS[intent]}". Every recommended venue MUST directly satisfy this specific need. Exclude venues that do not clearly match even if nearby.
- For "Something to do today": at least 2 of the 3 results must have a real confirmed event today, not just permanent features.
- For "Quiet place to sit": do NOT recommend shopping centres or markets under any circumstances.
- For "Close enough to walk": do NOT recommend any venue with walking_minutes greater than 10.
- Prioritise: (1) a real event or class confirmed running today, (2) if none found, a specific permanent feature e.g. "Free air-conditioned reading room open until 8 PM". Never use vague descriptions like "visit the venue".
- Use id, name, address, and walking_minutes EXACTLY as given in the list above.
- Prefer venues that are closer (lower walking_minutes) when quality is equal.
- Check if Seniors Card discounts apply to the cost.
- All text fields must be under 20 words.
- If a venue is closed today, exclude it.`
}

export function useAIRecommend() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)

  const recommend = useCallback(async ({ intent, extraNote, userLat, userLng, venues, weatherData }) => {
    const apiKey = import.meta.env.VITE_GEMINI_API_KEY
    if (!apiKey) { setError('Gemini API key not configured.'); return }

    setLoading(true)
    setError(null)
    setResults(null)

    try {
      const lat = userLat ?? MELBOURNE_LAT
      const lng = userLng ?? MELBOURNE_LNG

      
      const allVenues = (venues ?? [])
        .filter(v => {
          const cat = (v.category || '').toLowerCase();
          const sub = (v.sub_theme || '').toLowerCase();
          if (cat === 'fountain' || sub.includes('drinking fountain')) return false;

          if (!v.lat || !v.lng) return false;

          if (intent === 'easy_walk' && getWalkingMinutes(lat, lng, v.lat, v.lng) > 10) return false;

          if (intent === 'quiet_sit') {
            const category = (v.category || v.sub_theme || '').toLowerCase();
            if (category.includes('shopping') || category.includes('market')) return false;
          }
    
          if (intent === 'cool_down') {
            const category = (v.category || v.sub_theme || '').toLowerCase();
            const coolSpots = ['library', 'centre', 'gallery', 'museum', 'pool', 'mall'];
            return coolSpots.some(spot => category.includes(spot));
          }

          return true;
        })
        .map(v => ({
          ...v,
          _km: haversineKm(lat, lng, v.lat, v.lng),
          walking_minutes: getWalkingMinutes(lat, lng, v.lat, v.lng)
        }))
        .sort((a, b) => a._km - b._km)
        .slice(0, 5); 

      console.log('[AIRecommend] venues sent to Gemini:', allVenues.length)

      const prompt = buildPrompt({
        intent,
        extraNote,
        userLat: lat,
        userLng: lng,
        venues: allVenues,
        suburb: weatherData?.locationName ?? null,
        weatherForecast: buildWeatherForecast(weatherData?.hourly),
      })

      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          tools: [{ google_search: {} }],
          generationConfig: {
            temperature: 0.2
          }
        }),
      })

      if (!res.ok) {
        const body = await res.text()
        console.error('[AIRecommend] API error:', body)
        throw new Error(`Gemini API error: ${res.status}`)
      }

      const data  = await res.json()
      const text  = (data.candidates?.[0]?.content?.parts ?? []).map(p => p.text ?? '').join('')
      console.log('[AIRecommend] raw text:', text.slice(0, 600))

      // Strip markdown fences then extract the outermost JSON object
      const cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
      const match   = cleaned.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON found in AI response')

      const parsed = JSON.parse(match[0])
      console.log('[AIRecommend] parsed events:', parsed?.events?.length)
      setResults(parsed)
    } catch (err) {
      console.error('[AIRecommend] error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { recommend, results, loading, error }
}
