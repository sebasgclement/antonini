import { useEffect, useState } from "react";
import api from "../../lib/api";
import Button from "../ui/Button";
import Input from "../ui/Input";

type Props = {
  onClose: () => void;
  onCreated: (method: any) => void;
};

type MethodType = "" | "cash" | "bank" | "check" | "card" | "credit_bank";

const METHOD_OPTIONS: Record<string, string> = {
  cash: "💵 Efectivo",
  bank: "🏦 Transferencia Bancaria",
  check: "🎫 Cheque",
  card: "💳 Tarjeta de Débito/Crédito",
  credit_bank: "🏦 Crédito Bancario",
};

export default function PaymentMethodModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<MethodType>("");
  const [requiresDetails, setRequiresDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChangeType = (value: MethodType) => {
    setType(value);
    if (value === "cash") {
      setRequiresDetails(false);
    } else if (value) {
      setRequiresDetails(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return setError("El nombre es obligatorio");
    if (!type) return setError("Seleccioná un tipo de método");

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/payment-methods", {
        name,
        type,
        requires_details: requiresDetails,
      });

      onCreated(res.data.data || res.data);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.errors?.type?.[0] ||
          "Error al crear método de pago"
      );
    } finally {
      setLoading(false);
    }
  };

  // Cierre con ESC
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <>
      {/* 🔥 FIX: Usamos las variables correctas (--color-card y --color-text) */}
      <style>{`
        .adaptive-select option {
          background-color: var(--color-card);
          color: var(--color-text);
        }
      `}</style>

      <div className="modal-overlay" onClick={onClose} style={styles.overlay}>
        <div
          className="modal-card vstack"
          onClick={(e) => e.stopPropagation()}
          style={{
            ...styles.card,
            // 🔥 FIX: Variables correctas del tema
            backgroundColor: "var(--color-card)", 
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* HEADER */}
          <div
            className="hstack"
            style={{
              justifyContent: "space-between",
              marginBottom: 16,
              flexShrink: 0,
            }}
          >
            <div>
              <h3 style={{ margin: 0, fontSize: "1.25rem", color: "var(--color-text)" }}>
                Nuevo medio de pago
              </h3>
              <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.9rem" }}>
                Define cómo cobrarás las reservas
              </p>
            </div>
            <button onClick={onClose} style={styles.closeBtn} title="Cerrar">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* BODY */}
          <div style={{ overflowY: "auto", flex: 1, paddingRight: 4, display: "flex", flexDirection: "column", gap: 16 }}>
            <form id="create-method-form" onSubmit={handleSubmit} className="vstack" style={{ gap: 16 }}>
              
              <Input
                label="Nombre del método"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                placeholder="Ej: Banco Galicia - Cuenta Corriente"
                required
                autoFocus
              />

              {/* Selector de Tipo */}
              <div className="vstack" style={{ gap: 6 }}>
                <label style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--color-muted)" }}>
                  Tipo de Método *
                </label>
                <div style={{ position: "relative" }}>
                  <select
                    value={type}
                    onChange={(e) => handleChangeType(e.currentTarget.value as MethodType)}
                    className="adaptive-select"
                    style={{
                      ...styles.select,
                      // 🔥 FIX: Variables correctas
                      backgroundColor: "var(--input-bg)",
                      color: "var(--color-text)",
                      borderColor: "var(--color-border)",
                    }}
                    required
                  >
                    <option value="" disabled>Seleccionar tipo...</option>
                    {Object.entries(METHOD_OPTIONS).map(([key, label]) => (
                      <option key={key} value={key}>{label}</option>
                    ))}
                  </select>

                  <div style={{ ...styles.selectArrow, color: "var(--color-text)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <path d="M6 9l6 6 6-6" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Checkbox */}
              <div
                className="hstack"
                onClick={() => setRequiresDetails(!requiresDetails)}
                style={{
                  gap: 10,
                  padding: 12,
                  // 🔥 FIX: Variables correctas
                  backgroundColor: "var(--input-bg)",
                  border: "1px solid var(--color-border)",
                  borderRadius: 6,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={requiresDetails}
                  onChange={(e) => setRequiresDetails(e.target.checked)}
                  style={{ accentColor: "var(--color-primary)", width: 16, height: 16, cursor: "pointer" }}
                />
                <div className="vstack" style={{ gap: 2 }}>
                  <span style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--color-text)" }}>
                    Requiere datos adicionales
                  </span>
                  <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>
                    Marcar si al cobrar necesitas pedir CBU, N° Cheque, etc.
                  </span>
                </div>
              </div>

              {/* Error */}
              {error && (
                <div style={{ padding: 10, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", border: "1px solid rgba(239, 68, 68, 0.2)", borderRadius: 6, fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 8 }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
                  </svg>
                  {error}
                </div>
              )}
            </form>
          </div>

          {/* FOOTER */}
          <div className="hstack" style={{ justifyContent: "flex-end", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)", flexShrink: 0 }}>
            <Button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                // 🔥 FIX: Color de texto correcto (se verá oscuro en light mode)
                color: "var(--color-text)", 
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" form="create-method-form" loading={loading}>
              {loading ? "Guardando..." : "Crear Método"}
            </Button>
          </div>
        </div>
      </div>
    </>
  );
}

const styles = {
  overlay: {
    position: "fixed" as "fixed",
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: "rgba(0,0,0,0.6)",
    backdropFilter: "blur(4px)",
    display: "flex", alignItems: "center", justifyContent: "center",
    zIndex: 9999,
  },
  card: {
    padding: 24,
    borderRadius: 12,
    width: 450,
    maxWidth: "95%",
    boxShadow: "0 10px 25px rgba(0,0,0,0.5)",
  },
  closeBtn: {
    background: "none",
    border: "none",
    cursor: "pointer",
    padding: 4,
    display: "flex", alignItems: "center", justifyContent: "center",
    borderRadius: "50%",
    color: "var(--color-muted)",
  },
  select: {
    width: "100%",
    padding: "10px 12px",
    borderRadius: "6px",
    fontSize: "1rem",
    appearance: "none" as "none",
    cursor: "pointer",
    borderWidth: "1px",
    borderStyle: "solid",
  },
  selectArrow: {
    position: "absolute" as "absolute",
    right: 12,
    top: "50%",
    transform: "translateY(-50%)",
    pointerEvents: "none" as "none",
  },
};