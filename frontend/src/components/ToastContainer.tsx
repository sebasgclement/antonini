import React from 'react';

// Tipos, asegúrate de que sean consistentes con ToastContext.tsx
interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: number) => void;
}

const getIcon = (type: Toast['type']) => {
    switch (type) {
        case 'success':
            return '✅';
        case 'error':
            return '❌';
        case 'warning':
            return '⚠️';
        case 'info':
        default:
            return '🔔';
    }
};

const getColorClass = (type: Toast['type']) => {
    // Usamos clases CSS simples basadas en el tipo para aplicar color
    switch (type) {
        case 'success':
            return 'toast-success';
        case 'error':
            return 'toast-error';
        case 'warning':
            return 'toast-warning';
        case 'info':
        default:
            return 'toast-info';
    }
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        // El contenedor fijo en la esquina (ej. superior derecha)
        <div className="toast-container">
            {toasts.map((toast) => (
                <div 
                    key={toast.id} 
                    className={`toast-item ${getColorClass(toast.type)}`}
                    onClick={() => removeToast(toast.id)} // Cierre al hacer click
                >
                    <span className="toast-icon">{getIcon(toast.type)}</span>
                    <span className="toast-message">{toast.message}</span>
                    <button className="toast-close-btn" onClick={() => removeToast(toast.id)}>
                        ×
                    </button>
                    {/* Opcional: barra de progreso usando la duración */}
                </div>
            ))}
        </div>
    );
};

export default ToastContainer;