export type Customer = {
  id: number
  first_name: string
  last_name: string
  
  doc_type: string
  doc_number: string
  cuit?: string            // ✅ Nuevo
  marital_status?: string  // ✅ El que te daba error
  
  email?: string
  phone?: string
  alt_phone?: string       // ✅ Nuevo
  
  address?: string         // ✅ Nuevo
  city?: string            // ✅ Nuevo
  notes?: string           // ✅ Nuevo
  
  // URLs de fotos (vienen del Accessor de Laravel)
  dni_front_url?: string | null
  dni_back_url?: string | null
  
  // Campos viejos de fotos (paths)
  dni_front?: string | null
  dni_back?: string | null
  
  created_at?: string
  updated_at?: string
}

// Helper para mostrar nombre completo (ya lo tenías, dejalo igual)
export function displayCustomerName(c: Partial<Customer>) {
  return [c.first_name, c.last_name].filter(Boolean).join(' ') || 'Cliente sin nombre'
}