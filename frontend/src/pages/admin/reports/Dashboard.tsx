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

// Componente interno para Widget de Métrica
const MetricCard = ({ title, value, colorClass }: any) => {
    const colors: Record<string, string> = {
        blue: 'rgba(59, 130, 246, 0.1)',
        textBlue: '#3b82f6',
        green: 'rgba(34, 197, 94, 0.1)',
        textGreen: '#22c55e',
        purple: 'rgba(168, 85, 247, 0.1)',
        textPurple: '#a855f7',
    };

    return (
        <div style={{
            background: 'var(--color-card)',
            border: '1px solid var(--color-border)',
            borderRadius: 'var(--radius)',
            padding: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
            boxShadow: 'var(--shadow)',
            position: 'relative',
            overflow: 'hidden'
        }}>
            <div style={{fontSize: '0.9rem', color: 'var(--color-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', fontWeight: 600}}>
                {title}
            </div>
            <div style={{fontSize: '1.8rem', fontWeight: 700, color: colors['text' + colorClass.charAt(0).toUpperCase() + colorClass.slice(1)]}}>
                {value}
            </div>
            {/* Decoración de fondo */}
            <div style={{
                position: 'absolute', top: -10, right: -10, width: 80, height: 80,
                background: colors[colorClass], borderRadius: '50%', opacity: 0.5
            }} />
        </div>
    )
}

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
  }, []); // Carga inicial

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

  // 🔹 Sumar totales
  const totals = monthly.reduce((acc, curr) => ({
    cantidad: acc.cantidad + (curr.cantidad || 0),
    total: acc.total + (curr.total || 0),
    ganancia: acc.ganancia + (curr.ganancia || 0),
  }), { cantidad: 0, total: 0, ganancia: 0 });

  return (
    <div className="vstack" style={{ gap: 24 }}>
      
      {/* HEADER + FILTROS */}
      <div className="vstack" style={{ gap: 16 }}>
          <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <h1 className="title" style={{margin: 0}}>Tablero de Control</h1>
            <div className="hstack" style={{ gap: 8 }}>
                <Button onClick={loadReports} loading={loading}>
                    🔄 Actualizar
                </Button>
                <Button onClick={handleDownload} loading={downloading} style={{background: 'var(--color-text)', color: 'var(--color-bg)'}}>
                    📄 Exportar PDF
                </Button>
            </div>
          </div>

          <div className="card" style={{padding: 20}}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 16, alignItems: 'end' }}>
                
                <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                    <label style={{fontSize: '0.85rem'}}>Año Fiscal</label>
                    <Input type="number" name="year" value={filters.year} onChange={handleChange} />
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                    <label style={{fontSize: '0.85rem'}}>Desde</label>
                    <Input type="date" name="start_date" value={filters.start_date} onChange={handleChange} />
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                    <label style={{fontSize: '0.85rem'}}>Hasta</label>
                    <Input type="date" name="end_date" value={filters.end_date} onChange={handleChange} />
                </div>

                <div style={{display: 'flex', flexDirection: 'column', gap: 6}}>
                    <label style={{fontSize: '0.85rem'}}>Vendedor</label>
                    <select
                        name="seller_id"
                        value={filters.seller_id}
                        onChange={handleChange}
                        className="form-control"
                        style={{height: 42}}
                    >
                        <option value="">Todos</option>
                        {sellers.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
            </div>
          </div>
      </div>

      {/* === KPI WIDGETS === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 20 }}>
        <MetricCard title="Ventas Totales" value={formatCurrency(totals.total)} colorClass="blue" />
        <MetricCard title="Unidades Vendidas" value={totals.cantidad} colorClass="purple" />
        <MetricCard title="Ganancia Neta" value={formatCurrency(totals.ganancia)} colorClass="green" />
      </div>

      {error && <Toast message={error} type="error" />}

      {/* === TABLAS GRID (2 Columnas arriba, 1 abajo) === */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: 24 }}>
        
        {/* Ventas Mensuales */}
        <div className="card vstack" style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
            <div style={{padding: '16px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, background: 'var(--hover-bg)'}}>
                📅 Evolución Mensual
            </div>
            <div style={{overflowX: 'auto'}}>
                <table className="modern-table" style={{marginTop: 0, border: 'none'}}>
                    <thead>
                    <tr>
                        <th>Mes</th>
                        <th style={{textAlign: 'right'}}>Cant.</th>
                        <th style={{textAlign: 'right'}}>Total</th>
                        <th style={{textAlign: 'right'}}>Ganancia</th>
                    </tr>
                    </thead>
                    <tbody>
                    {monthly.length === 0 ? (
                        <tr><td colSpan={4} style={{textAlign: 'center', padding: 20, color: 'var(--color-muted)'}}>Sin datos</td></tr>
                    ) : (
                        monthly.map((r, i) => (
                        <tr key={i}>
                            <td>{r.month}/{r.year}</td>
                            <td style={{textAlign: 'right'}}>{r.cantidad}</td>
                            <td style={{textAlign: 'right', fontWeight: 600}}>{formatCurrency(r.total)}</td>
                            <td style={{textAlign: 'right', color: 'var(--color-primary)'}}>{formatCurrency(r.ganancia)}</td>
                        </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>

        {/* Ventas por Vendedor */}
        <div className="card vstack" style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
            <div style={{padding: '16px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, background: 'var(--hover-bg)'}}>
                👤 Rendimiento por Vendedor
            </div>
            <div style={{overflowX: 'auto'}}>
                <table className="modern-table" style={{marginTop: 0, border: 'none'}}>
                    <thead>
                    <tr>
                        <th>Vendedor</th>
                        <th style={{textAlign: 'right'}}>Cant.</th>
                        <th style={{textAlign: 'right'}}>Total</th>
                    </tr>
                    </thead>
                    <tbody>
                    {bySeller.length === 0 ? (
                        <tr><td colSpan={3} style={{textAlign: 'center', padding: 20, color: 'var(--color-muted)'}}>Sin datos</td></tr>
                    ) : (
                        bySeller.map((r, i) => (
                        <tr key={i}>
                            <td style={{fontWeight: 500}}>{r.vendedor}</td>
                            <td style={{textAlign: 'right'}}>{r.cantidad}</td>
                            <td style={{textAlign: 'right'}}>{formatCurrency(r.total)}</td>
                        </tr>
                        ))
                    )}
                    </tbody>
                </table>
            </div>
        </div>

      </div>

      {/* Ventas por Medio de Pago (Full Width) */}
      <div className="card vstack" style={{ gap: 0, padding: 0, overflow: 'hidden' }}>
        <div style={{padding: '16px 20px', borderBottom: '1px solid var(--color-border)', fontWeight: 600, background: 'var(--hover-bg)'}}>
            💳 Desglose por Medio de Pago
        </div>
        <div style={{overflowX: 'auto'}}>
            <table className="modern-table" style={{marginTop: 0, border: 'none'}}>
                <thead>
                <tr>
                    <th>Medio de Pago</th>
                    <th style={{textAlign: 'right'}}>Operaciones</th>
                    <th style={{textAlign: 'right'}}>Volumen Total</th>
                    <th style={{textAlign: 'right'}}>Rentabilidad</th>
                </tr>
                </thead>
                <tbody>
                {byPayment.length === 0 ? (
                    <tr><td colSpan={4} style={{textAlign: 'center', padding: 20, color: 'var(--color-muted)'}}>Sin datos</td></tr>
                ) : (
                    byPayment.map((r, i) => (
                    <tr key={i}>
                        <td style={{textTransform: 'capitalize'}}>{r.payment_method || "No especificado"}</td>
                        <td style={{textAlign: 'right'}}>{r.cantidad}</td>
                        <td style={{textAlign: 'right', fontWeight: 600}}>{formatCurrency(r.total)}</td>
                        <td style={{textAlign: 'right', color: 'var(--color-primary)'}}>{formatCurrency(r.ganancia)}</td>
                    </tr>
                    ))
                )}
                </tbody>
            </table>
        </div>
      </div>

    </div>
  );
}