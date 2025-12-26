import { useEffect, useState, type FormEvent, type ChangeEvent } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import PaymentMethodModal from "../../components/modals/PaymentMethodModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import Toggle from "../../components/ui/Toggle";
import api from "../../lib/api";
import { useDolar } from "../../hooks/useDolar";

/* === TIPOS === */
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

// TIPOS ACTUALIZADOS PARA CHEQUES
type CheckDetails = {
    bank: string;
    number: string; // N° Cheque (opcional, pero útil)
    holder: string;
    payment_date: string;  // Fecha de Cobro
    delivery_date: string; // Fecha de Entrega
};

type Payment = { 
    method_id: number | ""; 
    amount: number | ""; 
    method_name?: string;
    details?: CheckDetails | null; 
};

type PaymentMethod = {
  id: number;
  name: string;
  type: string;
};

type Partner = {
  id: string;
  full_name: string;
  dni: string;
  phone: string;
  photo: File | null;
};

const STATIC_METHODS: PaymentMethod[] = [
    { id: 1, name: "Efectivo", type: "cash" },
    { id: 2, name: "Transferencia Bancaria", type: "bank" },
    { id: 3, name: "Cheque / eCheck", type: "check" }, 
    { id: 4, name: "Tarjeta Débito/Crédito", type: "card" },
    { id: 5, name: "Crédito Prendario", type: "credit_bank" },
    { id: 6, name: "Permuta / Usado", type: "trade" },
  ];

export default function RegisterReservation() {
  const nav = useNavigate();
  const location = useLocation();
  const { dolar } = useDolar();

  // === ESTADOS ===
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);

  // --- SOCIOS ---
  const [includePartners, setIncludePartners] = useState(false);
  const [partners, setPartners] = useState<Partner[]>([
    { id: crypto.randomUUID(), full_name: "", dni: "", phone: "", photo: null }
  ]);

  // Economía
  const [currency, setCurrency] = useState<"ARS" | "USD">("ARS");
  const [exchangeRate, setExchangeRate] = useState<number>(1);
  const [price, setPrice] = useState<number | "">("");
  const [transferCost, setTransferCost] = useState<number | "">("");
  const [adminCost, setAdminCost] = useState<number | "">("");

  // Toma de Usado
  const [includeUsed, setIncludeUsed] = useState(false);
  const [usedVehicle, setUsedVehicle] = useState<Vehicle | null>(null);
  const [usedValue, setUsedValue] = useState<number | "">(""); 
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
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(STATIC_METHODS);
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
    (includeUsed ? (Number(usedValue) || 0) : 0);
  
  const balance = totalOperation - totalPaid;

  useEffect(() => {
    if (dolar?.venta && exchangeRate === 1) {
       setExchangeRate(dolar.venta);
    }
  }, [dolar]);

  /* === CARGA INICIAL === */
  useEffect(() => {
    (async () => {
      try {
        const res = await api.get("/payment-methods");
        const dbMethods: PaymentMethod[] = res.data?.data || [];
        
        const newMethods = dbMethods.filter(
            (dbMethod) => !STATIC_METHODS.some((staticMethod) => staticMethod.id === dbMethod.id)
        );
        setPaymentMethods([...STATIC_METHODS, ...newMethods]);

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
          const u = JSON.parse(savedU);
          setUsedVehicle(u);
          setUsedValue(u.price || "");
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

  // --- HANDLERS ---
  const handleAddPartner = () => {
    setPartners([...partners, { id: crypto.randomUUID(), full_name: "", dni: "", phone: "", photo: null }]);
  };
  const handleRemovePartner = (id: string) => {
    if (partners.length === 1) return; 
    setPartners(partners.filter(p => p.id !== id));
  };
  const updatePartner = (id: string, field: keyof Partner, value: any) => {
    setPartners(partners.map(p => p.id === id ? { ...p, [field]: value } : p));
  };
  const handlePartnerPhoto = (id: string, e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      updatePartner(id, "photo", e.target.files[0]);
    }
  };

  const addPayment = (method: PaymentMethod) => {
    const today = new Date().toISOString().split("T")[0];
    const initialDetails = method.id === 3 ? {
        bank: "",
        number: "",
        holder: "",
        payment_date: "",
        delivery_date: today // Seteamos fecha entrega por defecto hoy
    } : null;

    setPayments([...payments, { 
        method_id: method.id, 
        amount: "", 
        method_name: method.name,
        details: initialDetails
    }]);
    setShowPaymentModal(false);
  };

  const removePayment = (index: number) => {
    const newP = [...payments];
    newP.splice(index, 1);
    setPayments(newP);
  };

  const updatePaymentAmount = (index: number, val: string) => {
    const newP = [...payments];
    newP[index].amount = val === "" ? "" : parseFloat(val);
    setPayments(newP);
  };

  const updatePaymentDetails = (index: number, field: keyof CheckDetails, val: string) => {
      const newP = [...payments];
      if (newP[index].details) {
          newP[index].details = { ...newP[index].details!, [field]: val };
          setPayments(newP);
      }
  };

  const handleSwitchCurrency = (targetCurrency: "ARS" | "USD") => {
    if (currency === targetCurrency) return; 
    const rate = Number(exchangeRate);
    if (!rate || rate <= 1) {
       setCurrency(targetCurrency);
       return;
    }
    const convertValue = (val: number | "") => {
        if (!val) return "";
        return targetCurrency === "USD" 
            ? Number((Number(val) / rate).toFixed(2))
            : Math.round(Number(val) * rate);
    };

    setPrice(convertValue(price));
    setTransferCost(convertValue(transferCost));
    setAdminCost(convertValue(adminCost));
    setUsedValue(convertValue(usedValue)); 

    const newPayments = payments.map(p => ({ ...p, amount: convertValue(p.amount) }));
    setPayments(newPayments as Payment[]);
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
        } else if (type === "customer") {
          setCustomer(data);
          setToast("Cliente cargado ✅");
        } else if (type === "used") {
          setUsedVehicle(data);
          setUsedValue(data.price || "");
          setToast("Usado cargado ✅");
        }
      } else {
        setToast("No se encontraron resultados");
      }
    } catch {
      setToast("Error en la búsqueda");
    }
  };

  const printMileageDDJJ = () => {
    if (!customer || !usedVehicle) {
      setToast("Seleccioná cliente y vehículo usado primero");
      return;
    }
    
    // Aquí definimos la fecha
    const dateStr = new Date().toLocaleDateString('es-AR', { year: 'numeric', month: 'long', day: 'numeric' });

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) return;

    // Aquí la USAMOS (mira ${dateStr} dentro del HTML)
    printWindow.document.write(`
      <html>
        <head>
          <title>DDJJ Kilometraje</title>
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; line-height: 1.6; }
            h1 { text-align: center; font-size: 18px; text-decoration: underline; margin-bottom: 30px; }
            p { margin-bottom: 15px; }
            .firma { margin-top: 100px; text-align: right; border-top: 1px solid #000; width: 200px; margin-left: auto; padding-top: 10px; }
          </style>
        </head>
        <body>
          <h1>DECLARACIÓN JURADA DE KILOMETRAJE</h1>
          
          <p>En la ciudad de Rafaela, a los <strong>${dateStr}</strong>.</p>

          <p>
            Por la presente, yo <strong>${customer.first_name} ${customer.last_name}</strong>, 
            DNI <strong>${customer.doc_number}</strong>, declaro bajo juramento que el vehículo 
            usado que entrego en parte de pago:
          </p>
          
          <ul>
            <li>Marca: <strong>${usedVehicle.brand}</strong></li>
            <li>Modelo: <strong>${usedVehicle.model}</strong></li>
            <li>Dominio: <strong>${usedVehicle.plate}</strong></li>
          </ul>

          <p>
            Posee el kilometraje real y su odómetro funciona correctamente al momento de la entrega.
            Asimismo, libero de toda responsabilidad a la agencia por vicios ocultos o desperfectos 
            que pudieran surgir con posterioridad a esta fecha.
          </p>

          <div class="firma">
             Firma y Aclaración
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();

    if (includeUsed && usedVehicle && !usedChecklist["08"]) {
        setToast("❌ ERROR: El 08 firmado es obligatorio para tomar un usado.");
        return; 
    }

    if (!vehicle || !customer) {
      setToast("Falta vehículo o cliente");
      return;
    }

    // Validación de Cheques
    if (includeDeposit) {
        for (const p of payments) {
            if (p.method_id === 3 && p.details) {
                if(!p.details.bank || !p.details.holder || !p.details.payment_date) {
                    setToast("❌ Falta completar datos bancarios en el cheque ingresado.");
                    return;
                }
            }
        }
    }

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("vehicle_id", String(vehicle.id));
      formData.append("customer_id", String(customer.id));
      formData.append("price", String(price || 0));
      formData.append("currency", currency);
      formData.append("exchange_rate", String(exchangeRate));
      formData.append("transfer_cost", String(transferCost || 0));
      formData.append("administrative_cost", String(adminCost || 0));
      formData.append("balance", String(balance));
      formData.append("status", "pendiente");
      formData.append("date", new Date().toISOString().split("T")[0]);

      if (includeUsed && usedVehicle) {
        formData.append("used_vehicle_id", String(usedVehicle.id));
        formData.append("used_vehicle_price", String(usedValue || 0));
        formData.append("used_vehicle_checklist", JSON.stringify(usedChecklist));
      }

      if (includeDeposit) {
        const validPayments = payments.filter((p) => p.amount && p.method_id);
        const depositTotal = validPayments.reduce((acc, p) => acc + Number(p.amount), 0);
        formData.append("deposit", String(depositTotal));
        
        validPayments.forEach((p, index) => {
            formData.append(`payment_methods[${index}][method_id]`, String(p.method_id));
            formData.append(`payment_methods[${index}][amount]`, String(p.amount));
            if (p.details) {
                 formData.append(`payment_methods[${index}][details]`, JSON.stringify(p.details));
            }
        });
      }

      if (includePartners) {
        partners.forEach((partner, index) => {
            if (partner.full_name.trim() !== "") {
                formData.append(`partners[${index}][full_name]`, partner.full_name);
                formData.append(`partners[${index}][dni]`, partner.dni);
                formData.append(`partners[${index}][phone]`, partner.phone);
                if (partner.photo) {
                    formData.append(`partners[${index}][photo]`, partner.photo);
                }
            }
        });
      }

      await api.post("/reservations", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      localStorage.removeItem("temp_reservation_vehicle");
      localStorage.removeItem("temp_reservation_customer");
      localStorage.removeItem("temp_reservation_used");

      setToast("Reserva generada con éxito ✅");
      setTimeout(() => nav("/reservas"), 1000);
    } catch (err: any) {
      console.error(err);
      setToast(err.response?.data?.message || "Error al guardar");
    } finally {
      setLoading(false);
    }
  };

  return (
    // Agregamos pb-20 para dar espacio al footer flotante
    <div className="container vstack" style={{ gap: 20, paddingBottom: 100, position: 'relative' }}>
        <style>{`
            /* CAMBIO CLAVE: sticky en lugar de fixed.
              Esto hace que viva DENTRO del contenedor 'container' 
              y respete los anchos.
            */
            .sticky-footer {
                position: sticky; 
                bottom: 0;
                background-color: var(--color-card);
                border-top: 1px solid var(--color-border);
                padding: 16px;
                box-shadow: 0 -4px 10px rgba(0,0,0,0.05);
                z-index: 50;
                border-radius: 8px 8px 0 0;
                margin-top: auto; /* Empuja hacia abajo si sobra espacio */
            }

            .check-inline-grid {
                display: grid;
                grid-template-columns: 1fr 1fr;
                gap: 12px;
                margin-top: 12px;
                padding: 12px;
                background: rgba(0,0,0,0.03);
                border-radius: 6px;
                border: 1px dashed var(--color-border);
            }
            
            /* Inputs de fecha más lindos */
            input[type="date"] {
               font-family: inherit;
               cursor: pointer;
            }

            @media (max-width: 600px) {
                .check-inline-grid { grid-template-columns: 1fr; }
                .sticky-footer { flex-direction: column; gap: 10px; }
            }
        `}</style>

      {/* HEADER */}
      <div className="hstack" style={{ justifyContent: "space-between", alignItems: "center" }}>
        <h1 className="title" style={{ margin: 0 }}>Nueva Operación</h1>
        <Button onClick={() => nav("/reservas")} style={{ background: "transparent", color: "var(--color-muted)", border: "none" }}>
          Cancelar
        </Button>
      </div>

      <form id="reservation-form" onSubmit={onSubmit} className="vstack" style={{ gap: 20 }}>
        
        {/* 1. DATOS OPERACIÓN */}
        <div className="card vstack" style={{ gap: 16 }}>
          <div className="title" style={{ fontSize: "1.1rem", margin: 0 }}>Vehículo y Cliente</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: 20 }}>
            {/* ... Buscadores ... */}
            <div className="vstack" style={{ gap: 8 }}>
               <label>Unidad a Vender</label>
               <div className="hstack">
                 <Input placeholder="Patente..." value={searchPlate} onChange={(e) => setSearchPlate(e.currentTarget.value)} />
                 <Button type="button" onClick={() => searchEntity("vehicle", searchPlate)}>Buscar</Button>
               </div>
               <div className="hstack" style={{justifyContent:'flex-end'}}>
                 <a style={{fontSize:'0.8rem', cursor:'pointer', color:'var(--color-primary)'}} onClick={()=>{saveTempState(); window.location.href="/vehiculos/registro?redirect=/reservas/nueva"}}>+ Nuevo Vehículo</a>
               </div>
               {vehicle && <div style={{padding:10, background: 'var(--hover-bg)', borderRadius: 8}}>🚗 {vehicle.brand} {vehicle.model} - {vehicle.plate}</div>}
            </div>
            
            <div className="vstack" style={{ gap: 8 }}>
               <label>Cliente</label>
               <div className="hstack">
                 <Input placeholder="DNI..." value={searchDni} onChange={(e) => setSearchDni(e.currentTarget.value)} />
                 <Button type="button" onClick={() => searchEntity("customer", searchDni)}>Buscar</Button>
               </div>
               <div className="hstack" style={{justifyContent:'flex-end'}}>
                 <a style={{fontSize:'0.8rem', cursor:'pointer', color:'var(--color-primary)'}} onClick={()=>{saveTempState(); window.location.href="/clientes/registro?redirect=/reservas/nueva"}}>+ Nuevo Cliente</a>
               </div>
               {customer && <div style={{padding:10, background: 'var(--hover-bg)', borderRadius: 8}}>👤 {customer.first_name} {customer.last_name}</div>}
            </div>
          </div>
          
          {/* SOCIOS ... (mismo código) */}
          <div style={{ marginTop: 8 }}>
            <Toggle label="Agregar Socios / Cónyuge" checked={includePartners} onChange={setIncludePartners} />
            {includePartners && (
              <div className="vstack" style={{ gap: 12, marginTop: 12, padding: 12, background: "var(--input-bg)", borderRadius: 8 }}>
                {partners.map((partner, index) => (
                  <div key={partner.id} className="hstack" style={{ gap: 10, flexWrap: "wrap", alignItems:'flex-end' }}>
                      <Input label={index===0?"Nombre":""} value={partner.full_name} onChange={(e)=>updatePartner(partner.id,'full_name',e.target.value)} />
                      <Input label={index===0?"DNI":""} value={partner.dni} onChange={(e)=>updatePartner(partner.id,'dni',e.target.value)} />
                      <Input label={index===0?"Tel":""} value={partner.phone} onChange={(e)=>updatePartner(partner.id,'phone',e.target.value)} />
                      <label className="button" style={{fontSize: '0.8rem', padding: '10px', background: partner.photo ? 'var(--color-success)':'#333', color:'#fff', cursor:'pointer'}}>
                          {partner.photo ? '📸 Listo' : '📷 DNI'}
                          <input type="file" hidden accept="image/*" onChange={(e)=>handlePartnerPhoto(partner.id, e)} />
                      </label>
                      <Button type="button" onClick={()=>handleRemovePartner(partner.id)} style={{background:'red'}}>🗑</Button>
                  </div>
                ))}
<Button 
  type="button" 
  onClick={handleAddPartner} 
  style={{
    alignSelf: 'flex-start', 
    fontSize: '0.8rem',
    // Estilo "Outline" (Bordeado)
    background: 'transparent',
    border: '1px solid var(--color-primary)', 
    color: 'var(--color-primary)',
    fontWeight: 600
  }}
>
  + Agregar socio
</Button>              </div>
            )}
          </div>
        </div>

        {/* 2. VALORES */}
        <div className="card vstack" style={{ gap: 16 }}>
           <div className="hstack" style={{justifyContent:'space-between'}}>
              <div className="title" style={{ fontSize: "1.1rem", margin: 0 }}>Valores ({currency})</div>
              <div className="hstack" style={{gap:0, border:'1px solid #ccc', borderRadius:6, overflow:'hidden'}}>
                 <button type="button" onClick={()=>handleSwitchCurrency('ARS')} style={{padding:'5px 10px', background: currency==='ARS'?'#333':'#fff', color: currency==='ARS'?'#fff':'#333', border:'none', cursor:'pointer'}}>ARS</button>
                 <button type="button" onClick={()=>handleSwitchCurrency('USD')} style={{padding:'5px 10px', background: currency==='USD'?'#22c55e':'#fff', color: currency==='USD'?'#fff':'#333', border:'none', cursor:'pointer'}}>USD</button>
              </div>
           </div>
           <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20 }}>
              <div>
                 <Input label="Precio Venta" type="number" value={price as any} onChange={(e)=>setPrice(parseFloat(e.target.value))} style={{fontWeight:'bold', fontSize:'1.1rem'}}/>
                 {currency==='USD' && <small style={{color:'#666'}}>aprox $ {(Number(price)*exchangeRate).toLocaleString()}</small>}
              </div>
              <Input label="Gastos Transf." type="number" value={transferCost as any} onChange={(e)=>setTransferCost(parseFloat(e.target.value))} />
              <Input label="Gastos Admin." type="number" value={adminCost as any} onChange={(e)=>setAdminCost(parseFloat(e.target.value))} />
              <div>
                 <Input label={`Cotización USD (hoy: $${dolar?.venta})`} type="number" value={exchangeRate} onChange={(e)=>setExchangeRate(parseFloat(e.target.value))} />
              </div>
           </div>
        </div>

        {/* 3. PAGOS Y TOMA */}
        <div className="card vstack" style={{ gap: 20 }}>
          <div className="title" style={{ fontSize: "1.1rem", margin: 0 }}>Forma de Pago</div>

          {/* TOMA DE USADO */}
          <div style={{ background: "var(--input-bg)", borderRadius: 8, padding: 16, border: "1px solid var(--color-border)" }}>
            <Toggle label="Recibir Vehículo Usado (Permuta)" checked={includeUsed} onChange={setIncludeUsed} />
            {includeUsed && (
              <div className="vstack" style={{ marginTop: 16, gap: 16 }}>
                {/* ... Buscador Usado ... */}
                <div className="hstack">
                  <Input placeholder="Patente usado..." value={searchUsedPlate} onChange={(e) => setSearchUsedPlate(e.currentTarget.value)} />
                  <Button type="button" onClick={() => searchEntity("used", searchUsedPlate)}>Buscar</Button>
                   <a style={{fontSize:'0.8rem', cursor:'pointer', color:'var(--color-primary)'}} onClick={()=>{saveTempState(); window.location.href="/vehiculos/registro?redirect=/reservas/nueva&used=1"}}>+ Cargar Usado</a>
                </div>
                {usedVehicle && (
                  <div className="vstack" style={{gap:10, padding:10, border:'1px solid #ccc', borderRadius:8}}>
                    <div className="hstack" style={{justifyContent:'space-between', flexWrap:'wrap'}}>
                       <strong>🚗 {usedVehicle.brand} {usedVehicle.model} ({usedVehicle.plate})</strong>
                       <div className="hstack" style={{alignItems:'center', gap:5}}>
                          <label>Valor Toma ({currency}):</label>
                          <Input type="number" value={usedValue as any} onChange={(e)=>setUsedValue(parseFloat(e.target.value))} style={{width:120, textAlign:'right', fontWeight:'bold', color:'var(--color-success)'}} />
                       </div>
                    </div>
                    {/* ... Checklist y DDJJ ... */}
                    <div className="hstack" style={{justifyContent:'flex-end'}}>
                        <Button type="button" onClick={printMileageDDJJ} style={{fontSize:'0.8rem', padding:'5px 10px', background:'#555'}}>🖨️ Imprimir DDJJ</Button>
                    </div>
                    <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(120px, 1fr))', gap:10}}>
                       {Object.keys(usedChecklist).map(key => (
                          <label key={key} style={{display:'flex', gap:5, alignItems:'center', cursor:'pointer', color: (key==='08' && !usedChecklist['08']) ? 'red' : 'inherit'}}>
                             <input type="checkbox" checked={(usedChecklist as any)[key]} onChange={(e)=>setUsedChecklist({...usedChecklist, [key]: e.target.checked})} />
                             {key.toUpperCase()} {key==='08' && '*'}
                          </label>
                       ))}
                    </div>
                    {!usedChecklist["08"] && <small style={{color:'red'}}>* El 08 firmado es obligatorio.</small>}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* PAGOS */}
          <div style={{ background: "var(--input-bg)", borderRadius: 8, padding: 16, border: "1px solid var(--color-border)" }}>
              <Toggle label="Registrar Seña / Pagos Iniciales" checked={includeDeposit} onChange={setIncludeDeposit} />
              
              {includeDeposit && (
                <div className="vstack" style={{marginTop:15, gap:10}}>
                   {payments.map((p, i) => {
                      const isCheck = p.method_id === 3 && p.details;
                      
                      return (
                      <div key={i} className="vstack" style={{gap:5, padding:12, border:'1px solid var(--color-border)', borderRadius:8, background:'var(--color-card)'}}>
                          <div className="hstack" style={{gap:10, justifyContent:'space-between', flexWrap: 'wrap'}}>
                              <div style={{fontWeight:600, minWidth: 150}}>
                                  {p.method_name} 
                                  {isCheck && <span style={{fontSize:'0.8rem', color:'var(--color-primary)', marginLeft: 6}}>(Cheque)</span>}
                              </div>
                              
                              <div className="hstack" style={{flex:1, justifyContent:'flex-end', minWidth: 200}}>
                                  {/* Si NO es cheque, mostramos el input de monto simple acá. Si ES cheque, lo mostramos abajo en el grid para ordenarlo */}
                                  {!isCheck && (
                                     <Input type="number" placeholder="Monto..." value={p.amount as any} onChange={(e)=>updatePaymentAmount(i, e.target.value)} style={{maxWidth:150}} />
                                  )}
                                  <Button type="button" onClick={()=>removePayment(i)} style={{background:'red', padding:'5px 10px'}}>X</Button>
                              </div>
                          </div>
                          
                          {/* === DATOS DEL CHEQUE === */}
                          {isCheck && (
                              <div className="check-inline-grid">
                                  {/* 1. Fecha Entrega */}
                                  <div>
                                      <label style={{fontSize:'0.75rem', fontWeight:600, color:'var(--color-muted)'}}>Fecha de Entrega</label>
                                      <Input type="date" value={p.details!.delivery_date} onChange={(e)=>updatePaymentDetails(i,'delivery_date', e.target.value)} />
                                  </div>

                                  {/* 2. Banco */}
                                  <div>
                                      <label style={{fontSize:'0.75rem', fontWeight:600, color:'var(--color-muted)'}}>Banco</label>
                                      <Input value={p.details!.bank} onChange={(e)=>updatePaymentDetails(i,'bank', e.target.value)} placeholder="Ej: Galicia" />
                                  </div>

                                  {/* 3. Monto (Integrado al grid del cheque) */}
                                  <div>
                                      <label style={{fontSize:'0.75rem', fontWeight:600, color:'var(--color-muted)'}}>Monto ($)</label>
                                      <Input type="number" value={p.amount as any} onChange={(e)=>updatePaymentAmount(i, e.target.value)} placeholder="$ 0.00" style={{fontWeight:'bold'}} />
                                  </div>

                                  {/* 4. Titular */}
                                  <div>
                                      <label style={{fontSize:'0.75rem', fontWeight:600, color:'var(--color-muted)'}}>Titular</label>
                                      <Input value={p.details!.holder} onChange={(e)=>updatePaymentDetails(i,'holder', e.target.value)} placeholder="Nombre completo" />
                                  </div>

                                  {/* 5. Fecha Cobro */}
                                  <div style={{gridColumn: '1 / -1'}}>
                                      <label style={{fontSize:'0.75rem', fontWeight:600, color:'var(--color-primary)'}}>📅 Fecha de Cobro (Vencimiento)</label>
                                      <Input type="date" value={p.details!.payment_date} onChange={(e)=>updatePaymentDetails(i,'payment_date', e.target.value)} style={{borderColor: 'var(--color-primary)'}} />
                                  </div>

                                  {/* Campo extra oculto o secundario para número */}
                                  <div style={{marginTop:5}}>
                                      <Input value={p.details!.number} onChange={(e)=>updatePaymentDetails(i,'number', e.target.value)} placeholder="N° Cheque (Opcional)" style={{fontSize:'0.8rem'}} />
                                  </div>
                              </div>
                          )}
                      </div>
                   )})}
                   <Button type="button" onClick={()=>setShowPaymentModal(true)} style={{alignSelf:'flex-start', background:'var(--color-secondary)'}}>+ Agregar Pago</Button>
                </div>
              )}
          </div>
        </div>
      </form>

      {/* === MODAL FLOTANTE (STICKY FOOTER) === */}
      <div className="sticky-footer">
          <div className="hstack" style={{justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap: 16}}>
            
            {/* Totales Resumen */}
            <div className="vstack" style={{gap:2}}>
                <div style={{color:'var(--color-muted)', fontSize:'0.85rem'}}>
                    Operación Total: <strong>$ {totalOperation.toLocaleString()}</strong>
                </div>
                <div style={{color:'var(--color-success)', fontSize:'0.85rem'}}>
                    Entrega Pactada: <strong>$ {totalPaid.toLocaleString()}</strong>
                </div>
            </div>
            
            {/* Botón y Saldo */}
            <div className="hstack" style={{gap:20, alignItems:'center', flex:1, justifyContent:'flex-end'}}>
                <div className="vstack" style={{alignItems:'flex-end'}}>
                   <div style={{fontSize:'1.3rem', fontWeight:'bold', color: balance > 0 ? 'var(--color-primary)' : 'var(--color-success)'}}>
                       $ {balance.toLocaleString()}
                   </div>
                   <small style={{fontSize:'0.75rem', textTransform:'uppercase', letterSpacing:1}}>{balance > 0 ? "Saldo a Financiar" : "Saldado"}</small>
                </div>

                <Button 
                  type="submit" 
                  form="reservation-form" 
                  disabled={loading || Boolean(includeUsed && usedVehicle && !usedChecklist["08"])}
                  style={{minWidth: 140, height: 44}}
                >
                  {loading ? "Guardando..." : "CONFIRMAR"}
                </Button>
            </div>
          </div>
      </div>

      {showPaymentModal && (
          <PaymentMethodModal 
            onClose={() => setShowPaymentModal(false)} 
            methods={paymentMethods} 
            onSelect={addPayment} 
          />
      )}

      {toast && <Toast message={toast} onClose={() => setToast("")} />}
    </div>
  );
}