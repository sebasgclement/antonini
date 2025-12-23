import { useCallback, useState } from "react";
import api from "../lib/api";
import type { Customer } from "../types/customer";

// Definimos tipos auxiliares solo para el hook
export interface CustomerData {
  [key: string]: string | number | boolean | File | null | undefined;
}

export interface EventPayload {
  type: string;
  description: string;
  date: string;
  is_schedule: boolean;
}

export interface PaginationData {
  current_page: number;
  last_page: number;
  total: number;
}

export const useCustomers = () => {
  // Usamos TU tipo Customer aquí
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [pagination, setPagination] = useState<PaginationData>({
    current_page: 1,
    last_page: 1,
    total: 0,
  });

  // 🔍 1. OBTENER CLIENTES
  const getCustomers = useCallback(
    async (page: number = 1, search: string = "", dni: string = "") => {
      setLoading(true);
      try {
        let url = `/customers?page=${page}`;
        if (search) url += `&search=${search}`;
        if (dni) url += `&dni=${dni}`;

        const { data } = await api.get(url);
        if (data.ok) {
          setCustomers(data.data.data);
          setPagination({
            current_page: data.data.current_page,
            last_page: data.data.last_page,
            total: data.data.total,
          });
        }
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // 💾 2. GUARDAR CLIENTE
  const saveCustomer = async (
    customerData: CustomerData,
    id: number | null = null
  ) => {
    setLoading(true);
    try {
      const formData = new FormData();
      Object.keys(customerData).forEach((key) => {
        const value = customerData[key];
        if (value !== null && value !== undefined) {
          if (typeof value === "boolean") {
            formData.append(key, value ? "1" : "0");
          } else if (value instanceof File) {
            formData.append(key, value);
          } else {
            formData.append(key, String(value));
          }
        }
      });

      if (id) {
        formData.append("_method", "PUT");
        const res = await api.post(`/customers/${id}`, formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
      } else {
        const res = await api.post("/customers", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        return res.data;
      }
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 🗑️ 3. ELIMINAR CLIENTE
  const deleteCustomer = async (id: number) => {
    setLoading(true);
    try {
      await api.delete(`/customers/${id}`);
      setCustomers((prev) => prev.filter((c) => c.id !== id));
      return true;
    } catch (err) {
      throw err;
    } finally {
      setLoading(false);
    }
  };

  // 📅 4. AGREGAR EVENTO (Lógica de Bloqueo)
  const addEvent = async (customerId: number, payload: EventPayload) => {
    setLoading(true);
    try {
      const apiPayload = {
        ...payload,
        is_schedule: payload.is_schedule ? 1 : 0,
      };

      const { data } = await api.post(
        `/customers/${customerId}/events`,
        apiPayload
      );

      // Si el backend nos devuelve el nuevo estado de bloqueo, actualizamos la lista
      if (data.customer_status) {
        setCustomers((prev) =>
          prev.map((c) => {
            if (c.id === customerId) {
              // Mezclamos los datos viejos con los nuevos estados de bloqueo
              return {
                ...c,
                seller_id: data.customer_status.seller_id,
                locked_until: data.customer_status.locked_until,
              };
            }
            return c;
          })
        );
      }
      return data;
    } catch (err) {
      throw err; // El componente mostrará el Toast con el error
    } finally {
      setLoading(false);
    }
  };

  // 📜 5. OBTENER HISTORIAL
  const getCustomerEvents = async (customerId: number) => {
    try {
      const { data } = await api.get(`/customers/${customerId}/events`);
      return data;
    } catch (error) {
      return [];
    }
  };

  return {
    customers,
    loading,
    pagination,
    getCustomers,
    saveCustomer,
    deleteCustomer,
    addEvent,
    getCustomerEvents,
  };
};
