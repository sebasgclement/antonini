import { useEffect, useState } from "react";
import api from "../../lib/api";
import Button from "../ui/Button";
import Input from "../ui/Input";
import PaymentMethodModal from "./PaymentMethodModal";

interface Props {
  reservation: any;
  onClose: () => void;
  onSuccess: () => void;
}

type PaymentMethod = {
  id: number;
  name: string;
  type: string;
};

// Definimos la estructura de los detalles del cheque
type CheckDetails = {
  bank: string;
  number: string;
  holder: string;
  payment_date: string;
  delivery_date: string;
};

// === MÉTODOS BASE (CORE) ===
// Estos aseguran que la UI funcione (ej: ID 3 muestra el form de cheques)
// aunque la base de datos esté vacía.
const STATIC_METHODS: PaymentMethod[] = [
  { id: 1, name: "Efectivo", type: "cash" },
  { id: 2, name: "Transferencia Bancaria", type: "bank" },
  { id: 3, name: "Cheque / eCheck", type: "check" }, 
  { id: 4, name: "Tarjeta Débito/Crédito", type: "card" },
  { id: 5, name: "Crédito Prendario", type: "credit_bank" },
  { id: 6, name: "Permuta / Usado", type: "trade" },
];

export default function PaymentModal({
  reservation,
  onClose,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState<string>("");
  const [concept, setConcept] = useState("");
  const [methodId, setMethodId] = useState<string>("");
  
  // Inicializamos con los estáticos para que se vea rápido
  const [methods, setMethods] = useState<PaymentMethod[]>(STATIC_METHODS);

  const [checkDetails, setCheckDetails] = useState<CheckDetails>({
    bank: "",
    number: "",
    holder: "",
    payment_date: "",
    delivery_date: new Date().toISOString().split("T")[0],
  });

  const [loading, setLoading] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(false);
  const [showCreateMethod, setShowCreateMethod] = useState(false);

  useEffect(() => {
    if (reservation.balance) {
      setAmount(reservation.balance.toString());
    }
  }, [reservation]);

  // === FUSIÓN: ESTÁTICOS + API ===
  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setLoadingMethods(true);
    try {
      const res = await api.get("/payment-methods");
      const dbMethods: PaymentMethod[] = res.data.data || res.data;
      
      // Filtramos los que vienen de la DB.
      // Si la DB trae un ID que YA TENEMOS en STATIC_METHODS (ej: 1, 2, 3...), lo ignoramos
      // para usar nuestra definición local (que sabemos que tiene el 'type' correcto).
      // Solo agregamos los nuevos (ej: ID 8, 9, 10...).
      const newMethods = dbMethods.filter(
        (dbMethod) => !STATIC_METHODS.some((staticMethod) => staticMethod.id === dbMethod.id)
      );

      // Actualizamos la lista: Estáticos primero + Nuevos de la DB
      setMethods([...STATIC_METHODS, ...newMethods]);

    } catch (err) {
      console.error("Error cargando métodos extra, usando estáticos.", err);
      // Si falla la API, no pasa nada, ya tenemos los STATIC_METHODS cargados por defecto.
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleMethodCreated = (newMethod: any) => {
    setMethods((prev) => [...prev, newMethod]);
    setMethodId(newMethod.id.toString());
    setShowCreateMethod(false);
  };

  // Buscamos el método seleccionado en la lista combinada
  const selectedMethod = methods.find((m) => m.id.toString() === methodId);
  // La lógica de cheque sigue confiando en el 'type'
  const isCheck = selectedMethod?.type === "check";

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) return alert("Ingresa un monto válido");
    if (!methodId) return alert("Selecciona un medio de pago");

    if (isCheck) {
      if (!checkDetails.bank || !checkDetails.payment_date || !checkDetails.holder) {
        return alert("⚠️ Por favor completá los datos del cheque (Banco, Titular y Fecha de Cobro).");
      }
    }

    setLoading(true);

    try {
      const payload = {
        reservation_id: reservation.id,
        amount: numAmount,
        notes: concept || "Pago a cuenta",
        payment_method_id: methodId,
        details: isCheck ? checkDetails : null, 
      };

      await api.post("/reservation-payments", payload);
      onSuccess(); 
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Error al registrar el pago.";
      alert(`❌ ${msg}`);
    } finally {
      setLoading(false);
    }
  };

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
          padding: 8px;
        }
        .check-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 12px;
            padding: 16px;
            background-color: var(--bg-subtle, rgba(0,0,0,0.03));
            border: 1px solid var(--color-border);
            border-radius: 8px;
            margin-top: 8px;
        }
        @media (max-width: 500px) {
            .check-grid {
                grid-template-columns: 1fr;
            }
        }
      `}</style>

      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
        <div
          className="modal-card vstack"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: isCheck ? 600 : 450,
            maxWidth: "95%",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            backgroundColor: "var(--color-card)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
            transition: "width 0.3s ease",
          }}
        >
          {/* HEADER */}
          <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 16, flexShrink: 0 }}>
            <div>
              <h3 style={{ margin: 0, color: "var(--color-text)" }}>Registrar Cobro</h3>
              <p style={{ margin: 0, color: "var(--color-muted)", fontSize: "0.9rem" }}>
                Reserva #{reservation.id}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              style={{ background: "transparent", border: "none", cursor: "pointer", color: "var(--color-text)" }}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* BODY */}
          <div style={{ overflowY: "auto", flex: 1, paddingRight: 4, display: "flex", flexDirection: "column", gap: 16 }}>
            <form id="payment-form" onSubmit={handlePayment} className="vstack" style={{ gap: 16 }}>
              
              <Input
                label="Monto a cobrar ($)"
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.currentTarget.value)}
                placeholder="Ej: 50000"
                required
                autoFocus
              />

              {/* SELECTOR MEDIO DE PAGO */}
              <div className="vstack" style={{ gap: 6 }}>
                <div className="hstack" style={{ justifyContent: "space-between" }}>
                  <label style={{ fontWeight: 500, fontSize: "0.9rem", color: "var(--color-muted)" }}>
                    Medio de Pago *
                  </label>
                  <button
                    type="button"
                    onClick={() => setShowCreateMethod(true)}
                    style={{ background: "none", border: "none", color: "var(--color-primary)", fontSize: "0.85rem", cursor: "pointer", fontWeight: 600, textDecoration: "underline" }}
                  >
                    + Otro
                  </button>
                </div>

                <div style={{ position: "relative" }}>
                  <select
                    value={methodId}
                    onChange={(e) => setMethodId(e.target.value)}
                    required
                    className="adaptive-select"
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: "6px", fontSize: "1rem", appearance: "none", cursor: "pointer",
                      border: "1px solid var(--color-border)",
                      background: "var(--input-bg)",
                      color: "var(--color-text)",
                    }}
                  >
                    <option value="" disabled>{loadingMethods ? "Cargando..." : "Seleccionar método..."}</option>
                    {methods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.id <= 6 ? "" : "(Custom)"}
                      </option>
                    ))}
                  </select>

                  <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-muted)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
              </div>

              {/* === CAMPOS DE CHEQUE === */}
              {isCheck && (
                <div className="vstack" style={{ gap: 4, animation: "fadeIn 0.3s" }}>
                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-primary)' }}>
                        🎫 Datos del Cheque / eCheck
                    </label>
                    <div className="check-grid">
                        <Input 
                            label="Banco" 
                            placeholder="Ej: Galicia"
                            value={checkDetails.bank}
                            onChange={e => setCheckDetails({...checkDetails, bank: e.target.value})}
                            required
                        />
                         <Input 
                            label="N° Cheque" 
                            placeholder="Ej: 45002123"
                            value={checkDetails.number}
                            onChange={e => setCheckDetails({...checkDetails, number: e.target.value})}
                        />
                        <div style={{ gridColumn: "1 / -1" }}>
                            <Input 
                                label="Titular / Firmante" 
                                placeholder="Nombre completo"
                                value={checkDetails.holder}
                                onChange={e => setCheckDetails({...checkDetails, holder: e.target.value})}
                                required
                            />
                        </div>
                         <Input 
                            label="Fecha Entrega" 
                            type="date"
                            value={checkDetails.delivery_date}
                            onChange={e => setCheckDetails({...checkDetails, delivery_date: e.target.value})}
                        />
                        <Input 
                            label="Fecha Cobro" 
                            type="date"
                            value={checkDetails.payment_date}
                            onChange={e => setCheckDetails({...checkDetails, payment_date: e.target.value})}
                            required
                        />
                    </div>
                </div>
              )}

              <Input
                label="Concepto / Notas (Opcional)"
                value={concept}
                onChange={(e) => setConcept(e.currentTarget.value)}
                placeholder="Ej: Cuota 2, Cancelación total..."
              />

              <div style={{ padding: 10, background: "var(--hover-bg)", borderRadius: 6, fontSize: "0.9rem", color: "var(--color-text)" }}>
                Saldo actual: <strong>${reservation.balance?.toLocaleString("es-AR")}</strong>
              </div>
            </form>
          </div>

          {/* FOOTER */}
          <div className="hstack" style={{ justifyContent: "flex-end", gap: 10, marginTop: 16, flexShrink: 0, borderTop: "1px solid var(--color-border)", paddingTop: 16 }}>
            <Button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
              style={{
                background: "transparent",
                border: "1px solid var(--color-border)",
                color: "var(--color-text)", 
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" form="payment-form" loading={loading}>
              {loading ? "Registrando..." : "Registrar Cobro"}
            </Button>
          </div>
        </div>
      </div>

      {showCreateMethod && (
        <div style={{ position: "relative", zIndex: 1001 }}>
          <PaymentMethodModal
            onClose={() => setShowCreateMethod(false)}
            onCreated={handleMethodCreated}
          />
        </div>
      )}
    </>
  );
}