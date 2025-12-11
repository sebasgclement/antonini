// src/hooks/usePagedList.ts
import { useCallback, useEffect, useMemo, useState } from 'react'
import api from '../lib/api'

export type PagedApiResponse<T> =
  | { data: { data: T[]; last_page: number } }   
  | { data: T[]; last_page?: number }            
  | T[]                                          

export default function usePagedList<T>(
  url: string,
  params: Record<string, any> = {}
) {
  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  
  const serializedParams = useMemo(() => JSON.stringify(params), [params])

  const fetchList = useCallback(async () => {
    try {
      setLoading(true)
      setError('')
      const { data } = await api.get(url, {
        params: { ...params, page, search },
      })

      
      let list: T[] = []
      let last = 1

      if (Array.isArray(data)) {
        list = data as T[]
      } else if (data?.data?.data) {
        list = data.data.data as T[]
        last = Number(data.data.last_page ?? 1)
      } else if (data?.data) {
        list = data.data as T[]
        last = Number(data.last_page ?? 1)
      }

      setItems(list)
      setTotalPages(last || 1)
    } catch (e: any) {
      setError(e?.response?.data?.message || 'Error cargando datos')
    } finally {
      setLoading(false)
    }
  }, [url, page, search, serializedParams]) 

  useEffect(() => {
    fetchList()
  }, [fetchList])

  return {
    items,
    setItems,     
    loading,
    error,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    refetch: fetchList,
  }
}
