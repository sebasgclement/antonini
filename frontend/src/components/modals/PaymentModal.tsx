import { useState, useEffect } from "react";
import api from "../../lib/api";
import Button from "../ui/Button";
import Input from "../ui/Input";
import PaymentMethodModal from "./PaymentMethodModal";

type Reservation = {
  id: number;
  total_amount?: number; 
  pending_amount?: number;
  [key: string]: any;
};

type PaymentMethod = {
  id: number;
  name: string;
  type: string;
};

type Props = {
  reservation: Reservation;
  onClose: () => void;
  onSuccess: () => void;
};

export default function PaymentModal({ reservation, onClose, onSuccess }: Props) {
  const [methods, setMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethodId, setSelectedMethodId] = useState<string>("");
  const [isMethodModalOpen, setIsMethodModalOpen] = useState(false);
  
  const initialAmount = reservation.pending_amount || reservation.total_amount || 0;
  const [amount, setAmount] = useState(initialAmount.toString());
  const [loading, setLoading] = useState(false);
  
  // Inicializamos check_number en "0" para que no falle la validación si está oculto
  const [details, setDetails] = useState<Record<string, string>>({
    check_number: "0" 
  });

  useEffect(() => { loadMethods(); }, []);

  const loadMethods = () => {
    api.get("/payment-methods").then((res) => {
        setMethods(res.data.data || res.data);
    });
  };

  const selectedMethod = methods.find((m) => m.id.toString() === selectedMethodId);

  // === RENDERIZADO MANUAL DE CAMPOS ===
  const renderFields = () => {
    if (!selectedMethod) return null;

    switch (selectedMethod.type) {
        case 'check': 
            return (
                <div className="vstack" style={{ gap: 12, padding: 12, background: "rgba(0,0,0,0.02)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--color-primary)", display:'flex', justifyContent:'space-between' }}>
                        <span>🎫 Datos del Cheque</span>
                        <span style={{fontSize:'0.7rem', color:'green'}}>Personalizado</span>
                    </div>
                    
                    {/* Fila 1: Fechas */}
                    <div className="hstack" style={{ gap: 10 }}>
                         <div style={{flex:1}}>
                            <Input 
                                label="Fecha de Entrega" 
                                type="date" 
                                value={details.delivery_date || ''} 
                                onChange={e => setDetails({...details, delivery_date: e.target.value})} 
                            />
                        </div>
                        <div style={{flex:1}}>
                            <Input 
                                label="Fecha de Cobro *" 
                                type="date" 
                                value={details.payment_date || ''} 
                                onChange={e => setDetails({...details, payment_date: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>

                    {/* Fila 2: Banco y Titular */}
                    <div className="hstack" style={{ gap: 10 }}>
                        <div style={{flex:1}}>
                            <Input 
                                label="Banco *" 
                                placeholder="Ej: Galicia" 
                                value={details.bank_name || ''} 
                                onChange={e => setDetails({...details, bank_name: e.target.value})} 
                                required 
                            />
                        </div>
                        <div style={{flex:1}}>
                            <Input 
                                label="Titular / CUIT *" 
                                placeholder="Nombre o CUIT" 
                                value={details.owner || ''} 
                                onChange={e => setDetails({...details, owner: e.target.value})} 
                                required 
                            />
                        </div>
                    </div>

                    {/* Fila 3: Número de Cheque (Oculto o Visible) */}
                    {/* Si lo ponés hidden, recordá que ya lo inicializamos en "0" arriba */}
                    <Input 
                        type="number" // Lo dejo visible por si querés cambiarlo, o poné hidden
                        label="N° Cheque" 
                        value={details.check_number} 
                        onChange={e => setDetails({...details, check_number: e.target.value})} 
                    />
                </div>
            );

        case 'bank':
        case 'credit_bank':
            return (
                <div className="vstack" style={{ gap: 12, padding: 12, background: "var(--hover-bg)", borderRadius: 8 }}>
                     <Input label="Comprobante / ID" value={details.transaction_id || ''} onChange={e => setDetails({...details, transaction_id: e.target.value})} />
                </div>
            );
        
        case 'card':
             return (
                <div className="vstack" style={{ gap: 12, padding: 12, background: "var(--hover-bg)", borderRadius: 8 }}>
                    <div className="hstack" style={{gap:10}}>
                        <Input label="Últimos 4 núm." maxLength={4} value={details.card_last4 || ''} onChange={e => setDetails({...details, card_last4: e.target.value})} style={{width:100}} />
                        <Input label="Cód. Autorización" value={details.auth_code || ''} onChange={e => setDetails({...details, auth_code: e.target.value})} style={{flex:1}} />
                    </div>
                    <Input label="Cantidad de Cuotas" type="number" value={details.installments || ''} onChange={e => setDetails({...details, installments: e.target.value})} />
                </div>
             );

        default: return null;
    }
  };

  const handlePayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMethodId) return alert("Seleccioná un método");
    
    // Validación manual para Cheques
    if (selectedMethod?.type === 'check') {
        if (!details.payment_date) return alert("La fecha de cobro es obligatoria");
        if (!details.bank_name) return alert("El banco es obligatorio");
        if (!details.owner) return alert("El titular es obligatorio");
        if (!details.check_number) details.check_number = "0"; 
    }

    setLoading(true);
    try {
      const payload = {
        reservation_id: reservation.id,
        amount: parseFloat(amount),
        
        // CORRECCIÓN AQUÍ: Antes decía method_id, ahora payment_method_id
        payment_method_id: selectedMethodId, 

        details: { 
            ...details, 
            method_type: selectedMethod?.type, 
            method_name: selectedMethod?.name 
        }
      };

      console.log("Enviando pago:", payload); 

      await api.post("/reservation-payments", payload);
      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      const msg = error?.response?.data?.message || "Error al procesar el pago.";
      const validation = error?.response?.data?.errors;
      // Mostramos el error de validación de forma más legible si existe
      const validationMsg = validation ? "\n" + Object.values(validation).flat().join("\n") : "";
      alert(msg + validationMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
        <div className="modal-overlay" onClick={onClose} style={styles.overlay}>
        <div className="modal-card" onClick={(e) => e.stopPropagation()} style={{ ...styles.card, backgroundColor: "var(--color-card)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}>
            <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 20 }}>
                <h3 style={{ margin: 0 }}>Registrar Pago</h3>
                <button onClick={onClose} style={styles.closeBtn}>✕</button>
            </div>

            <form onSubmit={handlePayment} className="vstack" style={{ gap: 16 }}>
            <Input label="Monto a Cobrar" type="number" value={amount} onChange={(e) => setAmount(e.target.value)} required style={{fontSize:'1.1rem', fontWeight:'bold'}} />

            <div className="vstack" style={{ gap: 6 }}>
                <label style={{ fontSize: "0.9rem", color: "var(--color-muted)" }}>Método de Pago</label>
                <div className="hstack" style={{ gap: 8 }}>
                    <div style={{ flex: 1 }}>
                        <select 
                            value={selectedMethodId} 
                            onChange={(e) => { 
                                setSelectedMethodId(e.target.value); 
                                setDetails({ check_number: "0" }); 
                            }} 
                            style={styles.select} 
                            required
                        >
                            <option value="">Seleccionar...</option>
                            {methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
                        </select>
                    </div>
                    <Button type="button" onClick={() => setIsMethodModalOpen(true)} style={{ height: 42, width: 42, padding: 0, display: 'flex', alignItems:'center', justifyContent:'center', fontSize: '1.2rem' }}>⚙️</Button>
                </div>
            </div>

            {renderFields()}

            <div style={{ marginTop: 10 }}>
                <Button type="submit" loading={loading} style={{ width: "100%" }}>Confirmar Pago</Button>
            </div>
            </form>
        </div>
        </div>

        {isMethodModalOpen && (
            <PaymentMethodModal 
                onClose={() => setIsMethodModalOpen(false)}
                methods={methods} 
                onSelect={(method) => { setSelectedMethodId(method.id.toString()); setIsMethodModalOpen(false); }}
                onCreated={(newMethod) => { setMethods(prev => [...prev, newMethod]); }}
            />
        )}
    </>
  );
}

const styles = {
  overlay: { position: "fixed" as "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  card: { padding: 24, borderRadius: 12, width: 450, maxWidth: "95%", boxShadow: "0 10px 25px rgba(0,0,0,0.5)", overflowY: 'auto' as 'auto', maxHeight: '90vh' },
  closeBtn: { background: "none", border: "none", cursor: "pointer", color: "var(--color-muted)", fontSize: '1.2rem' },
  select: { width: "100%", padding: "10px", borderRadius: "6px", fontSize: "1rem", border: "1px solid var(--color-border)", backgroundColor: "var(--input-bg)", color: "var(--color-text)" },
};