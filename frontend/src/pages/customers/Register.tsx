import { useState, type FormEvent, type ChangeEvent } from "react";
import { useSearchParams } from "react-router-dom";
import api from "../../lib/api";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import useRedirectAfterSave from "../../hooks/useRedirectAfterSave";

export default function RegisterCustomer() {
  const { goBack } = useRedirectAfterSave("/clientes");
  const [searchParams] = useSearchParams();
  const redirect = searchParams.get("redirect");

  // 🔹 ESTADO NUEVO: Controla el tipo de registro
  const [customerType, setCustomerType] = useState<'consulta' | 'completo'>('consulta');

  // Identidad
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [docType, setDocType] = useState("DNI");
  const [docNumber, setDocNumber] = useState("");
  const [cuit, setCuit] = useState("");
  const [maritalStatus, setMaritalStatus] = useState("soltero");

  // Contacto
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [altPhone, setAltPhone] = useState("");

  // Ubicación
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");

  // Extras
  const [notes, setNotes] = useState("");

  // Fotos
  const [dniFront, setDniFront] = useState<File | null>(null);
  const [dniBack, setDniBack] = useState<File | null>(null);
  const [previewFront, setPreviewFront] = useState<string | null>(null);
  const [previewBack, setPreviewBack] = useState<string | null>(null);

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, side: "front" | "back") => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const url = URL.createObjectURL(file);
    if (side === "front") {
      setDniFront(file);
      setPreviewFront(url);
    } else {
      setDniBack(file);
      setPreviewBack(url);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setToast("");

    try {
      const form = new FormData();
      // Datos siempre obligatorios
      form.append("first_name", firstName);
      form.append("last_name", lastName);
      
      // Datos de contacto (esenciales para consulta)
      if (email) form.append("email", email);
      if (phone) form.append("phone", phone);
      if (altPhone) form.append("alt_phone", altPhone);
      if (notes) form.append("notes", notes);
      
      // 🔹 CONDICIONAL: Solo enviamos datos sensibles si es REGISTRO COMPLETO
      if (customerType === 'completo') {
          form.append("doc_type", docType);
          form.append("doc_number", docNumber);
          
          if (cuit) form.append("cuit", cuit);
          if (maritalStatus) form.append("marital_status", maritalStatus);
          
          if (address) form.append("address", address);
          if (city) form.append("city", city);
          
          if (dniFront) form.append("dni_front", dniFront);
          if (dniBack) form.append("dni_back", dniBack);
      } else {
          // Opcional: Si tu backend requiere SÍ o SÍ un DNI, podés enviar un placeholder o null
          // Si el backend explota sin DNI, avísame y le ponemos un parche.
          // Por ahora asumo que la API permite null en doc_number si es un lead.
      }

      const res = await api.post("/customers", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const created = res.data?.data ?? res.data;
      const newId = created?.id;

      // ✅ Guardar datos para autocompletado en vehículos
      localStorage.setItem(
        "lastRegisteredCustomer",
        JSON.stringify({
          dni: created.doc_number || "", // Manejamos el caso de que venga vacío
          name: `${created.first_name} ${created.last_name}`,
          email: created.email || "",
          phone: created.phone || "",
        })
      );

      setToast("Cliente registrado con éxito ✅");

      if (redirect) {
        setTimeout(() => {
          window.location.href = redirect;
        }, 400);
      } else {
        setTimeout(() => goBack({ customer_id: newId }), 400);
      }
    } catch (err: any) {
      setToast(err?.response?.data?.message || "No se pudo registrar el cliente");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <form onSubmit={onSubmit} className="vstack" style={{ gap: 24 }}>
        
        {/* Header */}
        <div className="hstack" style={{ justifyContent: 'space-between', alignItems: 'center' }}>
            <div className="title" style={{margin: 0}}>Nuevo Cliente</div>
            <Button type="button" onClick={() => goBack()} style={{background: 'transparent', color: 'var(--color-muted)', border: 'none'}}>
                Cancelar
            </Button>
        </div>

        {/* 🟢 SECCIÓN DE TIPO DE REGISTRO (Cards Idénticas a Vehículos) */}
        <div className="card">
            <div className="title" style={{marginBottom: 16, fontSize: '1rem'}}>Tipo de Registro</div>
            
            <div className="selection-grid">
                <div 
                    className={`selection-card ${customerType === 'consulta' ? 'selected' : ''}`}
                    onClick={() => setCustomerType('consulta')}
                >
                    <div className="selection-title">📝 Consulta / Lead</div>
                    <div className="selection-subtitle">Solo datos de contacto</div>
                </div>

                <div 
                    className={`selection-card ${customerType === 'completo' ? 'selected' : ''}`}
                    onClick={() => setCustomerType('completo')}
                >
                    <div className="selection-title">🪪 Cliente / Transacción</div>
                    <div className="selection-subtitle">Datos legales completos</div>
                </div>
            </div>

            {/* Mensajito de ayuda visual */}
            {customerType === 'consulta' && (
                <div style={{ marginTop: 12, padding: '10px', background: 'rgba(30, 167, 255, 0.1)', color: 'var(--color-primary)', borderRadius: 8, fontSize: '0.9rem', display:'flex', gap: 8, alignItems:'center' }}>
                    <span>ℹ️</span>
                    <span>Modo rápido: No se pedirán DNI, estado civil ni fotos.</span>
                </div>
            )}
        </div>

        {/* === TARJETA 1: IDENTIDAD === */}
        <div className="card vstack" style={{ gap: 16 }}>
            <div className="title" style={{fontSize: '1.1rem', margin: 0}}>Identidad</div>
            
            <div className="form-row">
                <Input label="Nombre *" value={firstName} onChange={(e) => setFirstName(e.currentTarget.value)} required />
                <Input label="Apellido *" value={lastName} onChange={(e) => setLastName(e.currentTarget.value)} required />
            </div>

            {/* 🔹 Estos campos solo se muestran si es REGISTRO COMPLETO */}
            {customerType === 'completo' && (
                <>
                    <div className="form-row">
                        <div className="form-group" style={{ flex: 0.5 }}>
                            <label>Tipo Doc</label>
                            <select className="form-control" value={docType} onChange={(e) => setDocType(e.currentTarget.value)}>
                                <option value="DNI">DNI</option>
                                <option value="CUIT">CUIT</option>
                                <option value="Pasaporte">Pasaporte</option>
                            </select>
                        </div>
                        {/* El required es condicional ahora */}
                        <Input 
                            label="Número de Documento *" 
                            value={docNumber} 
                            onChange={(e) => setDocNumber(e.currentTarget.value)} 
                            required={customerType === 'completo'} 
                        />
                        <Input label="CUIT / CUIL (Opcional)" value={cuit} onChange={(e) => setCuit(e.currentTarget.value)} />
                    </div>

                    {/* Estado Civil */}
                    <div className="form-group">
                        <label>Estado Civil</label>
                        <div className="hstack" style={{ gap: 16 }}>
                            <label style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}}>
                                <input type="radio" name="marital" value="soltero" checked={maritalStatus === 'soltero'} onChange={() => setMaritalStatus('soltero')} />
                                Soltero/a
                            </label>
                            <label style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}}>
                                <input type="radio" name="marital" value="casado" checked={maritalStatus === 'casado'} onChange={() => setMaritalStatus('casado')} />
                                Casado/a
                            </label>
                            <label style={{display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer'}}>
                                <input type="radio" name="marital" value="otro" checked={maritalStatus === 'otro'} onChange={() => setMaritalStatus('otro')} />
                                Otro
                            </label>
                        </div>
                    </div>
                </>
            )}
        </div>

        {/* === TARJETA 2: CONTACTO Y UBICACIÓN === */}
        <div className="card vstack" style={{ gap: 16 }}>
            <div className="title" style={{fontSize: '1.1rem', margin: 0}}>Contacto</div>
            
            <div className="form-row">
                <Input label="Teléfono Principal *" value={phone} onChange={(e) => setPhone(e.currentTarget.value)} required placeholder="Ej: 3492..." />
                <Input label="Teléfono Alternativo" value={altPhone} onChange={(e) => setAltPhone(e.currentTarget.value)} placeholder="Opcional" />
            </div>

            <Input label="Correo Electrónico" type="email" value={email} onChange={(e) => setEmail(e.currentTarget.value)} />

            {/* La dirección la mostramos solo en completo, o la dejamos siempre? 
                Generalmente en Leads no se pide dirección exacta. Lo ocultamos en consulta. */}
            {customerType === 'completo' && (
                <div className="form-row">
                    <Input label="Dirección / Calle" value={address} onChange={(e) => setAddress(e.currentTarget.value)} style={{flex: 2}} />
                    <Input label="Ciudad / Localidad" value={city} onChange={(e) => setCity(e.currentTarget.value)} style={{flex: 1}} />
                </div>
            )}
        </div>

        {/* === TARJETA 3: DOCUMENTACIÓN (SOLO COMPLETO) === */}
        {customerType === 'completo' && (
            <div className="card vstack" style={{ gap: 16 }}>
                <div className="title" style={{fontSize: '1.1rem', margin: 0}}>Documentación (Fotos DNI)</div>
                
                <div className="hstack" style={{ gap: 16, flexWrap: "wrap" }}>
                    <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                        <label>Frente del DNI</label>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "front")} className="form-control" style={{padding: 8}} />
                        {previewFront && (
                            <img src={previewFront} alt="DNI Frente" style={{ width: "100%", marginTop: 10, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                        )}
                    </div>
                    <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                        <label>Dorso del DNI</label>
                        <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, "back")} className="form-control" style={{padding: 8}} />
                        {previewBack && (
                            <img src={previewBack} alt="DNI Dorso" style={{ width: "100%", marginTop: 10, borderRadius: 8, border: '1px solid var(--color-border)' }} />
                        )}
                    </div>
                </div>
            </div>
        )}

        {/* === TARJETA 4: NOTAS === */}
        <div className="card vstack" style={{ gap: 16 }}>
            <div className="title" style={{fontSize: '1.1rem', margin: 0}}>Observaciones</div>
            <textarea 
                className="form-control" 
                rows={3} 
                value={notes} 
                onChange={(e) => setNotes(e.currentTarget.value)}
                placeholder="Datos adicionales, horarios de contacto, preferencias..." 
            />
        </div>

        <div className="hstack" style={{ justifyContent: "flex-end" }}>
            <Button type="submit" loading={loading} style={{padding: '10px 24px', fontSize: '1rem'}}>
                {customerType === 'consulta' ? 'Guardar Consulta' : 'Registrar Cliente'}
            </Button>
        </div>

      </form>

      {toast && (
        <Toast message={toast} type={toast.includes("éxito") ? "success" : "error"} />
      )}
    </div>
  );
}