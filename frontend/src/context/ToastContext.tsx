import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import ToastContainer from '../components/ToastContainer'; 

// --- TIPOS ---
export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface Toast {
    id: number;
    message: string;
    type: ToastType;
    duration?: number;
}

interface ToastContextType {
    addToast: (message: string, type?: ToastType, duration?: number) => void;
}

export const ToastContext = createContext<ToastContextType | undefined>(undefined);

// --- Hook Personalizado ---
export const useToast = () => {
    const context = useContext(ToastContext);
    if (context === undefined) {
        throw new Error('useToast debe ser usado dentro de un ToastProvider');
    }
    
    // 🔥 CORRECCIÓN CLAVE: Exportamos como 'showToast'
    // Así coincide con lo que usamos en NotificationContext y ReservationsList
    return { showToast: context.addToast };
};

// --- Provider ---
export const ToastProvider = ({ children }: { children: ReactNode }) => {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const addToast = useCallback((
        message: string,
        type: ToastType = 'info',
        duration: number = 5000 
    ) => {
        const id = Date.now();
        const newToast: Toast = { id, message, type, duration };

        setToasts((prev) => [newToast, ...prev]);

        // Auto-eliminar
        setTimeout(() => {
            setToasts((prev) => prev.filter((toast) => toast.id !== id));
        }, duration);
    }, []);
    
    const removeToast = useCallback((id: number) => {
        setToasts((prev) => prev.filter((toast) => toast.id !== id));
    }, []);

    const value = { addToast };

    return (
        <ToastContext.Provider value={value}>
            {children}
            {/* El Container que los dibuja */}
            <ToastContainer toasts={toasts} removeToast={removeToast} />
        </ToastContext.Provider>
    );
};