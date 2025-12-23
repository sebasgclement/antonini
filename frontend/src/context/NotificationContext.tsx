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
  agendaCount: number; // 👈 NUEVO
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
  const { isAuthenticated, isAdmin, loading } = useAuth(); // isAdmin puede ser undefined al inicio
  const [pendingReservationsCount, setPendingReservationsCount] = useState(0);
  const [agendaCount, setAgendaCount] = useState(0); // 👈 NUEVO ESTADO
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
      console.log("📅 Agenda count:", agendaData.count);
      setAgendaCount(agendaData.count || 0);
    } catch (error) {
      console.error("❌ Error cargando agenda count:", error);
    }

    // 2. Cargar Reservas (SOLO ADMIN)
    // Nota: Verificamos isAdmin explícitamente aquí por si cambia dinámicamente
    // pero idealmente confiamos en el hook useAuth.
    // Si isAdmin es true, buscamos las reservas.
    // Accedemos al localStorage o usamos la variable si ya está resuelta.
    
    // (Pequeño hack: a veces fetchInitialCounts se llama antes de que useAuth termine, 
    // así que intentamos si el usuario parece ser admin o si la prop isAdmin es true)
    
    // Como isAdmin viene del hook y puede tardar, hacemos la petición 
    // y si da 403 (Forbidden) simplemente no pasa nada, pero mejor intentarlo si es admin.
    if (isAdmin) {
        try {
          const { data: resData } = await api.get("/reservas/pendientes/count");
          console.log("🔢 Reservas count:", resData.count);
          setPendingReservationsCount(resData.count || 0);
        } catch (error) {
          console.error("❌ Error badge reservas:", error);
        }
    }
  }, [isAdmin]); // Se recrea si cambia el estado de admin

  // --- EFECTO 1: CARGA INICIAL (Separado del WebSocket) ---
  // Esto asegura que los vendedores normales también carguen su agenda
  useEffect(() => {
    if (!loading && isAuthenticated) {
        fetchInitialCounts();
    }
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
    // Si no es admin, no conectamos el socket de "admin-notifications"
    if (loading || !isAuthenticated || !isAdmin) return;

    const token = localStorage.getItem("token");
    if (!token) return;

    if (isConnected.current) return;

    console.log("🔌 Iniciando conexión Reverb (Admin)...");
    
    // Configuramos Echo
    const echoInstance = setupEcho(token);
    echoRef.current = echoInstance;
    isConnected.current = true;

    const handleEvent = (e: any) => {
      console.log("🔥 ¡EVENTO RECIBIDO!", e);

      const reserva = e.reserva || e;
      const cliente = reserva.clientName || "Cliente";

      showToast(`¡Nueva Reserva de ${cliente}!`, "warning", 8000);

      // Recargamos los contadores
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
    agendaCount, // 👈 Exportamos el valor
    fetchInitialCounts,
    refreshTrigger,
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};