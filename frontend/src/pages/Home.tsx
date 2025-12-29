import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";
import axios from "../lib/api";

// --- COMPONENTES INTERNOS ---

// 1. Tarjeta de Acción Rápida (Sin cambios)
const ActionCard = ({ to, title, description, icon, colorClass }: any) => {
  const colors: Record<string, string> = {
    blue: "rgba(59, 130, 246, 0.15)",
    textBlue: "#3b82f6",
    green: "rgba(34, 197, 94, 0.15)",
    textGreen: "#22c55e",
    orange: "rgba(249, 115, 22, 0.15)",
    textOrange: "#f97316",
    purple: "rgba(168, 85, 247, 0.15)",
    textPurple: "#a855f7",
  };

  const bg = colors[colorClass];
  const text =
    colors["text" + colorClass.charAt(0).toUpperCase() + colorClass.slice(1)];

  return (
    <Link
      to={to}
      className="dashboard-card"
      style={{ textDecoration: "none", color: "inherit", height: "100%" }}
    >
      <div>
        <div className="card-icon" style={{ background: bg, color: text }}>
          {icon}
        </div>
        <h3
          style={{
            fontSize: "1.1rem",
            fontWeight: 600,
            marginBottom: 8,
            color: "var(--color-text)",
          }}
        >
          {title}
        </h3>
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--color-muted)",
            lineHeight: 1.4,
          }}
        >
          {description}
        </p>
      </div>
      <div
        style={{
          marginTop: 15,
          fontSize: "0.85rem",
          fontWeight: 600,
          color: text,
          display: "flex",
          alignItems: "center",
          gap: 6,
        }}
      >
        Ingresar <span>→</span>
      </div>
    </Link>
  );
};

// 2. Widget de Agenda (NUEVO)
const AgendaWidget = () => {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Cargar agenda del backend
    axios
      .get("/my-agenda")
      .then((res) => {
        // Si el backend devuelve { data: [...] } o directo el array, ajusta aquí
        const data = Array.isArray(res.data) ? res.data : res.data.data || [];
        setEvents(data);
      })
      .catch((err) => console.error("Error cargando agenda:", err))
      .finally(() => setLoading(false));
  }, []);

  // Función para formato "Hoy", "Mañana" o fecha
  const getRelativeDateLabel = (dateStr: string) => {
    const d = new Date(dateStr);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    d.setHours(0, 0, 0, 0);
    today.setHours(0, 0, 0, 0);
    tomorrow.setHours(0, 0, 0, 0);

    if (d.getTime() === today.getTime()) return "HOY";
    if (d.getTime() === tomorrow.getTime()) return "MAÑANA";
    return d.toLocaleDateString("es-AR", { day: "2-digit", month: "short" });
  };

  if (loading) return <div style={{ color: "var(--color-muted)" }}>Cargando agenda...</div>;

  return (
    <div
      style={{
        background: "var(--color-card)",
        border: "1px solid var(--color-border)",
        borderRadius: 16,
        padding: 20,
        height: "100%",
        display: "flex",
        flexDirection: "column",
        boxShadow: "var(--shadow)",
      }}
    >
      <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 15 }}>
        <h3 style={{ margin: 0, fontSize: "1.1rem", display: 'flex', alignItems: 'center', gap: 8 }}>
          📅 Mi Agenda <span style={{fontSize:'0.8em', opacity: 0.6, fontWeight: 400}}>Próximos días</span>
        </h3>
      </div>

      <div style={{ display: "flex", flexDirection: "column", gap: 12, flex: 1 }}>
        {events.length === 0 ? (
          <div style={{ textAlign: "center", color: "var(--color-muted)", marginTop: 20 }}>
            <p>🎉 Nada pendiente por ahora.</p>
          </div>
        ) : (
          events.map((ev) => {
            const label = getRelativeDateLabel(ev.date);
            const isToday = label === "HOY";

            return (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px",
                  borderRadius: 8,
                  background: "var(--bg-body)", // Un poco más oscuro que la tarjeta
                  borderLeft: `4px solid ${isToday ? "#ef4444" : "#3b82f6"}`,
                }}
              >
                {/* Fecha */}
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                    minWidth: 50,
                    textAlign: "center",
                  }}
                >
                  <span
                    style={{
                      fontSize: "0.7rem",
                      fontWeight: 800,
                      color: isToday ? "#ef4444" : "var(--color-muted)",
                      textTransform: "uppercase",
                    }}
                  >
                    {label}
                  </span>
                </div>

                {/* Info */}
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "0.9rem", color: "var(--color-text)", fontWeight: 500 }}>
                     {/* Enlace al cliente */}
                    <Link 
                        to={`/clientes/${ev.customer_id}`} 
                        style={{textDecoration:'none', color: 'inherit', cursor:'pointer'}}
                        onMouseOver={(e) => e.currentTarget.style.textDecoration = 'underline'}
                        onMouseOut={(e) => e.currentTarget.style.textDecoration = 'none'}
                    >
                        {ev.customer?.first_name} {ev.customer?.last_name}
                    </Link>
                  </div>
                  <div style={{ fontSize: "0.85rem", color: "var(--color-muted)", marginTop: 2 }}>
                    {ev.description || "Sin descripción"}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      
      {/* Footer del widget */}
       {events.length > 0 && (
          <div style={{ marginTop: 15, textAlign: "center", fontSize: "0.8rem" }}>
             <Link to="/clientes" style={{color: "var(--color-primary)", textDecoration:'none'}}>Ver todos los clientes</Link>
          </div>
       )}
    </div>
  );
};

// --- PÁGINA PRINCIPAL ---

export default function Home() {
  const { user } = useAuth();

  // Rol check (Lógica temporal)
  const isAdmin =
    user?.id === 1 || 
    user?.roles?.some((r: any) =>
      ["admin", "superadmin", "gerente"].includes(r.name?.toLowerCase())
    ) ||
    false;

  const hour = new Date().getHours();
  const greeting =
    hour < 12 ? "Buenos días" : hour < 20 ? "Buenas tardes" : "Buenas noches";

  return (
    <div className="container vstack" style={{ gap: 24, paddingBottom: 40 }}>
      {/* HEADER: Bienvenida + Fecha */}
      <div
        className="hstack"
        style={{
          alignItems: "flex-end",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div style={{ flex: 1, minWidth: 280 }}>
          <h1 className="title" style={{ fontSize: "1.8rem", margin: 0, marginBottom: 6 }}>
            {greeting}, {user?.name?.split(" ")[0]} 👋
          </h1>
          <p style={{ color: "var(--color-muted)", fontSize: "1rem", margin: 0 }}>
            Panel de control general
          </p>
        </div>

        <div
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            borderRadius: 12,
            padding: "8px 20px",
            textAlign: "center",
            boxShadow: "var(--shadow)",
          }}
        >
          <div style={{ fontSize: "0.7rem", color: "var(--color-muted)", textTransform: "uppercase" }}>
            Hoy es
          </div>
          <div style={{ fontWeight: 700, fontSize: "1rem", color: "var(--color-text)", textTransform: "capitalize" }}>
            {new Date().toLocaleDateString("es-AR", {
              weekday: "long",
              day: "numeric",
              month: "short",
            })}
          </div>
        </div>
      </div>

      <hr style={{ border: 0, borderTop: "1px solid var(--color-border)", margin: 0 }} />

      {/* LAYOUT PRINCIPAL: GRID RESPONSIVE */}
      <div 
        style={{ 
            display: 'grid', 
            // En pantallas grandes: 2 columnas (2/3 para accesos, 1/3 para agenda)
            // En pantallas chicas: 1 columna
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
            gap: 24 
        }}
      >
        
        {/* COLUMNA IZQUIERDA: Accesos Directos */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20, flex: 2 }}>
            <h2 className="subtitle" style={{ margin: 0, fontSize: "0.9rem", fontWeight: 700, opacity: 0.7, textTransform: "uppercase" }}>
                Accesos Rápidos
            </h2>
            
            <div className="dashboard-grid">
                <ActionCard
                    to="/clientes/registro"
                    title="Nuevo Cliente"
                    description="Registrar prospecto."
                    colorClass="blue"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="8.5" cy="7" r="4" /><line x1="20" y1="8" x2="20" y2="14" /><line x1="23" y1="11" x2="17" y2="11" /></svg>}
                />
                <ActionCard
                    to="/vehiculos/registro"
                    title="Ingresar Auto"
                    description="Alta de unidad."
                    colorClass="green"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="3" width="15" height="13"></rect><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"></polygon><circle cx="5.5" cy="18.5" r="2.5"></circle><circle cx="18.5" cy="18.5" r="2.5"></circle></svg>}
                />
                <ActionCard
                    to="/reservas/nueva"
                    title="Nueva Reserva"
                    description="Iniciar venta."
                    colorClass="orange"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10 9 9 9 8 9" /></svg>}
                />
                {isAdmin && (
                    <ActionCard
                    to="/admin/reportes"
                    title="Reportes"
                    description="Métricas."
                    colorClass="purple"
                    icon={<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>}
                    />
                )}
            </div>

            {/* Listados Secundarios (Más compactos) */}
            <div className="card" style={{ padding: "16px 20px" }}>
                <div style={{ fontSize: "0.9rem", fontWeight: 600, marginBottom: 12 }}>Atajos a Listados:</div>
                <div className="hstack" style={{ flexWrap: "wrap", gap: 10 }}>
                <Link to="/vehiculos" className="enlace" style={{ background: "var(--hover-bg)", padding: "6px 12px", borderRadius: 6, fontSize: '0.9rem' }}>
                    🚙 Ver Stock
                </Link>
                <Link to="/clientes" className="enlace" style={{ background: "var(--hover-bg)", padding: "6px 12px", borderRadius: 6, fontSize: '0.9rem' }}>
                    📇 Ver Clientes
                </Link>
                <Link to="/reservas" className="enlace" style={{ background: "var(--hover-bg)", padding: "6px 12px", borderRadius: 6, fontSize: '0.9rem' }}>
                    📅 Ver Reservas
                </Link>
                </div>
            </div>
        </div>

        {/* COLUMNA DERECHA: La Agenda (Ocupa 1 fracción, o se apila en mobile) */}
        <div style={{ flex: 1, minWidth: 300 }}>
             <AgendaWidget />
        </div>

      </div>
    </div>
  );
}