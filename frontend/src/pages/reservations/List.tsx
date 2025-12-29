import { pdf } from "@react-pdf/renderer";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

// --- IMPORTS ---
import { PaymentReceipt } from "../../components/pdfs/PaymentReceipt";
import Pagination from "../../components/ui/Pagination";
import useAuth from "../../hooks/useAuth";
import usePagedList from "../../hooks/usePagedList";
import api from "../../lib/api";

import { useNotifications } from "../../context/NotificationContext";
import { useToast } from "../../hooks/useToast";
import PaymentModal from "../../components/modals/PaymentModal";

// --- TIPOS ---
type ReservationStatus = "pendiente" | "confirmada" | "anulada" | "vendido";

type Reservation = {
  id: number;
  date: string;
  status: ReservationStatus;
  price: number;
  deposit?: number;       // Columna 'deposit' de la tabla
  paid_amount?: number;   // Suma de pagos (si el backend lo envía)
  balance?: number;
  workshop_expenses?: number;
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

export default function ReservationsList() {
  const nav = useNavigate();
  const { user } = useAuth();
  const { showToast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);

  const { refreshTrigger, fetchInitialCounts } = useNotifications();

  // ESTADO MODALES
  const [reservationToPay, setReservationToPay] = useState<Reservation | null>(null);
  const [keepExpenses, setKeepExpenses] = useState(false);
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    type: "deposit" | "cancel" | null;
    reservation: Reservation | null;
  }>({ isOpen: false, type: null, reservation: null });

  const {
    items,
    loading,
    //error,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    refetch,
  } = usePagedList<Reservation>("/reservations",{}, {pollingInterval:15000});

  useEffect(() => {
    if (refreshTrigger > 0) refetch();
  }, [refreshTrigger, refetch]);

  const isAdmin =
    user?.roles?.some((r: any) =>
      ["admin", "superadmin", "gerente"].includes(r.name?.toLowerCase())
    ) ||
    user?.role === "admin" ||
    user?.role === "ADMIN";

  // --- ACCIONES ---

  const requestConfirmDeposit = (reservation: Reservation) => {
    setConfirmModal({ isOpen: true, type: "deposit", reservation });
  };

  const processConfirmDeposit = async () => {
    const reservation = confirmModal.reservation;
    if (!reservation) return;
    setIsProcessing(true);
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      await api.patch(`/reservations/${reservation.id}`, { status: "confirmada" });

      // Usamos deposit O paid_amount para el recibo
      const amount = Number(reservation.deposit || reservation.paid_amount || 0);
      
      const blob = await pdf(
        <PaymentReceipt
          reservation={{ ...reservation, status: "confirmada" }}
          amount={amount}
          concept="Seña / Reserva de Unidad"
        />
      ).toBlob();

      window.open(URL.createObjectURL(blob), "_blank");
      showToast("¡Seña confirmada! 📄", "success");
      await refetch();
      fetchInitialCounts();
    } catch (err) {
      console.error(err);
      showToast("Error al confirmar", "error");
    } finally {
      setIsProcessing(false);
      setConfirmModal({ isOpen: false, type: null, reservation: null });
    }
  };

  const requestCancelReservation = (reservation: Reservation) => {
    setKeepExpenses(false);
    setConfirmModal({ isOpen: true, type: "cancel", reservation });
  };

  const processCancelReservation = async (refund: boolean) => {
    const reservation = confirmModal.reservation;
    if (!reservation) return;
    setIsProcessing(true);
    setConfirmModal({ ...confirmModal, isOpen: false });

    try {
      await api.post(`/reservations/${reservation.id}/cancel`, {
        refund,
        keep_expenses: keepExpenses,
      });
      showToast(refund ? "Anulada y devuelto 💸" : "Anulada y retenido 🔒", "success");
      await refetch();
      fetchInitialCounts();
    } catch (err) {
      console.error(err);
      showToast("Error al anular", "error");
    } finally {
      setIsProcessing(false);
      setConfirmModal({ isOpen: false, type: null, reservation: null });
    }
  };

  const renderStatusBadge = (status: string) => {
    const config = STATUS_CONFIG[status.toLowerCase()] || STATUS_CONFIG["pendiente"];
    return <span className={`badge ${config.colorClass}`}>{config.label}</span>;
  };

  return (
    <div className="vstack" style={{ gap: 20 }}>
      {/* HEADER */}
      <div className="hstack" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <div className="title" style={{ margin: 0, color: "var(--color-text)" }}>Gestión de Reservas</div>
        <Link 
          to="/reservas/nueva" 
          className="btn" 
          style={{background:"var(--color-primary)", color:"#fff", textDecoration:"none", padding:"8px 16px", borderRadius:"6px"}}
        >
          + Nueva Reserva
        </Link>
      </div>

      {/* BUSCADOR */}
      <div className="card hstack" style={{ padding: "12px 16px" }}>
        <input
          className="input-search"
          placeholder="🔍 Buscar por cliente, vendedor, patente..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ border: "none", background: "transparent", width: "100%", outline: "none", color: "var(--color-text)" }}
        />
      </div>

      {/* TABLA */}
      <div className="card" style={{ padding: 0, overflow: "hidden" }}>
        {loading || isProcessing ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--color-muted)" }}>{isProcessing ? "Procesando..." : "Cargando..."}</div>
        ) : items.length === 0 ? (
          <div style={{ padding: 30, textAlign: "center", color: "var(--color-muted)" }}>No hay reservas.</div>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="modern-table" style={{ marginTop: 0, border: "none" }}>
              <thead>
                <tr style={{ background: "var(--hover-bg)" }}>
                  <th>Fecha / ID</th>
                  <th>Cliente</th>
                  <th>Vendedor</th>
                  <th>Vehículo</th>
                  <th>Estado</th>
                  <th style={{ textAlign: "right" }}>Total</th>
                  <th style={{ textAlign: "right" }}>Saldo</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {items.map((r) => {
                  const statusNormal = r.status.toLowerCase();
                  
                  // === LÓGICA INTELIGENTE DE DINERO ===
                  const price = Number(r.price || 0);
                  
                  // Buscamos cualquier rastro de dinero que haya entrado
                  const deposit = Number(r.deposit || 0);
                  const paidAmount = Number(r.paid_amount || 0);
                  
                  // 'moneyDown' es lo que realmente puso el cliente (Seña)
                  const moneyDown = Math.max(deposit, paidAmount);

                  // Calculamos el saldo visualmente si el backend falla
                  // Si el backend dice balance=price (no restó nada) pero moneyDown > 0, recalculamos
                  let displayBalance = Number(r.balance ?? 0);
                  if (displayBalance === price && moneyDown > 0) {
                      displayBalance = price - moneyDown;
                  }

                  // ¿Puede confirmar? Si es Admin, está Pendiente, y HAY PLATA PUESTA (moneyDown > 0)
                  const canConfirmDeposit = statusNormal === "pendiente" && moneyDown > 0 && isAdmin;
                  
                  const isPaidOff = displayBalance <= 1; // Margen de error $1

                  return (
                    <tr key={r.id}>
                      <td>
                        <div style={{ fontWeight: 500 }}>{new Date(r.date).toLocaleDateString()}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>#{r.id}</div>
                      </td>
                      <td>
                        <div style={{ fontWeight: 600 }}>
                          {r.customer ? `${r.customer.first_name} ${r.customer.last_name}` : "—"}
                        </div>
                      </td>
                      <td>
                         <span style={{ fontSize: "0.9rem", color: r.seller ? "inherit" : "var(--color-muted)" }}>
                           {r.seller?.name || "—"}
                         </span>
                      </td>
                      <td>
                        {r.vehicle ? (
                          <div>
                            <div style={{ fontWeight: 500 }}>{r.vehicle.brand} {r.vehicle.model}</div>
                            <div style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>{r.vehicle.plate}</div>
                          </div>
                        ) : "—"}
                      </td>
                      <td>{renderStatusBadge(r.status)}</td>
                      
                      <td style={{ textAlign: "right", fontWeight: 500 }}>
                        ${price.toLocaleString("es-AR")}
                      </td>
                      
                      <td style={{ textAlign: "right" }}>
                        {!isPaidOff ? (
                          <span style={{ color: "var(--color-danger)", fontWeight: 700 }}>
                            ${displayBalance.toLocaleString("es-AR")}
                          </span>
                        ) : (
                          <span className="badge green">Saldado</span>
                        )}
                      </td>

                      <td style={{ textAlign: "right" }}>
                        <div className="hstack" style={{ justifyContent: "flex-end", gap: 8 }}>
                          {/* BOTÓN CONFIRMAR SEÑA */}
                          {canConfirmDeposit && (
                            <button
                              className="action-btn"
                              title="Confirmar Seña"
                              onClick={() => requestConfirmDeposit(r)}
                              style={{
                                color: "#d97706",
                                background: "rgba(251, 191, 36, 0.1)",
                                border: "1px solid #d97706",
                              }}
                            >
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 1v22M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /></svg>
                            </button>
                          )}

                          {/* BOTÓN DETALLE */}
                          <button className="action-btn" title="Ver Detalle" onClick={() => nav(`/reservas/${r.id}`)}>
                            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>
                          </button>

                          {/* BOTÓN NUEVO PAGO */}
                          {!isPaidOff && statusNormal !== "anulada" && isAdmin && (
                            <button className="action-btn" title="Registrar Pago" onClick={() => setReservationToPay(r)} style={{ color: "var(--color-primary)", borderColor: "var(--color-primary)" }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="1" y="4" width="22" height="16" rx="2" /><line x1="1" y1="10" x2="23" y2="10" /></svg>
                            </button>
                          )}

                          {/* BOTÓN ANULAR */}
                          {isAdmin && statusNormal !== "anulada" && statusNormal !== "vendido" && (
                            <button className="action-btn danger" title="Anular" onClick={() => requestCancelReservation(r)} style={{ color: "var(--color-danger)", borderColor: "var(--color-danger)" }}>
                              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2 2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
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

      {/* MODAL PAGO */}
      {reservationToPay && (
        <PaymentModal
          reservation={reservationToPay}
          onClose={() => setReservationToPay(null)}
          onSuccess={() => { setReservationToPay(null); refetch(); showToast("Pago registrado", "success"); }}
        />
      )}

      {/* MODAL CONFIRMACIÓN */}
      {confirmModal.isOpen && confirmModal.reservation && (
        <div className="modal-overlay">
          <div className="modal-card" style={{ maxWidth: 500 }}>
             {/* HEADER GENÉRICO DEL MODAL */}
             <div style={{marginBottom:15}}>
                 {confirmModal.type === "deposit" ? <h3>💰 Confirmar Seña</h3> : <h3>🚫 Anular Reserva</h3>}
             </div>

             {/* BODY CONFIRMAR SEÑA */}
             {confirmModal.type === "deposit" && (
                 <>
                   <p style={{color:'var(--color-muted)'}}>
                       ¿Confirmas el ingreso por <b>${Math.max(Number(confirmModal.reservation.deposit||0), Number(confirmModal.reservation.paid_amount||0)).toLocaleString("es-AR")}</b>?
                   </p>
                   <div className="hstack" style={{justifyContent:'flex-end', gap:10, marginTop:20}}>
                       <button className="btn" style={{background:'transparent', border:'1px solid var(--color-border)', color:'var(--color-text)'}} onClick={()=>setConfirmModal({...confirmModal, isOpen:false})}>Cancelar</button>
                       <button className="btn" style={{background:'var(--color-primary)', color:'#fff'}} onClick={processConfirmDeposit} disabled={isProcessing}>{isProcessing?"Procesando...":"Confirmar"}</button>
                   </div>
                 </>
             )}

             {/* BODY ANULAR */}
             {confirmModal.type === "cancel" && (
                 <>
                   <p style={{color:'var(--color-muted)'}}>¿Qué deseas hacer con el dinero ingresado?</p>
                   {/* ... Botones de anular (igual que antes) ... */}
                   <div className="vstack" style={{gap:10, marginTop:15}}>
                       <button className="btn" style={{justifyContent:'flex-start', background:'var(--hover-bg)', color:'var(--color-text)'}} onClick={()=>processCancelReservation(true)}>💸 Anular y Devolver Dinero</button>
                       <button className="btn" style={{justifyContent:'flex-start', background:'var(--hover-bg)', color:'var(--color-text)'}} onClick={()=>processCancelReservation(false)}>🔒 Anular y Retener Dinero</button>
                   </div>
                   <button className="btn-link" style={{marginTop:15, color:'var(--color-muted)', width:'100%'}} onClick={()=>setConfirmModal({...confirmModal, isOpen:false})}>Cancelar Operación</button>
                 </>
             )}
          </div>
        </div>
      )}
    </div>
  );
}