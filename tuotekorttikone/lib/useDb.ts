'use client'
import { useCallback, useEffect, useState } from 'react'
import { api } from './api'
import type { Database } from './types'

export function useDb() {
  const [db, setDb] = useState<Database>()
  const [error, setError] = useState<string>()
  const reload = useCallback(() => {
    api
      .db()
      .then(setDb)
      .catch((e) => setError(e instanceof Error ? e.message : 'Virhe'))
  }, [])
  useEffect(() => {
    reload()
  }, [reload])
  return { db, error, reload }
}
