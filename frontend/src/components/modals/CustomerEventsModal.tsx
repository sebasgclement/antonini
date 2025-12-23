import { useEffect, useRef, useState } from "react";
import { useCustomers } from "../../hooks/useCustomers";
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
  // 👇 Agregamos updateCustomer y getSellers
  const { addEvent, getCustomerEvents, updateCustomer, getSellers } = useCustomers();
  const listEndRef = useRef<HTMLDivElement>(null);

  // Estados Eventos
  const [actionDesc, setActionDesc] = useState("");
  const [loadingAction, setLoadingAction] = useState(false);
  const [agendaDesc, setAgendaDesc] = useState("");
  const [agendaDate, setAgendaDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [loadingAgenda, setLoadingAgenda] = useState(false);
  
  // Estados Historial
  const [history, setHistory] = useState<any[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  // 👇 Estados para Reasignación (Admin)
  const [isAdmin, setIsAdmin] = useState(false);
  const [sellers, setSellers] = useState<{ id: number; name: string }[]>([]);
  const [selectedSeller, setSelectedSeller] = useState<number | string>(
    customer.seller_id || ""
  );
  const [loadingAssign, setLoadingAssign] = useState(false);

  useEffect(() => {
    loadHistory();
    checkAdminAndLoadSellers();
  }, [customer.id]);

  useEffect(() => {
    if (listEndRef.current) {
      listEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [history]);

  // 👇 Lógica para detectar Admin y cargar lista
  const checkAdminAndLoadSellers = async () => {
    const userStr = localStorage.getItem("user");
    
    if (userStr) {
      try {
        const u = JSON.parse(userStr);

        // 👇 LÓGICA CORREGIDA PARA TU ESTRUCTURA
        // 1. Si tu ID es 1 (Super Admin por defecto)
        // 2. O si tienes un array "roles" y alguno se llama "Admin" o tiene id 1
        const esAdmin = 
            u.id === 1 || 
            (u.roles && Array.isArray(u.roles) && u.roles.some((r: any) => 
                r.name === 'Admin' || r.name === 'admin' || r.id === 1
            ));

        if (esAdmin) {
          setIsAdmin(true);
          try {
            const data = await getSellers();
            setSellers(data);
          } catch (e) {
            console.error("Error cargando vendedores", e);
          }
        }
      } catch (e) {
        console.error("Error leyendo usuario", e);
      }
    }
  };

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

  const getErrorMessage = (err: any) => {
    return (
      err.response?.data?.message ||
      err.message ||
      "Error desconocido en el servidor"
    );
  };

  // 👇 Manejador para cambiar de dueño
  const handleAssignSeller = async () => {
    if (!selectedSeller) return;
    setLoadingAssign(true);
    try {
      await updateCustomer(customer.id, { seller_id: Number(selectedSeller) });
      if (onSuccess) onSuccess("Cliente reasignado correctamente");
      // No cerramos para permitir seguir editando, pero podés cerrar si querés
    } catch (err: any) {
      const msg = getErrorMessage(err);
      if (onError) onError(`Error al reasignar: ${msg}`);
    } finally {
      setLoadingAssign(false);
    }
  };

  const handleRegisterAction = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!actionDesc.trim()) return;
    setLoadingAction(true);
    try {
      await addEvent(customer.id, {
        type: "visita",
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
        type: "nota",
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
    const schedule = Boolean(isSchedule);
    if (schedule) return "📅";
    switch (type) {
      case "llamada": return "📞";
      case "visita": return "📍";
      case "whatsapp": return "💬";
      default: return "📝";
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
          <h3 style={{ margin: 0, fontSize: "1.1rem" }}>
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
            }}
          >
            &times;
          </button>
        </div>

        {/* 👇 ZONA ADMIN: REASIGNAR (Solo visible si isAdmin) */}
        {isAdmin && (
          <div
            style={{
              padding: "10px 16px",
              background: "rgba(2, 132, 199, 0.1)", // Un azul muy suave
              borderBottom: "1px solid var(--color-border)",
              display: "flex",
              alignItems: "center",
              gap: 10,
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#0284c7" }}>
              👮 Admin:
            </span>
            <select
              value={selectedSeller}
              onChange={(e) => setSelectedSeller(e.target.value)}
              style={{
                padding: "6px",
                borderRadius: "4px",
                border: "1px solid #ccc",
                fontSize: "0.9rem",
                flex: 1,
              }}
            >
              <option value="">-- Sin asignar --</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
            <Button 
                onClick={handleAssignSeller} 
                disabled={loadingAssign || selectedSeller == customer.seller_id}
                style={{ fontSize: "0.8rem", padding: "6px 10px" }}
            >
              {loadingAssign ? "..." : "Asignar"}
            </Button>
          </div>
        )}

        {/* === REGISTRO RÁPIDO === */}
        <div
          style={{
            padding: "10px 16px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-card)",
            flexShrink: 0,
          }}
        >
          <form onSubmit={handleRegisterAction} style={{ display: "flex", gap: "8px" }}>
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
            <Button type="submit" disabled={loadingAction || !actionDesc}>
              {loadingAction ? "..." : "Registrar"}
            </Button>
          </form>
        </div>

        {/* === HISTORIAL === */}
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
            <div style={{ textAlign: "center", marginTop: "20px", color: "var(--color-muted)" }}>
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
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                <span
                  style={{
                    fontWeight: 600,
                    fontSize: "0.75rem",
                    textTransform: "uppercase",
                    color: evt.is_schedule ? "var(--color-primary)" : "var(--color-muted)",
                  }}
                >
                  {getIcon(evt.type, evt.is_schedule)} {evt.is_schedule ? "Agenda" : evt.type}
                </span>
                <span style={{ fontSize: "0.75rem", color: "var(--color-muted)" }}>
                  {new Date(evt.date).toLocaleDateString()}
                </span>
              </div>
              <p style={{ margin: 0, fontSize: "0.9rem", color: "var(--color-text)" }}>
                {evt.description}
              </p>
            </div>
          ))}
          <div ref={listEndRef} />
        </div>

        {/* === AGENDAR === */}
        <div
          style={{
            padding: "12px 16px",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-card)",
            flexShrink: 0,
          }}
        >
          <div style={{ fontSize: "0.75rem", fontWeight: 700, color: "var(--color-primary)", marginBottom: "8px" }}>
            📅 Agendar Próximo Paso (Renueva Exclusividad)
          </div>
          <form onSubmit={handleAgendaSubmit} style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <input
              type="text"
              placeholder="Ej: Llamar el lunes..."
              value={agendaDesc}
              onChange={(e) => setAgendaDesc(e.target.value)}
              style={{
                padding: "8px 12px",
                borderRadius: "8px",
                border: "1px solid var(--color-border)",
                background: "var(--input-bg)",
                color: "var(--color-text)",
              }}
            />
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
                }}
              />
              <Button type="submit" disabled={loadingAgenda || !agendaDesc}>
                {loadingAgenda ? "..." : "Agendar"}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}