export type User = {
  id: number
  name: string
  email: string
  role?: string
  roles?: string[]
  
}

export type Customer = {
  id: number
  first_name: string
  last_name: string
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
