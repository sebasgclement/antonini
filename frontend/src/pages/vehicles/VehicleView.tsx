import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";
import api from "../../lib/api";

export default function VehicleView() {
  const { id } = useParams();
  const nav = useNavigate();
  const [vehicle, setVehicle] = useState<any>(null);
  const [expenses, setExpenses] = useState<any[]>([]);
  const [toast, setToast] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/vehicles/${id}`);
        setVehicle(data?.data ?? data);

        // Si la API no incluye los gastos embebidos, los pedimos aparte
        const expRes = await api.get(`/vehicles/${id}/expenses`);
        const expData = Array.isArray(expRes.data)
          ? expRes.data
          : expRes.data?.data || [];
        setExpenses(expData);
      } catch {
        setToast("No se pudo cargar la información del vehículo");
      }
    })();
  }, [id]);

  if (!vehicle) return <div className="container">Cargando…</div>;

  return (
    <div className="container vstack detail-page">
      <div className="page-header">
        <h2 className="page-title">
          {vehicle.brand} {vehicle.model}
          <span className={`status-badge ${vehicle.status}`}>
            {vehicle.status}
          </span>
        </h2>
      </div>

      {/* === Datos generales === */}
      <div className="detail-card">
        <div className="detail-section-title">Datos generales</div>
        <div className="detail-group">
          <p>
            <strong>Patente:</strong> {vehicle.plate || "—"}
          </p>
          <p>
            <strong>Año:</strong> {vehicle.year || "—"}
          </p>
          <p>
            <strong>Color:</strong> {vehicle.color || "—"}
          </p>
          <p>
            <strong>Kilometraje:</strong>{" "}
            {vehicle.km ? `${vehicle.km.toLocaleString()} km` : "—"}
          </p>
          <p>
            <strong>Combustible:</strong> {vehicle.fuel_type || "—"}
          </p>
        </div>
      </div>

      {/* === Propiedad / Cliente === */}
      <div className="detail-card">
        <div className="detail-section-title">Propiedad / Cliente</div>
        <div className="detail-group">
          <p>
            <strong>Tipo de propiedad:</strong> {vehicle.ownership}
          </p>
          {vehicle.ownership === "consignado" && (
            <p>
              <strong>Cliente consignante:</strong>{" "}
              {vehicle.customer?.name ||
                [vehicle.customer?.first_name, vehicle.customer?.last_name]
                  .filter(Boolean)
                  .join(" ") ||
                `#${vehicle.customer_id}`}
            </p>
          )}
          <p>
            <strong>VIN:</strong> {vehicle.vin || "—"}
          </p>
        </div>
      </div>

      {/* === Valores === */}
      <div className="detail-card">
        <div className="detail-section-title">Valores</div>
        <div className="detail-group">
          <p>
            <strong>Precio de referencia:</strong>{" "}
            {vehicle.reference_price
              ? `$${vehicle.reference_price.toLocaleString()}`
              : "—"}
          </p>
          <p>
            <strong>Valor de toma:</strong>{" "}
            {vehicle.take_price != null
              ? `$${Number(vehicle.take_price).toLocaleString("es-AR")}`
              : "—"}
          </p>
          <p>
            <strong>Precio actual:</strong>{" "}
            {vehicle.price ? `$${vehicle.price.toLocaleString()}` : "—"}
          </p>
        </div>
      </div>

      {/* === Gastos de taller === */}
      <div className="detail-card">
        <div className="detail-section-title">Gastos de taller</div>
        {expenses.length === 0 ? (
          <p className="text-muted">
            No hay gastos registrados para este vehículo.
          </p>
        ) : (
          <table className="report-table">
            <thead>
              <tr>
                <th>Fecha</th>
                <th>Descripción</th>
                <th>Monto ($)</th>
              </tr>
            </thead>
            <tbody>
              {expenses.map((exp, i) => (
                <tr key={i}>
                  <td>
                    {new Date(exp.date || exp.created_at).toLocaleDateString(
                      "es-AR"
                    )}
                  </td>
                  <td>{exp.description || "—"}</td>
                  <td>{exp.amount ? exp.amount.toLocaleString() : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* === Checklist === */}
      <div className="detail-card">
        <div className="detail-section-title">Checklist</div>
        <div className="detail-group checklist">
          <p>
            <strong>Rueda de auxilio:</strong>{" "}
            {vehicle.check_spare ? "✅ Sí" : "❌ No"}
          </p>
          <p>
            <strong>Crique:</strong> {vehicle.check_jack ? "✅ Sí" : "❌ No"}
          </p>
          <p>
            <strong>Herramientas:</strong>{" "}
            {vehicle.check_tools ? "✅ Sí" : "❌ No"}
          </p>
          <p>
            <strong>Documentación:</strong>{" "}
            {vehicle.check_docs ? "✅ Completa" : "❌ Incompleta"}
          </p>
          <p>
            <strong>Duplicado de llave:</strong>{" "}
            {vehicle.check_key_copy ? "✅ Sí" : "❌ No"}
          </p>
          <p>
            <strong>Manual:</strong> {vehicle.check_manual ? "✅ Sí" : "❌ No"}
          </p>
        </div>
      </div>

      {/* === Fotos === */}
      <div className="detail-card">
        <div className="detail-section-title">Fotos del vehículo</div>
        <div className="photo-gallery">
          {[
            { key: "front", label: "Frente" },
            { key: "back", label: "Dorso" },
            { key: "left", label: "Lateral Izquierdo" },
            { key: "right", label: "Lateral Derecho" },
            { key: "interior_front", label: "Interior Adelante" },
            { key: "interior_back", label: "Interior Atrás" },
            { key: "trunk", label: "Baúl" },
          ].map(({ key, label }) => {
            const url = vehicle[`photo_${key}_url`] || vehicle[`photo_${key}`];
            return (
              url && (
                <div className="photo-item" key={key}>
                  <img src={url} alt={label} />
                  <p>{label}</p>
                </div>
              )
            );
          })}
        </div>
      </div>

      {/* === Observaciones === */}
      {vehicle.notes && (
        <div className="detail-card">
          <div className="detail-section-title">Observaciones</div>
          <p>{vehicle.notes}</p>
        </div>
      )}

      <div className="detail-actions">
        <Button onClick={() => nav(-1)}>Volver</Button>
      </div>

      {toast && <Toast message={toast} type="error" />}
    </div>
  );
}
