import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from "react";
import useAuth from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import api from "../lib/api"; // 👈 Importamos la instancia API correcta
import { setupEcho } from "../utils/echo";

interface NotificationContextType {
  pendingReservationsCount: number;
  fetchInitialCounts: () => Promise<void>;
  refreshTrigger: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (context === undefined) {
    throw new Error(
      "useNotifications must be used within a NotificationProvider"
    );
  }
  return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({
  children,
}) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const [pendingReservationsCount, setPendingReservationsCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showToast } = useToast();

  const echoRef = useRef<any>(null);
  const isConnected = useRef(false);

  const fetchInitialCounts = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    try {
      // ✅ CORREGIDO: Usamos api.get en lugar de fetch a 127.0.0.1
      const { data } = await api.get("/reservas/pendientes/count");

      console.log("🔢 Badge actualizado:", data.count);
      setPendingReservationsCount(data.count || 0);
    } catch (error) {
      console.error("❌ Error badge:", error);
    }
  }, []);

  // --- EFECTO PARA CAMBIAR EL TÍTULO DE LA PESTAÑA ---
  useEffect(() => {
    const appName = "Antonini Auto";
    if (pendingReservationsCount > 0) {
      document.title = `(${pendingReservationsCount}) 🔔 ${appName}`;
    } else {
      document.title = appName;
    }
  }, [pendingReservationsCount]);

  // --- WEBSOCKET ---
  useEffect(() => {
    if (loading || !isAuthenticated || !isAdmin) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    if (isConnected.current) return;

    console.log("🔌 Iniciando conexión Reverb...");
    fetchInitialCounts();

    const echoInstance = setupEcho(token);
    echoRef.current = echoInstance;
    isConnected.current = true;

    const handleEvent = (e: any) => {
      console.log("🔥 ¡EVENTO RECIBIDO!", e);

      const reserva = e.reserva || e;
      const cliente = reserva.clientName || "Cliente";

      showToast(`¡Nueva Reserva de ${cliente}!`, "warning", 8000);

      fetchInitialCounts();
      setRefreshTrigger((prev) => prev + 1);
    };

    echoInstance
      .private("admin-notifications")
      .listen(".reserva.creada", handleEvent)
      .listen("reserva.creada", handleEvent);

    return () => {
      console.log("👋 Desmontando socket...");
      if (echoRef.current) {
        echoRef.current.disconnect();
        echoRef.current = null;
        isConnected.current = false;
      }
    };
  }, [isAuthenticated, isAdmin, loading, fetchInitialCounts, showToast]);

  const value = {
    pendingReservationsCount,
    fetchInitialCounts,
    refreshTrigger,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
