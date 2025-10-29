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
  fuel_type?: string; // 🔹 ahora se usa para tipo de combustible
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
};

const MARCAS = [
  "Toyota",
  "Ford",
  "Chevrolet",
  "Volkswagen",
  "Renault",
  "Fiat",
  "Peugeot",
  "Citroën",
  "Nissan",
  "Honda",
  "Jeep",
  "Hyundai",
  "Kia",
  "Mercedes-Benz",
  "BMW",
  "Audi",
  "Otros",
];

export default function VehicleEdit() {
  const { id } = useParams();
  const nav = useNavigate();

  const [v, setV] = useState<Partial<Vehicle>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [newPhotos, setNewPhotos] = useState<Record<string, File | null>>({});
  const [preview, setPreview] = useState<Record<string, string | null>>({});

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/vehicles/${id}`);
        const vehicle = data?.data ?? data ?? {};
        setV(vehicle);
        setPreview({
          front: vehicle.photo_front_url || null,
          back: vehicle.photo_back_url || null,
          left: vehicle.photo_left_url || null,
          right: vehicle.photo_right_url || null,
        });
      } catch (err: any) {
        setToast(
          err?.response?.data?.message || "No se pudo cargar el vehículo"
        );
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

  // 🔍 Buscar cliente por DNI
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
      if (v.fuel_type) form.append("fuel_type", v.fuel_type); // 🔹 tipo de combustible
      if (v.reference_price)
        form.append("reference_price", String(v.reference_price));
      if (v.price) form.append("price", String(v.price));

      form.append("ownership", v.ownership || "propio");

      if (v.ownership === "consignado" && v.customer_dni) {
        form.append("customer_dni", v.customer_dni);
        form.append("customer_name", v.customer_name || "");
        if (v.customer_email) form.append("customer_email", v.customer_email);
        if (v.customer_phone) form.append("customer_phone", v.customer_phone);
      }

      // ✅ Enviar booleanos como 1/0
      form.append("check_spare", v.check_spare ? "1" : "0");
      form.append("check_jack", v.check_jack ? "1" : "0");
      form.append("check_docs", v.check_docs ? "1" : "0");

      if (v.notes) form.append("notes", v.notes);

      // Adjuntar nuevas fotos o eliminar
      Object.entries(newPhotos).forEach(([side, file]) => {
        if (file) form.append(`photo_${side}`, file);
        else form.append(`delete_photo_${side}`, "1");
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

        {/* Datos vehículo */}
        <div className="card vstack" style={{ gap: 16 }}>
          <Input
            label="Patente *"
            value={v.plate || ""}
            onChange={(e) => setV({ ...v, plate: e.currentTarget.value })}
            required
          />

          <div className="hstack" style={{ gap: 16 }}>
            {/* 🔹 Marca */}
            <div className="form-group" style={{ flex: 1 }}>
              <label>Marca *</label>
              <select
  className="form-control"
  value={v.brand || ""}
  onChange={(e) => setV({ ...v, brand: e.currentTarget.value })}
  required
>
  <option value="">Seleccionar marca</option>
  {MARCAS.map((m) => (
    <option key={m} value={m}>
      {m}
    </option>
  ))}
</select>

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

          {/* 🔹 Color, km y combustible */}
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
  onChange={(e) => setV({ ...v, fuel_type: e.currentTarget.value })}
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

          {/* 🆕 Campos de precio */}
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

        {/* Propiedad */}
        <div className="card vstack">
          <div className="hstack" style={{ gap: 16 }}>
            <label>
              <input
                type="radio"
                name="ownership"
                value="propio"
                checked={v.ownership === "propio"}
                onChange={() =>
                  setV({ ...v, ownership: "propio", customer_dni: undefined })
                }
              />
              Propio
            </label>
            <label>
              <input
                type="radio"
                name="ownership"
                value="consignado"
                checked={v.ownership === "consignado"}
                onChange={() => setV({ ...v, ownership: "consignado" })}
              />
              Consignado
            </label>
          </div>
        </div>

        {/* Cliente consignado */}
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

        {/* Fotos */}
        <div className="card vstack" style={{ gap: 12 }}>
          <div className="title">Fotos del vehículo</div>
          <div className="hstack" style={{ flexWrap: "wrap", gap: 16 }}>
            {["front", "back", "left", "right"].map((side) => (
              <div
                key={side}
                className="form-group"
                style={{ flex: 1, minWidth: 180 }}
              >
                <label>
                  {
                    {
                      front: "Frente",
                      back: "Dorso",
                      left: "Lateral Izquierdo",
                      right: "Lateral Derecho",
                    }[side]
                  }
                </label>
                {preview[side] ? (
                  <div style={{ position: "relative" }}>
                    <img
                      src={preview[side]!}
                      alt={side}
                      style={{
                        width: "100%",
                        maxWidth: 280,
                        marginTop: 8,
                        borderRadius: 8,
                      }}
                    />
                    <Button
                      type="button"
                      onClick={() => handleRemovePhoto(side)}
                      style={{
                        position: "absolute",
                        top: 6,
                        right: 6,
                        padding: "4px 8px",
                        fontSize: "0.8rem",
                      }}
                    >
                      Quitar
                    </Button>
                  </div>
                ) : (
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => handleFileChange(e, side)}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Checklist */}
        <div className="card vstack" style={{ gap: 8 }}>
          <div className="title">Checklist</div>
          <label>
            <input
              type="checkbox"
              checked={v.check_spare || false}
              onChange={(e) =>
                setV({ ...v, check_spare: e.currentTarget.checked })
              }
            />{" "}
            Rueda de auxilio
          </label>
          <label>
            <input
              type="checkbox"
              checked={v.check_jack || false}
              onChange={(e) =>
                setV({ ...v, check_jack: e.currentTarget.checked })
              }
            />{" "}
            Cric / Herramientas
          </label>
          <label>
            <input
              type="checkbox"
              checked={v.check_docs || false}
              onChange={(e) =>
                setV({ ...v, check_docs: e.currentTarget.checked })
              }
            />{" "}
            Documentación
          </label>
          <textarea
  className="form-control"
  placeholder="Observaciones"
  value={v.notes || ""}
  onChange={(e) => setV({ ...v, notes: e.currentTarget.value })}
/>

        </div>

        <div className="hstack" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" loading={saving}>
            Guardar cambios
          </Button>
        </div>
      </form>

      {toast && (
        <Toast
          message={toast}
          type={toast.includes("✅") ? "success" : "error"}
        />
      )}
    </div>
  );
}
