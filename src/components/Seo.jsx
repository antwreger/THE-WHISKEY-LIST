import { useEffect } from 'react'

// Keep the reused page independent from August's production SEO and canonical URLs.
export default function Seo() {
  useEffect(() => { document.title = 'Dryckeslistan · Brygghuset · Demo' }, [])
  return null
}
