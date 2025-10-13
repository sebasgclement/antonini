import { useEffect, useState } from "react";
import api from "../../../lib/api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import Toast from "../../../components/ui/Toast";

type Report = {
  month?: number;
  year?: number;
  cantidad?: number;
  total?: number;
  ganancia?: number;
  vendedor?: string;
  payment_method?: string;
};

export default function ReportsDashboard() {
  const [monthly, setMonthly] = useState<Report[]>([]);
  const [bySeller, setBySeller] = useState<Report[]>([]);
  const [byPayment, setByPayment] = useState<Report[]>([]);
  const [error, setError] = useState("");
  const [filters, setFilters] = useState({
    year: new Date().getFullYear(),
    start_date: "",
    end_date: "",
    seller_id: "",
  });
  const [sellers, setSellers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [downloading, setDownloading] = useState(false);

  // 🔹 Cargar lista de vendedores
  useEffect(() => {
    api
      .get("/admin/users")
      .then((res) => setSellers(res.data.data || res.data))
      .catch(() => {});
  }, []);

  // 🔹 Cargar reportes
  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, String(v)));

      const [m, s, p] = await Promise.all([
        api.get(`/reports/sales/monthly?${params.toString()}`),
        api.get(`/reports/sales/by-seller?${params.toString()}`),
        api.get(`/reports/sales/by-payment?${params.toString()}`),
      ]);

      setMonthly(m.data.data || []);
      setBySeller(s.data.data || []);
      setByPayment(p.data.data || []);
    } catch {
      setError("Error al cargar los reportes");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, []);

  const handleChange = (e: any) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const formatCurrency = (n?: number) => (n ? `$${n.toLocaleString("es-AR")}` : "—");

  const handleDownload = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => v && params.append(k, String(v)));

      const response = await api.get(`/reports/sales/export?${params.toString()}`, {
        responseType: "blob",
      });

      const blob = new Blob([response.data], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
    } catch {
      setError("No se pudo generar el PDF");
    } finally {
      setDownloading(false);
    }
  };

  // 🔹 Sumar totales (solo del reporte mensual)
  const sumTotals = (arr: Report[]) => ({
    cantidad: arr.reduce((a, b) => a + (b.cantidad || 0), 0),
    total: arr.reduce((a, b) => a + (b.total || 0), 0),
    ganancia: arr.reduce((a, b) => a + (b.ganancia || 0), 0),
  });

  const totals = sumTotals(monthly);

  return (
    <div className="vstack" style={{ gap: 24 }}>
      <div className="title">📊 Reportes de Ventas</div>

      {/* === FILTROS === */}
      <div className="report-card">
        <div className="report-filters">
          <div className="field">
            <Input
              label="Año"
              type="number"
              name="year"
              value={filters.year}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <Input
              label="Desde"
              type="date"
              name="start_date"
              value={filters.start_date}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <Input
              label="Hasta"
              type="date"
              name="end_date"
              value={filters.end_date}
              onChange={handleChange}
            />
          </div>

          <div className="field">
            <label>Vendedor</label>
            <select
              name="seller_id"
              value={filters.seller_id}
              onChange={handleChange}
            >
              <option value="">Todos</option>
              {sellers.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="report-actions">
          <Button onClick={loadReports} loading={loading}>
            Aplicar filtros
          </Button>
          <Button onClick={handleDownload} loading={downloading}>
            📄 Descargar PDF
          </Button>
        </div>
      </div>

      {/* === WIDGETS === */}
      <div className="dashboard-widgets">
        <div className="widget">
          <span className="widget-title">Ventas Totales</span>
          <strong className="widget-value">{formatCurrency(totals.total)}</strong>
        </div>
        <div className="widget">
          <span className="widget-title">Cantidad Vendida</span>
          <strong className="widget-value">{totals.cantidad}</strong>
        </div>
        <div className="widget">
          <span className="widget-title">Ganancia Estimada</span>
          <strong className="widget-value text-success">
            {formatCurrency(totals.ganancia)}
          </strong>
        </div>
      </div>

      {error && <Toast message={error} type="error" />}

      {/* === TABLAS === */}
      <div className="report-section">
        <h3>📅 Ventas mensuales</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Mes</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {monthly.length === 0 ? (
              <tr>
                <td colSpan={4} className="report-table-empty">
                  No hay datos disponibles.
                </td>
              </tr>
            ) : (
              monthly.map((r, i) => (
                <tr key={i}>
                  <td>
                    {r.month}/{r.year}
                  </td>
                  <td>{r.cantidad}</td>
                  <td>{formatCurrency(r.total)}</td>
                  <td>{formatCurrency(r.ganancia)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="report-section">
        <h3>👤 Ventas por vendedor</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Vendedor</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {bySeller.length === 0 ? (
              <tr>
                <td colSpan={4} className="report-table-empty">
                  No hay datos disponibles.
                </td>
              </tr>
            ) : (
              bySeller.map((r, i) => (
                <tr key={i}>
                  <td>{r.vendedor}</td>
                  <td>{r.cantidad}</td>
                  <td>{formatCurrency(r.total)}</td>
                  <td>{formatCurrency(r.ganancia)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="report-section">
        <h3>💳 Ventas por forma de pago</h3>
        <table className="report-table">
          <thead>
            <tr>
              <th>Forma de pago</th>
              <th>Cantidad</th>
              <th>Total</th>
              <th>Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {byPayment.length === 0 ? (
              <tr>
                <td colSpan={4} className="report-table-empty">
                  No hay datos disponibles.
                </td>
              </tr>
            ) : (
              byPayment.map((r, i) => (
                <tr key={i}>
                  <td>{r.payment_method || "—"}</td>
                  <td>{r.cantidad}</td>
                  <td>{formatCurrency(r.total)}</td>
                  <td>{formatCurrency(r.ganancia)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
