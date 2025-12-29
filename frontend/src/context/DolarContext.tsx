import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

type DolarContextType = {
  price: number;
  isManual: boolean;
  loading: boolean;
  setManualPrice: (price: number | null) => void;
};

const DolarContext = createContext<DolarContextType>({} as DolarContextType);

export function DolarProvider({ children }: { children: ReactNode }) {
  const [apiPrice, setApiPrice] = useState<number>(0);

  // Leemos del localStorage con una función de inicialización para evitar lecturas innecesarias
  const [manualPrice, setManualPriceState] = useState<number | null>(() => {
    const saved = localStorage.getItem("dolar_manual");
    return saved ? parseFloat(saved) : null;
  });

  const [loading, setLoading] = useState(true);

  // 1. Obtener cotización real (Dolar Blue) de la API
  useEffect(() => {
    const fetchDolar = async () => {
      try {
        const res = await fetch("https://dolarapi.com/v1/dolares/blue");
        const data = await res.json();
        setApiPrice(data.venta);
      } catch (error) {
        console.error("Error buscando dolar:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDolar();
  }, []);

  // 2. Función para establecer precio manual
  const setManualPrice = (price: number | null) => {
    setManualPriceState(price);
    if (price) {
      localStorage.setItem("dolar_manual", price.toString());
    } else {
      localStorage.removeItem("dolar_manual");
    }
  };

  // 3. Prioridad: Manual > API
  const finalPrice = manualPrice || apiPrice;

  return (
    <DolarContext.Provider
      value={{
        price: finalPrice,
        isManual: !!manualPrice,
        loading,
        setManualPrice,
      }}
    >
      {children}
    </DolarContext.Provider>
  );
}

// Hook para usarlo
export const useDolar = () => useContext(DolarContext);
