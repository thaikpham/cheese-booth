import { useEffect, useState } from 'react'

import {
  fetchLatestReleaseCatalog,
  type LatestReleaseCatalog,
} from '../lib/releaseCatalog'

export function useLatestReleaseCatalog(): LatestReleaseCatalog | null {
  const [catalog, setCatalog] = useState<LatestReleaseCatalog | null>(null)

  useEffect(() => {
    let cancelled = false

    void fetchLatestReleaseCatalog().then((nextCatalog) => {
      if (!cancelled) {
        setCatalog(nextCatalog)
      }
    })

    return () => {
      cancelled = true
    }
  }, [])

  return catalog
}
