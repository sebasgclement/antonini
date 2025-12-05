import { useEffect, useState, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import api from "../../lib/api";

type Vehicle = {
  id: number;
  plate: string;
  brand: string;
  model: string;
};

type Expense = {
  id: number;
  description: string;
  amount: number;
  date: string;
  status: "pagado" | "no_pagado";
};

export default function VehicleExpensesForm() {
  const { vehicleId } = useParams<{ vehicleId: string }>();
  const id = vehicleId || useParams().id;
  const nav = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar datos
  const loadData = async () => {
    try {
      const v = await api.get(`/vehicles/${id}`);
      setVehicle(v.data.data || v.data);
      const res = await api.get(`/vehicles/${id}/expenses`);
      setExpenses(res.data.data || []);
    } catch {
      setToast("No se pudo cargar la información del vehículo");
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Submit
  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!description || !amount || !date) {
      setToast("Completa todos los campos requeridos");
      return;
    }
    try {
      setLoading(true);
      await api.post(`/vehicles/${id}/expenses`, { description, amount, date });
      setToast("Gasto registrado ✅");
      setDescription("");
      setAmount("");
      // Dejamos la fecha por si carga varios del mismo día
      loadData();
    } catch {
      setToast("No se pudo registrar el gasto");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (exp: Expense) => {
    if (!confirm(`¿Eliminar el gasto "${exp.description}"?`)) return;
    try {
      await api.delete(`/vehicles/${id}/expenses/${exp.id}`);
      setExpenses((prev) => prev.filter((e) => e.id !== exp.id));
      setToast("Gasto eliminado ✅");
    } catch {
      setToast("No se pudo eliminar el gasto");
    }
  };

  // Toggle Estado
  const toggleStatus = async (exp: Expense) => {
      const newStatus = exp.status === 'pagado' ? 'no_pagado' : 'pagado';
      try {
          await api.put(`/vehicles/${id}/expenses/${exp.id}`, { status: newStatus });
          setExpenses(prev => prev.map(e => e.id === exp.id ? {...e, status: newStatus} : e));
          setToast(newStatus === 'pagado' ? "Marcado como Pagado 💰" : "Marcado como Pendiente ⏳");
      } catch {
          setToast("Error al cambiar estado");
      }
  }

  return (
    <div className="container vstack" style={{ gap: 24 }}>
      
      {/* Header simple */}
      <div className="hstack" style={{ justifyContent: 'space-between' }}>
        <div>
            <h2 className="title" style={{margin: 0}}>Gastos de Taller</h2>
            {vehicle && (
                <div style={{color: 'var(--color-muted)', fontSize: '0.9rem', marginTop: 4}}>
                    Vehículo: <strong>{vehicle.brand} {vehicle.model}</strong> — {vehicle.plate || 'S/Patente'}
                </div>
            )}
        </div>
        <Button onClick={() => nav(`/vehiculos/${id}/ver`)} style={{background: 'transparent', border: '1px solid var(--color-border)', color: 'var(--color-text)'}}>
            Ver Ficha
        </Button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24, alignItems: 'start' }}>
          
          {/* === FORMULARIO (Izquierda o Arriba en móvil) === */}
          <div className="card vstack" style={{ gap: 16 }}>
            <div className="title" style={{fontSize: '1rem', margin: 0}}>Nuevo Gasto</div>
            
            <form onSubmit={handleSubmit} className="vstack" style={{ gap: 12 }}>
                <Input
                    label="Descripción del trabajo *"
                    value={description}
                    onChange={(e) => setDescription(e.currentTarget.value)}
                    required
                    placeholder="Ej: Cambio de aceite y filtros"
                />
                
                {/* Fila doble para ahorrar espacio */}
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <Input
                        label="Monto ($) *"
                        type="number"
                        value={amount as any}
                        onChange={(e) => setAmount(parseFloat(e.currentTarget.value) || "")}
                        required
                    />
                    <Input
                        label="Fecha *"
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.currentTarget.value)}
                        required
                    />
                </div>

                <div className="hstack" style={{ justifyContent: "flex-end", marginTop: 8 }}>
                    <Button type="submit" loading={loading} style={{width: '100%'}}>
                        + Registrar Gasto
                    </Button>
                </div>
            </form>
          </div>

          {/* === LISTA (Derecha) === */}
          <div className="card vstack" style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
            {expenses.length === 0 ? (
                <div style={{padding: 30, textAlign: 'center', color: 'var(--color-muted)'}}>
                    No hay gastos cargados aún.
                </div>
            ) : (
                <div style={{overflowX: 'auto'}}>
                    <table className="modern-table" style={{marginTop: 0, border: 'none'}}>
                        <thead>
                        <tr style={{background: 'var(--hover-bg)'}}>
                            <th>Fecha</th>
                            <th>Descripción</th>
                            <th>Monto</th>
                            <th>Estado</th>
                            <th style={{ textAlign: "right" }}>Acciones</th>
                        </tr>
                        </thead>
                        <tbody>
                        {expenses.map((exp) => (
                            <tr key={exp.id}>
                            <td style={{whiteSpace: 'nowrap'}}>{new Date(exp.date).toLocaleDateString('es-AR', {day: '2-digit', month: '2-digit', year: '2-digit'})}</td>
                            <td style={{fontWeight: 500}}>{exp.description}</td>
                            <td style={{fontWeight: 600, color: 'var(--color-text)'}}>${exp.amount.toLocaleString("es-AR")}</td>
                            <td>
                                <span 
                                    className={`badge ${exp.status === 'pagado' ? 'green' : 'orange'}`}
                                    style={{cursor: 'pointer'}}
                                    onClick={() => toggleStatus(exp)}
                                    title="Click para cambiar estado"
                                >
                                    {exp.status === 'pagado' ? 'Pagado' : 'Pendiente'}
                                </span>
                            </td>
                            <td style={{ textAlign: "right" }}>
                                <div className="hstack" style={{ justifyContent: "flex-end", gap: 4 }}>
                                    <button 
                                        className="action-btn danger" 
                                        onClick={() => handleDelete(exp)}
                                        title="Eliminar"
                                    >
                                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                    </button>
                                </div>
                            </td>
                            </tr>
                        ))}
                        </tbody>
                        {/* Footer con Total */}
                        <tfoot>
                            <tr style={{borderTop: '2px solid var(--color-border)'}}>
                                <td colSpan={2} style={{textAlign: 'right', fontWeight: 'bold', color: 'var(--color-muted)'}}>TOTAL:</td>
                                <td style={{fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--color-primary)'}}>
                                    $ {expenses.reduce((sum, e) => sum + Number(e.amount), 0).toLocaleString()}
                                </td>
                                <td colSpan={2}></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}
          </div>

      </div>

      {toast && (
        <Toast
          message={toast}
          type={toast.includes("✅") || toast.includes("💰") ? "success" : "error"}
        />
      )}
    </div>
  );
}