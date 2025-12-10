import { pdf } from "@react-pdf/renderer";
import { saveAs } from "file-saver";
import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

// --- IMPORTS ---
import { PaymentReceipt } from "../../components/pdfs/PaymentReceipt";
import Pagination from "../../components/ui/Pagination";
import usePagedList from "../../hooks/usePagedList";
import api from "../../lib/api";
import useAuth from "../../hooks/useAuth"; 

// 🔔 IMPORTAMOS EL TOAST Y CONTEXTO
import { useToast } from "../../hooks/useToast";
import { useNotifications } from "../../context/NotificationContext";

// IMPORTA EL MODAL DE PAGO
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
  const { showToast } = useToast(); 
  const [isProcessing, setIsProcessing] = useState(false);
  
  // 👇 GATILLO PARA ACTUALIZACIÓN AUTOMÁTICA
  const { refreshTrigger, fetchInitialCounts } = useNotifications();

  // ESTADO PARA EL MODAL DE PAGO
  const [reservationToPay, setReservationToPay] = useState<Reservation | null>(null);

  // ESTADO PARA EL MODAL DE CONFIRMACIÓN
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: 'deposit' | 'cancel' | null;
    reservation: Reservation | null;
  }>({ isOpen: false, type: null, reservation: null });

  const {
    items, loading, error, page, setPage, totalPages, search, setSearch, refetch,
  } = usePagedList<Reservation>("/reservations");

  // ✅ EFECTO: Si llega notificación, recarga la tabla
  useEffect(() => {
    if (refreshTrigger > 0) {
        console.log("🔄 Actualizando tabla por notificación...");
        refetch();
    }
  }, [refreshTrigger, refetch]);

  // ✅ LÓGICA DE ADMIN
  const isAdmin = 
    user?.roles?.some((r: any) => ['admin', 'superadmin', 'gerente'].includes(r.name?.toLowerCase())) || 
    user?.role === 'admin' || 
    user?.role === 'ADMIN';

  // --- 1. CONFIRMAR SEÑA ---
  const requestConfirmDeposit = (reservation: Reservation) => {
    setConfirmModal({ isOpen: true, type: 'deposit', reservation });
  };

  const processConfirmDeposit = async () => {
    const reservation = confirmModal.reservation;
    if (!reservation) return;

    setIsProcessing(true);
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      await api.patch(`/reservations/${reservation.id}`, { status: "confirmada" });

      const amount = reservation.deposit || 0;
      const blob = await pdf(
        <PaymentReceipt
          reservation={{ ...reservation, status: "confirmada" }}
          amount={amount}
          concept="Seña / Reserva de Unidad"
        />
      ).toBlob();
      saveAs(blob, `Recibo_Seña_${reservation.id}.pdf`);

      showToast("¡Seña confirmada y recibo generado!", "success");
      
      await refetch();
      fetchInitialCounts(); // Actualizar badge
    } catch (err) {
      console.error(err);
      showToast("Error al confirmar la seña", "error");
    } finally {
      setIsProcessing(false);
      setConfirmModal({ isOpen: false, type: null, reservation: null });
    }
  };

  // --- 2. CANCELAR RESERVA ---
  const requestCancelReservation = (reservation: Reservation) => {
    setConfirmModal({ isOpen: true, type: 'cancel', reservation });
  };

  const processCancelReservation = async () => {
    const reservation = confirmModal.reservation;
    if (!reservation) return;

    setIsProcessing(true);
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      await api.delete(`/reservations/${reservation.id}`);
      showToast("Reserva eliminada y vehículo liberado 🗑️", "success");
      
      await refetch();
      fetchInitialCounts(); // Actualizar badge (baja el número)
    } catch (err) {
      console.error(err);
      showToast("Error al cancelar la reserva", "error");
    } finally {
      setIsProcessing(false);
      setConfirmModal({ isOpen: false, type: null, reservation: null });
    }
  };

  const renderStatusBadge = (status: Reservation["status"]) => {
    const config = STATUS_CONFIG[status] || STATUS_CONFIG["pendiente"];
    return <span className={`badge ${config.colorClass}`}>{config.label}</span>;
  };

  return (
    <div className="vstack" style={{ gap: 20 }}>
      {/* HEADER */}
      <div className="hstack" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="title" style={{ margin: 0 }}>Gestión de Reservas</div>
        <Link className="btn" to="/reservas/nueva">+ Nueva Reserva</Link>
      </div>

      {/* BUSCADOR */}
      <div className="card hstack" style={{ padding: "12px 16px" }}>
        <input
          className="input-search"
          placeholder="🔍 Buscar por cliente, patente o vehículo..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ border: "none", background: "transparent", width: "100%", fontSize: "1rem", outline: "none" }}
        />
      </div>

      {/* TABLA */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading || isProcessing ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--color-muted)" }}>
            {isProcessing ? "Procesando..." : "Cargando reservas..."}
          </div>
        ) : error ? (
          <div style={{ padding: 20, color: "var(--color-danger)" }}>Error: {error}</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--color-muted)" }}>No hay reservas.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="modern-table" style={{ marginTop: 0, border: "none" }}>
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
                  
                  // Lógica para confirmar seña (Solo Admin y pendiente)
                  const canConfirmDeposit = r.status === "pendiente" && (r.deposit || 0) > 0 && isAdmin;

                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{new Date(r.date).toLocaleDateString()}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>#{r.id}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>{r.customer ? `${r.customer.first_name} ${r.customer.last_name}` : "—"}</div>
                      </td>
                      <td>
                        {r.vehicle ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{r.vehicle.brand} {r.vehicle.model}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--color-muted)", textTransform: "uppercase" }}>{r.vehicle.plate}</div>
                          </div>
                        ) : "—"}
                      </td>
                      <td>{renderStatusBadge(r.status)}</td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ fontWeight: 500 }}>${r.price?.toLocaleString("es-AR")}</div>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        {hasBalance ? (
                          <span style={{ color: "var(--color-danger)", fontWeight: 700 }}>${balance.toLocaleString("es-AR")}</span>
                        ) : (
                          <span className="badge green">Saldado</span>
                        )}
                      </td>

                      {/* ACCIONES */}
                      <td style={{ textAlign: "right" }}>
                        <div className="hstack" style={{ justifyContent: "flex-end", gap: 8 }}>
                          
                          {/* 1. CONFIRMAR SEÑA (Solo Admin) */}
                          {canConfirmDeposit && (
                            <button
                              className="action-btn"
                              title="Confirmar Seña (Admin)"
                              onClick={() => requestConfirmDeposit(r)}
                              style={{ color: "#d97706", background: "#fffbeb", border: "1px solid #fcd34d" }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            </button>
                          )}

                          {/* 2. VER DETALLE */}
                          <button className="action-btn" title="Ver Detalle" onClick={() => nav(`/reservas/${r.id}`)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          </button>

                          {/* 3. REGISTRAR COBRO (MODAL) */}
                          {/* 🔥 CORREGIDO: Aparece si hay deuda y NO está anulada (independiente de si es pendiente o confirmada) */}
                          {hasBalance && r.status !== "anulada" && isAdmin && (
                              <button
                                className="action-btn"
                                title="Registrar Nuevo Pago"
                                style={{ color: "var(--color-primary)" }}
                                onClick={() => setReservationToPay(r)}
                              >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                  <rect x="1" y="4" width="22" height="16" rx="2" ry="2" />
                                  <line x1="1" y1="10" x2="23" y2="10" />
                                </svg>
                              </button>
                            )}

                          {/* 4. BOTÓN ELIMINAR/CANCELAR (Solo Admin) */}
                          {/* 🔥 CORREGIDO: Siempre visible para Admin */}
                          {isAdmin && (
                            <button
                              className="action-btn danger"
                              title="Cancelar Reserva y Liberar Unidad"
                              onClick={() => requestCancelReservation(r)}
                              style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <polyline points="3 6 5 6 21 6"></polyline>
                                <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
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

      {/* RENDERIZADO DEL MODAL DE PAGO */}
      {reservationToPay && (
        <PaymentModal
          reservation={reservationToPay}
          onClose={() => setReservationToPay(null)}
          onSuccess={() => {
            setReservationToPay(null);
            refetch(); // Recargar la tabla
            showToast("Pago registrado correctamente", "success");
          }}
        />
      )}

      {/* MODAL DE CONFIRMACIÓN */}
      {confirmModal.isOpen && confirmModal.reservation && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 400 }}>
            <h3>{confirmModal.type === 'deposit' ? '💰 Confirmar Seña' : '⚠️ Cancelar Reserva'}</h3>
            <p style={{ color: 'var(--color-muted)', marginBottom: 20 }}>
              {confirmModal.type === 'deposit' 
                ? `¿Confirmas el ingreso de la seña por $${(confirmModal.reservation.deposit || 0).toLocaleString('es-AR')}?`
                : `¿Estás seguro de ELIMINAR la reserva #${confirmModal.reservation.id}? El vehículo volverá a estar disponible.`
              }
            </p>
            <div className="hstack" style={{ justifyContent: 'flex-end', gap: 10 }}>
              <button className="btn" style={{ background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)' }} onClick={() => setConfirmModal({ isOpen: false, type: null, reservation: null })}>Cancelar</button>
              <button className="btn" style={{ background: confirmModal.type === 'deposit' ? 'var(--color-primary)' : 'var(--color-danger)' }} onClick={confirmModal.type === 'deposit' ? processConfirmDeposit : processCancelReservation} disabled={isProcessing}>
                {isProcessing ? 'Procesando...' : (confirmModal.type === 'deposit' ? 'Sí, Confirmar' : 'Sí, Eliminar')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}