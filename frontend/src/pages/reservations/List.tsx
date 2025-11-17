import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import usePagedList from "../../hooks/usePagedList";
import api from "../../lib/api";

type Reservation = {
  id: number;
  date: string;
  status: "pendiente" | "confirmada" | "anulada" | "vendido";
  price: number;
  deposit?: number;
  credit_bank?: number;
  balance?: number;
  payment_method?: string;
  comments?: string;
  vehicle?: { id: number; plate: string; brand: string; model: string };
  customer?: { id: number; first_name: string; last_name: string };
  seller?: { id: number; name: string };
};

type PaymentMethod = {
  id: number;
  name: string;
  type: "cash" | "bank" | "check" | "card" | "credit_bank";
  requires_details?: boolean;
};

type PaymentDetails = {
  bank_name?: string;
  account_alias?: string;
  account_holder?: string;
  operation_number?: string;
  check_number?: string;
  check_due_date?: string;
  card_holder?: string;
  card_last4?: string;
  installments?: number | "";
};

/* ========= MODAL PARA AGREGAR PAGO ========= */

type AddPaymentModalProps = {
  reservation: Reservation;
  onClose: () => void;
  onSaved: (message?: string) => void;
};

function AddPaymentModal({
  reservation,
  onClose,
  onSaved,
}: AddPaymentModalProps) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [methodId, setMethodId] = useState<number | "">("");
  const [amount, setAmount] = useState<number | "">("");
  const [details, setDetails] = useState<PaymentDetails>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Cargar métodos de pago
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/payment-methods");
        setMethods(res.data?.data || res.data || []);
      } catch {
        setError("No se pudieron cargar los medios de pago");
      }
    })();
  }, []);

  const selectedMethod = methods.find((m) => m.id === methodId);

  const setDetail = (
    key: keyof PaymentDetails,
    value: string | number | ""
  ) => {
    setDetails((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (!methodId) {
      setError("Seleccioná un medio de pago");
      return;
    }
    if (!amount || Number(amount) <= 0) {
      setError("Ingresá un monto válido");
      return;
    }

    // Limpio details (si todo está vacío, va null)
    const cleaned: PaymentDetails = { ...details };
    if (cleaned.installments === "") {
      delete cleaned.installments;
    }
    const hasDetails = Object.values(cleaned).some(
      (v) => v !== undefined && v !== ""
    );
    const payloadDetails = hasDetails ? cleaned : null;

    setLoading(true);
    try {
      await api.post("/reservation-payments", {
        reservation_id: reservation.id,
        payment_method_id: Number(methodId),
        amount: Number(amount),
        details: payloadDetails,
      });

      onSaved("Pago registrado correctamente ✅");
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          "No se pudo registrar el pago. Verificá la API /reservation-payments."
      );
    } finally {
      setLoading(false);
    }
  };

  // Cerrar con ESC
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  const renderDetailFields = () => {
    if (!selectedMethod) return null;

    switch (selectedMethod.type) {
      case "cash":
        return (
          <p style={{ fontSize: "0.85rem", color: "var(--color-muted)" }}>
            Este método no requiere datos adicionales.
          </p>
        );

      case "bank":
        return (
          <>
            <label>Banco / entidad</label>
            <input
              type="text"
              value={details.bank_name ?? ""}
              onChange={(e) => setDetail("bank_name", e.currentTarget.value)}
              placeholder="Ej: Banco Nación"
            />

            <label>Alias / CBU / Cuenta</label>
            <input
              type="text"
              value={details.account_alias ?? ""}
              onChange={(e) =>
                setDetail("account_alias", e.currentTarget.value)
              }
              placeholder="Alias o CBU"
            />

            <label>Titular</label>
            <input
              type="text"
              value={details.account_holder ?? ""}
              onChange={(e) =>
                setDetail("account_holder", e.currentTarget.value)
              }
              placeholder="Nombre del titular"
            />

            <label>Nº de operación</label>
            <input
              type="text"
              value={details.operation_number ?? ""}
              onChange={(e) =>
                setDetail("operation_number", e.currentTarget.value)
              }
              placeholder="Comprobante / referencia"
            />
          </>
        );

      case "check":
        return (
          <>
            <label>Banco</label>
            <input
              type="text"
              value={details.bank_name ?? ""}
              onChange={(e) => setDetail("bank_name", e.currentTarget.value)}
              placeholder="Ej: Banco Santa Fe"
            />

            <label>Nº de cheque</label>
            <input
              type="text"
              value={details.check_number ?? ""}
              onChange={(e) => setDetail("check_number", e.currentTarget.value)}
              placeholder="Número de cheque"
            />

            <label>Fecha de vencimiento</label>
            <input
              type="date"
              value={details.check_due_date ?? ""}
              onChange={(e) =>
                setDetail("check_due_date", e.currentTarget.value)
              }
            />

            <label>Titular</label>
            <input
              type="text"
              value={details.account_holder ?? ""}
              onChange={(e) =>
                setDetail("account_holder", e.currentTarget.value)
              }
              placeholder="Nombre del titular"
            />
          </>
        );

      case "card":
        return (
          <>
            <label>Titular de la tarjeta</label>
            <input
              type="text"
              value={details.card_holder ?? ""}
              onChange={(e) => setDetail("card_holder", e.currentTarget.value)}
              placeholder="Nombre como figura en la tarjeta"
            />

            <label>Últimos 4 dígitos</label>
            <input
              type="text"
              maxLength={4}
              value={details.card_last4 ?? ""}
              onChange={(e) => setDetail("card_last4", e.currentTarget.value)}
              placeholder="1234"
            />

            <label>Cantidad de cuotas</label>
            <input
              type="number"
              min={1}
              value={details.installments ?? ""}
              onChange={(e) =>
                setDetail(
                  "installments",
                  e.currentTarget.value === ""
                    ? ""
                    : Number(e.currentTarget.value)
                )
              }
              placeholder="1, 3, 6…"
            />

            <label>Nº de operación</label>
            <input
              type="text"
              value={details.operation_number ?? ""}
              onChange={(e) =>
                setDetail("operation_number", e.currentTarget.value)
              }
              placeholder="Comprobante / ticket"
            />
          </>
        );

      case "credit_bank":
        return (
          <>
            <label>Banco / entidad</label>
            <input
              type="text"
              value={details.bank_name ?? ""}
              onChange={(e) => setDetail("bank_name", e.currentTarget.value)}
              placeholder="Banco que otorga el crédito"
            />

            <label>Nº de operación / legajo</label>
            <input
              type="text"
              value={details.operation_number ?? ""}
              onChange={(e) =>
                setDetail("operation_number", e.currentTarget.value)
              }
              placeholder="Nº de crédito / referencia"
            />
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card vstack" onClick={(e) => e.stopPropagation()}>
        <h3>Registrar pago</h3>
        <p style={{ fontSize: "0.9rem", color: "var(--color-muted)" }}>
          Reserva #{reservation.id} —{" "}
          {reservation.vehicle
            ? `${reservation.vehicle.brand} ${reservation.vehicle.model} (${reservation.vehicle.plate})`
            : "Vehículo"}
        </p>

        <form onSubmit={handleSubmit} className="vstack" style={{ gap: 12 }}>
          <label>Medio de pago *</label>
          <select
            value={methodId}
            onChange={(e) => {
              const value =
                e.currentTarget.value === ""
                  ? ""
                  : Number(e.currentTarget.value);
              setMethodId(value);
            }}
          >
            <option value="">Seleccionar…</option>
            {methods.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>

          <label>Monto *</label>
          <input
            type="number"
            min={1}
            value={amount}
            onChange={(e) =>
              setAmount(
                e.currentTarget.value === ""
                  ? ""
                  : Number(e.currentTarget.value)
              )
            }
          />

          {/* Campos dinámicos según tipo */}
          {selectedMethod && (
            <div className="vstack" style={{ gap: 8 }}>
              <strong style={{ fontSize: "0.9rem" }}>
                Detalle del pago ({selectedMethod.type})
              </strong>
              {renderDetailFields()}
            </div>
          )}

          {error && <p className="text-danger">{error}</p>}

          <div
            className="hstack"
            style={{ justifyContent: "flex-end", gap: 8 }}
          >
            <Button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Guardar pago
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ========= LISTA PRINCIPAL DE RESERVAS ========= */

export default function ReservationsList() {
  const nav = useNavigate();
  const { items, loading, error, page, setPage, totalPages, refetch } =
    usePagedList<Reservation>("/reservations");

  const [toast, setToast] = useState("");
  const [paymentModalReservation, setPaymentModalReservation] =
    useState<Reservation | null>(null);

  const rows = useMemo(() => items, [items]);

  useEffect(() => {
    refetch();
  }, [page, refetch]);

  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState === "visible") refetch();
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [refetch]);

  // Auto-ocultar toast después de unos segundos
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3500);
    return () => clearTimeout(t);
  }, [toast]);

  const renderStatusBadge = (status: Reservation["status"]) => {
    let label = "";
    let bg = "#1f2933";

    switch (status) {
      case "pendiente":
        label = "Pendiente";
        bg = "#eab308"; // amarillo
        break;
      case "confirmada":
        label = "Confirmada";
        bg = "#22c55e"; // verde
        break;
      case "anulada":
        label = "Anulada";
        bg = "#6b7280"; // gris
        break;
      case "vendido":
        label = "Vendido";
        bg = "#ef4444"; // rojo
        break;
      default:
        label = status;
        break;
    }

    return (
      <span
        style={{
          display: "inline-block",
          padding: "2px 8px",
          borderRadius: 999,
          fontSize: "0.75rem",
          fontWeight: 600,
          color: "#fff",
          background: bg,
          textTransform: "capitalize",
        }}
      >
        {label}
      </span>
    );
  };

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div
        className="hstack"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <div className="title">Reservas</div>
        <Link className="enlace" to="/reservas/nueva">
          + Nueva reserva
        </Link>
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: 16 }}>Cargando…</div>
        ) : error ? (
          <div style={{ padding: 16, color: "var(--color-danger)" }}>
            Error: {error}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 16, color: "var(--color-muted)" }}>
            No hay reservas.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--color-muted)" }}>
                <th style={{ padding: 8 }}>#</th>
                <th style={{ padding: 8 }}>Fecha</th>
                <th style={{ padding: 8 }}>Vehículo</th>
                <th style={{ padding: 8 }}>Cliente</th>
                <th style={{ padding: 8 }}>Vendedor</th>
                <th style={{ padding: 8 }}>Precio de venta</th>
                <th style={{ padding: 8 }}>Seña</th>
                <th style={{ padding: 8 }}>Saldo</th>
                <th style={{ padding: 8 }}>Estado</th>
                <th style={{ padding: 8, textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #1f2430" }}>
                  <td style={{ padding: 8 }}>{r.id}</td>
                  <td style={{ padding: 8 }}>
                    {new Date(r.date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: 8 }}>
                    {r.vehicle
                      ? `${r.vehicle.brand} ${r.vehicle.model} (${r.vehicle.plate})`
                      : "—"}
                  </td>
                  <td style={{ padding: 8 }}>
                    {r.customer
                      ? `${r.customer.first_name} ${r.customer.last_name}`
                      : "—"}
                  </td>
                  <td style={{ padding: 8 }}>{r.seller?.name || "—"}</td>
                  <td style={{ padding: 8 }}>
                    {r.price?.toLocaleString("es-AR") || "—"}
                  </td>
                  <td style={{ padding: 8 }}>
                    {r.deposit?.toLocaleString("es-AR") || "—"}
                  </td>
                  <td style={{ padding: 8 }}>
                    {r.credit_bank
                      ? r.credit_bank.toLocaleString("es-AR")
                      : "—"}
                  </td>
                  <td
                    style={{
                      padding: 8,
                      fontWeight: 600,
                      color:
                        (r.balance ?? 0) > 0
                          ? "#eab308" // saldo pendiente
                          : "#22c55e", // saldado
                    }}
                  >
                    {r.balance?.toLocaleString("es-AR") || 0}
                  </td>
                  <td style={{ padding: 8 }}>{renderStatusBadge(r.status)}</td>
                  <td style={{ padding: 8, textAlign: "right" }}>
                    <div
                      className="hstack"
                      style={{ justifyContent: "flex-end", gap: 6 }}
                    >
                      {/* 👁 Ver detalle, ahora visible en modo claro */}
                      <Button
                        type="button"
                        title="Ver detalle"
                        onClick={() => nav(`/reservas/${r.id}`)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 4,
                          minWidth: 0,
                          color: "var(--color-text)",
                        }}
                      >
                        👁
                      </Button>

                      {/* 💳 Registrar pago */}
                      <Button
                        type="button"
                        title="Registrar pago"
                        className="btn-secondary"
                        onClick={() => setPaymentModalReservation(r)}
                        style={{
                          background: "transparent",
                          border: "none",
                          padding: 4,
                          minWidth: 0,
                          color: "var(--color-primary)",
                        }}
                      >
                        💳
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {paymentModalReservation && (
        <AddPaymentModal
          reservation={paymentModalReservation}
          onClose={() => setPaymentModalReservation(null)}
          onSaved={(msg) => {
            if (msg) setToast(msg);
            setPaymentModalReservation(null);
            refetch(); // recarga lista con saldo/estado actualizados
          }}
        />
      )}

      {toast && (
        <Toast
          message={toast}
          type={toast.includes("✅") ? "success" : "error"}
        />
      )}
    </div>
  );
}
