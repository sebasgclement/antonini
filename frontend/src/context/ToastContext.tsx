import React, { createContext, useContext, useState, useEffect } from 'react';
// 👈 SOLUCIÓN 1: Importamos ReactNode con 'type'
import { type ReactNode } from 'react'; 
// 👈 SOLUCIÓN 2: Importamos el componente ToastContainer
import ToastContainer from '../components/ToastContainer'; 

// --- TIPOS ---
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
    duration?: number;
}

// Tipos para el Contexto
interface ToastContextType {
    // 👈 SOLUCIÓN 3: Renombramos la función a 'addToast'
    addToast: (message: string, type?: ToastType, duration?: number) => void;
}

// Exportamos el contexto para que el useToast pueda consumirlo
export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- Hook Personalizado (para usar en NotificationContext) ---
export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast debe ser usado dentro de un ToastProvider');
    }
    // 👈 Devolvemos la interfaz pública (solo 'addToast')
    return { addToast: context.addToast };
};

// --- Provider Component ---
export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = (
        message: string,
        type: ToastType = 'info',
        duration: number = 5000 // 5 segundos por defecto
    ) => {
        const id = Date.now();
        const newToast: Toast = { id, message, type, duration };

        // Prepend (colocar al principio) para que se vea el más nuevo arriba
        setToasts((prev) => [newToast, ...prev]);

        // Ocultar automáticamente después de la duración
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
    };
    
    // Función para cerrar un toast manualmente
    const removeToast = (id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    };

    const value = { addToast };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* 👈 Renderiza el contenedor con la lista de toasts */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};