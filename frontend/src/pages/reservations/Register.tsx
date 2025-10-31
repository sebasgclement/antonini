import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import api from "../../lib/api";

type Vehicle = {
  id: number;
  plate: string;
  brand: string;
  model: string;
  status: string;
  price?: number;
};

type Customer = {
  id: number;
  first_name: string;
  last_name: string;
  doc_number: string;
  email?: string;
  phone?: string;
};

type Payment = {
  method: string;
  amount: number | "";
};

export default function RegisterReservation() {
  const nav = useNavigate();

  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [usedVehicle, setUsedVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  const [searchPlate, setSearchPlate] = useState("");
  const [searchUsedPlate, setSearchUsedPlate] = useState("");
  const [searchDni, setSearchDni] = useState("");

  const [price, setPrice] = useState<number | "">("");
  const [deposit, setDeposit] = useState<number | "">("");
  const [comments, setComments] = useState("");
  const [toast, setToast] = useState("");
  const [loading, setLoading] = useState(false);

  const [payments, setPayments] = useState<Payment[]>([{ method: "", amount: "" }]);
  const [balance, setBalance] = useState<number>(0);

  // ==================== CARGA INICIAL ====================
  useEffect(() => {
    (async () => {
      try {
        const storedVehicle = localStorage.getItem("reservation_vehicle");
        const storedUsed = localStorage.getItem("reservation_used_vehicle");
        const storedCustomer = localStorage.getItem("reservation_customer");

        if (storedVehicle) setVehicle(JSON.parse(storedVehicle));
        if (storedUsed) setUsedVehicle(JSON.parse(storedUsed));
        if (storedCustomer) {
          const c = JSON.parse(storedCustomer);
          setCustomer(c);
          // ✅ Reflejar DNI visualmente
          setSearchDni(c.doc_number || c.dni || "");
        }

        // Vehículo recién registrado (nuevo o usado)
        const savedVehicle = localStorage.getItem("lastRegisteredVehicle");
        if (savedVehicle) {
          const v = JSON.parse(savedVehicle);
          localStorage.removeItem("lastRegisteredVehicle");

          try {
            let found = null;
            if (v.id) {
              const res = await api.get(`/vehicles/${v.id}`);
              found = res.data?.data || res.data;
            } else if (v.plate) {
              const res = await api.get(`/vehicles?search=${v.plate}`);
              found = res.data?.data?.data?.[0] || res.data?.data?.[0];
            }

            // ✅ Determinar si se registró para parte de pago
            const redirect = new URLSearchParams(window.location.search).get("redirect");
            if (found) {
              if (redirect?.includes("used")) {
                setUsedVehicle(found);
                setSearchUsedPlate(found.plate);
                localStorage.setItem("reservation_used_vehicle", JSON.stringify(found));
                setToast("Vehículo usado cargado automáticamente ✅");
              } else {
                setVehicle(found);
                setSearchPlate(found.plate);
                setPrice(found.price || "");
                localStorage.setItem("reservation_vehicle", JSON.stringify(found));
                setToast("Vehículo cargado automáticamente ✅");
              }
            }
          } catch {
            setToast("Error al cargar vehículo registrado");
          }
        }

        // Cliente recién registrado
        const savedCustomer = localStorage.getItem("lastRegisteredCustomer");
        if (savedCustomer) {
          const c = JSON.parse(savedCustomer);
          setCustomer(c);
          setSearchDni(c.doc_number || c.dni || "");
          localStorage.setItem("reservation_customer", JSON.stringify(c));
          localStorage.removeItem("lastRegisteredCustomer");
          setToast("Cliente cargado automáticamente ✅");
        }
      } catch {
        setToast("Error al cargar datos iniciales");
      }
    })();
  }, []);

  // ==================== EFECTOS ====================
  useEffect(() => {
    const total = Number(price) || 0;
    const paid = Number(deposit) || 0;
    const pagos = payments.reduce((acc, p) => acc + (Number(p.amount) || 0), 0);
    const tradeIn = usedVehicle?.price || 0;
    setBalance(total - paid - pagos - tradeIn);
  }, [price, deposit, payments, usedVehicle]);

  // Guardar en localStorage
  useEffect(() => {
    if (vehicle) localStorage.setItem("reservation_vehicle", JSON.stringify(vehicle));
  }, [vehicle]);
  useEffect(() => {
    if (usedVehicle)
      localStorage.setItem("reservation_used_vehicle", JSON.stringify(usedVehicle));
  }, [usedVehicle]);
  useEffect(() => {
    if (customer) localStorage.setItem("reservation_customer", JSON.stringify(customer));
  }, [customer]);
  useEffect(() => {
    if (price !== "") localStorage.setItem("reservation_price", JSON.stringify(price));
  }, [price]);
  useEffect(() => {
    const storedPrice = localStorage.getItem("reservation_price");
    if (storedPrice) setPrice(JSON.parse(storedPrice));
  }, []);

  // ==================== BUSCAR VEHÍCULO ====================
  const searchVehicle = async () => {
    if (!searchPlate.trim()) return;
    try {
      const res = await api.get(`/vehicles?search=${searchPlate}`);
      const found = res.data?.data?.data?.[0] || res.data?.data?.[0];
      if (found) {
        setVehicle(found);
        setPrice(found.price || "");
        localStorage.setItem("reservation_vehicle", JSON.stringify(found));
        localStorage.setItem("reservation_price", JSON.stringify(found.price || ""));
        setToast("Vehículo encontrado ✅");
      } else {
        setVehicle(null);
        localStorage.removeItem("reservation_vehicle");
        setToast("No se encontró vehículo con esa patente");
      }
    } catch {
      setToast("Error al buscar vehículo");
    }
  };

  // ==================== BUSCAR VEHÍCULO USADO ====================
  const searchUsedVehicle = async () => {
    if (!searchUsedPlate.trim()) return;
    try {
      const res = await api.get(`/vehicles?search=${searchUsedPlate}`);
      const found = res.data?.data?.data?.[0] || res.data?.data?.[0];
      if (found) {
        setUsedVehicle(found);
        localStorage.setItem("reservation_used_vehicle", JSON.stringify(found));
        setToast("Vehículo usado encontrado ✅");
      } else {
        setUsedVehicle(null);
        localStorage.removeItem("reservation_used_vehicle");
        setToast("No se encontró vehículo usado con esa patente");
      }
    } catch {
      setToast("Error al buscar vehículo usado");
    }
  };

  // ==================== BUSCAR CLIENTE ====================
const searchCustomer = async () => {
  if (!searchDni.trim()) return;

  try {
    const res = await api.get(`/customers?dni=${searchDni}`);
    const found = res.data?.data?.[0];

    if (found) {
      // ✅ Guardamos el cliente completo con id real
      setCustomer(found);
      setSearchDni(found.doc_number || "");
      localStorage.setItem("reservation_customer", JSON.stringify(found));
      setToast("Cliente encontrado ✅");
    } else {
      setCustomer(null);
      localStorage.removeItem("reservation_customer");
      setToast("No se encontró cliente con ese DNI");
    }
  } catch {
    setToast("Error al buscar cliente");
  }
};


  // ==================== GESTIÓN DE PAGOS ====================
  const addPayment = () => setPayments([...payments, { method: "", amount: "" }]);
  const updatePayment = (index: number, key: keyof Payment, value: any) => {
    const updated = [...payments];
    updated[index][key] = value;
    setPayments(updated);
  };
  const removePayment = (index: number) =>
    setPayments(payments.filter((_, i) => i !== index));

  // ==================== SUBMIT ====================
const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  setLoading(true);

  // 🚨 Validaciones previas
  if (!vehicle?.id) {
    setToast("Debe seleccionar un vehículo válido");
    setLoading(false);
    return;
  }

  if (!customer?.id) {
    setToast("Debe seleccionar un cliente válido");
    setLoading(false);
    return;
  }

  try {
    await api.post("/reservations", {
      vehicle_id: vehicle.id,
      used_vehicle_id: usedVehicle?.id || null,
      customer_id: customer.id,
      seller_id: 1, // ⚠️ reemplazar por el usuario logueado más adelante
      price,
      deposit,
      payment_methods: payments,
      balance,
      comments,
    });

    setToast("Reserva creada correctamente ✅");

    // 🧹 Limpiamos solo los datos de esta reserva
    localStorage.removeItem("reservation_vehicle");
    localStorage.removeItem("reservation_used_vehicle");
    localStorage.removeItem("reservation_customer");
    localStorage.removeItem("reservation_price");

    setTimeout(() => nav("/reservas"), 800);
  } catch (err: any) {
    setToast(err?.response?.data?.message || "No se pudo registrar la reserva");
  } finally {
    setLoading(false);
  }
};


  // ==================== RENDER ====================
  return (
    <div className="container">
      <form onSubmit={onSubmit} className="vstack" style={{ gap: 16 }}>
        <div className="title">Registrar reserva</div>

        {/* VEHÍCULO PRINCIPAL */}
        <div className="card vstack" style={{ gap: 16 }}>
          <label>Vehículo principal *</label>
          <a href="/vehiculos/registro?redirect=/reservas/nueva" className="enlace">
            + Registrar vehículo
          </a>
          <div className="hstack" style={{ gap: 8 }}>
            <Input
              label="Buscar por patente"
              value={searchPlate}
              onChange={(e) => setSearchPlate(e.currentTarget.value)}
              placeholder="Ej: AB123CD"
            />
            <Button type="button" onClick={searchVehicle}>Buscar</Button>
          </div>
          {vehicle && (
            <div className="card" style={{ background: "#11161f", padding: 12 }}>
              <p><strong>{vehicle.brand} {vehicle.model}</strong> — {vehicle.plate}</p>
              <p>Precio: ${vehicle.price?.toLocaleString() || "—"}</p>
            </div>
          )}
        </div>

        {/* CLIENTE */}
        <div className="card vstack" style={{ gap: 16 }}>
          <label>Cliente *</label>
          <a href="/clientes/registro?redirect=/reservas/nueva" className="enlace">
            + Registrar cliente
          </a>
          <div className="hstack" style={{ gap: 8 }}>
            <Input
              label="Buscar por DNI"
              value={searchDni}
              onChange={(e) => setSearchDni(e.currentTarget.value)}
              placeholder="Ej: 30123456"
            />
            <Button type="button" onClick={searchCustomer}>Buscar</Button>
          </div>
          {customer && (
            <div className="card" style={{ background: "#11161f", padding: 12 }}>
              <p><strong>{customer.first_name} {customer.last_name}</strong></p>
              <p>DNI: {customer.doc_number}</p>
              {customer.email && <p>Email: {customer.email}</p>}
              {customer.phone && <p>Tel: {customer.phone}</p>}
            </div>
          )}
        </div>

        {/* VEHÍCULO USADO */}
        <div className="card vstack" style={{ gap: 16 }}>
          <label>Vehículo usado (opcional)</label>
          <a href="/vehiculos/registro?redirect=/reservas/nueva?type=used" className="enlace">
            + Registrar vehículo usado
          </a>
          <div className="hstack" style={{ gap: 8 }}>
            <Input
              label="Buscar por patente"
              value={searchUsedPlate}
              onChange={(e) => setSearchUsedPlate(e.currentTarget.value)}
              placeholder="Ej: AC987EF"
            />
            <Button type="button" onClick={searchUsedVehicle}>Buscar</Button>
          </div>
          {usedVehicle && (
            <div className="card" style={{ background: "#11161f", padding: 12 }}>
              <p><strong>{usedVehicle.brand} {usedVehicle.model}</strong> — {usedVehicle.plate}</p>
              <p>Valor tomado: ${usedVehicle.price?.toLocaleString() || "—"}</p>
            </div>
          )}
        </div>

        {/* DATOS ECONÓMICOS */}
        <div className="card vstack" style={{ gap: 16 }}>
          <Input
            label="Precio de venta ($)"
            type="number"
            value={price as any}
            onChange={(e) => setPrice(parseFloat(e.currentTarget.value) || "")}
            required
          />
          <Input
            label="Seña / anticipo ($)"
            type="number"
            value={deposit as any}
            onChange={(e) => setDeposit(parseFloat(e.currentTarget.value) || "")}
          />

          <div className="vstack" style={{ gap: 8 }}>
            <label>Medios de pago</label>
            {payments.map((p, i) => (
              <div key={i} className="hstack" style={{ gap: 8 }}>
                <select
                  value={p.method}
                  onChange={(e) => updatePayment(i, "method", e.currentTarget.value)}
                  required
                >
                  <option value="">Seleccionar…</option>
                  <option value="efectivo">Efectivo</option>
                  <option value="transferencia">Transferencia</option>
                  <option value="cheque">Cheque</option>
                  <option value="tarjeta_debito">Tarjeta Débito</option>
                  <option value="tarjeta_credito">Tarjeta Crédito</option>
                </select>
                <Input
                  type="number"
                  label="Monto"
                  value={p.amount as any}
                  onChange={(e) =>
                    updatePayment(
                      i,
                      "amount",
                      parseFloat(e.currentTarget.value) || ""
                    )
                  }
                />
                <Button type="button" onClick={() => removePayment(i)}>🗑</Button>
              </div>
            ))}
            <Button type="button" onClick={addPayment}>+ Agregar medio</Button>
          </div>
        </div>

        {/* SALDO */}
        <div className="card vstack" style={{ gap: 12 }}>
          <label>Saldo restante ($)</label>
          <input type="number" value={balance} readOnly className="input-readonly" />
        </div>

        {/* COMENTARIOS */}
        <div className="card vstack" style={{ gap: 12 }}>
          <label>Comentarios</label>
          <textarea
            placeholder="Observaciones adicionales, condiciones de pago, etc."
            value={comments}
            onChange={(e) => setComments(e.currentTarget.value)}
            className="textarea"
          />
        </div>

        <div className="hstack" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" loading={loading}>Guardar</Button>
        </div>
      </form>

      {toast && (
        <Toast message={toast} type={toast.includes("✅") ? "success" : "error"} />
      )}
    </div>
  );
}
