import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import { useDolar } from "../hooks/useDolar"; // Importamos el hook nuevo

// --- COMPONENTES INTERNOS ---

// 1. Tarjeta de Acción Rápida (Estilo Dashboard)
const ActionCard = ({ to, title, description, icon, colorClass }: any) => {
  // Paleta de colores coherente con el sistema
  const colors: Record<string, string> = {
    blue: 'rgba(59, 130, 246, 0.15)',
    textBlue: '#3b82f6',
    green: 'rgba(34, 197, 94, 0.15)',
    textGreen: '#22c55e',
    orange: 'rgba(249, 115, 22, 0.15)',
    textOrange: '#f97316',
    purple: 'rgba(168, 85, 247, 0.15)',
    textPurple: '#a855f7',
  };

  const bg = colors[colorClass];
  const text = colors['text' + colorClass.charAt(0).toUpperCase() + colorClass.slice(1)];

  return (
    <Link to={to} className="dashboard-card" style={{textDecoration: 'none', color: 'inherit'}}>
      <div>
        <div 
            className="card-icon" 
            style={{ background: bg, color: text }}
        >
          {icon}
        </div>
        <h3 style={{ fontSize: '1.2rem', fontWeight: 600, marginBottom: 8, color: 'var(--color-text)' }}>{title}</h3>
        <p style={{ fontSize: '0.9rem', color: 'var(--color-muted)', lineHeight: 1.5 }}>
          {description}
        </p>
      </div>
      <div style={{ marginTop: 20, fontSize: '0.9rem', fontWeight: 600, color: text, display: 'flex', alignItems: 'center', gap: 6 }}>
        Ingresar <span>→</span>
      </div>
    </Link>
  );
};

// 2. Tarjeta de Cotización Dólar (Widget Nuevo)
const DolarWidget = () => {
    const { dolar, loading } = useDolar();

    if (loading) return (
        <div style={widgetStyle} className="skeleton-loading">
            <span style={{fontSize: '0.8rem', color: 'var(--color-muted)'}}>Cargando cotización...</span>
        </div>
    );

    if (!dolar) return null; // Si falla, no mostramos nada para no ensuciar

    return (
        <div style={widgetStyle}>
            <div className="vstack" style={{ gap: 2 }}>
                <div className="hstack" style={{gap: 6, alignItems: 'center'}}>
                    <span style={{fontSize: '1.2rem'}}>💵</span>
                    <span style={{fontWeight: 700, color: 'var(--color-text)', fontSize: '0.95rem'}}>Dólar Blue</span>
                </div>
                <span style={{fontSize: '0.75rem', color: 'var(--color-muted)'}}>Venta Actual</span>
            </div>
            <div style={{fontSize: '1.4rem', fontWeight: 800, color: 'var(--color-success)'}}>
                ${dolar.venta}
            </div>
        </div>
    );
};

const widgetStyle = {
    background: 'var(--color-card)',
    border: '1px solid var(--color-border)',
    borderRadius: 12,
    padding: '10px 20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 20,
    boxShadow: 'var(--shadow)',
    minWidth: 200
};


// --- PÁGINA PRINCIPAL ---

export default function Home() {
  const { user } = useAuth();

  // Rol check
  const isAdmin = user?.roles?.some((r: any) => 
    ['admin', 'superadmin', 'gerente'].includes(r.name?.toLowerCase())
  ) || false;

  // Saludo dinámico
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="container vstack" style={{ gap: 32, paddingBottom: 40 }}>
      
      {/* HEADER: Bienvenida + Widgets */}
      <div className="hstack" style={{ alignItems: 'flex-end', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        
        {/* Saludo */}
        <div style={{ flex: 1, minWidth: 280 }}>
            <h1 className="title" style={{ fontSize: '2rem', margin: 0, marginBottom: 8 }}>
                {greeting}, {user?.name?.split(' ')[0]} 👋
            </h1>
            <p style={{ color: 'var(--color-muted)', fontSize: '1.05rem', margin: 0 }}>
                Panel de control general
            </p>
        </div>
        
        {/* Widgets (Fecha + Dólar) */}
        <div className="hstack" style={{ gap: 12, flexWrap: 'wrap' }}>
            {/* Widget Dólar */}
            <DolarWidget />

            {/* Widget Fecha */}
            <div style={{ ...widgetStyle, alignItems: 'flex-end', flexDirection: 'column', gap: 0, justifyContent: 'center' }}>
                <div style={{fontSize: '0.75rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: 0.5}}>Hoy es</div>
                <div style={{fontWeight: 700, fontSize: '1.1rem', color: 'var(--color-text)', textTransform: 'capitalize'}}>
                    {new Date().toLocaleDateString('es-AR', { weekday: 'short', day: 'numeric', month: 'short' })}
                </div>
            </div>
        </div>
      </div>

      <hr style={{ border: 0, borderTop: '1px solid var(--color-border)', margin: 0 }} />

      {/* GRID DE ACCESOS DIRECTOS */}
      <div>
        <h2 className="subtitle" style={{ marginBottom: 20, fontSize: '0.9rem', fontWeight: 700, opacity: 0.7, textTransform: 'uppercase', letterSpacing: 1 }}>
            Accesos Directos
        </h2>
        
        <div className="dashboard-grid">
            
            {/* Clientes */}
            <ActionCard 
                to="/clientes/registro"
                title="Nuevo Cliente"
                description="Registrar un nuevo prospecto o cliente en la base de datos."
                colorClass="blue"
                icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/></svg>}
            />

            {/* Vehículos */}
            <ActionCard 
                to="/vehiculos/registro"
                title="Ingresar Vehículo"
                description="Dar de alta una nueva unidad en stock o vehículo ofrecido."
                colorClass="green"
                icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>}
            />

            {/* Reservas */}
            <ActionCard 
                to="/reservas/nueva"
                title="Nueva Reserva"
                description="Iniciar proceso de venta o reserva de unidad."
                colorClass="orange"
                icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/></svg>}
            />

            {/* Admin (Reportes) */}
            {isAdmin && (
                <ActionCard 
                    to="/admin/reportes"
                    title="Reportes Gerenciales"
                    description="Métricas de ventas, stock y rendimiento."
                    colorClass="purple"
                    icon={<svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>}
                />
            )}

        </div>
      </div>

      {/* ACCESOS SECUNDARIOS */}
      <div className="card vstack" style={{ marginTop: 10, padding: 20 }}>
        <div className="title" style={{ fontSize: '1rem', margin: 0, borderBottom: 'none' }}>Listados Completos</div>
        <div className="hstack" style={{ flexWrap: 'wrap', gap: 12 }}>
            <Link to="/vehiculos" className="enlace" style={{background: 'var(--hover-bg)', padding: '8px 16px'}}>🚙 Ver Stock Completo</Link>
            <Link to="/clientes" className="enlace" style={{background: 'var(--hover-bg)', padding: '8px 16px'}}>📇 Directorio de Clientes</Link>
            <Link to="/reservas" className="enlace" style={{background: 'var(--hover-bg)', padding: '8px 16px'}}>📅 Gestión de Reservas</Link>
        </div>
      </div>

    </div>
  );
}