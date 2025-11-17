import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import api from "../../lib/api";

type PaymentDetails = {
  bank_name?: string;
  check_number?: string;
  check_due_date?: string;
  account_alias?: string;
  account_holder?: string;
  card_last4?: string;
  card_holder?: string;
  installments?: number;
  operation_number?: string;
  raw?: string;
};

type ReservationPayment = {
  id: number;
  amount: number;
  details?: PaymentDetails | null;
  method?: {
    id: number;
    name: string;
    type: string;
  } | null;
};

type Reservation = {
  id: number;
  date: string;
  status: "pendiente" | "confirmada" | "anulada" | "vendida" | "vendido";
  price: number;
  deposit?: number;
  credit_bank?: number;
  balance?: number;
  paid_amount?: number;
  remaining_amount?: number;
  payment_method?: string;
  comments?: string;
  vehicle?: { id: number; plate: string; brand: string; model: string };
  customer?: {
    id: number;
    first_name: string;
    last_name: string;
    email?: string;
    phone?: string;
  };
  seller?: { id: number; name: string };
  usedVehicle?: {
    id: number;
    brand: string;
    model: string;
    plate: string;
    price: number;
  };
  payments?: ReservationPayment[];
};

export default function ReservationView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/reservations/${id}`);
        // el backend viene como { data: {...} } o directo
        setReservation(data.data || data);
      } catch {
        setToast("No se pudo cargar la reserva");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(""), 3000);
    return () => clearTimeout(t);
  }, [toast]);

  if (loading) return <div className="container">Cargando…</div>;

  if (!reservation)
    return (
      <div className="container">
        <p>No se encontró la reserva.</p>
        <Button onClick={() => nav("/reservas")}>← Volver</Button>
      </div>
    );

  const valorUsado = reservation.usedVehicle?.price || 0;
  const precioVenta = reservation.price || 0;

  // Total pagado: priorizo lo que venga del backend, si no lo calculo de los pagos, si no de la seña
  const totalPagosDesdeLista =
    reservation.payments?.reduce(
      (acc, p) => acc + (Number(p.amount) || 0),
      0
    ) ?? 0;

  const totalPagado =
    reservation.paid_amount ??
    totalPagosDesdeLista ??
    (reservation.deposit || 0);

  const creditoBanco = reservation.credit_bank || 0;

  // Saldo: primero lo que mande el backend, si no, lo calculo
  const saldo =
    reservation.remaining_amount ??
    reservation.balance ??
    precioVenta - totalPagado - valorUsado - creditoBanco;

  const fmtMoney = (n: number | undefined | null) =>
    typeof n === "number"
      ? n.toLocaleString("es-AR", { minimumFractionDigits: 2 })
      : "—";

  const statusLabel =
    reservation.status === "vendido" || reservation.status === "vendida"
      ? "Vendido"
      : reservation.status.charAt(0).toUpperCase() +
        reservation.status.slice(1);

  return (
    <div className="container vstack" style={{ gap: 20 }}>
      {/* === Detalle general === */}
      <div className="detail-card">
        <div className="detail-section-title">
          🧾 Detalle de la reserva #{reservation.id}
        </div>
        <p>
          <strong>Fecha:</strong>{" "}
          {new Date(reservation.date).toLocaleDateString("es-AR")}
        </p>
        <p>
          <strong>Estado:</strong>{" "}
          <span style={{ textTransform: "capitalize" }}>{statusLabel}</span>
        </p>
      </div>

      {/* === Vehículo === */}
      <div className="detail-card">
        <div className="detail-section-title">🚗 Vehículo reservado</div>
        {reservation.vehicle ? (
          <>
            <p>
              {reservation.vehicle.brand} {reservation.vehicle.model} (
              {reservation.vehicle.plate})
            </p>
            <div className="detail-actions">
              <Button
                onClick={() => nav(`/vehiculos/${reservation.vehicle?.id}/ver`)}
              >
                Ver vehículo
              </Button>
            </div>
          </>
        ) : (
          <p style={{ color: "var(--color-muted)" }}>No asociado.</p>
        )}
      </div>

      {/* === Vehículo tomado en parte de pago === */}
      {reservation.usedVehicle && (
        <div className="detail-card">
          <div className="detail-section-title">
            🔁 Vehículo en parte de pago
          </div>
          <p>
            {reservation.usedVehicle.brand} {reservation.usedVehicle.model} (
            {reservation.usedVehicle.plate})
          </p>
          <p>
            <strong>Valor tomado:</strong> $
            {fmtMoney(reservation.usedVehicle.price)}
          </p>
          <div className="detail-actions">
            <Button
              onClick={() =>
                nav(`/vehiculos/${reservation.usedVehicle?.id}/ver`)
              }
            >
              Ver vehículo usado
            </Button>
          </div>
        </div>
      )}

      {/* === Cliente === */}
      <div className="detail-card">
        <div className="detail-section-title">👤 Cliente</div>
        {reservation.customer ? (
          <>
            <p>
              <strong>
                {reservation.customer.first_name}{" "}
                {reservation.customer.last_name}
              </strong>
            </p>
            {reservation.customer.email && (
              <p>Email: {reservation.customer.email}</p>
            )}
            {reservation.customer.phone && (
              <p>Tel: {reservation.customer.phone}</p>
            )}
          </>
        ) : (
          <p style={{ color: "var(--color-muted)" }}>No asociado.</p>
        )}
      </div>

      {/* === Datos económicos === */}
      <div className="detail-card">
        <div className="detail-section-title">💰 Datos económicos</div>
        <p>
          <strong>Precio venta:</strong> ${fmtMoney(precioVenta)}
        </p>
        <p>
          <strong>Total pagado:</strong> ${fmtMoney(totalPagado)}
        </p>
        <p>
          <strong>Crédito bancario:</strong> ${fmtMoney(creditoBanco)}
        </p>
        <p>
          <strong>Valor usado:</strong> ${fmtMoney(valorUsado)}
        </p>
        <hr />
        <p>
          <strong>Saldo final:</strong>{" "}
          <span
            style={{
              color:
                saldo > 0 ? "var(--color-warning)" : "var(--color-success)",
              fontSize: "1.1em",
            }}
          >
            ${fmtMoney(saldo)}
          </span>
        </p>
        <p>
          <strong>Forma de pago (resumen):</strong>{" "}
          {reservation.payment_method || "—"}
        </p>
      </div>

      {/* === Pagos registrados === */}
      <div className="detail-card">
        <div className="detail-section-title">💳 Pagos registrados</div>

        {reservation.payments && reservation.payments.length > 0 ? (
          <div className="vstack" style={{ gap: 12 }}>
            {reservation.payments.map((pago) => {
              const d = pago.details || {};
              return (
                <div
                  key={pago.id}
                  className="card"
                  style={{ padding: 12, gap: 4 }}
                >
                  <p>
                    <strong>{pago.method?.name || "Medio de pago"}:</strong> $
                    {fmtMoney(pago.amount)}
                  </p>

                  {/* Detalles específicos según lo que haya */}
                  <div
                    style={{
                      fontSize: "0.85rem",
                      color: "var(--color-muted)",
                    }}
                  >
                    {d.bank_name && <p>Banco: {d.bank_name}</p>}
                    {d.account_alias && <p>Alias/CBU: {d.account_alias}</p>}
                    {d.account_holder && <p>Titular: {d.account_holder}</p>}
                    {d.check_number && <p>Nº de cheque: {d.check_number}</p>}
                    {d.check_due_date && <p>Vencimiento: {d.check_due_date}</p>}
                    {d.card_holder && <p>Titular tarjeta: {d.card_holder}</p>}
                    {d.card_last4 && <p>Últimos 4 dígitos: {d.card_last4}</p>}
                    {typeof d.installments === "number" &&
                      d.installments > 0 && <p>Cuotas: {d.installments}</p>}
                    {d.operation_number && (
                      <p>Nº de operación: {d.operation_number}</p>
                    )}
                    {d.raw && <p>{d.raw}</p>}
                    {/* Si no hay ningún detalle, no mostramos nada extra */}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p style={{ color: "var(--color-muted)" }}>
            No hay pagos registrados para esta reserva.
          </p>
        )}
      </div>

      {/* === Comentarios === */}
      {reservation.comments && (
        <div className="detail-card">
          <div className="detail-section-title">🗒️ Comentarios</div>
          <p>{reservation.comments}</p>
        </div>
      )}

      {/* === Botones === */}
      <div className="detail-actions">
        <Button onClick={() => nav("/reservas")}>← Volver</Button>
      </div>

      {toast && (
        <Toast
          message={toast}
          type={toast.includes("✅") ? "success" : "error"}
        />
      )}
    </div>
  );
}
