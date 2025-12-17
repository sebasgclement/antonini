import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import Toggle from "../../components/ui/Toggle";
import useRedirectAfterSave from "../../hooks/useRedirectAfterSave";
import api from "../../lib/api";

export default function RegisterVehicle() {
  const { goBack } = useRedirectAfterSave("/vehiculos");

  const [locationStatus, setLocationStatus] = useState<"stock" | "ofrecido">(
    "stock"
  );

  const [brands, setBrands] = useState<{ id: number; name: string }[]>([]);
  const [brand, setBrand] = useState("");
  const [newBrand, setNewBrand] = useState("");

  const [plate, setPlate] = useState("");
  const [model, setModel] = useState("");
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

  const [published, setPublished] = useState(false);
  const [notes, setNotes] = useState("");

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
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const [showModal, setShowModal] = useState(false);

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
      setPublished(data.published ?? false);
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

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get("/brands");
        setBrands(data);
      } catch {
        console.error("No se pudieron cargar las marcas");
      }
    })();
  }, []);

  const addBrand = async () => {
    if (!newBrand.trim()) return;
    try {
      const { data } = await api.post("/brands", { name: newBrand });
      setBrands((prev) => [...prev, data]);
      setBrand(data.name);
      setNewBrand("");
      setToast("Marca agregada ✅");
      setShowModal(false);
    } catch {
      setToast("No se pudo agregar la marca");
    }
  };

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
        locationStatus === "stock" ? "disponible" : "ofrecido"
      );
      if (locationStatus === "ofrecido" && !plate) {
        const dummyPlate = "OFR-" + Math.floor(1000 + Math.random() * 9000);
        form.append("plate", dummyPlate);
      } else {
        if (plate) form.append("plate", plate);
      }

      form.append("brand", brand);
      form.append("model", model);
      if (year) form.append("year", String(year));
      if (vin) form.append("vin", vin);
      if (color) form.append("color", color);
      if (km) form.append("km", String(km));
      if (fuelType) form.append("fuel_level", fuelType);

      if (locationStatus === "stock") {
        if (referencePrice)
          form.append("reference_price", String(referencePrice));
        if (takePrice) form.append("take_price", String(takePrice));
        if (price) form.append("price", String(price));
      } else {
        form.append("reference_price", "0");
        form.append("take_price", "0");
        form.append("price", "0");
      }

      form.append("ownership", ownership);
      const isPublished =
        locationStatus === "stock" ? (published ? "1" : "0") : "0";
      form.append("published", isPublished);

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
        if (dni) form.append("customer_dni", dni);
        form.append("customer_name", customerName);
        if (customerEmail) form.append("customer_email", customerEmail);
        if (customerPhone) form.append("customer_phone", customerPhone);
      }

      if (photoFront) form.append("photo_front", photoFront);
      if (photoBack) form.append("photo_back", photoBack);
      if (photoLeft) form.append("photo_left", photoLeft);
      if (photoRight) form.append("photo_right", photoRight);
      if (photoInteriorFront)
        form.append("photo_interior_front", photoInteriorFront);
      if (photoInteriorBack)
        form.append("photo_interior_back", photoInteriorBack);
      if (photoTrunk) form.append("photo_trunk", photoTrunk);

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
        setTimeout(goBack, 800);
      }
    } catch (err: any) {
      console.error(err);
      const msg =
        err?.response?.data?.message || "No se pudo registrar el vehículo";
      setToast(typeof msg === "string" ? msg : JSON.stringify(msg));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <form onSubmit={onSubmit} className="vstack" style={{ gap: 16 }}>
        <div className="title">Registro de vehículos</div>

        <div className="card">
          <div className="title" style={{ marginBottom: 16, fontSize: "1rem" }}>
            Estado del Ingreso
          </div>
          <div className="selection-grid">
            <div
              className={`selection-card ${
                locationStatus === "stock" ? "selected" : ""
              }`}
              onClick={() => {
                setLocationStatus("stock");
                setOwnership("consignado");
              }}
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
                setPublished(false);
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
              <span>Se generará una patente provisoria interna.</span>
            </div>
          )}
        </div>

        <div className="card vstack" style={{ gap: 16 }}>
          <Input
            label={
              locationStatus === "stock" ? "Patente *" : "Patente (Opcional)"
            }
            value={plate}
            onChange={(e) => setPlate(e.currentTarget.value.toUpperCase())}
            required={locationStatus === "stock"}
            placeholder={
              locationStatus === "ofrecido" ? "Dejar vacío si no se conoce" : ""
            }
          />

          <div className="hstack" style={{ gap: 16 }}>
            <div className="form-group" style={{ flex: 1 }}>
              <label>Marca *</label>
              <div className="hstack" style={{ gap: 8 }}>
                <select
                  className="form-control"
                  value={brand}
                  onChange={(e) => setBrand(e.currentTarget.value)}
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

          {locationStatus === "stock" && (
            <Input
              label="VIN / Chasis"
              value={vin}
              onChange={(e) => setVin(e.currentTarget.value)}
            />
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

          {locationStatus === "stock" && (
            <div className="hstack" style={{ gap: 16 }}>
              <Input
                label="Precio Ref. ($)"
                type="number"
                value={referencePrice as any}
                onChange={(e) =>
                  setReferencePrice(parseFloat(e.currentTarget.value) || "")
                }
              />
              <Input
                label="Valor Toma ($)"
                type="number"
                value={takePrice as any}
                onChange={(e) =>
                  setTakePrice(parseFloat(e.currentTarget.value) || "")
                }
              />
              <Input
                label="Precio Venta ($)"
                type="number"
                value={price as any}
                onChange={(e) =>
                  setPrice(parseFloat(e.currentTarget.value) || "")
                }
              />
            </div>
          )}
        </div>

        {locationStatus === "stock" && (
          <div className="card vstack" style={{ gap: 12 }}>
            <div className="title">Propiedad</div>
            <div className="selection-grid">
              <div
                className={`selection-card ${
                  ownership === "propio" ? "selected" : ""
                }`}
                onClick={() => setOwnership("propio")}
              >
                <div className="selection-title">🏢 Propio</div>
              </div>
              <div
                className={`selection-card ${
                  ownership === "consignado" ? "selected" : ""
                }`}
                onClick={() => setOwnership("consignado")}
              >
                <div className="selection-title">🤝 Consignado</div>
              </div>
            </div>
          </div>
        )}

        {ownership === "consignado" && (
          <div className="card vstack" style={{ gap: 16 }}>
            <div className="title">
              {locationStatus === "stock"
                ? "Datos del Dueño"
                : "Datos del Interesado / Dueño"}
            </div>
            <div className="form-row" style={{ alignItems: "flex-end" }}>
              <div style={{ flex: 1 }}>
                <Input
                  label={
                    locationStatus === "stock" ? "DNI *" : "DNI (Opcional)"
                  }
                  value={dni}
                  onChange={(e) => setDni(e.currentTarget.value)}
                  required={locationStatus === "stock"}
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
                  published,
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
              label={
                locationStatus === "ofrecido"
                  ? "Nombre completo *"
                  : "Nombre completo"
              }
              value={customerName}
              onChange={(e) => setCustomerName(e.currentTarget.value)}
              required={locationStatus === "ofrecido"}
            />
            <Input
              label="Email"
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.currentTarget.value)}
            />
            <Input
              label={locationStatus === "ofrecido" ? "Teléfono *" : "Teléfono"}
              value={customerPhone}
              onChange={(e) => setCustomerPhone(e.currentTarget.value)}
              required={locationStatus === "ofrecido"}
            />
          </div>
        )}

        <div className="card vstack" style={{ gap: 12 }}>
          <label>Fotos (Opcional)</label>
          <div className="hstack" style={{ flexWrap: "wrap", gap: 16 }}>
            {[
              { key: "front", label: "Frente" },
              { key: "back", label: "Dorso" },
              { key: "left", label: "Lat. Izq" },
              { key: "right", label: "Lat. Der" },
              { key: "interior_front", label: "Int. Ade" },
              { key: "interior_back", label: "Int. Atr" },
              { key: "trunk", label: "Baúl" },
            ].map(({ key, label }) => (
              <div
                key={key}
                className="form-group"
                style={{ flex: 1, minWidth: 150 }}
              >
                <label style={{ fontSize: "0.9rem" }}>{label}</label>
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
                      marginTop: 8,
                      borderRadius: 8,
                      height: 100,
                      objectFit: "cover",
                    }}
                  />
                )}
              </div>
            ))}
          </div>
        </div>

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
                label="Auxilio"
                checked={checkSpare}
                onChange={setCheckSpare}
              />
              <Toggle
                label="Crique"
                checked={checkJack}
                onChange={setCheckJack}
              />
              <Toggle
                label="Herr."
                checked={checkTools}
                onChange={setCheckTools}
              />
              <Toggle
                label="Docs"
                checked={checkDocs}
                onChange={setCheckDocs}
              />
              <Toggle
                label="Copia Llave"
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
              placeholder="Observaciones..."
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
              style={{ marginTop: 8 }}
            />
          </div>
        )}

        {locationStatus === "ofrecido" && (
          <div className="card">
            <label>Observaciones</label>
            <textarea
              className="form-control"
              placeholder="Detalles importantes..."
              value={notes}
              onChange={(e) => setNotes(e.currentTarget.value)}
            />
          </div>
        )}

        {locationStatus === "stock" && (
          <div
            className="card hstack"
            style={{ justifyContent: "space-between", alignItems: "center" }}
          >
            <div>
              <div style={{ fontWeight: 600 }}>Publicar en Web</div>
              <p
                className="text-muted"
                style={{ margin: 0, fontSize: "0.9rem" }}
              >
                Visible en la galería online.
              </p>
            </div>
            <Toggle checked={published} onChange={setPublished} />
          </div>
        )}

        <div className="hstack" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" loading={loading}>
            Guardar
          </Button>
        </div>
      </form>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Nueva Marca</h3>
            <input
              value={newBrand}
              onChange={(e) => setNewBrand(e.currentTarget.value)}
              className="form-control"
              placeholder="Nombre"
            />
            <div
              className="hstack"
              style={{ justifyContent: "flex-end", gap: 8, marginTop: 16 }}
            >
              <Button onClick={addBrand}>Guardar</Button>
              {/* Botón arreglado aquí 👇: Sin variant, con estilo inline simple */}
              <Button
                onClick={() => setShowModal(false)}
                type="button"
                style={{ backgroundColor: "#9ca3af" }}
              >
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
