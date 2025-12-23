import { useEffect, useState } from "react";
import api from "../../lib/api";
import Button from "../ui/Button";
import Input from "../ui/Input";

/* === TIPOS === */
type PaymentMethod = {
  id: number;
  name: string;
  type: string;
};

type Props = {
  onClose: () => void;
  
  // Hacemos estas props OPCIONALES para que sirva en ambos casos
  methods?: PaymentMethod[]; 
  onSelect?: (method: PaymentMethod) => void;
  
  // Agregamos esta prop para el caso de PaymentModal
  onCreated?: (method: PaymentMethod) => void;
};

type MethodType = "" | "cash" | "bank" | "check" | "card" | "credit_bank";

const METHOD_OPTIONS: Record<string, string> = {
  cash: "💵 Efectivo",
  bank: "🏦 Transferencia Bancaria",
  check: "🎫 Cheque",
  card: "💳 Tarjeta de Débito/Crédito",
  credit_bank: "🏦 Crédito Bancario",
};

export default function PaymentMethodModal({ onClose, methods, onSelect, onCreated }: Props) {
  // LOGICA INTELIGENTE:
  // Si no me pasaron 'methods', asumo que abrieron el modal directo para crear.
  const isCreateOnly = !methods;
  
  const [view, setView] = useState<"select" | "create">(
    isCreateOnly ? "create" : "select"
  );

  // === LÓGICA DE CREACIÓN ===
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

  const handleCreateSubmit = async (e: React.FormEvent) => {
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

      const newMethod = res.data.data || res.data;
      
      // Llamamos a CUALQUIERA de las dos funciones que esté definida
      if (onSelect) onSelect(newMethod);
      if (onCreated) onCreated(newMethod);
      
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
      <style>{`
        .adaptive-select option {
          background-color: var(--color-card);
          color: var(--color-text);
        }
        .method-item:hover {
          background-color: var(--hover-bg);
          border-color: var(--color-primary);
        }
      `}</style>

      <div className="modal-overlay" onClick={onClose} style={styles.overlay}>
        <div
          className="modal-card vstack"
          onClick={(e) => e.stopPropagation()}
          style={{
            ...styles.card,
            backgroundColor: "var(--color-card)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
          }}
        >
          {/* === VISTA 1: LISTA PARA ELEGIR (Solo si methods existe) === */}
          {view === "select" && methods && (
            <>
              <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Medio de Pago</h3>
                  <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.9rem" }}>
                    Seleccioná un método o crea uno nuevo
                  </p>
                </div>
                <button onClick={onClose} style={styles.closeBtn}><svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M18 6L6 18M6 6l12 12" strokeWidth="2" /></svg></button>
              </div>

              <div className="vstack" style={{ gap: 10, overflowY: "auto", flex: 1 }}>
                {methods.length === 0 && (
                   <div style={{padding:20, textAlign:'center', color:'var(--color-muted)'}}>No hay métodos creados aún.</div>
                )}
                
                {methods.map((m) => (
                  <div
                    key={m.id}
                    className="method-item hstack"
                    onClick={() => onSelect && onSelect(m)}
                    style={{
                      padding: 12,
                      border: "1px solid var(--color-border)",
                      borderRadius: 8,
                      cursor: "pointer",
                      justifyContent: "space-between",
                      transition: "all 0.2s",
                    }}
                  >
                    <span style={{ fontWeight: 500 }}>{m.name}</span>
                    <small style={{ color: "var(--color-muted)" }}>
                        {METHOD_OPTIONS[m.type] || m.type}
                    </small>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
                <Button onClick={() => setView("create")} style={{ width: "100%" }}>
                  + Crear Nuevo Método
                </Button>
              </div>
            </>
          )}

          {/* === VISTA 2: FORMULARIO DE CREACIÓN === */}
          {view === "create" && (
            <>
              <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 16 }}>
                <div>
                  <h3 style={{ margin: 0, fontSize: "1.25rem" }}>Nuevo Método</h3>
                  {/* Solo mostramos el botón de "Volver" si venimos de la lista */}
                  {!isCreateOnly && (
                      <button 
                        onClick={() => setView("select")} 
                        style={{background:'transparent', border:'none', color:'var(--color-primary)', cursor:'pointer', padding:0, fontSize:'0.9rem'}}
                      >
                        ← Volver al listado
                      </button>
                  )}
                </div>
                 {/* Si es createOnly, mostramos la X de cerrar acá */}
                 {isCreateOnly && (
                    <button onClick={onClose} style={styles.closeBtn}><svg width="20" height="20" viewBox="0 0 24 24" stroke="currentColor" fill="none"><path d="M18 6L6 18M6 6l12 12" strokeWidth="2" /></svg></button>
                 )}
              </div>

              <div style={{ overflowY: "auto", flex: 1, paddingRight: 4 }}>
                <form id="create-method-form" onSubmit={handleCreateSubmit} className="vstack" style={{ gap: 16 }}>
                  <Input
                    label="Nombre"
                    value={name}
                    onChange={(e) => setName(e.currentTarget.value)}
                    placeholder="Ej: Banco Galicia"
                    required
                    autoFocus
                  />

                  {/* Selector de Tipo */}
                  <div className="vstack" style={{ gap: 6 }}>
                    <label style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--color-muted)" }}>Tipo *</label>
                    <div style={{ position: "relative" }}>
                      <select
                        value={type}
                        onChange={(e) => handleChangeType(e.currentTarget.value as MethodType)}
                        className="adaptive-select"
                        style={{
                          ...styles.select,
                          backgroundColor: "var(--input-bg)",
                          color: "var(--color-text)",
                          borderColor: "var(--color-border)",
                        }}
                        required
                      >
                        <option value="" disabled>Seleccionar...</option>
                        {Object.entries(METHOD_OPTIONS).map(([key, label]) => (
                          <option key={key} value={key}>{label}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {/* Checkbox */}
                  <div className="hstack" onClick={() => setRequiresDetails(!requiresDetails)} style={{ gap: 10, padding: 12, backgroundColor: "var(--input-bg)", border: "1px solid var(--color-border)", borderRadius: 6, cursor: "pointer" }}>
                    <input type="checkbox" checked={requiresDetails} onChange={(e) => setRequiresDetails(e.target.checked)} style={{ accentColor: "var(--color-primary)", width: 16, height: 16 }} />
                    <div className="vstack">
                      <span style={{ fontSize: "0.9rem" }}>Requiere datos adicionales</span>
                      <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>Ej: CBU, N° Cheque</span>
                    </div>
                  </div>

                  {error && (
                    <div style={{ padding: 10, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", borderRadius: 6, fontSize: "0.9rem" }}>
                      ⚠️ {error}
                    </div>
                  )}
                </form>
              </div>

              <div className="hstack" style={{ justifyContent: "flex-end", gap: 10, marginTop: 16, paddingTop: 16, borderTop: "1px solid var(--color-border)" }}>
                 <Button type="button" onClick={onClose} className="btn-secondary" disabled={loading} style={{background:'transparent', border:'1px solid var(--color-border)', color:'var(--color-text)'}}>
                    Cancelar
                 </Button>
                 <Button type="submit" form="create-method-form" loading={loading}>
                   Guardar
                 </Button>
              </div>
            </>
          )}
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
};