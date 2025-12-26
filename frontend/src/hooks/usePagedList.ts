// src/hooks/usePagedList.ts
import { useCallback, useEffect, useMemo, useState, useRef } from 'react'
import api from '../lib/api'

export type PagedApiResponse<T> =
  | { data: { data: T[]; last_page: number } }
  | { data: T[]; last_page?: number }
  | T[]

// Definimos una interfaz para las opciones nuevas
interface UsePagedListOptions {
  pollingInterval?: number; // Tiempo en ms para recarga automática
}

export default function usePagedList<T>(
  url: string,
  params: Record<string, any> = {},
  options: UsePagedListOptions = {} // 👈 Nuevo argumento opcional
) {
  const { pollingInterval = 0 } = options; // Extraemos el intervalo (default 0 = apagado)

  const [items, setItems] = useState<T[]>([])
  const [loading, setLoading] = useState(true)      // Carga incial / manual (Spinner grande)
  const [isRefetching, setIsRefetching] = useState(false) // 👈 Carga silenciosa (Spinner chico/invisible)
  const [error, setError] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [search, setSearch] = useState('')

  // Referencia para evitar actualizar estado si el componente se desmontó (crucial para polling)
  const isMounted = useRef(true);
  useEffect(() => {
    isMounted.current = true;
    return () => { isMounted.current = false; };
  }, []);
  
  const serializedParams = useMemo(() => JSON.stringify(params), [params])

  // Modificamos fetchList para aceptar modo silencioso
  const fetchList = useCallback(async (silent = false) => {
    if (!isMounted.current) return;

    try {
      if (!silent) setLoading(true); // Solo pone loading si NO es silencioso
      else setIsRefetching(true);    // Si es silencioso, activamos isRefetching
      
      setError('')
      
      const { data } = await api.get(url, {
        params: { ...params, page, search },
      })

      if (!isMounted.current) return;
      
      let list: T[] = []
      let last = 1

      // Tu lógica original de parseo de respuesta (intacta)
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
      if (isMounted.current) {
        setError(e?.response?.data?.message || 'Error cargando datos')
      }
    } finally {
      if (isMounted.current) {
        if (!silent) setLoading(false)
        else setIsRefetching(false)
      }
    }
  }, [url, page, search, serializedParams]) 

  // 1. Carga inicial o cambios de filtros (siempre con Loading visible)
  useEffect(() => {
    fetchList(false) 
  }, [fetchList])

  // 2. POLLING (Auto-refresco silencioso) 🔄
  useEffect(() => {
    if (!pollingInterval || pollingInterval <= 0) return;

    const intervalId = setInterval(() => {
      // Solo refrescamos si la pestaña está visible (ahorra recursos)
      if (document.visibilityState === 'visible') {
        fetchList(true); // 👈 True = Modo silencioso
      }
    }, pollingInterval);

    return () => clearInterval(intervalId);
  }, [pollingInterval, fetchList]);

  return {
    items,
    setItems,
    loading,      // Usar para loader principal
    isRefetching, // 👈 Nuevo: Usar si querés mostrar un indicador sutil de actualización
    error,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    refetch: () => fetchList(false), // Refetch manual standard
    silentRefetch: () => fetchList(true) // Por si querés forzar refetch sin spinner
  }
}