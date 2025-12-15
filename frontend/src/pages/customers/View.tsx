import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import api from "../../lib/api";
import { displayCustomerName } from "../../types/customer";

const DataItem = ({
  label,
  value,
  sub,
}: {
  label: string;
  value: React.ReactNode;
  sub?: string;
}) => (
  <div style={{ display: "flex", flexDirection: "column", gap: 2 }}>
    <span
      style={{
        fontSize: "0.8rem",
        color: "var(--color-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: "1.05rem",
        fontWeight: 500,
        color: "var(--color-text)",
      }}
    >
      {value}
    </span>
    {sub && (
      <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
        {sub}
      </span>
    )}
  </div>
);

// Helper para iconos de eventos
const getEventIcon = (type: string) => {
  switch (type) {
    case "llamada":
      return "📞";
    case "whatsapp":
      return "💬";
    case "visita":
      return "📍";
    default:
      return "📝";
  }
};

export default function CustomerView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [customer, setCustomer] = useState<any>(null);
  const [recentEvents, setRecentEvents] = useState<any[]>([]); // 🔹 Estado para eventos
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      try {
        // 1. Cargar Cliente
        const { data } = await api.get(`/customers/${id}`);
        setCustomer(data?.data ?? data);

        // 2. Cargar Eventos Recientes (Solo traemos, después filtramos si hace falta)
        const eventsRes = await api.get(`/customers/${id}/events`);
        const eventsData = Array.isArray(eventsRes.data)
          ? eventsRes.data
          : eventsRes.data?.data || [];
        setRecentEvents(eventsData.slice(0, 5)); // Nos quedamos con los últimos 5
      } catch {
        setToast("No se pudo cargar la información del cliente");
      }
    })();
  }, [id]);

  if (!customer)
    return (
      <div
        className="container"
        style={{
          padding: 20,
          textAlign: "center",
          color: "var(--color-muted)",
        }}
      >
        Cargando...
      </div>
    );

  // 🔥 FIX FOTOS
  const getCleanUrl = (url: any) => {
    if (!url) return "";
    if (typeof url === "string" && url.includes("/api/storage")) {
      return url.replace("/api/storage", "/storage");
    }
    return url;
  };

  const frontUrl = getCleanUrl(customer.dni_front_url);
  const backUrl = getCleanUrl(customer.dni_back_url);
  const maritalColor = customer.marital_status === "casado" ? "purple" : "blue";

  // 🔹 Detectar si es Lead/Consulta (Status 'consulta' o sin dirección)
  const isLead =
    customer.status === "consulta" || (!customer.address && !frontUrl);

  return (
    <div className="container vstack detail-page" style={{ gap: 24 }}>
      {/* === HEADER === */}
      <div
        className="hstack"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <div>
          <h2 className="page-title" style={{ margin: 0, fontSize: "1.8rem" }}>
            {displayCustomerName(customer)}
          </h2>

          <div
            style={{
              color: "var(--color-muted)",
              marginTop: 4,
              display: "flex",
              gap: 8,
              alignItems: "center",
              flexWrap: "wrap",
              fontSize: "0.9rem",
            }}
          >
            <span>#{customer.id}</span>
            <span>•</span>
            <span>📅 {new Date(customer.created_at).toLocaleDateString()}</span>
            <span>•</span>
            <span>
              👤 Vendedor: <strong>{customer.user?.name || "Sistema"}</strong>
            </span>
            {isLead && <span className="badge orange">Potential Lead</span>}
          </div>
        </div>
        <Button
          onClick={() => nav(-1)}
          style={{
            background: "var(--color-card)",
            border: "1px solid var(--color-border)",
            color: "var(--color-text)",
          }}
        >
          ← Volver
        </Button>
      </div>

      {/* === GRID PRINCIPAL === */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
          gap: 20,
        }}
      >
        {/* COLUMNA 1: Datos Personales (Común a todos) */}
        <div className="card vstack" style={{ gap: 20 }}>
          <div className="title" style={{ fontSize: "1.1rem" }}>
            Datos Personales
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <DataItem
              label="Tipo Documento"
              value={customer.doc_type || "DNI"}
            />
            <DataItem label="Número" value={customer.doc_number || "—"} />

            {/* Solo mostramos estos si NO es Lead, o si tienen datos */}
            {(customer.cuit || !isLead) && (
              <DataItem label="CUIT / CUIL" value={customer.cuit || "—"} />
            )}
            {(customer.marital_status || !isLead) && (
              <DataItem
                label="Estado Civil"
                value={
                  customer.marital_status ? (
                    <span
                      className={`badge ${maritalColor}`}
                      style={{ textTransform: "capitalize" }}
                    >
                      {customer.marital_status}
                    </span>
                  ) : (
                    "—"
                  )
                }
              />
            )}
          </div>
        </div>

        {/* COLUMNA 2: Contacto (Común a todos) */}
        <div className="card vstack" style={{ gap: 20 }}>
          <div className="title" style={{ fontSize: "1.1rem" }}>
            Contacto
          </div>

          <div
            style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}
          >
            <DataItem
              label="Teléfono"
              value={
                customer.phone ? (
                  <a
                    href={`tel:${customer.phone}`}
                    style={{ color: "inherit", textDecoration: "none" }}
                  >
                    {customer.phone}
                  </a>
                ) : (
                  "—"
                )
              }
            />
            <div style={{ gridColumn: "1 / -1" }}>
              <DataItem
                label="Email"
                value={
                  customer.email ? (
                    <a
                      href={`mailto:${customer.email}`}
                      style={{
                        color: "var(--color-primary)",
                        textDecoration: "none",
                      }}
                    >
                      {customer.email}
                    </a>
                  ) : (
                    "—"
                  )
                }
              />
            </div>
            {!isLead && (
              <div style={{ gridColumn: "1 / -1" }}>
                <DataItem
                  label="Dirección"
                  value={customer.address || "—"}
                  sub={customer.city || ""}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* === SECCIÓN DINÁMICA === */}

      {/* OPCIÓN A: Si es LEAD -> Mostramos Historial de Consultas */}
      {isLead && recentEvents.length > 0 && (
        <div className="card">
          <div
            className="title"
            style={{ fontSize: "1.1rem", marginBottom: 16 }}
          >
            ⏳ Últimas Interacciones
          </div>
          <div className="vstack" style={{ gap: 12 }}>
            {recentEvents.map((ev: any) => (
              <div
                key={ev.id}
                style={{
                  display: "flex",
                  gap: 12,
                  padding: "10px",
                  background: "var(--bg-color)",
                  borderRadius: 8,
                  border: "1px solid var(--color-border)",
                }}
              >
                <div style={{ fontSize: "1.2rem" }}>
                  {getEventIcon(ev.type)}
                </div>
                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span
                      style={{
                        fontWeight: 600,
                        fontSize: "0.9rem",
                        textTransform: "capitalize",
                      }}
                    >
                      {ev.type}
                    </span>
                    <span
                      style={{
                        fontSize: "0.8rem",
                        color: "var(--color-muted)",
                      }}
                    >
                      {new Date(ev.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <div
                    style={{ fontSize: "0.9rem", color: "var(--color-text)" }}
                  >
                    {ev.description}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* OPCIÓN B: Si es CLIENTE -> Mostramos Documentación */}
      {!isLead && (frontUrl || backUrl) ? (
        <div className="card">
          <div className="title" style={{ fontSize: "1.1rem" }}>
            Documentación Digital
          </div>
          <div
            style={{
              display: "flex",
              gap: 20,
              flexWrap: "wrap",
              marginTop: 10,
            }}
          >
            {frontUrl && (
              <div style={{ flex: 1, minWidth: 200, maxWidth: 400 }}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--color-muted)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Frente:
                </span>
                <img
                  src={frontUrl}
                  alt="Frente DNI"
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow)",
                  }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/400x250?text=Error+Imagen";
                  }}
                />
              </div>
            )}
            {backUrl && (
              <div style={{ flex: 1, minWidth: 200, maxWidth: 400 }}>
                <span
                  style={{
                    fontSize: "0.9rem",
                    color: "var(--color-muted)",
                    display: "block",
                    marginBottom: 8,
                  }}
                >
                  Dorso:
                </span>
                <img
                  src={backUrl}
                  alt="Dorso DNI"
                  style={{
                    width: "100%",
                    borderRadius: 8,
                    border: "1px solid var(--color-border)",
                    boxShadow: "var(--shadow)",
                  }}
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://via.placeholder.com/400x250?text=Error+Imagen";
                  }}
                />
              </div>
            )}
          </div>
        </div>
      ) : null}

      {/* === OBSERVACIONES (Siempre visible) === */}
      {customer.notes && (
        <div className="card">
          <div className="title" style={{ fontSize: "1.1rem" }}>
            Notas Internas
          </div>
          <p style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>
            {customer.notes}
          </p>
        </div>
      )}

      {/* Acciones Footer */}
      <div
        className="hstack"
        style={{ justifyContent: "flex-end", marginTop: 20 }}
      >
        <Button onClick={() => nav(`/clientes/${customer.id}/edit`)}>
          ✎ Editar Cliente
        </Button>
      </div>

      {toast && <Toast message={toast} type="error" />}
    </div>
  );
}
