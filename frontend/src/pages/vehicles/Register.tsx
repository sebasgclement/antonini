import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import InfoAutoModal from "../../components/modals/InfoAutoModal";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import Toggle from "../../components/ui/Toggle";
import useRedirectAfterSave from "../../hooks/useRedirectAfterSave";
import api from "../../lib/api";

export default function RegisterVehicle() {
  const { goBack } = useRedirectAfterSave("/vehiculos");

  // 🔹 ESTADOS DEL FORMULARIO
  const [locationStatus, setLocationStatus] = useState<"stock" | "ofrecido">(
    "stock"
  );

  // Campos del auto
  const [brand, setBrand] = useState(""); // Ahora es texto libre
  const [model, setModel] = useState("");
  const [plate, setPlate] = useState("");
  const [year, setYear] = useState<number | "">("");
  const [vin, setVin] = useState("");
  const [color, setColor] = useState("");
  const [km, setKm] = useState<number | "">("");
  const [fuelType, setFuelType] = useState<string>("");
  const [referencePrice, setReferencePrice] = useState<number | "">("");
  const [takePrice, setTakePrice] = useState<number | "">("");
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
  const [checkTools, setCheckTools] = useState(true);
  const [checkDocs, setCheckDocs] = useState(true);
  const [checkKeyCopy, setCheckKeyCopy] = useState(true);
  const [checkManual, setCheckManual] = useState(true);
  const [notes, setNotes] = useState("");

  // Fotos
  const [photoFront, setPhotoFront] = useState<File | null>(null);
  const [photoBack, setPhotoBack] = useState<File | null>(null);
  const [photoLeft, setPhotoLeft] = useState<File | null>(null);
  const [photoRight, setPhotoRight] = useState<File | null>(null);
  const [photoInteriorFront, setPhotoInteriorFront] = useState<File | null>(
    null
  );
  const [photoInteriorBack, setPhotoInteriorBack] = useState<File | null>(null);
  const [photoTrunk, setPhotoTrunk] = useState<File | null>(null);
  const [preview, setPreview] = useState<Record<string, string | null>>({});

  // UI States
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showInfoAutoModal, setShowInfoAutoModal] = useState(false);

  // 🔹 Función para recibir datos desde InfoAuto (SIMPLIFICADA)
  const handleInfoAutoImport = (data: any) => {
    // Ya no necesitamos validar contra una lista de marcas.
    // Simplemente tomamos el texto que viene de la API.
    setBrand(data.brand);
    setModel(data.model);
    setYear(data.year);
    setReferencePrice(data.price);
    setPrice(data.price);

    setToast("Datos importados correctamente ✅");
  };

  // Restaurar Backup
  useEffect(() => {
    const saved = localStorage.getItem("vehicleFormBackup");
    if (saved) {
      const data = JSON.parse(saved);
      if (data.locationStatus) setLocationStatus(data.locationStatus);
      setPlate(data.plate || "");
      setBrand(data.brand || "");
      setModel(data.model || "");
      setYear(data.year || "");
      setVin(data.vin || "");
      setColor(data.color || "");
      setKm(data.km || "");
      setFuelType(data.fuelType || "");
      setReferencePrice(data.referencePrice || "");
      setTakePrice(data.takePrice || "");
      setPrice(data.price || "");
      setOwnership(data.ownership || "consignado");
      setDni(data.dni || "");
      setCustomerName(data.customerName || "");
      setCustomerEmail(data.customerEmail || "");
      setCustomerPhone(data.customerPhone || "");
      setCheckSpare(data.checkSpare ?? true);
      setCheckJack(data.checkJack ?? true);
      setCheckDocs(data.checkDocs ?? true);
      setCheckKeyCopy(data.checkKeyCopy ?? true);
      setCheckManual(data.checkManual ?? true);
      setCheckTools(data.checkTools ?? true);
      setNotes(data.notes || "");
      localStorage.removeItem("vehicleFormBackup");
    }

    const newClient = localStorage.getItem("lastRegisteredCustomer");
    if (newClient) {
      const c = JSON.parse(newClient);
      setDni(c.dni || "");
      setCustomerName(c.name || "");
      setCustomerEmail(c.email || "");
      setCustomerPhone(c.phone || "");
      localStorage.removeItem("lastRegisteredCustomer");
      setToast("Cliente cargado automáticamente ✅");
    }
  }, []);

  const handleFileChange = (e: ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview((prev) => ({ ...prev, [key]: url }));

    switch (key) {
      case "front":
        setPhotoFront(file);
        break;
      case "back":
        setPhotoBack(file);
        break;
      case "left":
        setPhotoLeft(file);
        break;
      case "right":
        setPhotoRight(file);
        break;
      case "interior_front":
        setPhotoInteriorFront(file);
        break;
      case "interior_back":
        setPhotoInteriorBack(file);
        break;
      case "trunk":
        setPhotoTrunk(file);
        break;
    }
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

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setToast("");

    try {
      const form = new FormData();
      form.append(
        "status",
        locationStatus === "ofrecido" ? "ofrecido" : "disponible"
      );

      if (plate) form.append("plate", plate);
      form.append("brand", brand);
      form.append("model", model);
      if (year) form.append("year", String(year));

      if (vin) form.append("vin", vin);
      if (color) form.append("color", color);
      if (km) form.append("km", String(km));
      if (fuelType) form.append("fuel_level", fuelType);

      if (referencePrice)
        form.append("reference_price", String(referencePrice));
      if (takePrice) form.append("take_price", String(takePrice));
      if (price) form.append("price", String(price));

      form.append("ownership", ownership);

      if (locationStatus === "stock") {
        form.append("check_spare", checkSpare ? "1" : "0");
        form.append("check_jack", checkJack ? "1" : "0");
        form.append("check_tools", checkTools ? "1" : "0");
        form.append("check_docs", checkDocs ? "1" : "0");
        form.append("check_key_copy", checkKeyCopy ? "1" : "0");
        form.append("check_manual", checkManual ? "1" : "0");
      }

      if (notes) form.append("notes", notes);

      if (ownership === "consignado") {
        form.append("customer_dni", dni);
        form.append("customer_name", customerName);
        if (customerEmail) form.append("customer_email", customerEmail);
        if (customerPhone) form.append("customer_phone", customerPhone);
      }

      const photos = {
        photo_front: photoFront,
        photo_back: photoBack,
        photo_left: photoLeft,
        photo_right: photoRight,
        photo_interior_front: photoInteriorFront,
        photo_interior_back: photoInteriorBack,
        photo_trunk: photoTrunk,
      };

      Object.entries(photos).forEach(([key, file]) => {
        if (file) form.append(key, file);
      });

      const res = await api.post("/vehicles", form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const newVehicle = res.data?.data || res.data;
      const redirect = new URLSearchParams(window.location.search).get(
        "redirect"
      );

      if (newVehicle) {
        localStorage.setItem(
          "lastRegisteredVehicle",
          JSON.stringify(newVehicle)
        );
      }

      if (redirect?.includes("/reservas/nueva") && newVehicle?.id) {
        window.location.href = `${redirect}?vehicle_id=${newVehicle.id}`;
      } else {
        setToast("Vehículo registrado con éxito ✅");
        setTimeout(() => goBack(), 800);
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
      {/* HEADER */}
      <div
        className="hstack"
        style={{
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 20,
        }}
      >
        <div className="title" style={{ margin: 0 }}>
          Registro de vehículos
        </div>
        <Button
          type="button"
          onClick={() => goBack()}
          className="btn-secondary"
          style={{
            background: "transparent",
            border: "1px solid var(--border-color)",
          }}
        >
          Cancelar / Volver
        </Button>
      </div>

      <form onSubmit={onSubmit} className="vstack" style={{ gap: 16 }}>
        {/* SECCIÓN ESTADO */}
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
                setOwnership("consignado");
              }}
            >
              <div className="selection-title">📞 Solo Ofrecido (Dato)</div>
              <div className="selection-subtitle">
                El cliente retiene la unidad
              </div>
            </div>
          </div>
        </div>

        {/* 🟢 BOTÓN INFOAUTO */}
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <Button
            type="button"
            onClick={() => setShowInfoAutoModal(true)}
            style={{
              background: "linear-gradient(135deg, #6366f1, #4f46e5)",
              border: "none",
              boxShadow: "0 4px 10px rgba(99, 102, 241, 0.3)",
            }}
          >
            ✨ Autocompletar con InfoAuto
          </Button>
        </div>

        {/* DATOS BÁSICOS */}
        <div className="card vstack" style={{ gap: 16 }}>
          <div className="hstack" style={{ gap: 16 }}>
            <div style={{ flex: 1 }}>
              <Input
                label={
                  locationStatus === "stock"
                    ? "Patente *"
                    : "Patente (Opcional)"
                }
                value={plate}
                onChange={(e) => setPlate(e.currentTarget.value)}
                required={locationStatus === "stock"}
                placeholder={
                  locationStatus === "ofrecido" ? "Sin patente" : "Ej: AA123BB"
                }
              />
            </div>
          </div>

          <div className="hstack" style={{ gap: 16 }}>
            {/* CAMBIO: INPUT SIMPLE DE MARCA (Sin Select, Sin Botón +) */}
            <Input
              label="Marca *"
              value={brand}
              onChange={(e) => setBrand(e.currentTarget.value)}
              required
              placeholder="Ej: Ford, Toyota, Fiat"
            />

            <Input
              label="Modelo *"
              value={model}
              onChange={(e) => setModel(e.currentTarget.value)}
              required
              placeholder="Ej: Corolla 2.0 SEG CVT"
            />
            <Input
              label="Año"
              type="number"
              value={year as any}
              onChange={(e) => setYear(parseInt(e.currentTarget.value) || "")}
            />
          </div>

          {locationStatus === "stock" && (
            <div className="hstack" style={{ gap: 16 }}>
              <Input
                label="VIN / Chasis"
                value={vin}
                onChange={(e) => setVin(e.currentTarget.value)}
              />
            </div>
          )}

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
              onChange={(e) => setKm(Number(e.target.value))}
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
              label="Valor toma ($)"
              type="number"
              value={takePrice as any}
              onChange={(e) => setTakePrice(Number(e.target.value))}
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

        {/* ... SECCIONES PROPIEDAD, CLIENTE, FOTOS Y CHECKLIST ... */}
        {/* === PROPIEDAD === */}
        <div className="card vstack" style={{ gap: 12 }}>
          <div className="title">Propiedad</div>
          <div className="selection-grid">
            <div
              className={`selection-card ${
                ownership === "propio" ? "selected" : ""
              } ${locationStatus === "ofrecido" ? "disabled" : ""}`}
              onClick={() => {
                if (locationStatus !== "ofrecido") setOwnership("propio");
              }}
            >
              <div className="selection-title">🏢 Propio</div>
              <div className="selection-subtitle">Unidad de la agencia</div>
            </div>
            <div
              className={`selection-card ${
                ownership === "consignado" ? "selected" : ""
              }`}
              onClick={() => setOwnership("consignado")}
            >
              <div className="selection-title">🤝 Consignado</div>
              <div className="selection-subtitle">Unidad de terceros</div>
            </div>
          </div>
        </div>

        {/* === CLIENTE / CONSIGNADO === */}
        {ownership === "consignado" && (
          <div className="card vstack" style={{ gap: 16 }}>
            <div className="title">Datos del cliente / Dueño</div>
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
            <Button
              type="button"
              onClick={() => {
                const state = {
                  locationStatus,
                  plate,
                  brand,
                  model,
                  year,
                  vin,
                  color,
                  km,
                  fuelType,
                  referencePrice,
                  takePrice,
                  price,
                  ownership,
                  dni,
                  customerName,
                  customerEmail,
                  customerPhone,
                  checkSpare,
                  checkJack,
                  checkTools,
                  checkDocs,
                  checkKeyCopy,
                  checkManual,
                  notes,
                };
                localStorage.setItem(
                  "vehicleFormBackup",
                  JSON.stringify(state)
                );
                window.location.href =
                  "/clientes/registro?redirect=/vehiculos/registro";
              }}
            >
              + Registrar nuevo cliente
            </Button>
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

        {/* === FOTOS === */}
        <div className="card vstack" style={{ gap: 12 }}>
          <label>Fotos del vehículo (opcional)</label>
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
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* === CHECKLIST === */}
        {locationStatus === "stock" && (
          <div className="card vstack" style={{ gap: 16 }}>
            <div className="title">Checklist de Ingreso</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
                gap: 12,
              }}
            >
              <Toggle
                label="Rueda de auxilio"
                checked={checkSpare}
                onChange={setCheckSpare}
              />
              <Toggle
                label="Crique"
                checked={checkJack}
                onChange={setCheckJack}
              />
              <Toggle
                label="Herramientas"
                checked={checkTools}
                onChange={setCheckTools}
              />
              <Toggle
                label="Documentación"
                checked={checkDocs}
                onChange={setCheckDocs}
              />
              <Toggle
                label="Duplicado de llave"
                checked={checkKeyCopy}
                onChange={setCheckKeyCopy}
              />
              <Toggle
                label="Manual"
                checked={checkManual}
                onChange={setCheckManual}
              />
            </div>
            <textarea
              className="form-control"
              placeholder="Observaciones adicionales del estado..."
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
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
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
            />
          </div>
        )}

        <div
          className="hstack"
          style={{ justifyContent: "flex-end", marginTop: 20 }}
        >
          <Button type="submit" loading={loading}>
            Guardar Vehículo
          </Button>
        </div>
      </form>

      {/* MODAL INFOAUTO */}
      {showInfoAutoModal && (
        <InfoAutoModal
          onClose={() => setShowInfoAutoModal(false)}
          onImport={handleInfoAutoImport}
        />
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
