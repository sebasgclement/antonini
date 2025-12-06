import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import api from "../../lib/api";

// --- TIPOS ---
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
  created_at?: string;
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
  status: "pendiente" | "confirmada" | "anulada" | "vendida";
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

// --- CONFIG DE ESTADOS ---
const STATUS_CONFIG: Record<string, { colorClass: string; label: string }> = {
  pendiente: { colorClass: "orange", label: "⏳ Pendiente" },
  confirmada: { colorClass: "green", label: "✅ Confirmada" },
  anulada: { colorClass: "gray", label: "🚫 Anulada" },
  vendido: { colorClass: "blue", label: "🤝 Vendido" },
};

export default function ReservationView() {
  const { id } = useParams();
  const nav = useNavigate();
  const location = useLocation();
  const [reservation, setReservation] = useState<Reservation | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchReservation = async () => {
      try {
        const { data } = await api.get(`/reservations/${id}`);
        setReservation(data.data || data);
      } catch (err) {
        console.error(err);
        setError("No se pudo cargar la reserva");
      } finally {
        setLoading(false);
      }
    };
    fetchReservation();
  }, [id]);

  if (loading)
    return <div className="p-4 text-center">Cargando detalle...</div>;
  if (error || !reservation)
    return (
      <div className="p-4">
        <div style={{ color: "var(--color-danger)" }}>
          {error || "Reserva no encontrada"}
        </div>
        <Button onClick={() => nav("/reservas")} style={{ marginTop: 20 }}>
          ← Volver
        </Button>
      </div>
    );

  // --- CÁLCULOS ---
  const precioVenta = reservation.price || 0;
  const valorUsado = reservation.usedVehicle?.price || 0;
  const creditoBanco = reservation.credit_bank || 0;
  const totalPagosRegistrados =
    reservation.payments?.reduce((acc, p) => acc + Number(p.amount), 0) ?? 0;
  const totalPagado = reservation.paid_amount ?? totalPagosRegistrados;
  const saldo =
    reservation.balance ??
    precioVenta - totalPagado - valorUsado - creditoBanco;

  const statusInfo =
    STATUS_CONFIG[reservation.status] || STATUS_CONFIG.pendiente;

  return (
    <div className="vstack" style={{ gap: 24, paddingBottom: 50 }}>
      {/* === HEADER === */}
      <div
        className="hstack"
        style={{
          justifyContent: "space-between",
          alignItems: "flex-start",
          flexWrap: "wrap",
          gap: 10,
        }}
      >
        <div>
          <div className="hstack" style={{ gap: 10, alignItems: "center" }}>
            <h2 style={{ margin: 0 }}>Reserva #{reservation.id}</h2>
            <span
              className={`badge ${statusInfo.colorClass}`}
              style={{ fontSize: "0.9rem" }}
            >
              {statusInfo.label}
            </span>
          </div>
          <p style={{ margin: "4px 0 0 0", color: "var(--color-muted)" }}>
            Registrada el{" "}
            {new Date(reservation.date).toLocaleDateString("es-AR")}
          </p>
        </div>

        <div className="hstack" style={{ gap: 10 }}>
          <Button
            onClick={() => nav("/reservas")}
            className="btn-secondary"
            style={{
              background: "transparent",
              border: "1px solid var(--border-color)",
            }}
          >
            Volver
          </Button>
        </div>
      </div>

      {/* === GRID PRINCIPAL === */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))",
          gap: 24,
        }}
      >
        {/* COLUMNA IZQUIERDA: Info Cliente y Vehículos */}
        <div className="vstack" style={{ gap: 24 }}>
          {/* TARJETA CLIENTE */}
          <div className="card vstack" style={{ gap: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: 10,
                margin: 0,
              }}
            >
              👤 Cliente
            </h3>
            {reservation.customer ? (
              <div className="vstack" style={{ gap: 8 }}>
                <div style={{ fontSize: "1.2rem", fontWeight: 600 }}>
                  {reservation.customer.first_name}{" "}
                  {reservation.customer.last_name}
                </div>
                {reservation.customer.email && (
                  <div
                    className="hstack"
                    style={{ gap: 8, color: "var(--color-muted)" }}
                  >
                    <span>✉️</span> {reservation.customer.email}
                  </div>
                )}
                {reservation.customer.phone && (
                  <div
                    className="hstack"
                    style={{ gap: 8, color: "var(--color-muted)" }}
                  >
                    <span>📞</span> {reservation.customer.phone}
                  </div>
                )}
              </div>
            ) : (
              <div style={{ color: "var(--color-muted)" }}>
                Sin cliente asociado
              </div>
            )}
          </div>

          {/* TARJETA VEHÍCULO */}
          <div className="card vstack" style={{ gap: 16 }}>
            <h3
              style={{
                fontSize: "1.1rem",
                borderBottom: "1px solid var(--border-color)",
                paddingBottom: 10,
                margin: 0,
              }}
            >
              🚗 Vehículo Reservado
            </h3>
            {reservation.vehicle ? (
              <div className="vstack" style={{ gap: 5 }}>
                <div style={{ fontSize: "1.1rem", fontWeight: 600 }}>
                  {reservation.vehicle.brand} {reservation.vehicle.model}
                </div>
                <div className="badge gray" style={{ width: "fit-content" }}>
                  {reservation.vehicle.plate}
                </div>
                <Button
                  className="btn-sm"
                  style={{ marginTop: 10, alignSelf: "flex-start" }}
                  // CORREGIDO: Ruta completa
                  onClick={() =>
                    nav(`/vehiculos/${reservation.vehicle?.id}/ver`, {
                      state: { from: location.pathname },
                    })
                  }
                >
                  Ver Ficha
                </Button>
              </div>
            ) : (
              <div style={{ color: "var(--color-muted)" }}>
                Sin vehículo asociado
              </div>
            )}
          </div>

          {/* VEHÍCULO USADO (Si existe) */}
          {reservation.usedVehicle && (
            <div className="card vstack" style={{ gap: 16 }}>
              <h3
                style={{
                  fontSize: "1.1rem",
                  borderBottom: "1px solid var(--border-color)",
                  paddingBottom: 10,
                  margin: 0,
                }}
              >
                🔄 Retoma (Usado)
              </h3>
              <div>
                <div style={{ fontWeight: 600 }}>
                  {reservation.usedVehicle.brand}{" "}
                  {reservation.usedVehicle.model}
                </div>
                <div
                  style={{ fontSize: "0.9rem", color: "var(--color-muted)" }}
                >
                  Patente: {reservation.usedVehicle.plate}
                </div>
                <div
                  style={{
                    marginTop: 8,
                    fontWeight: 600,
                    color: "var(--color-success)",
                  }}
                >
                  Valor Toma: $
                  {reservation.usedVehicle.price.toLocaleString("es-AR")}
                </div>

                <Button
                  className="btn-sm btn-secondary"
                  style={{
                    marginTop: 10,
                    alignSelf: "flex-start",
                    fontSize: "0.8rem",
                  }}
                  // CORREGIDO: Ruta completa
                  onClick={() =>
                    nav(`/vehiculos/${reservation.usedVehicle?.id}/ver`)
                  }
                >
                  Ver Usado
                </Button>
              </div>
            </div>
          )}

          {/* COMENTARIOS */}
          {reservation.comments && (
            <div className="card">
              <h4
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "1rem",
                  color: "var(--color-muted)",
                }}
              >
                Notas / Comentarios
              </h4>
              <p style={{ margin: 0, fontStyle: "italic" }}>
                "{reservation.comments}"
              </p>
            </div>
          )}
        </div>

        {/* COLUMNA DERECHA: Finanzas y Pagos */}
        <div className="vstack" style={{ gap: 24 }}>
          {/* RESUMEN FINANCIERO */}
          <div className="card vstack" style={{ gap: 16 }}>
            <h3 style={{ fontSize: "1.1rem", margin: 0 }}>
              💰 Resumen Económico
            </h3>

            <div
              style={{
                display: "grid",
                gridTemplateColumns: "1fr 1fr",
                gap: 15,
              }}
            >
              <InfoBox label="Precio Venta" value={precioVenta} />
              <InfoBox label="Crédito Banco" value={creditoBanco} />
              <InfoBox label="Toma Usado" value={valorUsado} />
              <InfoBox
                label="Total Pagado"
                value={totalPagado}
                highlightColor="var(--color-success)"
              />
            </div>

            <div
              style={{
                borderTop: "2px dashed var(--border-color)",
                paddingTop: 15,
                marginTop: 5,
              }}
            >
              <div
                className="hstack"
                style={{
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <span style={{ fontSize: "1.1rem", fontWeight: 500 }}>
                  Saldo Pendiente:
                </span>
                <span
                  style={{
                    fontSize: "1.5rem",
                    fontWeight: 700,
                    color:
                      saldo > 0
                        ? "var(--color-danger)"
                        : "var(--color-success)",
                  }}
                >
                  ${saldo.toLocaleString("es-AR")}
                </span>
              </div>
              {saldo <= 0 && (
                <div
                  style={{
                    textAlign: "right",
                    color: "var(--color-success)",
                    fontSize: "0.9rem",
                    marginTop: 4,
                  }}
                >
                  ✅ Vehículo Saldado
                </div>
              )}
            </div>
          </div>

          {/* LISTADO DE PAGOS */}
          <div
            className="card vstack"
            style={{ gap: 0, padding: 0, overflow: "hidden" }}
          >
            <div
              style={{
                padding: "16px 20px",
                borderBottom: "1px solid var(--border-color)",
                background: "var(--hover-bg)",
              }}
            >
              <h3 style={{ fontSize: "1rem", margin: 0 }}>
                🧾 Historial de Pagos
              </h3>
            </div>

            <div className="vstack">
              {reservation.payments && reservation.payments.length > 0 ? (
                reservation.payments.map((pago, index) => (
                  <PaymentItem
                    key={pago.id}
                    payment={pago}
                    isLast={index === (reservation.payments?.length || 0) - 1}
                  />
                ))
              ) : (
                <div
                  style={{
                    padding: 20,
                    textAlign: "center",
                    color: "var(--color-muted)",
                  }}
                >
                  No hay pagos registrados aún.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// --- SUBCOMPONENTES ---

const InfoBox = ({
  label,
  value,
  highlightColor,
}: {
  label: string;
  value: number;
  highlightColor?: string;
}) => (
  <div className="vstack" style={{ gap: 4 }}>
    <span
      style={{
        fontSize: "0.85rem",
        color: "var(--color-muted)",
        textTransform: "uppercase",
        letterSpacing: "0.5px",
      }}
    >
      {label}
    </span>
    <span
      style={{
        fontSize: "1.1rem",
        fontWeight: 600,
        color: highlightColor || "var(--text-color)",
      }}
    >
      ${value.toLocaleString("es-AR")}
    </span>
  </div>
);

const PaymentItem = ({
  payment,
  isLast,
}: {
  payment: ReservationPayment;
  isLast: boolean;
}) => {
  const d = payment.details || {};

  return (
    <div
      style={{
        padding: "16px 20px",
        borderBottom: isLast ? "none" : "1px solid var(--border-color)",
        display: "flex",
        gap: 15,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: "50%",
          background: "var(--hover-bg)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: "1.2rem",
          flexShrink: 0,
        }}
      >
        {getPaymentIcon(payment.method?.type)}
      </div>

      <div className="vstack" style={{ flex: 1, gap: 4 }}>
        <div className="hstack" style={{ justifyContent: "space-between" }}>
          <span style={{ fontWeight: 600 }}>
            {payment.method?.name || "Pago registrado"}
          </span>
          <span style={{ fontWeight: 700, color: "var(--color-primary)" }}>
            ${payment.amount.toLocaleString("es-AR")}
          </span>
        </div>

        <div
          style={{
            fontSize: "0.85rem",
            color: "var(--color-muted)",
            lineHeight: 1.4,
          }}
        >
          {d.bank_name && <span>🏦 {d.bank_name} • </span>}
          {d.check_number && <span>🎫 Cheque #{d.check_number} • </span>}
          {d.card_last4 && <span>💳 Termina en ****{d.card_last4} • </span>}
          {d.operation_number && <span>Ref: {d.operation_number}</span>}

          {!d.bank_name &&
            !d.check_number &&
            !d.card_last4 &&
            !d.operation_number && <span>Pago regular</span>}
        </div>
      </div>
    </div>
  );
};

function getPaymentIcon(type?: string) {
  switch (type) {
    case "cash":
      return "💵";
    case "bank":
      return "🏦";
    case "check":
      return "🎫";
    case "card":
      return "💳";
    default:
      return "💰";
  }
}
