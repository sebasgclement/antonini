import { useContext, useCallback } from 'react';
import { ToastContext, type ToastType } from '../context/ToastContext';

export const useToast = () => {
    const context = useContext(ToastContext);

    if (context === undefined) {
        throw new Error('useToast debe ser usado dentro de un ToastProvider');
    }

    // Adaptador: NotificationContext espera una función llamada "showToast"
    // con 3 argumentos. Mapeamos eso a la función "addToast" del contexto.
    const showToast = useCallback(
        (message: string, type: ToastType, duration?: number) => {
            context.addToast(message, type, duration);
        },
        [context]
    );

    return { showToast };
};