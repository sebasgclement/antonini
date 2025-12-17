import { useEffect, useState, type FormEvent } from "react";
import api from "../../lib/api";
import { type Customer } from "../../types/customer";
import Button from "../ui/Button";

type Event = {
  id: number;
  type: string;
  description: string;
  date: string;
};

interface Props {
  customer: Customer;
  onClose: () => void;
}

export default function CustomerEventsModal({ customer, onClose }: Props) {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);

  // Formulario nuevo evento
  const [type, setType] = useState("nota");
  const [description, setDescription] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 16)); // Fecha actual formato input datetime

  useEffect(() => {
    // Cargar eventos del cliente (asumiendo que el backend los devuelve en la relación o en un endpoint aparte)
    // Si usás la relación en el 'show' del cliente, podrías pasarlos por props.
    // Si son muchos, mejor hacer un fetch aquí:
    api
      .get(`/customers/${customer.id}/events`)
      .then((res) => setEvents(res.data.data || res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [customer.id]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description) return;

    try {
      const res = await api.post(`/customers/${customer.id}/events`, {
        type,
        description,
        date,
      });
      // Agregar el nuevo evento arriba
      setEvents([res.data.data, ...events]);
      setDescription(""); // Limpiar solo descripción
    } catch (error) {
      alert("Error al guardar evento");
    }
  };

  // Iconos según tipo
  const getIcon = (t: string) => {
    switch (t) {
      case "llamada":
        return "📞";
      case "reunion":
        return "📅";
      case "whatsapp":
        return "💬";
      default:
        return "📝";
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-box"
        style={{
          maxWidth: 500,
          height: "80vh",
          display: "flex",
          flexDirection: "column",
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header Modal */}
        <div
          className="hstack"
          style={{
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 16,
          }}
        >
          <h3 style={{ margin: 0 }}>
            Acciones: {customer.first_name} {customer.last_name}
          </h3>
          <button
            onClick={onClose}
            style={{
              background: "none",
              border: "none",
              fontSize: "1.2rem",
              cursor: "pointer",
            }}
          >
            ✕
          </button>
        </div>

        {/* Formulario de carga rápida */}
        <form
          onSubmit={handleSubmit}
          style={{
            background: "var(--hover-bg)",
            padding: 12,
            borderRadius: 8,
            marginBottom: 16,
          }}
        >
          <div className="hstack" style={{ gap: 8, marginBottom: 8 }}>
            <select
              className="form-control"
              value={type}
              onChange={(e) => setType(e.target.value)}
              style={{ flex: 1 }}
            >
              <option value="nota">📝 Nota</option>
              <option value="llamada">📞 Llamada</option>
              <option value="whatsapp">💬 WhatsApp</option>
              <option value="reunion">📅 Reunión</option>
            </select>
            <input
              type="datetime-local"
              className="form-control"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              style={{ flex: 1.5 }}
            />
          </div>
          <div className="hstack" style={{ gap: 8 }}>
            <input
              className="form-control"
              placeholder="Detalle del evento..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              style={{ flex: 1 }}
            />
            <Button type="submit" style={{ padding: "6px 12px" }}>
              Agendar
            </Button>
          </div>
        </form>

        {/* Lista de eventos (Scrollable) */}
        <div style={{ flex: 1, overflowY: "auto", paddingRight: 4 }}>
          {loading ? (
            <p style={{ textAlign: "center" }}>Cargando historial...</p>
          ) : (
            <div className="vstack" style={{ gap: 12 }}>
              {events.length === 0 && (
                <p style={{ color: "var(--color-muted)", textAlign: "center" }}>
                  Sin eventos registrados.
                </p>
              )}

              {events.map((ev) => (
                <div
                  key={ev.id}
                  style={{
                    border: "1px solid var(--color-border)",
                    borderRadius: 8,
                    padding: 10,
                    position: "relative",
                    paddingLeft: 40,
                  }}
                >
                  <div
                    style={{
                      position: "absolute",
                      left: 10,
                      top: 10,
                      background: "var(--hover-bg)",
                      width: 24,
                      height: 24,
                      borderRadius: "50%",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    {getIcon(ev.type)}
                  </div>
                  <div
                    style={{
                      fontSize: "0.8rem",
                      color: "var(--color-primary)",
                      fontWeight: 600,
                    }}
                  >
                    {new Date(ev.date).toLocaleString()}
                  </div>
                  <div
                    style={{ fontSize: "0.95rem", color: "var(--color-text)" }}
                  >
                    {ev.description}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
