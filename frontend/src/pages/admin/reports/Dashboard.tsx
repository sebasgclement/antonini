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

  // === Cargar vendedores ===
  useEffect(() => {
    api
      .get("/admin/users")
      .then((res) => setSellers(res.data.data || res.data))
      .catch(() => {});
  }, []);

  // === Cargar reportes ===
  const loadReports = async () => {
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => {
        if (v) params.append(k, String(v));
      });

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

  const formatCurrency = (n?: number) =>
    n ? `$${n.toLocaleString("es-AR")}` : "—";

  // === Descargar PDF con token ===
  const handleDownload = async () => {
    try {
      setDownloading(true);
      const params = new URLSearchParams();
      if (filters.year) params.append("year", String(filters.year));
      if (filters.seller_id) params.append("seller_id", filters.seller_id);
      if (filters.start_date) params.append("start_date", filters.start_date);
      if (filters.end_date) params.append("end_date", filters.end_date);

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

  return (
    <div className="vstack" style={{ gap: 24 }}>
      <div className="title">📊 Reportes de Ventas</div>

      {/* === FILTROS === */}
      <div className="card vstack" style={{ gap: 12 }}>
        <div className="form-row">
          <Input
            label="Año"
            type="number"
            name="year"
            value={filters.year}
            onChange={handleChange}
          />
          <Input
            label="Desde"
            type="date"
            name="start_date"
            value={filters.start_date}
            onChange={handleChange}
          />
          <Input
            label="Hasta"
            type="date"
            name="end_date"
            value={filters.end_date}
            onChange={handleChange}
          />
          <div className="form-group">
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

        <div className="hstack" style={{ justifyContent: "flex-end", gap: 8 }}>
          <Button onClick={loadReports} loading={loading}>
            Aplicar filtros
          </Button>
          <Button onClick={handleDownload} loading={downloading}>
            📄 Descargar PDF
          </Button>
        </div>
      </div>

      {error && <Toast message={error} type="error" />}

      {/* === VENTAS MENSUALES === */}
      <div className="card">
        <h3>📅 Ventas mensuales</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--color-muted)" }}>
              <th style={{ padding: 8 }}>Mes</th>
              <th style={{ padding: 8 }}>Cantidad</th>
              <th style={{ padding: 8 }}>Total</th>
              <th style={{ padding: 8 }}>Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {monthly.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 8, color: "var(--color-muted)" }}>
                  No hay datos disponibles.
                </td>
              </tr>
            ) : (
              monthly.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid #1f2430" }}>
                  <td style={{ padding: 8 }}>
                    {r.month}/{r.year}
                  </td>
                  <td style={{ padding: 8 }}>{r.cantidad}</td>
                  <td style={{ padding: 8 }}>{formatCurrency(r.total)}</td>
                  <td style={{ padding: 8 }}>{formatCurrency(r.ganancia)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === VENTAS POR VENDEDOR === */}
      <div className="card">
        <h3>👤 Ventas por vendedor</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--color-muted)" }}>
              <th style={{ padding: 8 }}>Vendedor</th>
              <th style={{ padding: 8 }}>Cantidad</th>
              <th style={{ padding: 8 }}>Total</th>
              <th style={{ padding: 8 }}>Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {bySeller.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 8, color: "var(--color-muted)" }}>
                  No hay datos disponibles.
                </td>
              </tr>
            ) : (
              bySeller.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid #1f2430" }}>
                  <td style={{ padding: 8 }}>{r.vendedor}</td>
                  <td style={{ padding: 8 }}>{r.cantidad}</td>
                  <td style={{ padding: 8 }}>{formatCurrency(r.total)}</td>
                  <td style={{ padding: 8 }}>{formatCurrency(r.ganancia)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* === VENTAS POR MÉTODO DE PAGO === */}
      <div className="card">
        <h3>💳 Ventas por forma de pago</h3>
        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ textAlign: "left", color: "var(--color-muted)" }}>
              <th style={{ padding: 8 }}>Forma de pago</th>
              <th style={{ padding: 8 }}>Cantidad</th>
              <th style={{ padding: 8 }}>Total</th>
              <th style={{ padding: 8 }}>Ganancia</th>
            </tr>
          </thead>
          <tbody>
            {byPayment.length === 0 ? (
              <tr>
                <td colSpan={4} style={{ padding: 8, color: "var(--color-muted)" }}>
                  No hay datos disponibles.
                </td>
              </tr>
            ) : (
              byPayment.map((r, i) => (
                <tr key={i} style={{ borderTop: "1px solid #1f2430" }}>
                  <td style={{ padding: 8 }}>{r.payment_method}</td>
                  <td style={{ padding: 8 }}>{r.cantidad}</td>
                  <td style={{ padding: 8 }}>{formatCurrency(r.total)}</td>
                  <td style={{ padding: 8 }}>{formatCurrency(r.ganancia)}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
