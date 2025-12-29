export type Customer = {
  id: number;
  status?: "consulta" | "cliente";
  first_name: string;
  last_name: string;

  doc_type: string;
  doc_number: string;
  cuit?: string;
  marital_status?: string;

  email?: string;
  phone?: string;
  alt_phone?: string;

  address?: string;
  city?: string;
  notes?: string;

  // URLs de fotos
  dni_front_url?: string | null;
  dni_back_url?: string | null;

  // Campos viejos de fotos
  dni_front?: string | null;
  dni_back?: string | null;

  created_at?: string;
  updated_at?: string;

  // 👇 ESTO ES LO NUEVO (Lo que arregla el error rojo)
  user_id?: number;
  user?: {
    id: number;
    name: string;
    email: string;
  };

  seller_id?: number | null; // ID del vendedor que lo tiene asignado
  locked_until?: string | null; // Fecha hasta cuando es suyo
  seller?: {
    // Objeto del vendedor para mostrar su nombre
    id: number;
    name: string;
  };
};

// Helper para mostrar nombre completo
export function displayCustomerName(c: Partial<Customer>) {
  return (
    [c.first_name, c.last_name].filter(Boolean).join(" ") ||
    "Cliente sin nombre"
  );
}
