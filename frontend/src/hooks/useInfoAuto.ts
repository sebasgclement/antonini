import { useEffect, useState } from "react";
import api from "../lib/api";

// --- TIPOS ---
export type Brand = { id: number; name: string; logo_url?: string };
export type Group = { id: number; name: string; brand_id: number };

export type ModelListPosition = {
  codia: number;
  description: string;
};

export type ModelDetail = {
  codia: number;
  description: string;
  photo_url?: string;
  list_price?: number; // Precio 0km
  prices: { year: number; price: number }[]; // Array de usados
};

export type Price = { year: number; price: number; isZeroKm?: boolean };

export function useInfoAuto() {
  const [brands, setBrands] = useState<Brand[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [models, setModels] = useState<ModelListPosition[]>([]);
  const [prices, setPrices] = useState<Price[]>([]);

  const [selectedBrand, setSelectedBrand] = useState<number | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<number | null>(null);
  const [selectedModelCodia, setSelectedModelCodia] = useState<number | null>(
    null
  );
  const [modelDetail, setModelDetail] = useState<ModelDetail | null>(null);
  const [selectedYearPrice, setSelectedYearPrice] = useState<Price | null>(
    null
  );

  const [loading, setLoading] = useState(false);

  // 1. Cargar Marcas
  useEffect(() => {
    setLoading(true);
    api
      .get("/infoauto/brands")
      .then((res) => {
        const data = res.data.data || res.data || [];
        setBrands(Array.isArray(data) ? data : []);
      })
      .catch((err) => console.error("Error loading brands:", err))
      .finally(() => setLoading(false));
  }, []);

  // 2. Cargar Grupos
  useEffect(() => {
    setGroups([]);
    setModels([]);
    setPrices([]);
    setSelectedGroup(null);
    setSelectedModelCodia(null);
    setModelDetail(null);
    setSelectedYearPrice(null);

    if (selectedBrand) {
      setLoading(true);
      api
        .get(`/infoauto/brands/${selectedBrand}/groups`)
        .then((res) => {
          const data = res.data.data || res.data || [];
          setGroups(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error("Error loading groups:", err))
        .finally(() => setLoading(false));
    }
  }, [selectedBrand]);

  // 3. Cargar Modelos
  useEffect(() => {
    setModels([]);
    setPrices([]);
    setSelectedModelCodia(null);
    setModelDetail(null);
    setSelectedYearPrice(null);

    if (selectedGroup && selectedBrand) {
      setLoading(true);
      api
        .get(`/infoauto/brands/${selectedBrand}/groups/${selectedGroup}/models`)
        .then((res) => {
          const data = res.data.data || res.data || [];
          setModels(Array.isArray(data) ? data : []);
        })
        .catch((err) => console.error("Error loading models:", err))
        .finally(() => setLoading(false));
    }
  }, [selectedGroup, selectedBrand]);

  // 4. Cargar DETALLE (Precios)
  useEffect(() => {
    setPrices([]);
    setModelDetail(null);
    setSelectedYearPrice(null);

    if (selectedModelCodia) {
      setLoading(true);
      api
        .get(`/infoauto/models/${selectedModelCodia}`)
        .then((res) => {
          const detail = res.data.data || res.data;

          if (!detail) {
            console.error("No detail data received");
            return;
          }

          setModelDetail(detail);

          // --- FIX CRÍTICO: Asegurar que usedPrices sea un array ---
          let usedPrices: Price[] = [];

          // A veces viene en detail.prices, a veces en detail.prices.data
          if (Array.isArray(detail.prices)) {
            usedPrices = [...detail.prices];
          } else if (detail.prices?.data && Array.isArray(detail.prices.data)) {
            usedPrices = [...detail.prices.data];
          }

          // --- FIX DUPLICADOS: Verificar si ya existe el año actual ---
          const currentYear = new Date().getFullYear();
          const hasCurrentYear = usedPrices.some((p) => p.year === currentYear);

          // Si hay precio de lista (0km) y no está duplicado el año, lo agregamos
          if (detail.list_price && !hasCurrentYear) {
            usedPrices.push({
              year: currentYear,
              price: detail.list_price,
              isZeroKm: true,
            });
          } else if (detail.list_price && hasCurrentYear) {
            // Si ya existe el año 2025 como usado, podemos agregar el 0km con un año "fake" o label especial
            // O simplemente lo marcamos. Aquí optamos por reemplazar o agregar una variante.
            // Para simplificar, si ya hay usados 2025, no pisamos con 0km o lo manejamos en UI.
            // Estrategia: Agregar flag isZeroKm al existente si coinciden precios, o push con ID único
          }

          // Ordenar solo si es un array válido
          if (Array.isArray(usedPrices)) {
            setPrices(usedPrices.sort((a, b) => b.year - a.year));
          }
        })
        .catch((err) => console.error("Error loading details:", err))
        .finally(() => setLoading(false));
    }
  }, [selectedModelCodia]);

  return {
    brands,
    groups,
    models,
    prices,
    modelDetail,
    selectedBrand,
    setSelectedBrand,
    selectedGroup,
    setSelectedGroup,
    selectedModelCodia,
    setSelectedModelCodia,
    selectedYearPrice,
    setSelectedYearPrice,
    loading,
  };
}
