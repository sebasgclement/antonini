import { useState, useEffect } from "react";
import api from "../lib/api";

export function useDolar() {
  const [dolar, setDolar] = useState<{ compra: number; venta: number } | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/dolar")
      .then((res) => setDolar(res.data))
      .catch((err) => console.error("Error dolar:", err))
      .finally(() => setLoading(false));
  }, []);

  return { dolar, loading };
}