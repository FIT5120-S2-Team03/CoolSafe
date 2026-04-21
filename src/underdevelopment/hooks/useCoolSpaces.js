import { useState, useEffect } from 'react'
import { getCategoryFromSubTheme } from '../utils/categoryMapping'

const ENDPOINT =
  'https://discover.data.vic.gov.au/api/3/action/datastore_search?resource_id=4dd37664-05e9-4904-9d19-662d8b718189&limit=500'

export default function useCoolSpaces() {
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function load() {
      try {
        const res = await fetch(ENDPOINT)
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const json = await res.json()
        const records = json?.result?.records ?? []

        const processed = []
        for (const r of records) {
          const category = getCategoryFromSubTheme(r.sub_theme)
          if (!category) continue

          const parts = (r.co_ordinates ?? '').split(', ')
          const lat = parseFloat(parts[0])
          const lng = parseFloat(parts[1])
          if (isNaN(lat) || isNaN(lng)) continue

          processed.push({ name: r.feature_name, lat, lng, category, address: '' })
        }

        if (!cancelled) setVenues(processed)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { venues, loading, error }
}
