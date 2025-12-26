import { useEffect, useState } from "react";
import api from "../../lib/api";
import Button from "../ui/Button";
import Input from "../ui/Input";

/* === TIPOS === */
type DynamicField = {
  key: string;
  label: string;
  type: "text" | "number" | "date";
  required: boolean;
};

type PaymentMethod = {
  id: number;
  name: string;
  type: string;
  config?: any; // Puede venir como string o objeto
  description?: string; // Usaremos esto como backup
};

type Props = {
  onClose: () => void;
  methods?: PaymentMethod[]; 
  onSelect?: (method: PaymentMethod) => void;
  onCreated?: (method: PaymentMethod) => void;
};

// VOLVEMOS A LOS TIPOS OFICIALES (Sin 'custom' ni 'other')
const METHOD_OPTIONS: Record<string, string> = {
  cash: "💵 Efectivo",
  bank: "🏦 Transferencia Bancaria",
  check: "🎫 Cheque",
  card: "💳 Tarjeta de Débito/Crédito",
  credit_bank: "🏦 Crédito Bancario",
  crypto: "₿ Criptomoneda"
};

export default function PaymentMethodModal({ onClose, methods: initialMethods, onSelect, onCreated }: Props) {
  const isCreateOnly = !initialMethods;
  const [view, setView] = useState<"select" | "create">(isCreateOnly ? "create" : "select");
  const [localMethods, setLocalMethods] = useState<PaymentMethod[]>(initialMethods || []);

  useEffect(() => {
    if (initialMethods) setLocalMethods(initialMethods);
  }, [initialMethods]);

  // === ESTADOS ===
  const [name, setName] = useState("");
  const [type, setType] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // === CAMPOS DINÁMICOS ===
  const [customFields, setCustomFields] = useState<DynamicField[]>([]);
  const [newFieldLabel, setNewFieldLabel] = useState("");
  const [newFieldType, setNewFieldType] = useState<"text"|"number"|"date">("text");

  const addField = () => {
    if (!newFieldLabel.trim()) return;
    const key = newFieldLabel.toLowerCase().trim().replace(/\s+/g, '_'); 
    setCustomFields([...customFields, { key, label: newFieldLabel, type: newFieldType, required: true }]);
    setNewFieldLabel("");
  };

  const removeField = (index: number) => {
    setCustomFields(customFields.filter((_, i) => i !== index));
  };

  const handleDeleteMethod = async (e: React.MouseEvent, id: number) => {
    e.stopPropagation();
    if (!window.confirm("¿Seguro que querés eliminar este método?")) return;
    try {
        await api.delete(`/payment-methods/${id}`);
        setLocalMethods(prev => prev.filter(m => m.id !== id));
    } catch (err) {
        alert("No se pudo eliminar.");
    }
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return setError("El nombre es obligatorio");
    if (!type) return setError("Seleccioná un tipo de método");

    if (newFieldLabel.trim()) {
         if(window.confirm(`¿Agregar el campo pendiente "${newFieldLabel}" antes de guardar?`)) {
            addField();
            return;
         }
    }

    setLoading(true);
    setError("");

    try {
      // === ESTRATEGIA DE CONTRABANDO ===
      // Convertimos la config a STRING. A veces los backends borran objetos pero aceptan texto.
      const configPayload = JSON.stringify({ fields: customFields });

      const payload = {
        name,
        type, 
        // Enviamos la config como string
        config: configPayload,
        // HACK: Enviamos lo mismo en 'description' por si 'config' es ignorado
        description: configPayload,
        requires_details: customFields.length > 0 
      };

      console.log("Enviando Payload:", payload);

      const res = await api.post("/payment-methods", payload);
      const newMethod = res.data.data || res.data;
      
      if (onSelect) onSelect(newMethod);
      if (onCreated) onCreated(newMethod);
      onClose();
    } catch (err: any) {
      console.error(err);
      setError(err?.response?.data?.message || "Error al crear método. Revisá la consola.");
    } finally {
      setLoading(false);
    }
  };

  return (
      <div className="modal-overlay" onClick={onClose} style={styles.overlay}>
        <div className="modal-card vstack" onClick={(e) => e.stopPropagation()} style={{ ...styles.card, backgroundColor: "var(--color-card)", color: "var(--color-text)", border: "1px solid var(--color-border)" }}>
          
          {view === "select" && (
            <>
              <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 16 }}>
                <div><h3 style={{ margin: 0 }}>Medio de Pago</h3></div>
                <button onClick={onClose} style={styles.closeBtn}>✕</button>
              </div>
              <div className="vstack" style={{ gap: 10, overflowY: "auto", flex: 1 }}>
                {localMethods.map((m) => (
                  <div key={m.id} className="method-item hstack" onClick={() => onSelect && onSelect(m)} style={{ padding: 12, border: "1px solid var(--color-border)", borderRadius: 8, cursor: "pointer", justifyContent: "space-between", background: 'var(--color-card)', alignItems: 'center' }}>
                    <div className="vstack">
                        <span style={{ fontWeight: 500 }}>{m.name}</span>
                        <small style={{ color: "var(--color-muted)" }}>{METHOD_OPTIONS[m.type] || m.type}</small>
                    </div>
                    <button onClick={(e) => handleDeleteMethod(e, m.id)} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}>🗑️</button>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 16, borderTop: "1px solid var(--color-border)", paddingTop: 10 }}>
                <Button onClick={() => setView("create")} style={{ width: "100%" }}>+ Nuevo Método</Button>
              </div>
            </>
          )}

          {view === "create" && (
            <>
              <div className="hstack" style={{ justifyContent: "space-between", marginBottom: 16 }}>
                <h3>Nuevo Método</h3>
                {!isCreateOnly && <button onClick={() => setView("select")} style={{background:'transparent', border:'none', color:'var(--color-primary)', cursor:'pointer'}}>← Volver</button>}
              </div>

              <div style={{ overflowY: "auto", flex: 1, paddingRight: 4 }}>
                <form id="create-method-form" onSubmit={handleCreateSubmit} className="vstack" style={{ gap: 16 }}>
                  <Input label="Nombre" value={name} onChange={(e) => setName(e.currentTarget.value)} placeholder="Ej: Cheque Diferido" required />

                  <div className="vstack" style={{ gap: 6 }}>
                    <label style={{ fontWeight: 500, fontSize: "0.9rem" }}>Tipo Base *</label>
                    <select value={type} onChange={(e) => setType(e.currentTarget.value)} style={styles.select} required>
                      <option value="" disabled>Seleccionar...</option>
                      {Object.entries(METHOD_OPTIONS).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>

                  {/* === CONSTRUCTOR DE CAMPOS === */}
                  <div style={{ border: '1px dashed var(--color-border)', borderRadius: 8, padding: 12, background: 'rgba(120,120,120, 0.05)' }}>
                    <div className="hstack" style={{justifyContent:'space-between', marginBottom:8}}>
                        <h4 style={{ margin: 0, fontSize: '0.9rem' }}>Campos Personalizados</h4>
                    </div>
                    
                    {customFields.length > 0 ? (
                        <div className="hstack" style={{ gap: 8, flexWrap: 'wrap', marginBottom: 12 }}>
                            {customFields.map((field, idx) => (
                                <div key={idx} style={{ background: 'var(--hover-bg)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '8px', border: '1px solid var(--color-border)' }}>
                                    <span>{field.label}</span>
                                    <button type="button" onClick={() => removeField(idx)} style={{ color: '#f87171', border: 'none', background: 'transparent', cursor: 'pointer' }}>×</button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div style={{ fontSize:'0.8rem', color:'var(--color-muted)', marginBottom:10 }}>
                           ℹ️ Si agregás campos, intentaremos forzar el formulario personalizado.
                        </div>
                    )}

                    <div className="hstack" style={{ gap: 8, alignItems: 'flex-end' }}>
                        <div style={{ flex: 2 }}>
                            <Input placeholder="Ej: Fecha Cobro" value={newFieldLabel} onChange={(e) => setNewFieldLabel(e.target.value)} style={{fontSize:'0.9rem'}} />
                        </div>
                        <div style={{ flex: 1 }}>
                             <select value={newFieldType} onChange={(e:any) => setNewFieldType(e.target.value)} style={{width:'100%', padding:'9px', borderRadius:6, border:'1px solid var(--color-border)', background:'var(--input-bg)', color:'var(--color-text)', fontSize:'0.9rem'}}>
                                 <option value="text">Texto</option>
                                 <option value="number">Número</option>
                                 <option value="date">Fecha</option>
                             </select>
                        </div>
                        <Button type="button" onClick={addField} disabled={!newFieldLabel} style={{height: 38}}>+</Button>
                    </div>
                  </div>

                  {error && <div style={{ padding: 10, backgroundColor: "rgba(239, 68, 68, 0.15)", color: "#f87171", borderRadius: 6 }}>⚠️ {error}</div>}
                </form>
              </div>

              <div className="hstack" style={{ justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
                 <Button type="button" onClick={onClose} style={{background:'transparent', border:'1px solid var(--color-border)', color:'var(--color-text)'}} disabled={loading}>Cancelar</Button>
                 <Button type="submit" form="create-method-form" loading={loading}>Guardar</Button>
              </div>
            </>
          )}
        </div>
      </div>
  );
}

const styles = {
  overlay: { position: "fixed" as "fixed", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999 },
  card: { padding: 24, borderRadius: 12, width: 480, maxWidth: "95%", maxHeight: "90vh", display: "flex", flexDirection: "column" as "column", overflow: "hidden", boxShadow: "0 10px 25px rgba(0,0,0,0.5)" },
  closeBtn: { background: "none", border: "none", cursor: "pointer", padding: 4, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "50%", color: "var(--color-muted)", fontSize: '1.2rem' },
  select: { width: "100%", padding: "10px 12px", borderRadius: "6px", fontSize: "1rem", appearance: "none" as "none", cursor: "pointer", borderWidth: "1px", borderStyle: "solid", backgroundColor: "var(--input-bg)", color: "var(--color-text)", borderColor: "var(--color-border)" },
};