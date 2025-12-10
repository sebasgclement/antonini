import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { useEffect, useState } from "react";
import api from "../../lib/api";
import { PaymentReceipt } from "../pdfs/PaymentReceipt";
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

export default function PaymentModal({
  reservation,
  onClose,
  onSuccess,
}: Props) {
  const [amount, setAmount] = useState<string>("");
  const [concept, setConcept] = useState("");
  const [methodId, setMethodId] = useState<string>("");
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMethods, setLoadingMethods] = useState(true);

  const [showCreateMethod, setShowCreateMethod] = useState(false);

  useEffect(() => {
    if (reservation.balance) {
      setAmount(reservation.balance.toString());
    }
  }, [reservation]);

  useEffect(() => {
    fetchMethods();
  }, []);

  const fetchMethods = async () => {
    setLoadingMethods(true);
    try {
      const res = await api.get("/payment-methods");
      setMethods(res.data.data || res.data);
    } catch (err) {
      console.error("Error cargando métodos", err);
    } finally {
      setLoadingMethods(false);
    }
  };

  const handleMethodCreated = (newMethod: any) => {
    setMethods((prev) => [...prev, newMethod]);
    setMethodId(newMethod.id.toString());
    setShowCreateMethod(false);
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    const numAmount = parseFloat(amount);

    if (!numAmount || numAmount <= 0) return alert("Ingresa un monto válido");
    if (!methodId) return alert("Selecciona un medio de pago");

    setLoading(true);

    try {
      const selectedMethod = methods.find((m) => m.id.toString() === methodId);
      const methodName = selectedMethod?.name || "Desconocido";

      await api.post("/reservation-payments", {
        reservation_id: reservation.id, 
        amount: numAmount,
        notes: concept || "Pago a cuenta", 
        payment_method_id: methodId,
      });

      const reservationForPdf = { ...reservation, payment_method: methodName };

      const blob = await pdf(
        <PaymentReceipt
          reservation={reservationForPdf}
          amount={numAmount}
          concept={concept || "Pago Parcial / Cuota"}
        />
      ).toBlob();

      saveAs(blob, `Recibo_Pago_${reservation.id}.pdf`);
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
      {/* 🔥 FIX: Variables correctas para el dropdown */}
      <style>{`
        .adaptive-select option {
          background-color: var(--color-card);
          color: var(--color-text);
          padding: 8px;
        }
      `}</style>

      <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
        <div
          className="modal-card vstack"
          onClick={(e) => e.stopPropagation()}
          style={{
            width: 450,
            maxWidth: "95%",
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",

            // 🔥 FIX: Variables CSS correctas
            backgroundColor: "var(--color-card)",
            color: "var(--color-text)",
            border: "1px solid var(--color-border)",
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
                    + Nuevo método
                  </button>
                </div>

                <div style={{ position: "relative" }}>
                  <select
                    value={methodId}
                    onChange={(e) => setMethodId(e.target.value)}
                    required
                    disabled={loadingMethods}
                    className="adaptive-select"
                    style={{
                      width: "100%", padding: "10px 12px", borderRadius: "6px", fontSize: "1rem", appearance: "none", cursor: "pointer",
                      // 🔥 FIX: Variables CSS correctas
                      border: "1px solid var(--color-border)",
                      background: "var(--input-bg)",
                      color: "var(--color-text)",
                    }}
                  >
                    <option value="" disabled>{loadingMethods ? "Cargando..." : "Seleccionar método..."}</option>
                    {methods.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.name} {m.type === "cash" ? "(Efvo)" : ""}
                      </option>
                    ))}
                  </select>

                  <div style={{ position: "absolute", right: 12, top: "50%", transform: "translateY(-50%)", pointerEvents: "none", color: "var(--color-muted)" }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                  </div>
                </div>
              </div>

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
                // 🔥 FIX: Color de texto correcto
                color: "var(--color-text)", 
              }}
            >
              Cancelar
            </Button>
            <Button type="submit" form="payment-form" loading={loading}>
              {loading ? "Procesando..." : "Confirmar e Imprimir"}
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