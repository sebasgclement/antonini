import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import Toggle from "../../components/ui/Toggle";
import api from "../../lib/api";

// Ampliamos el tipo para incluir customer_id y status
type Vehicle = {
  id: number;
  plate: string;
  brand: string;
  model: string;
  year?: number;
  vin?: string;
  color?: string;
  km?: number;
  fuel_type?: string;
  ownership: "propio" | "consignado";
  status?: string;
  customer_id?: number; // 👈 CRÍTICO: Agregado el ID del cliente
  customer_dni?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  reference_price?: number;
  take_price?: number;
  price?: number;
  check_spare: boolean;
  check_jack: boolean;
  check_tools: boolean;
  check_docs: boolean;
  check_key_copy: boolean;
  check_manual: boolean;
  notes?: string;
  photo_front_url?: string | null;
  photo_back_url?: string | null;
  photo_left_url?: string | null;
  photo_right_url?: string | null;
  photo_interior_front_url?: string | null;
  photo_interior_back_url?: string | null;
  photo_trunk_url?: string | null;
};

export default function VehicleEdit() {
  const { id } = useParams();
  const nav = useNavigate();

  const [v, setV] = useState<Partial<Vehicle>>({});
  const [locationStatus, setLocationStatus] = useState<"stock" | "ofrecido">(
    "stock"
  );
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [newPhotos, setNewPhotos] = useState<Record<string, File | null>>({});
  const [preview, setPreview] = useState<Record<string, string | null>>({});
  const [showModal, setShowModal] = useState(false);
  const [newBrand, setNewBrand] = useState("");

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        // 1. Cargar datos
        const { data } = await api.get(`/vehicles/${id}`);
        let vehicle = data?.data ?? data ?? {};

        // 2. Normalizar Ownership
        const rawOwnership = vehicle.ownership || "propio";
        vehicle.ownership =
          rawOwnership.toLowerCase() === "consignado" ? "consignado" : "propio";

        // 3. RECUPERACIÓN DE CLIENTE
        if (vehicle.ownership === "consignado" && vehicle.customer_id) {
          try {
            const custRes = await api.get(`/customers/${vehicle.customer_id}`);
            const custData = custRes.data?.data ?? custRes.data;

            if (custData) {
              vehicle.customer_dni = custData.dni;
              vehicle.customer_name =
                custData.name ||
                `${custData.first_name || ""} ${
                  custData.last_name || ""
                }`.trim();
              vehicle.customer_email = custData.email;
              vehicle.customer_phone = custData.phone;
            }
          } catch (innerErr) {
            console.warn("No se pudo hidratar el cliente", innerErr);
          }
        } else if (vehicle.customer) {
          vehicle.customer_id = vehicle.customer.id; // Asegurar que el ID esté seteado
          vehicle.customer_dni = vehicle.customer.dni;
          vehicle.customer_name =
            vehicle.customer.name ||
            `${vehicle.customer.first_name || ""} ${
              vehicle.customer.last_name || ""
            }`.trim();
          vehicle.customer_email = vehicle.customer.email;
          vehicle.customer_phone = vehicle.customer.phone;
        }

        if (isMounted) {
          setV(vehicle);

          if (vehicle.status === "ofrecido") {
            setLocationStatus("ofrecido");
          } else {
            setLocationStatus("stock");
          }

          setPreview({
            front: vehicle.photo_front_url || null,
            back: vehicle.photo_back_url || null,
            left: vehicle.photo_left_url || null,
            right: vehicle.photo_right_url || null,
            interior_front: vehicle.photo_interior_front_url || null,
            interior_back: vehicle.photo_interior_back_url || null,
            trunk: vehicle.photo_trunk_url || null,
          });

          const brandsRes = await api.get("/brands");
          setBrands(brandsRes.data);
        }
      } catch (err: any) {
        if (isMounted)
          setToast(err?.response?.data?.message || "Error al cargar vehículo");
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, side: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setNewPhotos((prev) => ({ ...prev, [side]: file }));
    setPreview((prev) => ({ ...prev, [side]: url }));
  };

  const handleRemovePhoto = (side: string) => {
    setNewPhotos((prev) => ({ ...prev, [side]: null }));
    setPreview((prev) => ({ ...prev, [side]: null }));
    setV((prev) => ({ ...prev, [`photo_${side}_url`]: null }));
  };

  const searchByDni = async () => {
    if (!v.customer_dni?.trim()) return;
    try {
      const res = await api.get(`/customers?dni=${v.customer_dni}`);
      const found = res.data?.data?.[0] || null;
      if (found) {
        setV((prev) => ({
          ...prev,
          customer_id: found.id, // 👈 IMPORTANTE: Guardamos el ID del cliente encontrado
          customer_name: `${found.first_name} ${found.last_name}`,
          customer_email: found.email || "",
          customer_phone: found.phone || "",
        }));
        setToast("Cliente encontrado ✅");
      } else {
        setToast("No se encontró cliente con ese DNI");
      }
    } catch {
      setToast("Error al buscar cliente");
    }
  };

  const addBrand = async () => {
    if (!newBrand.trim()) return;
    try {
      const { data } = await api.post("/brands", { name: newBrand });
      setBrands((prev) => [...prev, data]);
      setV((prev) => ({ ...prev, brand: data.name }));
      setNewBrand("");
      setToast("Marca agregada ✅");
      setShowModal(false);
    } catch {
      setToast("No se pudo agregar la marca");
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);
    try {
      const form = new FormData();

      // Validación rápida
      if (v.ownership === "consignado" && !v.customer_id) {
        setToast(
          "⚠️ Error: Si es consignado, debés buscar y seleccionar un cliente por DNI."
        );
        setSaving(false);
        return;
      }

      if (locationStatus === "ofrecido") {
        form.append("status", "ofrecido");
      } else if (v.status === "ofrecido" && locationStatus === "stock") {
        form.append("status", "disponible");
      }

      if (v.plate) form.append("plate", v.plate);
      form.append("brand", v.brand || "");
      form.append("model", v.model || "");
      if (v.year) form.append("year", String(v.year));
      if (v.vin) form.append("vin", v.vin);
      if (v.color) form.append("color", v.color);
      if (v.km) form.append("km", String(v.km));
      if (v.fuel_type) form.append("fuel_type", v.fuel_type);

      if (v.reference_price)
        form.append("reference_price", String(v.reference_price));
      if (v.take_price) form.append("take_price", String(v.take_price));
      if (v.price) form.append("price", String(v.price));

      form.append("ownership", v.ownership || "propio");

      // 🟢 LÓGICA CRÍTICA DEL CLIENTE
      if (v.ownership === "consignado" && v.customer_id) {
        form.append("customer_id", String(v.customer_id)); // Enviamos el ID para vincular
        form.append("customer_dni", v.customer_dni || "");
        form.append("customer_name", v.customer_name || "");
      } else {
        // Si es propio, nos aseguramos que no quede linkeado a nadie viejo
        form.append("customer_id", "");
      }

      // Checklist
      if (locationStatus === "stock") {
        form.append("check_spare", v.check_spare ? "1" : "0");
        form.append("check_jack", v.check_jack ? "1" : "0");
        form.append("check_tools", v.check_tools ? "1" : "0");
        form.append("check_docs", v.check_docs ? "1" : "0");
        form.append("check_key_copy", v.check_key_copy ? "1" : "0");
        form.append("check_manual", v.check_manual ? "1" : "0");
      }

      if (v.notes) form.append("notes", v.notes);

      const sides = [
        "front",
        "back",
        "left",
        "right",
        "interior_front",
        "interior_back",
        "trunk",
      ];
      sides.forEach((side) => {
        const file = newPhotos[side];
        if (file) form.append(`photo_${side}`, file);
        else if (preview[side] === null)
          form.append(`delete_photo_${side}`, "1");
      });

      await api.post(`/vehicles/${id}?_method=PUT`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast("Vehículo actualizado ✅");
      setTimeout(() => nav("/vehiculos"), 800);
    } catch (err: any) {
      setToast(err?.response?.data?.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="container">Cargando…</div>;

  return (
    <div className="container">
      <form onSubmit={onSubmit} className="vstack" style={{ gap: 16 }}>
        <div className="title">Editar vehículo #{id}</div>

        <div className="card">
          <div className="title" style={{ marginBottom: 16, fontSize: "1rem" }}>
            Estado del Ingreso
          </div>
          <div className="selection-grid">
            <div
              className={`selection-card ${
                locationStatus === "stock" ? "selected" : ""
              }`}
              onClick={() => setLocationStatus("stock")}
            >
              <div className="selection-title">🏠 Ingreso Físico (Stock)</div>
              <div className="selection-subtitle">
                Vehículo ingresa al predio
              </div>
            </div>
            <div
              className={`selection-card ${
                locationStatus === "ofrecido" ? "selected" : ""
              }`}
              onClick={() => {
                setLocationStatus("ofrecido");
                setV({ ...v, ownership: "consignado" });
              }}
            >
              <div className="selection-title">📞 Solo Ofrecido (Dato)</div>
              <div className="selection-subtitle">
                El cliente retiene la unidad
              </div>
            </div>
          </div>
          {locationStatus === "ofrecido" && (
            <div
              style={{
                marginTop: 12,
                padding: "10px",
                background: "rgba(245, 158, 11, 0.1)",
                color: "orange",
                borderRadius: 8,
                fontSize: "0.9rem",
                display: "flex",
                gap: 8,
                alignItems: "center",
              }}
            >
              <span>💡</span>
              <span>
                Se ocultarán campos técnicos (VIN, Checklist) y la patente será
                opcional.
              </span>
            </div>
          )}
        </div>

        <div className="card vstack" style={{ gap: 16 }}>
          <Input
            label={
              locationStatus === "stock" ? "Patente *" : "Patente (Opcional)"
            }
            value={v.plate || ""}
            onChange={(e) => setV({ ...v, plate: e.currentTarget.value })}
            required={locationStatus === "stock"}
            placeholder={locationStatus === "ofrecido" ? "Sin patente" : ""}
          />
          <div className="hstack" style={{ gap: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Marca *</label>
              <div className="hstack" style={{ gap: 8 }}>
                <select
                  className="form-control"
                  value={v.brand || ""}
                  onChange={(e) => setV({ ...v, brand: e.currentTarget.value })}
                  required
                >
                  <option value="">Seleccionar marca</option>
                  {brands.map((b) => (
                    <option key={b.id} value={b.name}>
                      {b.name}
                    </option>
                  ))}
                </select>
                <Button type="button" onClick={() => setShowModal(true)}>
                  +
                </Button>
              </div>
            </div>
            <Input
              label="Modelo *"
              value={v.model || ""}
              onChange={(e) => setV({ ...v, model: e.currentTarget.value })}
              required
            />
            <Input
              label="Año"
              type="number"
              value={v.year || ""}
              onChange={(e) =>
                setV({
                  ...v,
                  year: parseInt(e.currentTarget.value) || undefined,
                })
              }
            />
          </div>
          {locationStatus === "stock" && (
            <div className="hstack" style={{ gap: 16 }}>
              <Input
                label="VIN / Chasis"
                value={v.vin || ""}
                onChange={(e) => setV({ ...v, vin: e.currentTarget.value })}
              />
            </div>
          )}
          <div className="hstack" style={{ gap: 16 }}>
            <Input
              label="Color"
              value={v.color || ""}
              onChange={(e) => setV({ ...v, color: e.currentTarget.value })}
            />
            <Input
              label="Kilometraje (km)"
              type="number"
              value={v.km || ""}
              onChange={(e) =>
                setV({ ...v, km: parseInt(e.currentTarget.value) || undefined })
              }
            />
            <div className="form-group" style={{ flex: 1 }}>
              <label>Tipo de combustible *</label>
              <select
                className="form-control"
                value={v.fuel_type || ""}
                onChange={(e) =>
                  setV({ ...v, fuel_type: e.currentTarget.value })
                }
                required
              >
                <option value="">Seleccionar</option>
                <option value="nafta">Nafta</option>
                <option value="gasoil">Gasoil</option>
                <option value="gnc/nafta">GNC / Nafta</option>
                <option value="eléctrico">Eléctrico</option>
              </select>
            </div>
          </div>
          <div className="hstack" style={{ gap: 16 }}>
            <Input
              label="Precio de referencia ($)"
              type="number"
              value={v.reference_price || ""}
              onChange={(e) =>
                setV({
                  ...v,
                  reference_price:
                    parseFloat(e.currentTarget.value) || undefined,
                })
              }
            />
            <Input
              label="Valor de toma ($)"
              type="number"
              value={v.take_price || ""}
              onChange={(e) =>
                setV({
                  ...v,
                  take_price: parseFloat(e.currentTarget.value) || undefined,
                })
              }
            />
            <Input
              label="Precio de venta ($)"
              type="number"
              value={v.price || ""}
              onChange={(e) =>
                setV({
                  ...v,
                  price: parseFloat(e.currentTarget.value) || undefined,
                })
              }
            />
          </div>
        </div>

        <div className="card vstack" style={{ gap: 12 }}>
          <div className="title">Propiedad</div>
          <div className="selection-grid">
            <div
              className={`selection-card ${
                v.ownership === "propio" ? "selected" : ""
              } ${locationStatus === "ofrecido" ? "disabled" : ""}`}
              onClick={() => {
                if (locationStatus !== "ofrecido")
                  setV({ ...v, ownership: "propio" });
              }}
            >
              <div className="selection-title">🏢 Propio</div>
              <div className="selection-subtitle">Unidad de la agencia</div>
            </div>
            <div
              className={`selection-card ${
                v.ownership === "consignado" ? "selected" : ""
              }`}
              onClick={() => setV({ ...v, ownership: "consignado" })}
            >
              <div className="selection-title">🤝 Consignado</div>
              <div className="selection-subtitle">Unidad de terceros</div>
            </div>
          </div>
        </div>

        {v.ownership === "consignado" && (
          <div className="card vstack" style={{ gap: 16 }}>
            <div className="title">Datos del cliente</div>
            <div className="form-row" style={{ alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="DNI *"
                  value={v.customer_dni || ""}
                  onChange={(e) =>
                    setV({ ...v, customer_dni: e.currentTarget.value })
                  }
                  required
                />
              </div>
              <Button type="button" onClick={searchByDni}>
                Buscar
              </Button>
            </div>
            <Input
              label="Nombre completo"
              value={v.customer_name || ""}
              onChange={(e) =>
                setV({ ...v, customer_name: e.currentTarget.value })
              }
            />
            <Input
              label="Email"
              type="email"
              value={v.customer_email || ""}
              onChange={(e) =>
                setV({ ...v, customer_email: e.currentTarget.value })
              }
            />
            <Input
              label="Teléfono"
              value={v.customer_phone || ""}
              onChange={(e) =>
                setV({ ...v, customer_phone: e.currentTarget.value })
              }
            />
          </div>
        )}

        {locationStatus === "stock" && (
          <div className="card vstack" style={{ gap: 16 }}>
            <div className="title">Checklist</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              <Toggle
                label="Rueda de auxilio"
                checked={v.check_spare ?? false}
                onChange={(val) => setV({ ...v, check_spare: val })}
              />
              <Toggle
                label="Crique"
                checked={v.check_jack ?? false}
                onChange={(val) => setV({ ...v, check_jack: val })}
              />
              <Toggle
                label="Herramientas"
                checked={v.check_tools ?? false}
                onChange={(val) => setV({ ...v, check_tools: val })}
              />
              <Toggle
                label="Documentación"
                checked={v.check_docs ?? false}
                onChange={(val) => setV({ ...v, check_docs: val })}
              />
              <Toggle
                label="Duplicado de llave"
                checked={v.check_key_copy ?? false}
                onChange={(val) => setV({ ...v, check_key_copy: val })}
              />
              <Toggle
                label="Manual"
                checked={v.check_manual ?? false}
                onChange={(val) => setV({ ...v, check_manual: val })}
              />
            </div>
            <textarea
              className="form-control"
              placeholder="Observaciones"
              value={v.notes || ""}
              onChange={(e) => setV({ ...v, notes: e.currentTarget.value })}
              style={{ marginTop: 8 }}
            />
          </div>
        )}

        {locationStatus === "ofrecido" && (
          <div className="card">
            <label>Observaciones del vehículo</label>
            <textarea
              className="form-control"
              placeholder="Detalles importantes..."
              value={v.notes || ""}
              onChange={(e) => setV({ ...v, notes: e.currentTarget.value })}
            />
          </div>
        )}

        <div className="card vstack" style={{ gap: 12 }}>
          <div className="title">Fotos del vehículo</div>
          <div className="hstack" style={{ flexWrap: "wrap", gap: 16 }}>
            {[
              { key: "front", label: "Frente" },
              { key: "back", label: "Dorso" },
              { key: "left", label: "Lateral Izquierdo" },
              { key: "right", label: "Lateral Derecho" },
              { key: "interior_front", label: "Interior Adelante" },
              { key: "interior_back", label: "Interior Atrás" },
              { key: "trunk", label: "Baúl" },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="form-group"
                style={{ flex: 1, minWidth: 180 }}
              >
                <label>{label}</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, key)}
                />
                {preview[key] && (
                  <img
                    src={preview[key]!}
                    alt={key}
                    style={{
                      width: "100%",
                      maxWidth: 280,
                      marginTop: 8,
                      borderRadius: 8,
                    }}
                    onClick={() => handleRemovePhoto(key)}
                    title="Click para eliminar"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="hstack" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" loading={saving}>
            Guardar cambios
          </Button>
        </div>
      </form>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Agregar nueva marca</h3>
            <input
              type="text"
              className="form-control"
              value={newBrand}
              onChange={(e) => setNewBrand(e.currentTarget.value)}
              placeholder="Nombre de marca"
            />
            <div
              className="hstack"
              style={{ justifyContent: "flex-end", gap: 8 }}
            >
              <Button type="button" onClick={addBrand}>
                Guardar
              </Button>
              <Button type="button" onClick={() => setShowModal(false)}>
                Cerrar
              </Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast
          message={toast}
          type={toast.includes("✅") ? "success" : "error"}
        />
      )}
    </div>
  );
}
