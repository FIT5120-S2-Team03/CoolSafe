import { useState, useEffect } from 'react'

const ENDPOINT =
  'https://discover.data.vic.gov.au/api/3/action/datastore_search?resource_id=240212c6-0999-492f-b0c9-cdf175903a07&filters=%7B%22asset_type%22%3A%22Drinking+Fountain%22%7D&limit=100'

export default function useFountains() {
  const [fountains, setFountains] = useState([])
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
          if (r.asset_type !== 'Drinking Fountain') continue

          const parts = (r.coordinatelocation ?? '').split(', ')
          const lat = parseFloat(parts[0])
          const lng = parseFloat(parts[1])
          if (isNaN(lat) || isNaN(lng)) continue

          processed.push({
            name: 'Drinking Fountain',
            lat,
            lng,
            category: 'Fountain',
            address: r.location_desc ?? '',
          })
        }

        if (!cancelled) setFountains(processed)
      } catch (err) {
        if (!cancelled) setError(err.message)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    load()
    return () => { cancelled = true }
  }, [])

  return { fountains, loading, error }
}
