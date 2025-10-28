import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import api from "../../lib/api";

type Reservation = {
  id: number;
  date: string;
  status: "pendiente" | "confirmada" | "anulada";
  price: number; // precio venta
  deposit?: number; // seña
  payment_method?: string;
  comments?: string;
  vehicle?: { id: number; plate: string; brand: string; model: string };
  customer?: { id: number; first_name: string; last_name: string };
  seller?: { id: number; name: string };
  used_vehicle?: {
    id: number;
    brand: string;
    model: string;
    plate: string;
    valuation: number; // valor del usado tomado como parte de pago
  };
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
        setReservation(data.data || data);
      } catch {
        setToast("No se pudo cargar la reserva");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  if (loading) return <div className="container">Cargando…</div>;

  if (!reservation)
    return (
      <div className="container">
        <p>No se encontró la reserva.</p>
        <Button onClick={() => nav("/reservas")}>← Volver</Button>
      </div>
    );

  // --- Cálculo del saldo final ---
  const valorUsado = reservation.used_vehicle?.valuation || 0;
  const senia = reservation.deposit || 0;
  const precioVenta = reservation.price || 0;
  const saldo = precioVenta - senia - valorUsado;

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
          <span style={{ textTransform: "capitalize" }}>
            {reservation.status}
          </span>
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
      {reservation.used_vehicle && (
        <div className="detail-card">
          <div className="detail-section-title">
            🔁 Vehículo en parte de pago
          </div>
          <p>
            {reservation.used_vehicle.brand} {reservation.used_vehicle.model} (
            {reservation.used_vehicle.plate})
          </p>
          <p>
            <strong>Valor tomado:</strong> $
            {reservation.used_vehicle.valuation.toLocaleString("es-AR", {
              minimumFractionDigits: 2,
            })}
          </p>
          <div className="detail-actions">
            <Button
              onClick={() =>
                nav(`/vehiculos/${reservation.used_vehicle?.id}/ver`)
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
          <p>
            {reservation.customer.first_name} {reservation.customer.last_name}
          </p>
        ) : (
          <p style={{ color: "var(--color-muted)" }}>No asociado.</p>
        )}
      </div>

      {/* === Datos económicos === */}
      <div className="detail-card">
        <div className="detail-section-title">💰 Datos económicos</div>
        <p>
          <strong>Precio venta:</strong> $
          {precioVenta.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
        </p>
        <p>
          <strong>Seña:</strong>{" "}
          {senia
            ? `$${senia.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}`
            : "—"}
        </p>
        <p>
          <strong>Valor usado:</strong>{" "}
          {valorUsado
            ? `$${valorUsado.toLocaleString("es-AR", {
                minimumFractionDigits: 2,
              })}`
            : "—"}
        </p>
        <hr />
        <p>
          <strong>Saldo final:</strong>{" "}
          <span
            style={{
              color:
                saldo > 0 ? "var(--color-success)" : "var(--color-warning)",
              fontSize: "1.1em",
            }}
          >
            ${saldo.toLocaleString("es-AR", { minimumFractionDigits: 2 })}
          </span>
        </p>
        <p>
          <strong>Forma de pago:</strong> {reservation.payment_method || "—"}
        </p>
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
