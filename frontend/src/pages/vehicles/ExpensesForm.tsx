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
  const id = vehicleId || useParams().id; // compatibilidad si la ruta es /vehiculos/:id/gastos
  const nav = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [description, setDescription] = useState("");
  const [amount, setAmount] = useState<number | "">("");
  const [date, setDate] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  // Cargar datos del vehículo y sus gastos
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

  // Crear nuevo gasto
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
      setDate("");
      loadData();
    } catch {
      setToast("No se pudo registrar el gasto");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar gasto
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

  return (
    <div className="container vstack" style={{ gap: 20 }}>
      <div className="title">
        🔧 Gastos del vehículo{" "}
        {vehicle ? `${vehicle.brand} ${vehicle.model} (${vehicle.plate})` : ""}
      </div>

      {/* Formulario de alta */}
      <form onSubmit={handleSubmit} className="card vstack" style={{ gap: 12 }}>
        <Input
          label="Descripción *"
          value={description}
          onChange={(e) => setDescription(e.currentTarget.value)}
          required
        />
        <Input
          label="Monto ($)"
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
        <div className="hstack" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" loading={loading}>
            Guardar
          </Button>
        </div>
      </form>

      {/* Lista de gastos */}
      <div className="card vstack" style={{ gap: 8 }}>
        <div className="title">Historial de gastos</div>
        {expenses.length === 0 ? (
          <p style={{ color: "var(--color-muted)" }}>
            No hay gastos registrados.
          </p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Monto</th>
                <th>Estado</th> {/* ✅ */}
                <th style={{ textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp) => (
                <tr key={exp.id}>
                  <td>{new Date(exp.date).toLocaleDateString()}</td>
                  <td>{exp.description}</td>
                  <td>${exp.amount.toLocaleString("es-AR")}</td>
                  <td style={{ textAlign: "right" }}>
                    <div
                      className="hstack"
                      style={{ gap: 8, justifyContent: "flex-end" }}
                    >
                      {exp.status === "no_pagado" ? (
                        <Button
                          onClick={async () => {
                            await api.put(
                              `/vehicles/${id}/expenses/${exp.id}`,
                              { status: "pagado" }
                            );
                            setToast("Gasto marcado como pagado ✅");
                            loadData();
                          }}
                        >
                          💰 Pagar
                        </Button>
                      ) : (
                        <Button
                          onClick={async () => {
                            await api.put(
                              `/vehicles/${id}/expenses/${exp.id}`,
                              { status: "no_pagado" }
                            );
                            setToast("Gasto marcado como NO pagado ⚠️");
                            loadData();
                          }}
                        >
                          🔄 Desmarcar
                        </Button>
                      )}
                      <Button onClick={() => handleDelete(exp)}>🗑️</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Button
        onClick={() => nav("/vehiculos")}
        style={{ alignSelf: "flex-start" }}
      >
        ← Volver
      </Button>

      {toast && (
        <Toast
          message={toast}
          type={toast.includes("✅") ? "success" : "error"}
        />
      )}
    </div>
  );
}
