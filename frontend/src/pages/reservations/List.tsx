import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// --- IMPORTS ---
import { PaymentReceipt } from "../../components/pdfs/PaymentReceipt";
import Pagination from "../../components/ui/Pagination";
import usePagedList from "../../hooks/usePagedList";
import api from "../../lib/api";
import useAuth from "../../hooks/useAuth"; 

// IMPORTA EL MODAL
import PaymentModal from "../../components/modals/PaymentModal";

// --- TIPOS ---
type ReservationStatus = "pendiente" | "confirmada" | "anulada" | "vendido";

type Reservation = {
  id: number;
  date: string;
  status: ReservationStatus;
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

const STATUS_CONFIG: Record<string, { colorClass: string; label: string }> = {
  pendiente: { colorClass: "orange", label: "⏳ Pendiente" },
  confirmada: { colorClass: "green", label: "✅ Confirmada" },
  anulada: { colorClass: "gray", label: "🚫 Anulada" },
  vendido: { colorClass: "blue", label: "🤝 Vendido" },
};

/* ========= COMPONENTE LISTA PRINCIPAL ========= */

export default function ReservationsList() {
  const nav = useNavigate();
  const { user } = useAuth();
  const [isProcessing, setIsProcessing] = useState(false);

  // ESTADO PARA EL MODAL DE PAGO
  const [reservationToPay, setReservationToPay] = useState<Reservation | null>(
    null
  );

  const {
    items,
    loading,
    error,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    refetch,
  } = usePagedList<Reservation>("/reservations");

  // ✅ LÓGICA ROBUSTA DE ADMIN (Igual que en el Home)
  // Verifica si tiene roles array O propiedad simple, y normaliza a minúsculas
  const isAdmin = 
    user?.roles?.some((r: any) => ['admin', 'superadmin', 'gerente'].includes(r.name?.toLowerCase())) || 
    user?.role === 'admin' || // Fallback por si tu backend manda string simple
    user?.role === 'ADMIN';

  // --- FUNCIÓN: CONFIRMAR SEÑA ---
  const handleConfirmDeposit = async (reservation: Reservation) => {
    const amount = reservation.deposit || 0;

    if (
      !window.confirm(
        `💰 ¿Confirmas el ingreso de la SEÑA por $${amount.toLocaleString(
          "es-AR"
        )}?`
      )
    )
      return;

    setIsProcessing(true);
    try {
      await api.patch(`/reservations/${reservation.id}`, {
        status: "confirmada",
      });

      const blob = await pdf(
        <PaymentReceipt
          reservation={{ ...reservation, status: "confirmada" }}
          amount={amount}
          concept="Seña / Reserva de Unidad"
        />
      ).toBlob();
      saveAs(blob, `Recibo_Seña_${reservation.id}.pdf`);

      await refetch();
    } catch (err) {
      console.error(err);
      alert("Error al confirmar seña.");
    } finally {
      setIsProcessing(false);
    }
  };

  const renderStatusBadge = (status: Reservation["status"]) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG["pendiente"];
    return <span className={`badge ${config.colorClass}`}>{config.label}</span>;
  };

  return (
    <div className="vstack" style={{ gap: 20 }}>
      {/* HEADER */}
      <div
        className="hstack"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <div className="title" style={{ margin: 0 }}>
          Gestión de Reservas
        </div>
        <Link className="btn" to="/reservas/nueva">
          + Nueva Reserva
        </Link>
      </div>

      {/* BUSCADOR */}
      <div className="card hstack" style={{ padding: "12px 16px" }}>
        <input
          className="input-search"
          placeholder="🔍 Buscar por cliente, patente o vehículo..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{
            border: "none",
            background: "transparent",
            width: "100%",
            fontSize: "1rem",
            outline: "none",
          }}
        />
      </div>

      {/* TABLA */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading || isProcessing ? (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "var(--color-muted)",
            }}
          >
            {isProcessing ? "Procesando..." : "Cargando reservas..."}
          </div>
        ) : error ? (
          <div style={{ padding: 20, color: "var(--color-danger)" }}>
            Error: {error}
          </div>
        ) : items.length === 0 ? (
          <div
            style={{
              padding: 30,
              textAlign: "center",
              color: "var(--color-muted)",
            }}
          >
            No hay reservas.
          </div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table
              className="modern-table"
              style={{ marginTop: 0, border: "none" }}
            >
              <thead>
                <tr style={{ background: "var(--hover-bg)" }}>
                  <th>Fecha / ID</th>
                  <th>Cliente</th>
                  <th>Vehículo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ textAlign: "right" }}>Saldo</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const balance = r.balance ?? 0;
                  const hasBalance = balance > 0;
                  
                  // 3. APLICO EL FILTRO CORRECTO
                  const canConfirmDeposit =
                    r.status === "pendiente" && 
                    (r.deposit || 0) > 0 &&
                    isAdmin; // ✅ Ahora usa la validación robusta

                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>
                          {new Date(r.date).toLocaleDateString()}
                        </div>
                        <div
                          style={{
                            fontSize: "0.8rem",
                            color: "var(--color-muted)",
                          }}
                        >
                          #{r.id}
                        </div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {r.customer
                            ? `${r.customer.first_name} ${r.customer.last_name}`
                            : "—"}
                        </div>
                      </td>
                      <td>
                        {r.vehicle ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>
                              {r.vehicle.brand} {r.vehicle.model}
                            </div>
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--color-muted)",
                                textTransform: "uppercase",
                              }}
                            >
                              {r.vehicle.plate}
                            </div>
                          </div>
                        ) : (
                          "—"
                        )}
                      </td>
                      <td>{renderStatusBadge(r.status)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 500 }}>
                          ${r.price?.toLocaleString("es-AR")}
                        </div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {hasBalance ? (
                          <span
                            style={{
                              color: "var(--color-danger)",
                              fontWeight: 700,
                            }}
                          >
                            ${balance.toLocaleString("es-AR")}
                          </span>
                        ) : (
                          <span className="badge green">Saldado</span>
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td style={{ textAlign: "right" }}>
                        <div
                          className="hstack"
                          style={{ justifyContent: "flex-end", gap: 8 }}
                        >
                          {/* 1. CONFIRMAR SEÑA */}
                          {canConfirmDeposit && (
                            <button
                              className="action-btn"
                              title="Confirmar Seña (Admin)"
                              onClick={() => handleConfirmDeposit(r)}
                              style={{
                                color: "#d97706",
                                background: "#fffbeb",
                                border: "1px solid #fcd34d"
                              }}
                            >
                              <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="currentColor"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                              >
                                <path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                              </svg>
                            </button>
                          )}

                          {/* 2. VER DETALLE */}
                          <button
                            className="action-btn"
                            title="Ver Detalle"
                            onClick={() => nav(`/reservas/${r.id}`)}
                          >
                            <svg
                              width="18"
                              height="18"
                              viewBox="0 0 24 24"
                              fill="none"
                              stroke="currentColor"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            >
                              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                              <circle cx="12" cy="12" r="3" />
                            </svg>
                          </button>

                          {/* 3. REGISTRAR COBRO (MODAL) */}
                          {hasBalance &&
                            r.status !== "anulada" &&
                            r.status !== "pendiente" && (
                              <button
                                className="action-btn"
                                title="Registrar Nuevo Pago"
                                style={{ color: "var(--color-primary)" }}
                                onClick={() => setReservationToPay(r)}
                              >
                                <svg
                                  width="18"
                                  height="18"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <rect
                                    x="1"
                                    y="4"
                                    width="22"
                                    height="16"
                                    rx="2"
                                    ry="2"
                                  />
                                  <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                              </button>
                            )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {/* RENDERIZADO DEL MODAL */}
      {reservationToPay && (
        <PaymentModal
          reservation={reservationToPay}
          onClose={() => setReservationToPay(null)}
          onSuccess={() => {
            setReservationToPay(null);
            refetch(); // Recargar la tabla para ver el saldo actualizado
          }}
        />
      )}
    </div>
  );
}