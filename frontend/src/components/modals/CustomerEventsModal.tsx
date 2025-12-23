import { useEffect, useRef, useState } from "react";
import { useCustomers } from "../../hooks/useCustomers"; // Eliminé EventPayload de acá para definirlo localmente si hace falta
import type { Customer } from "../../types/customer";
import Button from "../ui/Button";

interface Props {
  customer: Customer;
  onClose: () => void;
  onSuccess?: (msg: string) => void;
  onError?: (msg: string) => void;
}

export default function CustomerEventsModal({
  customer,
  onClose,
  onSuccess,
  onError,
}: Props) {
  const { addEvent, getCustomerEvents } = useCustomers();
  const listEndRef = useRef<HTMLDivElement>(null);

  // Estados
  const [actionDesc, setActionDesc] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [agendaDesc, setAgendaDesc] = useState("");

  // Usamos fecha de hoy por defecto
  const [agendaDate, setAgendaDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const [loadingAgenda, setLoadingAgenda] = useState(false);
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    loadHistory();
  }, [customer.id]);

  useEffect(() => {
    // Scroll al fondo suavemente cuando cambia el historial
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  const loadHistory = async () => {
    setLoadingHistory(true);
    try {
      const data = await getCustomerEvents(customer.id);
      setHistory(data);
    } catch (err) {
      console.error("Error cargando historial:", err);
    } finally {
      setLoadingHistory(false);
    }
  };

  // Función auxiliar para extraer mensaje de error de la API
  const getErrorMessage = (err: any) => {
    console.error("Error API completo:", err); // Para ver en consola
    // Intenta leer el mensaje que manda Laravel/Backend
    return (
      err.response?.data?.message ||
      err.message ||
      "Error desconocido en el servidor"
    );
  };

  const handleRegisterAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionDesc.trim()) return;
    setLoadingAction(true);
    try {
      // Payload ajustado
      await addEvent(customer.id, {
        type: "visita", // Asegurate que este tipo exista en tu BD
        description: actionDesc,
        date: new Date().toISOString().split("T")[0],
        is_schedule: false,
      });

      setActionDesc("");
      await loadHistory();
      if (onSuccess) onSuccess("Acción registrada correctamente");
    } catch (err: any) {
      const msg = getErrorMessage(err);
      if (onError) onError(`Error al registrar: ${msg}`);
    } finally {
      setLoadingAction(false);
    }
  };

  const handleAgendaSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!agendaDesc.trim()) return;
    setLoadingAgenda(true);
    try {
      await addEvent(customer.id, {
        type: "nota", // Asegurate que este tipo exista en tu BD
        description: agendaDesc,
        date: agendaDate,
        is_schedule: true,
      });

      setAgendaDesc("");
      setAgendaDate(new Date().toISOString().split("T")[0]);
      await loadHistory();
      if (onSuccess) onSuccess("Agendado y renovado correctamente");
    } catch (err: any) {
      const msg = getErrorMessage(err);
      if (onError) onError(`Error al agendar: ${msg}`);
    } finally {
      setLoadingAgenda(false);
    }
  };

  const getIcon = (type: string, isSchedule: boolean) => {
    // Convertimos a booleano real por si viene como 1/0 string
    const schedule = Boolean(isSchedule);
    if (schedule) return "📅";
    switch (type) {
      case "llamada":
        return "📞";
      case "visita":
        return "📍";
      case "whatsapp":
        return "💬";
      default:
        return "📝";
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-card"
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: "600px",
          width: "95%",
          height: "90vh",
          maxHeight: "800px",
          display: "flex",
          flexDirection: "column",
          padding: 0,
          overflow: "hidden",
          background: "var(--color-card)",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
        }}
      >
        {/* === HEADER === */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "12px 16px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-card)",
            flexShrink: 0,
          }}
        >
          <h3
            style={{
              margin: 0,
              fontSize: "1.1rem",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {customer.first_name} {customer.last_name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.5rem",
              color: "var(--color-muted)",
              cursor: "pointer",
              padding: "0 8px",
            }}
          >
            &times;
          </button>
        </div>

        {/* === REGISTRO RÁPIDO (Arriba) === */}
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-card)",
            flexShrink: 0,
          }}
        >
          <form
            onSubmit={handleRegisterAction}
            style={{ display: "flex", gap: "8px" }}
          >
            <input
              type="text"
              placeholder="Registrar acción pasada (ej: Vino al local)..."
              value={actionDesc}
              onChange={(e) => setActionDesc(e.target.value)}
              style={{
                flex: 1,
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--input-bg)",
                color: "var(--color-text)",
                fontSize: "0.9rem",
              }}
            />
            <Button
              type="submit"
              disabled={loadingAction || !actionDesc}
              style={{ padding: "8px 12px" }}
            >
              {loadingAction ? "..." : "Registrar"}
            </Button>
          </form>
        </div>

        {/* === HISTORIAL (Centro) === */}
        <div
          style={{
            flex: 1,
            overflowY: "auto",
            padding: "16px",
            background: "var(--color-bg)",
            display: "flex",
            flexDirection: "column",
            gap: "12px",
          }}
        >
          {!loadingHistory && history.length === 0 && (
            <div
              style={{
                textAlign: "center",
                marginTop: "20px",
                color: "var(--color-muted)",
                fontSize: "0.9rem",
              }}
            >
              No hay historial registrado.
            </div>
          )}

          {history.map((evt: any) => (
            <div
              key={evt.id}
              style={{
                background: "var(--color-card)",
                padding: "10px 12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                borderLeft: evt.is_schedule
                  ? "3px solid var(--color-primary)"
                  : "3px solid var(--color-muted)",
                boxShadow: "0 1px 2px rgba(0,0,0,0.05)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: "4px",
                }}
              >
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    color: evt.is_schedule
                      ? "var(--color-primary)"
                      : "var(--color-muted)",
                  }}
                >
                  {getIcon(evt.type, evt.is_schedule)}{" "}
                  {evt.is_schedule ? "Agenda" : evt.type}
                </span>
                <span
                  style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}
                >
                  {new Date(evt.date).toLocaleDateString()}
                </span>
              </div>
              <p
                style={{
                  margin: 0,
                  fontSize: "0.9rem",
                  lineHeight: 1.4,
                  color: "var(--color-text)",
                }}
              >
                {evt.description}
              </p>
            </div>
          ))}
          <div ref={listEndRef} />
        </div>

        {/* === AGENDAR (Abajo) === */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-card)",
            flexShrink: 0,
          }}
        >
          <div
            style={{
              fontSize: "0.75rem",
              fontWeight: 700,
              color: "var(--color-primary)",
              marginBottom: "8px",
              display: "flex",
              alignItems: "center",
              gap: "6px",
            }}
          >
            <span>📅</span> Agendar Próximo Paso (Renueva Exclusividad)
          </div>

          <form
            onSubmit={handleAgendaSubmit}
            style={{ display: "flex", flexDirection: "column", gap: "8px" }}
          >
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="text"
                placeholder="Ej: Llamar el lunes..."
                value={agendaDesc}
                onChange={(e) => setAgendaDesc(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px 12px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  background: "var(--input-bg)",
                  color: "var(--color-text)",
                  fontSize: "0.9rem",
                }}
              />
            </div>
            <div style={{ display: "flex", gap: "8px" }}>
              <input
                type="date"
                value={agendaDate}
                onChange={(e) => setAgendaDate(e.target.value)}
                style={{
                  flex: 1,
                  padding: "8px",
                  borderRadius: "8px",
                  border: "1px solid var(--color-border)",
                  background: "var(--input-bg)",
                  color: "var(--color-text)",
                  fontSize: "0.9rem",
                }}
              />
              <Button
                type="submit"
                disabled={loadingAgenda || !agendaDesc}
                style={{ whiteSpace: "nowrap" }}
              >
                {loadingAgenda ? "..." : "Agendar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
