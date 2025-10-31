import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
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
  year?: number;
  vin?: string;
  color?: string;
  km?: number;
  fuel_type?: string;
  ownership: "propio" | "consignado";
  customer_dni?: string;
  customer_name?: string;
  customer_email?: string;
  customer_phone?: string;
  reference_price?: number;
  price?: number;
  check_spare: boolean;
  check_jack: boolean;
  check_docs: boolean;
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
  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [newPhotos, setNewPhotos] = useState<Record<string, File | null>>({});
  const [preview, setPreview] = useState<Record<string, string | null>>({});

  // 🔹 Modal nueva marca
  const [showModal, setShowModal] = useState(false);
  const [newBrand, setNewBrand] = useState("");

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/vehicles/${id}`);
        const vehicle = data?.data ?? data ?? {};
        setV(vehicle);

        // 🔹 Preview de todas las fotos, incluidas las nuevas
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

        // 🔹 Si acaba de registrarse un cliente, cargarlo automáticamente
        const newClient = localStorage.getItem("lastRegisteredCustomer");
        if (newClient) {
          const c = JSON.parse(newClient);
          setV((prev) => ({
            ...prev,
            customer_dni: c.dni || "",
            customer_name: c.name || "",
            customer_email: c.email || "",
            customer_phone: c.phone || "",
          }));
          localStorage.removeItem("lastRegisteredCustomer");
          setToast("Cliente cargado automáticamente ✅");
        }
      } catch (err: any) {
        setToast(err?.response?.data?.message || "No se pudo cargar el vehículo");
      } finally {
        setLoading(false);
      }
    })();
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
      form.append("plate", v.plate || "");
      form.append("brand", v.brand || "");
      form.append("model", v.model || "");
      if (v.year) form.append("year", String(v.year));
      if (v.vin) form.append("vin", v.vin);
      if (v.color) form.append("color", v.color);
      if (v.km) form.append("km", String(v.km));
      if (v.fuel_type) form.append("fuel_type", v.fuel_type);
      if (v.reference_price) form.append("reference_price", String(v.reference_price));
      if (v.price) form.append("price", String(v.price));
      form.append("ownership", v.ownership || "propio");

      if (v.ownership === "consignado" && v.customer_dni) {
        form.append("customer_dni", v.customer_dni);
        form.append("customer_name", v.customer_name || "");
        if (v.customer_email) form.append("customer_email", v.customer_email);
        if (v.customer_phone) form.append("customer_phone", v.customer_phone);
      }

      form.append("check_spare", v.check_spare ? "1" : "0");
      form.append("check_jack", v.check_jack ? "1" : "0");
      form.append("check_docs", v.check_docs ? "1" : "0");
      if (v.notes) form.append("notes", v.notes);

      // 📸 Todas las fotos
      const sides = [
        "front", "back", "left", "right",
        "interior_front", "interior_back", "trunk",
      ];

      sides.forEach((side) => {
        const file = newPhotos[side];
        if (file) form.append(`photo_${side}`, file);
        else if (preview[side] === null) form.append(`delete_photo_${side}`, "1");
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

        {/* Datos básicos */}
        <div className="card vstack" style={{ gap: 16 }}>
          <Input
            label="Patente *"
            value={v.plate || ""}
            onChange={(e) => setV({ ...v, plate: e.currentTarget.value })}
            required
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
                <Button type="button" onClick={() => setShowModal(true)}>+</Button>
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
                setV({ ...v, year: parseInt(e.currentTarget.value) || undefined })
              }
            />
          </div>

          <div className="hstack" style={{ gap: 16 }}>
            <Input
              label="VIN / Chasis"
              value={v.vin || ""}
              onChange={(e) => setV({ ...v, vin: e.currentTarget.value })}
            />
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
        </div>

        {/* Fotos */}
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
              <div key={key} className="form-group" style={{ flex: 1, minWidth: 180 }}>
                <label>{label}</label>
                <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, key)} />
                {preview[key] && (
                  <img
                    src={preview[key]!}
                    alt={key}
                    style={{ width: "100%", maxWidth: 280, marginTop: 8, borderRadius: 8 }}
                    onClick={() => handleRemovePhoto(key)}
                    title="Click para eliminar"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        <div className="hstack" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" loading={saving}>Guardar cambios</Button>
        </div>
      </form>

      {/* Modal visual para nueva marca */}
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
            <div className="hstack" style={{ justifyContent: "flex-end", gap: 8 }}>
              <Button type="button" onClick={addBrand}>Guardar</Button>
              <Button type="button" onClick={() => setShowModal(false)}>Cerrar</Button>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <Toast message={toast} type={toast.includes("✅") ? "success" : "error"} />
      )}
    </div>
  );
}
