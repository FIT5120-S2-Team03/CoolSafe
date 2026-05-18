// useAIRecommend — calls the Gemini API to recommend 3 cool venues tailored to
// an elderly user's intent (cool down, free, quiet, walkable, etc.) using
// today's weather forecast and a pre-filtered candidate list.
import { useState, useCallback } from 'react'
import { haversineKm, getWalkingMinutes } from '../utils/routing/haversine'
import {
  EVENT_SUBTYPES,
  INDOOR_SUBTYPES,
  INTENT_INSTRUCTIONS,
  INTENT_LABELS,
  PAID_SUBTYPES,
  QUIET_SUBTYPES,
} from '../components/ai/aiRecommendationConfig'

const MELBOURNE_LAT = -37.8136
const MELBOURNE_LNG = 144.9631
const API_BASE = import.meta.env.VITE_API_BASE_URL ?? 'https://coolsafe.onrender.com'

// Format the next 8 hours of "feels-like" temperature into a short text line
// the Gemini prompt can reason about.
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

// Assemble the full prompt sent to Gemini: context + venue shortlist + strict
// JSON-only output contract so the response is machine-parseable.
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
1. Use ONLY the venue list, walking time, weather, and user need provided below.
2. Choose the 3 best venues for an elderly resident today.
3. For each venue, write ONE concise senior-friendly reason based on the venue type or likely permanent feature (e.g. "Air-conditioned reading room", "Quiet gallery visit", or "Shaded garden seating").
4. Return the 3 best as JSON.

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
      "activity": "<specific senior-friendly reason based on the venue type or likely permanent feature>",
      "address": "<exact address from list>",
      "is_free": true or false,
      "cost": "<Free / $X / Free with Seniors Card>",
      "disclaimer": "AI recommendation · Call ahead to confirm"
    }
  ],
  "health_reminder": "<max 15 words: heat safety tip based on today's forecast>"
}

## Rules
- Return 3 events, each from a DIFFERENT venue. Never duplicate a venue.
- ELDERLY SUITABILITY: Only recommend activities appropriate for people aged 65+. Exclude events targeting children, teenagers, or young adults — e.g. workshops for under-18s, youth programs, school holiday activities, high-intensity fitness classes.
- The user's need is "${INTENT_LABELS[intent]}". Every recommended venue MUST directly satisfy this specific need. Exclude venues that do not clearly match even if nearby.
- ALWAYS return exactly 3 events, each from a DIFFERENT venue. Never return fewer than 3 — if strict criteria cannot be met, relax them and use the venue's best permanent feature instead.
- For "Something to do today": recommend venues suited to a gentle outing today, using a clear permanent feature or activity type.
- For "Close enough to walk": do NOT recommend any venue with walking_minutes greater than 10.
- Prioritise specific, plausible permanent features over vague descriptions like "visit the venue".
- Use id, name, address, and walking_minutes EXACTLY as given in the list above.
- Prefer venues that are closer (lower walking_minutes) when quality is equal.
- All text fields must be under 20 words.
- Do not claim live opening status, confirmed events, or real-time facts that are not present in the input data.`
}

export function useAIRecommend() {
  const [results, setResults] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState(null)
  const [candidateCount, setCandidateCount] = useState(0)
  const [usedFallbackCandidates, setUsedFallbackCandidates] = useState(false)

  // Pre-filter venues by intent and distance, send the shortlist to Gemini,
  // then parse the JSON object back out.
  const recommend = useCallback(async ({ intent, extraNote, userLat, userLng, venues, weatherData, excludeIds = [] }) => {
    setLoading(true)
    setError(null)
    setResults(null)
    setCandidateCount(0)
    setUsedFallbackCandidates(false)

    try {
      const lat = userLat ?? MELBOURNE_LAT
      const lng = userLng ?? MELBOURNE_LNG

      
      const excludeSet = new Set(excludeIds.map(String))

      const eligibleVenues = (venues ?? [])
        .filter(v => {
          if (excludeSet.has(String(v.id))) return false;

          const cat = (v.category || '').toLowerCase();
          const sub = (v.sub_theme || '').toLowerCase();
          const vname = (v.name || '').toLowerCase();
          if (cat === 'fountain' || sub.includes('drinking fountain')) return false;

          if (!v.lat || !v.lng) return false;

          if (intent === 'easy_walk') {
            return getWalkingMinutes(lat, lng, v.lat, v.lng) <= 10;
          }

          if (intent === 'cool_down') {
            return INDOOR_SUBTYPES.includes(sub) || vname.includes('library')
          }

          if (intent === 'something_to_do') {
            return EVENT_SUBTYPES.includes(sub)
          }

          if (intent === 'free_nearby') {
            return !PAID_SUBTYPES.includes(sub)
          }

          if (intent === 'quiet_sit') {
            return QUIET_SUBTYPES.includes(sub) || vname.includes('library')
          }

          return true;
        })
        .map(v => ({
          ...v,
          _km: haversineKm(lat, lng, v.lat, v.lng),
          walking_minutes: getWalkingMinutes(lat, lng, v.lat, v.lng)
        }))
        .sort((a, b) => a._km - b._km)

      const fallbackVenues = (venues ?? [])
        .filter(v => {
          if (excludeSet.has(String(v.id))) return false
          const cat = (v.category || '').toLowerCase()
          const sub = (v.sub_theme || '').toLowerCase()
          return cat !== 'fountain' && !sub.includes('drinking fountain') && v.lat && v.lng
        })
        .map(v => ({
          ...v,
          _km: haversineKm(lat, lng, v.lat, v.lng),
          walking_minutes: getWalkingMinutes(lat, lng, v.lat, v.lng),
        }))
        .sort((a, b) => a._km - b._km)

      const shouldUseFallback = eligibleVenues.length < 3
      const allVenues = (shouldUseFallback ? fallbackVenues : eligibleVenues).slice(0, 10)

      setCandidateCount(allVenues.length)
      setUsedFallbackCandidates(shouldUseFallback && allVenues.length > 0)

      const prompt = buildPrompt({
        intent,
        extraNote,
        userLat: lat,
        userLng: lng,
        venues: allVenues,
        suburb: weatherData?.locationName ?? null,
        weatherForecast: buildWeatherForecast(weatherData?.hourly),
      })

      const res = await fetch(`${API_BASE}/api/ai/recommend`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt }),
      })

      if (!res.ok) {
        const errorData = await res.json().catch(() => null)
        throw new Error(errorData?.error || `Gemini API error: ${res.status}`)
      }

      const data  = await res.json()
      const text  = (data.candidates?.[0]?.content?.parts ?? []).map(p => p.text ?? '').join('')

      // Strip markdown fences then extract the outermost JSON object
      const cleaned = text.replace(/```(?:json)?\s*/gi, '').replace(/```/g, '').trim()
      const match   = cleaned.match(/\{[\s\S]*\}/)
      if (!match) throw new Error('No JSON found in AI response')

      setResults(JSON.parse(match[0]))
    } catch (err) {
      setError(err.message || 'Something went wrong. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  return { recommend, results, loading, error, candidateCount, usedFallbackCandidates }
}
