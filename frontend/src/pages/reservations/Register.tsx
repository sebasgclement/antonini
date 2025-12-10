import { useEffect, useState, type FormEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentMethodModal from "../../components/modals/PaymentMethodModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import Toggle from "../../components/ui/Toggle";
import api from "../../lib/api";
import { useDolar } from "../../hooks/useDolar";

/* TIPOS */
type Vehicle = {
  id: number;
  plate: string;
  brand: string;
  model: string;
  price?: number;
  status: string;
};
type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  doc_number: string;
  email?: string;
};
type Payment = { method_id: number | ""; amount: number | ""; details?: any };
type PaymentMethod = {
  id: number;
  name: string;
  type: string;
  requires_details?: boolean;
};

export default function RegisterReservation() {
  const nav = useNavigate();
  const location = useLocation();
  const { dolar } = useDolar();

  // === ESTADOS ===
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // Cotitular
  const [hasCoowner, setHasCoowner] = useState(false);
  const [coName, setCoName] = useState("");
  const [coDni, setCoDni] = useState("");
  const [coPhone, setCoPhone] = useState("");

  // Economía
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [price, setPrice] = useState<number | "">("");
  const [transferCost, setTransferCost] = useState<number | "">("");
  const [adminCost, setAdminCost] = useState<number | "">("");

  // Toma de Usado
  const [includeUsed, setIncludeUsed] = useState(false);
  const [usedVehicle, setUsedVehicle] = useState<Vehicle | null>(null);
  const [usedChecklist, setUsedChecklist] = useState({
    titulo: false,
    cedula: false,
    "08": false,
    informe: false,
    libre_deuda: false,
    verificacion: false,
  });

  // Pagos
  const [includeDeposit, setIncludeDeposit] = useState(false);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  // UX
  const [searchPlate, setSearchPlate] = useState("");
  const [searchDni, setSearchDni] = useState("");
  const [searchUsedPlate, setSearchUsedPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  /* === CÁLCULOS === */
  const totalOperation =
    (Number(price) || 0) +
    (Number(transferCost) || 0) +
    (Number(adminCost) || 0);
  
  const totalPaid =
    (includeDeposit
      ? payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0)
      : 0) +
    (includeUsed && usedVehicle?.price ? Number(usedVehicle.price) : 0);
  
  const balance = totalOperation - totalPaid;

  // Actualizar cotización automática al cargar
  useEffect(() => {
    if (dolar?.venta && exchangeRate === 1) {
       setExchangeRate(dolar.venta);
    }
  }, [dolar, exchangeRate]);

  /* === CARGA INICIAL === */
  useEffect(() => {
    (async () => {
      try {
        const methods = await api.get("/payment-methods");
        setPaymentMethods(methods.data?.data || []);

        const savedV = localStorage.getItem("temp_reservation_vehicle");
        if (savedV) {
          const v = JSON.parse(savedV);
          setVehicle(v);
          setPrice(v.price || "");
          setSearchPlate(v.plate);
        }

        const savedC = localStorage.getItem("temp_reservation_customer");
        if (savedC) {
          const c = JSON.parse(savedC);
          setCustomer(c);
          setSearchDni(c.doc_number);
        }

        const savedU = localStorage.getItem("temp_reservation_used");
        if (savedU) {
          setUsedVehicle(JSON.parse(savedU));
          setIncludeUsed(true);
        }

        const params = new URLSearchParams(location.search);
        const vId = params.get("vehicle_id");

        if (vId && !savedV) {
          const res = await api.get(`/vehicles/${vId}`);
          const v = res.data?.data || res.data;
          if (v) {
            setVehicle(v);
            setPrice(v.price || "");
            setSearchPlate(v.plate);
          }
        }
      } catch (e) {
        console.error(e);
      }
    })();
  }, [location.search]);

  // --- 🔥 LÓGICA DE CONVERSIÓN DE MONEDA 🔥 ---
  const handleSwitchCurrency = (targetCurrency: "ARS" | "USD") => {
    if (currency === targetCurrency) return; // Si es la misma, no hacemos nada

    const rate = Number(exchangeRate);
    if (!rate || rate <= 1) {
        // Si no hay cotización válida, solo cambiamos la etiqueta
        setCurrency(targetCurrency);
        return;
    }

    // Función helper para convertir un valor individual
    const convertValue = (val: number | "") => {
        if (!val) return "";
        if (targetCurrency === "USD") {
            // ARS -> USD (Dividir)
            return Number((Number(val) / rate).toFixed(2));
        } else {
            // USD -> ARS (Multiplicar)
            return Math.round(Number(val) * rate);
        }
    };

    // Convertimos todos los campos monetarios
    setPrice(convertValue(price));
    setTransferCost(convertValue(transferCost));
    setAdminCost(convertValue(adminCost));

    setCurrency(targetCurrency);
  };

  const saveTempState = () => {
    if (vehicle) localStorage.setItem("temp_reservation_vehicle", JSON.stringify(vehicle));
    if (customer) localStorage.setItem("temp_reservation_customer", JSON.stringify(customer));
    if (usedVehicle) localStorage.setItem("temp_reservation_used", JSON.stringify(usedVehicle));
  };

  const searchEntity = async (type: "vehicle" | "customer" | "used", query: string) => {
    if (!query) return;
    try {
      const endpoint = type === "customer" ? `/customers?dni=${query}` : `/vehicles?search=${query}`;
      const res = await api.get(endpoint);
      const data = res.data?.data?.data?.[0] || res.data?.data?.[0];

      if (data) {
        if (type === "vehicle") {
          setVehicle(data);
          setPrice(data.price || "");
          setToast("Vehículo cargado ✅");
        }
        if (type === "customer") {
          setCustomer(data);
          setToast("Cliente cargado ✅");
        }
        if (type === "used") {
          setUsedVehicle(data);
          setToast("Usado cargado ✅");
        }
      } else {
        setToast("No se encontraron resultados");
      }
    } catch {
      setToast("Error en la búsqueda");
    }
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!vehicle || !customer) {
      setToast("Falta vehículo o cliente");
      return;
    }
    setLoading(true);

    try {
      const payload = {
        vehicle_id: vehicle.id,
        customer_id: customer.id,
        price: Number(price),
        currency,
        exchange_rate: Number(exchangeRate),
        transfer_cost: Number(transferCost),
        administrative_cost: Number(adminCost),

        second_buyer_name: hasCoowner ? coName : null,
        second_buyer_dni: hasCoowner ? coDni : null,
        second_buyer_phone: hasCoowner ? coPhone : null,

        used_vehicle_id: includeUsed ? usedVehicle?.id : null,
        used_vehicle_checklist: includeUsed ? usedChecklist : null,

        payment_methods: includeDeposit
          ? payments.filter((p) => p.amount && p.method_id)
          : [],
        deposit: includeDeposit
          ? payments.reduce((acc, p) => acc + Number(p.amount), 0)
          : 0,

        balance,
        status: "pendiente",
        date: new Date().toISOString().split("T")[0],
      };

      await api.post("/reservations", payload);

      localStorage.removeItem("temp_reservation_vehicle");
      localStorage.removeItem("temp_reservation_customer");
      localStorage.removeItem("temp_reservation_used");

      setToast("Reserva generada con éxito ✅");
      setTimeout(() => nav("/reservas"), 1000);
    } catch (err: any) {
      setToast(err.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container vstack" style={{ gap: 20 }}>
      {/* HEADER */}
      <div className="hstack" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="title" style={{ margin: 0 }}>Nueva Operación</h1>
        <Button
          onClick={() => nav("/reservas")}
          style={{ background: "transparent", color: "var(--color-muted)", border: "none" }}
        >
          Cancelar
        </Button>
      </div>

      <form onSubmit={onSubmit} className="vstack" style={{ gap: 20, paddingBottom: 80 }}>
        
        {/* === 1. DATOS DE LA OPERACIÓN === */}
        <div className="card vstack" style={{ gap: 16 }}>
          <div className="title" style={{ fontSize: "1.1rem", margin: 0 }}>Vehículo y Cliente</div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>
            {/* VEHÍCULO A VENDER */}
            <div className="vstack" style={{ gap: 8 }}>
              <div className="hstack" style={{ justifyContent: "space-between" }}>
                <label>Unidad a Vender</label>
                <a className="enlace" style={{ fontSize: "0.85rem", cursor: "pointer" }}
                  onClick={(e) => {
                    e.preventDefault();
                    saveTempState();
                    window.location.href = "/vehiculos/registro?redirect=/reservas/nueva";
                  }}
                >
                  + Nuevo Vehículo
                </a>
              </div>
              <div className="hstack">
                <Input placeholder="Patente / Modelo..." value={searchPlate} onChange={(e) => setSearchPlate(e.currentTarget.value)} />
                <Button type="button" onClick={() => searchEntity("vehicle", searchPlate)}>Buscar</Button>
              </div>
              {vehicle && (
                <div style={{ padding: 10, background: "var(--hover-bg)", borderRadius: "var(--radius)", fontSize: "0.9rem", border: "1px solid var(--color-primary)" }}>
                  🚗 <strong>{vehicle.brand} {vehicle.model}</strong> <br />
                  <small style={{ color: "var(--color-muted)" }}>Patente: {vehicle.plate} • Precio Lista: ${vehicle.price?.toLocaleString()}</small>
                </div>
              )}
            </div>

            {/* CLIENTE */}
            <div className="vstack" style={{ gap: 8 }}>
              <div className="hstack" style={{ justifyContent: "space-between" }}>
                <label>Cliente Titular</label>
                <a className="enlace" style={{ fontSize: "0.85rem", cursor: "pointer" }}
                  onClick={(e) => {
                    e.preventDefault();
                    saveTempState();
                    window.location.href = "/clientes/registro?redirect=/reservas/nueva";
                  }}
                >
                  + Nuevo Cliente
                </a>
              </div>
              <div className="hstack">
                <Input placeholder="DNI / Apellido..." value={searchDni} onChange={(e) => setSearchDni(e.currentTarget.value)} />
                <Button type="button" onClick={() => searchEntity("customer", searchDni)}>Buscar</Button>
              </div>
              {customer && (
                <div style={{ padding: 10, background: "var(--hover-bg)", borderRadius: "var(--radius)", fontSize: "0.9rem", border: "1px solid var(--color-primary)" }}>
                  👤 <strong>{customer.first_name} {customer.last_name}</strong> <br />
                  <small style={{ color: "var(--color-muted)" }}>Doc: {customer.doc_number}</small>
                </div>
              )}
            </div>
          </div>

          {/* COTITULAR */}
          <div style={{ marginTop: 8 }}>
            <Toggle label="Agregar Segundo Titular / Cónyuge" checked={hasCoowner} onChange={setHasCoowner} />
            {hasCoowner && (
              <div className="hstack" style={{ marginTop: 12, alignItems: "end" }}>
                <Input label="Nombre Completo" value={coName} onChange={(e) => setCoName(e.currentTarget.value)} />
                <Input label="DNI" value={coDni} onChange={(e) => setCoDni(e.currentTarget.value)} />
                <Input label="Teléfono" value={coPhone} onChange={(e) => setCoPhone(e.currentTarget.value)} />
              </div>
            )}
          </div>
        </div>

        {/* === 2. VALORES === */}
        <div className="card vstack" style={{ gap: 16 }}>
          <div className="hstack" style={{ justifyContent: "space-between" }}>
            <div className="title" style={{ fontSize: "1.1rem", margin: 0 }}>Valores de la Operación</div>

            {/* Selector Moneda */}
            <div className="hstack" style={{ gap: 0, border: "1px solid var(--color-border)", borderRadius: 8, overflow: "hidden" }}>
              <button
                type="button"
                // 🔥 CAMBIO: Usamos handleSwitchCurrency
                onClick={() => handleSwitchCurrency("ARS")}
                style={{
                  padding: "6px 12px", border: "none", cursor: "pointer",
                  background: currency === "ARS" ? "var(--color-primary)" : "transparent",
                  color: currency === "ARS" ? "#fff" : "var(--color-muted)",
                }}
              >
                Pesos (ARS)
              </button>
              <button
                type="button"
                // 🔥 CAMBIO: Usamos handleSwitchCurrency
                onClick={() => handleSwitchCurrency("USD")}
                style={{
                  padding: "6px 12px", border: "none", cursor: "pointer",
                  background: currency === "USD" ? "#22c55e" : "transparent",
                  color: currency === "USD" ? "#fff" : "var(--color-muted)",
                }}
              >
                Dólares (USD)
              </button>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 20 }}>
            {/* Precio Venta */}
            <div className="vstack" style={{ gap: 6 }}>
              <Input
                label={`Precio Negociado (${currency})`}
                type="number"
                value={price as any}
                onChange={(e) => setPrice(parseFloat(e.currentTarget.value))}
                style={{ fontWeight: "bold", fontSize: "1.1rem" }}
              />
              
              {/* HELPER VISUAL (Muestra la conversión en tiempo real) */}
              {price && exchangeRate > 1 && (
                <div style={{ fontSize: "0.8rem", color: "var(--color-muted)", paddingLeft: 4 }}>
                    Equivale a: <strong>{currency === 'USD' ? '$' : 'USD'} {
                        currency === 'USD' 
                        ? (Number(price) * exchangeRate).toLocaleString('es-AR')
                        : (Number(price) / exchangeRate).toLocaleString('en-US', {maximumFractionDigits: 2})
                    }</strong>
                </div>
              )}

              {/* COTIZACIÓN DÓLAR */}
              <div className="hstack" style={{ gap: 8, alignItems: "center", marginTop: 4 }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-muted)" }}>Cotización (USD):</span>
                <div style={{ position: 'relative', width: 100 }}>
                    <input
                    type="number"
                    value={exchangeRate}
                    onChange={(e) => setExchangeRate(Number(e.target.value))}
                    style={{
                        width: '100%', padding: "4px 8px", borderRadius: 6,
                        border: "1px solid var(--color-border)", background: "var(--input-bg)",
                        color: "var(--color-text)", textAlign: "right", fontWeight: 600,
                    }}
                    />
                </div>
                <button 
                    type="button"
                    onClick={() => dolar?.venta && setExchangeRate(dolar.venta)}
                    title={`Usar cotización actual: $${dolar?.venta || '...'}`}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer' }}
                >
                    🔄
                </button>
              </div>
            </div>

            <Input
              label="Gastos Transferencia"
              type="number"
              value={transferCost as any}
              onChange={(e) => setTransferCost(parseFloat(e.currentTarget.value))}
              placeholder="0.00"
            />
            <Input
              label="Gastos Administrativos"
              type="number"
              value={adminCost as any}
              onChange={(e) => setAdminCost(parseFloat(e.currentTarget.value))}
              placeholder="0.00"
            />
          </div>
        </div>

        {/* === 3. PAGOS Y TOMA === */}
        <div className="card vstack" style={{ gap: 20 }}>
          <div className="title" style={{ fontSize: "1.1rem", margin: 0 }}>Forma de Pago</div>

          {/* TOMA DE USADO */}
          <div style={{ background: "var(--input-bg)", borderRadius: 8, padding: 16, border: "1px solid var(--color-border)" }}>
            <Toggle label="Recibir Vehículo Usado (Permuta)" checked={includeUsed} onChange={setIncludeUsed} />

            {includeUsed && (
              <div className="vstack" style={{ marginTop: 16, gap: 16 }}>
                <div className="hstack">
                  <Input placeholder="Patente del usado..." value={searchUsedPlate} onChange={(e) => setSearchUsedPlate(e.currentTarget.value)} />
                  <Button type="button" onClick={() => searchEntity("used", searchUsedPlate)}>Buscar</Button>
                  <a className="enlace" style={{ cursor: "pointer" }}
                    onClick={(e) => {
                      e.preventDefault();
                      saveTempState();
                      window.location.href = `/vehiculos/registro?redirect=/reservas/nueva?used=1`;
                    }}
                  >
                    + Cargar Usado
                  </a>
                </div>

                {usedVehicle && (
                  <>
                    <div style={{ padding: 10, background: "var(--color-card)", borderRadius: 8, border: "1px solid var(--color-border)" }}>
                      🚗 Toma: <strong>{usedVehicle.brand} {usedVehicle.model}</strong> - Valor Toma: <strong style={{ color: "#22c55e" }}>${usedVehicle.price?.toLocaleString()}</strong>
                    </div>

                    <label style={{ fontSize: "0.9rem", color: "var(--color-muted)", marginTop: 8 }}>Documentación Recibida:</label>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10 }}>
                      {Object.keys(usedChecklist).map((key) => (
                        <label key={key} style={{ fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
                          <input
                            type="checkbox"
                            checked={(usedChecklist as any)[key]}
                            onChange={(e) => setUsedChecklist({ ...usedChecklist, [key]: e.target.checked })}
                          />
                          {key.replace("_", " ").toUpperCase()}
                        </label>
                      ))}
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* SEÑA / PAGOS */}
          <div style={{ background: "var(--input-bg)", borderRadius: 8, padding: 16, border: "1px solid var(--color-border)" }}>
            <Toggle label="Registrar Seña / Anticipo" checked={includeDeposit} onChange={setIncludeDeposit} />

            {includeDeposit && (
              <div className="vstack" style={{ marginTop: 16, gap: 12 }}>
                {payments.map((p, i) => (
                  <div key={i} className="hstack" style={{ alignItems: "flex-start" }}>
                    <div style={{ flex: 1 }}>
                      <select
                        className="form-control"
                        value={p.method_id}
                        onChange={(e) => {
                          const copy = [...payments];
                          copy[i].method_id = Number(e.target.value);
                          setPayments(copy);
                        }}
                      >
                        <option value="">Método...</option>
                        {paymentMethods.map((m) => (
                          <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ flex: 1 }}>
                      <Input
                        type="number"
                        placeholder="Monto"
                        value={p.amount as any}
                        onChange={(e) => {
                          const copy = [...payments];
                          copy[i].amount = Number(e.target.value);
                          setPayments(copy);
                        }}
                      />
                    </div>
                    <Button type="button" onClick={() => setPayments(payments.filter((_, idx) => idx !== i))} style={{ padding: "10px" }}>🗑</Button>
                  </div>
                ))}
                <div className="hstack">
                  <Button type="button" onClick={() => setPayments([...payments, { method_id: "", amount: "" }])}>+ Agregar Pago</Button>
                  <a className="enlace" style={{ cursor: "pointer" }} onClick={(e) => { e.preventDefault(); setShowPaymentModal(true); }}>+ Nuevo método</a>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 4. RESUMEN FINAL */}
        <div className="card" style={{ position: "sticky", bottom: 20, zIndex: 10, border: "2px solid var(--color-primary)", background: "var(--color-card)", boxShadow: "0 -4px 20px rgba(0,0,0,0.3)", padding: "16px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
            <div style={{ display: "flex", gap: 32 }}>
              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-muted)", textTransform: "uppercase" }}>Total Operación</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, whiteSpace: "nowrap" }}>
                  {currency === "USD" ? "USD" : "$"} {totalOperation.toLocaleString()}
                </span>
              </div>

              <div style={{ display: "flex", flexDirection: "column" }}>
                <span style={{ fontSize: "0.8rem", color: "var(--color-muted)", textTransform: "uppercase" }}>Saldo a Pagar</span>
                <span style={{ fontSize: "1.4rem", fontWeight: 800, color: balance > 0 ? "var(--color-danger)" : "var(--color-primary)", whiteSpace: "nowrap" }}>
                  {currency === "USD" ? "USD" : "$"} {balance.toLocaleString()}
                </span>
              </div>
            </div>

            <Button type="submit" loading={loading} style={{ padding: "12px 24px", fontSize: "1.1rem", fontWeight: 700, minWidth: "fit-content" }}>
              CONFIRMAR 📝
            </Button>
          </div>
        </div>
      </form>

      {/* Modal de métodos de pago */}
      {showPaymentModal && (
        <PaymentMethodModal
          onClose={() => setShowPaymentModal(false)}
          onCreated={(newMethod) => {
            setPaymentMethods([...paymentMethods, newMethod]);
            setToast("Método de pago creado ✅");
          }}
        />
      )}

      {toast && <Toast message={toast} type={toast.includes("✅") ? "success" : "error"} />}
    </div>
  );
}