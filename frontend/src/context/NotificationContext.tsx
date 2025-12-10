import React, { createContext, useContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import { setupEcho } from '../utils/echo'; 
import useAuth from '../hooks/useAuth';
import { useToast } from '../hooks/useToast'; 

interface NotificationContextType {
    pendingReservationsCount: number;
    fetchInitialCounts: () => Promise<void>; 
    refreshTrigger: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (context === undefined) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

export const NotificationProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    
    const { isAuthenticated, isAdmin, loading } = useAuth();
    const [pendingReservationsCount, setPendingReservationsCount] = useState(0);
    const [refreshTrigger, setRefreshTrigger] = useState(0); 
    const { showToast } = useToast(); 
    
    // Referencias para mantener valores sin reiniciar el efecto
    const echoRef = useRef<any>(null);
    const isConnected = useRef(false);

    // Función para actualizar el contador desde la DB
    const fetchInitialCounts = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) return;

        try {
            const response = await fetch('http://127.0.0.1:8000/api/reservas/pendientes/count', {
                headers: { 
                    Authorization: `Bearer ${token}`,
                    'Accept': 'application/json'
                }
            });

            if (response.ok) {
                const data = await response.json();
                console.log("🔢 Badge actualizado:", data.count);
                setPendingReservationsCount(data.count || 0);
            }
        } catch (error) {
            console.error("❌ Error badge:", error);
        }
    }, []);

    // --- WEBSOCKET (Lógica blindada) ---
    useEffect(() => {
        // 1. Validaciones iniciales
        if (loading || !isAuthenticated || !isAdmin) return;
        
        const token = localStorage.getItem('token');
        if (!token) return;

        // 2. Si ya estamos conectados, NO hacemos nada (Evita el loop de desconexión)
        if (isConnected.current) {
            return;
        }

        console.log("🔌 Iniciando conexión Reverb...");
        
        // 3. Cargar datos iniciales
        fetchInitialCounts();

        // 4. Configurar Echo
        const echoInstance = setupEcho(token); 
        echoRef.current = echoInstance;
        isConnected.current = true;

        // 🔥 ESPÍA GLOBAL: Esto muestra TODO lo que entra por el cable
        echoInstance.connector.pusher.connection.bind('message', (payload: any) => {
            console.log('📡 RAW MESSAGE RECIBIDO:', payload);
        });

        // 5. Suscripción al canal
        const channel = echoInstance.private('admin-notifications');

        channel.listen('.reserva.creada', (e: any) => {
            console.log('🎯 Evento Detectado:', e);
            
            const data = e.reserva || e;
            const cliente = data.clientName || 'Cliente';

            showToast(`⚠️ ¡Nueva Reserva de ${cliente}!`, 'warning', 8000);
            
            // Actualizar todo
            fetchInitialCounts();
            setRefreshTrigger(prev => prev + 1);
        });

        // Evento alternativo por si el nombre viene sin punto
        channel.listen('reserva.creada', (e: any) => {
             console.log('🎯 Evento (sin punto):', e);
             fetchInitialCounts();
             setRefreshTrigger(prev => prev + 1);
        });

        // 6. Cleanup: Solo desconectamos si el componente se desmonta REALMENTE
        return () => {
            console.log("👋 Desmontando socket...");
            if (echoRef.current) {
                echoRef.current.disconnect();
                echoRef.current = null;
                isConnected.current = false;
            }
        };
    
    // ⚠️ ARRAY DE DEPENDENCIAS MÍNIMO: 
    // Sacamos 'fetchInitialCounts' y 'showToast' para que no reinicien la conexión
    }, [isAuthenticated, isAdmin, loading]); 

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