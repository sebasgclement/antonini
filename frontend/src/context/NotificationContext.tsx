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
import api from "../lib/api";
import { setupEcho } from "../utils/echo";

interface NotificationContextType {
  pendingReservationsCount: number;
  agendaCount: number;
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
  const [agendaCount, setAgendaCount] = useState(0);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const { showToast } = useToast();

  const echoRef = useRef<any>(null);
  const isConnected = useRef(false);

  // --- FUNCIÓN DE CARGA DE DATOS ---
  const fetchInitialCounts = useCallback(async () => {
    const token = localStorage.getItem("token");
    if (!token) return;

    // 1. Cargar Agenda (PARA TODOS)
    try {
      const { data: agendaData } = await api.get("/my-agenda/count");
      // console.log("📅 Agenda count:", agendaData.count);
      setAgendaCount(agendaData.count || 0);
    } catch (error) {
      console.error("❌ Error cargando agenda count:", error);
    }

    // 2. Cargar Reservas (SOLO ADMIN)
    if (isAdmin) {
      try {
        const { data: resData } = await api.get("/reservas/pendientes/count");
        // console.log("🔢 Reservas count:", resData.count);
        setPendingReservationsCount(resData.count || 0);
      } catch (error) {
        console.error("❌ Error badge reservas:", error);
      }
    }
  }, [isAdmin]);

  // --- EFECTO 1: CARGA INICIAL + POLLING (Auto-actualización) ---
  useEffect(() => {
    if (loading || !isAuthenticated) return;

    // A. Carga inmediata al entrar
    fetchInitialCounts();

    // B. 🔥 POLLING: Preguntar cada 30 segundos si hay algo nuevo
    // Esto soluciona el problema de que el badge no aparezca si falla el socket
    const intervalId = setInterval(() => {
      // Solo consultamos si la pestaña está visible para no gastar recursos al pepe
      if (document.visibilityState === "visible") {
        console.log("⏰ Polling: Verificando notificaciones...");
        fetchInitialCounts();
      }
    }, 30000); // 30000 ms = 30 segundos

    // Limpiamos el reloj cuando se desmonta
    return () => clearInterval(intervalId);

  }, [loading, isAuthenticated, fetchInitialCounts]);

  // --- EFECTO 2: CAMBIAR EL TÍTULO DE LA PESTAÑA ---
  useEffect(() => {
    const appName = "Antonini Auto";
    const totalNotifications = pendingReservationsCount + agendaCount;

    if (totalNotifications > 0) {
      document.title = `(${totalNotifications}) 🔔 ${appName}`;
    } else {
      document.title = appName;
    }
  }, [pendingReservationsCount, agendaCount]);

  // --- EFECTO 3: WEBSOCKET (Solo Admin para Reservas) ---
  useEffect(() => {
    if (loading || !isAuthenticated || !isAdmin) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    if (isConnected.current) return;

    console.log("🔌 Iniciando conexión Reverb (Admin)...");

    const echoInstance = setupEcho(token);
    echoRef.current = echoInstance;
    isConnected.current = true;

    const handleEvent = (e: any) => {
      console.log("🔥 ¡EVENTO RECIBIDO POR SOCKET!", e);

      const reserva = e.reserva || e;
      const cliente = reserva.clientName || "Cliente";

      // Mostramos Toast
      showToast(`¡Nueva Reserva de ${cliente}!`, "warning", 8000);

      // Recargamos los contadores inmediatamente
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
    agendaCount,
    fetchInitialCounts,
    refreshTrigger,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};