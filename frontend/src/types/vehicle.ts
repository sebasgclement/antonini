export type Vehicle = {
  id: number
  brand?: string | null
  model?: string | null
  year?: number | null
  plate?: string | null
  vin?: string | null
  color?: string | null
  km?: number | null
  ownership?: 'propio' | 'consignado' | null
  customer_id?: number | null
  reference_price?: number | null
  price?: number | null
  status?: 'disponible' | 'reservado' | 'vendido' | null
  created_at?: string
  updated_at?: string
}

export function displayVehicleName(v: Vehicle) {
  const parts = [v.brand, v.model, v.year].filter(Boolean)
  return parts.length ? parts.join(' ') : `Vehículo #${v.id}`
}
