import React from 'react';

// Tipos consistentes
export interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning';
    duration?: number;
}

interface ToastContainerProps {
    toasts: Toast[];
    removeToast: (id: number) => void;
}

// Configuración visual por tipo
const toastConfig = {
    success: { icon: '✅', color: '#10b981', bg: 'rgba(16, 185, 129, 0.15)' },
    error:   { icon: '❌', color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
    warning: { icon: '⚠️', color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
    info:    { icon: 'ℹ️', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
};

const ToastContainer: React.FC<ToastContainerProps> = ({ toasts, removeToast }) => {
    return (
        <div
            style={{
                position: 'fixed',
                top: 24,
                right: 24,
                zIndex: 99999, // 🔥 ESTO ES CRÍTICO: Más alto que cualquier modal
                display: 'flex',
                flexDirection: 'column',
                gap: 12,
                pointerEvents: 'none', // Permite clickear "a través" del contenedor vacío
            }}
        >
            {toasts.map((toast) => {
                const config = toastConfig[toast.type] || toastConfig.info;

                return (
                    <div
                        key={toast.id}
                        onClick={() => removeToast(toast.id)}
                        className="toast-enter"
                        style={{
                            pointerEvents: 'auto', // El toast sí recibe clicks
                            width: 320,
                            maxWidth: '90vw',
                            // Usamos tus variables de tema para el fondo
                            backgroundColor: 'var(--color-card, #1f2937)',
                            color: 'var(--color-text, #fff)',
                            
                            // Borde izquierdo de color
                            borderLeft: `6px solid ${config.color}`,
                            border: '1px solid var(--color-border)',
                            borderLeftWidth: 6,
                            borderLeftColor: config.color,

                            borderRadius: 8,
                            padding: '16px',
                            boxShadow: '0 10px 30px rgba(0,0,0,0.3)',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 12,
                            cursor: 'pointer',
                            position: 'relative',
                            overflow: 'hidden',
                        }}
                    >
                        {/* Ícono */}
                        <span style={{ fontSize: '1.5rem', lineHeight: 1 }}>
                            {config.icon}
                        </span>

                        {/* Mensaje */}
                        <div style={{ flex: 1 }}>
                            <p style={{ margin: 0, fontSize: '0.95rem', fontWeight: 500, lineHeight: 1.4 }}>
                                {toast.message}
                            </p>
                        </div>

                        {/* Botón Cerrar */}
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                removeToast(toast.id);
                            }}
                            style={{
                                background: 'transparent',
                                border: 'none',
                                color: 'var(--color-muted)',
                                cursor: 'pointer',
                                fontSize: '1.2rem',
                                padding: 4,
                                lineHeight: 1,
                            }}
                        >
                            ×
                        </button>
                    </div>
                );
            })}

            {/* Animación de entrada simple */}
            <style>{`
                @keyframes slideInRight {
                    from { transform: translateX(120%); opacity: 0; }
                    to { transform: translateX(0); opacity: 1; }
                }
                .toast-enter {
                    animation: slideInRight 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards;
                }
            `}</style>
        </div>
    );
};

export default ToastContainer;