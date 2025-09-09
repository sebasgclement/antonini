export type Customer = {
  id: number
  first_name?: string | null
  last_name?: string | null
  name?: string | null
  doc_type?: string | null
  doc_number?: string | null
  cuit?: string | null
  email?: string | null
  phone?: string | null
  alt_phone?: string | null
  city?: string | null
  address?: string | null
  notes?: string | null
  created_at?: string
  updated_at?: string
}


export function displayCustomerName(c: Customer) {
  if (c.name) return c.name
  const parts = [c.first_name, c.last_name].filter(Boolean)
  return parts.length ? parts.join(' ') : `Cliente #${c.id}`
}
