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
    
    const echoRef = useRef<any>(null);
    const isConnected = useRef(false);

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

    // --- 🔔 NUEVO: EFECTO PARA CAMBIAR EL TÍTULO DE LA PESTAÑA ---
    useEffect(() => {
        // Nombre base de tu aplicación
        const appName = "Antonini Auto";

        if (pendingReservationsCount > 0) {
            // Si hay notificaciones: "(1) 🔔 Antonini Auto"
            document.title = `(${pendingReservationsCount}) 🔔 ${appName}`;
        } else {
            // Si no hay nada: "Antonini Auto"
            document.title = appName;
        }
    }, [pendingReservationsCount]);
    // -------------------------------------------------------------

    // --- WEBSOCKET ---
    useEffect(() => {
        if (loading || !isAuthenticated || !isAdmin) return;
        
        const token = localStorage.getItem('token');
        if (!token) return;

        if (isConnected.current) return;

        console.log("🔌 Iniciando conexión Reverb...");
        fetchInitialCounts();

        const echoInstance = setupEcho(token); 
        echoRef.current = echoInstance;
        isConnected.current = true;

        const handleEvent = (e: any) => {
            console.log('🔥 ¡EVENTO RECIBIDO!', e);
            
            const reserva = e.reserva || e;
            const cliente = reserva.clientName || 'Cliente';

            showToast(`¡Nueva Reserva de ${cliente}!`, 'warning', 8000);
            
            fetchInitialCounts();
            setRefreshTrigger(prev => prev + 1);
        };

        echoInstance.private('admin-notifications')
            .listen('.reserva.creada', handleEvent)
            .listen('reserva.creada', handleEvent);

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