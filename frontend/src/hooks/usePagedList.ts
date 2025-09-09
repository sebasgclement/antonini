// src/hooks/usePagedList.ts
import { useEffect, useState } from 'react'
import api from '../lib/api'

export default function usePagedList<T>(url: string, params: any = {}) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  useEffect(() => {
    (async () => {
      try {
        setLoading(true)
        const { data } = await api.get(url, { params: { ...params, page, search } })
        const list: T[] = data?.data?.data ?? data?.data ?? []
        setItems(list)
        setTotalPages(data?.data?.last_page ?? data?.last_page ?? 1)
      } catch (e: any) {
        setError(e?.response?.data?.message || 'Error cargando datos')
      } finally {
        setLoading(false)
      }
    })()
  }, [url, page, search])

  return { items, loading, error, page, setPage, totalPages, search, setSearch }
}
