import { useState, type ChangeEvent, type FormEvent } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import useRedirectAfterSave from "../../hooks/useRedirectAfterSave";
import api from "../../lib/api";

export default function RegisterVehicle() {
  const { goBack } = useRedirectAfterSave("/vehiculos");

  const [plate, setPlate] = useState("");
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [vin, setVin] = useState("");
  const [color, setColor] = useState("");
  const [km, setKm] = useState<number | "">("");
  const [fuelType, setFuelType] = useState<string>(""); // 🔹 ahora guarda tipo de combustible

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

  // 🆕 Nuevos campos
  const [referencePrice, setReferencePrice] = useState<number | "">("");
  const [price, setPrice] = useState<number | "">("");

  const [ownership, setOwnership] = useState<"propio" | "consignado">(
    "consignado"
  );
  const [dni, setDni] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");

  const [checkSpare, setCheckSpare] = useState(true);
  const [checkJack, setCheckJack] = useState(true);
  const [checkDocs, setCheckDocs] = useState(true);
  const [notes, setNotes] = useState("");

  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoBack, setPhotoBack] = useState<File | null>(null);
  const [photoLeft, setPhotoLeft] = useState<File | null>(null);
  const [photoRight, setPhotoRight] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string | null>>({});

  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview((prev) => ({ ...prev, [key]: url }));
    if (key === "front") setPhotoFront(file);
    if (key === "back") setPhotoBack(file);
    if (key === "left") setPhotoLeft(file);
    if (key === "right") setPhotoRight(file);
  };

  const searchByDni = async () => {
    if (!dni.trim()) return;
    try {
      const res = await api.get(`/customers?dni=${dni}`);
      const found = res.data?.data?.[0] || null;
      if (found) {
        setCustomerName(found.first_name + " " + found.last_name);
        setCustomerEmail(found.email || "");
        setCustomerPhone(found.phone || "");
        setToast("Cliente encontrado ✅");
      } else {
        setToast("No se encontró cliente con ese DNI");
      }
    } catch {
      setToast("Error al buscar cliente");
    }
  };

  // ✅ onSubmit actualizado
  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setToast("");

    try {
      const form = new FormData();
      form.append("plate", plate);
      form.append("brand", brand);
      form.append("model", model);
      if (year) form.append("year", String(year));
      if (vin) form.append("vin", vin);
      if (color) form.append("color", color);
      if (km) form.append("km", String(km));
      if (fuelType) form.append("fuel_level", fuelType);
      if (referencePrice)
        form.append("reference_price", String(referencePrice));
      if (price) form.append("price", String(price));

      form.append("ownership", ownership);

      // ✅ Enviar 1/0 en lugar de true/false
      form.append("check_spare", checkSpare ? "1" : "0");
      form.append("check_jack", checkJack ? "1" : "0");
      form.append("check_docs", checkDocs ? "1" : "0");

      if (notes) form.append("notes", notes);

      if (ownership === "consignado") {
        form.append("customer_dni", dni);
        form.append("customer_name", customerName);
        if (customerEmail) form.append("customer_email", customerEmail);
        if (customerPhone) form.append("customer_phone", customerPhone);
      }

      // 📸 Fotos
      if (photoFront) form.append("photo_front", photoFront);
      if (photoBack) form.append("photo_back", photoBack);
      if (photoLeft) form.append("photo_left", photoLeft);
      if (photoRight) form.append("photo_right", photoRight);

      const res = await api.post("/vehicles", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newId = res.data?.data?.id ?? res.data?.id;
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect"
      );

      if (redirect?.includes("/reservas/nueva") && newId) {
        window.location.href = `${redirect}?vehicle_id=${newId}`;
      } else {
        setToast("Vehículo registrado con éxito ✅");
        setTimeout(goBack, 800);
      }
    } catch (err: any) {
      setToast(
        err?.response?.data?.message || "No se pudo registrar el vehículo"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <form onSubmit={onSubmit} className="vstack" style={{ gap: 16 }}>
        <div className="title">Registro de vehículos</div>

        {/* Datos básicos */}
        <div className="card vstack" style={{ gap: 16 }}>
          <Input
            label="Patente *"
            value={plate}
            onChange={(e) => setPlate(e.currentTarget.value)}
            required
          />

          <div className="hstack" style={{ gap: 16 }}>
            {/* 🔹 Marca */}
            <div className="form-group" style={{ flex: 1 }}>
              <label>Marca *</label>
              <select
  className="form-control"
  value={brand}
  onChange={(e) => setBrand(e.currentTarget.value)}
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
              value={model}
              onChange={(e) => setModel(e.currentTarget.value)}
              required
            />
            <Input
              label="Año"
              type="number"
              value={year as any}
              onChange={(e) => setYear(parseInt(e.currentTarget.value) || "")}
            />
          </div>

          <div className="hstack" style={{ gap: 16 }}>
            <Input
              label="VIN / Chasis"
              value={vin}
              onChange={(e) => setVin(e.currentTarget.value)}
            />
          </div>

          {/* 🔹 Color, km y combustible */}
          <div className="hstack" style={{ gap: 16 }}>
            <Input
              label="Color"
              value={color}
              onChange={(e) => setColor(e.currentTarget.value)}
            />

            <Input
              label="Kilometraje (km)"
              type="number"
              value={km as any}
              onChange={(e) => setKm(parseInt(e.currentTarget.value) || "")}
            />

            <div className="form-group" style={{ flex: 1 }}>
              <label>Tipo de combustible *</label>
              <select
  className="form-control"
  value={fuelType}
  onChange={(e) => setFuelType(e.currentTarget.value)}
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

          {/* 🆕 Campos de precios */}
          <div className="hstack" style={{ gap: 16 }}>
            <Input
              label="Precio de referencia ($)"
              type="number"
              value={referencePrice as any}
              onChange={(e) =>
                setReferencePrice(parseFloat(e.currentTarget.value) || "")
              }
            />
            <Input
              label="Precio de venta ($)"
              type="number"
              value={price as any}
              onChange={(e) =>
                setPrice(parseFloat(e.currentTarget.value) || "")
              }
            />
          </div>
        </div>

        {/* Propiedad */}
        <div className="card vstack" style={{ gap: 8 }}>
          <div className="title">Propiedad</div>
          <div className="hstack" style={{ gap: 16 }}>
            <label>
              <input
                type="radio"
                name="ownership"
                value="propio"
                checked={ownership === "propio"}
                onChange={() => setOwnership("propio")}
              />{" "}
              Propio
            </label>
            <label>
              <input
                type="radio"
                name="ownership"
                value="consignado"
                checked={ownership === "consignado"}
                onChange={() => setOwnership("consignado")}
              />{" "}
              Consignado
            </label>
          </div>
        </div>

        {/* Cliente consignado */}
        {ownership === "consignado" && (
          <div className="card vstack" style={{ gap: 16 }}>
            <div className="title">Datos del cliente</div>

            <div className="form-row" style={{ alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Input
                  label="DNI *"
                  value={dni}
                  onChange={(e) => setDni(e.currentTarget.value)}
                  required
                />
              </div>
              <Button type="button" onClick={searchByDni}>
                Buscar
              </Button>
            </div>

            <a
              href="/clientes/registro?redirect=/vehiculos/registro"
              className="enlace"
            >
              + Registrar nuevo cliente
            </a>

            <Input
              label="Nombre completo"
              value={customerName}
              onChange={(e) => setCustomerName(e.currentTarget.value)}
            />
            <Input
              label="Email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.currentTarget.value)}
            />
            <Input
              label="Teléfono"
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.currentTarget.value)}
            />
          </div>
        )}

        {/* Fotos */}
        <div className="card vstack" style={{ gap: 12 }}>
          <label>Fotos del vehículo (opcional)</label>
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
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, side)}
                />
                {preview[side] && (
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
              checked={checkSpare}
              onChange={(e) => setCheckSpare(e.currentTarget.checked)}
            />{" "}
            Rueda de auxilio
          </label>
          <label>
            <input
              type="checkbox"
              checked={checkJack}
              onChange={(e) => setCheckJack(e.currentTarget.checked)}
            />{" "}
            Cric / Herramientas
          </label>
          <label>
            <input
              type="checkbox"
              checked={checkDocs}
              onChange={(e) => setCheckDocs(e.currentTarget.checked)}
            />{" "}
            Documentación
          </label>
          <textarea
  className="form-control"
  placeholder="Observaciones"
  value={notes}
  onChange={(e) => setNotes(e.currentTarget.value)}
/>

        </div>

        <div className="hstack" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" loading={loading}>
            Guardar
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
