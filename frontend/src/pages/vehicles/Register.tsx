import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import useRedirectAfterSave from "../../hooks/useRedirectAfterSave";
import api from "../../lib/api";

export default function RegisterVehicle() {
  const { goBack } = useRedirectAfterSave("/vehiculos");

  // 🔹 Estado de marcas (desde BD)
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
  const [checkJack, setCheckJack] = useState(true); // Cric
  const [checkTools, setCheckTools] = useState(true); // 🆕 Herramientas
  const [checkDocs, setCheckDocs] = useState(true);
  const [checkKeyCopy, setCheckKeyCopy] = useState(true);
  const [checkManual, setCheckManual] = useState(true);

  const [notes, setNotes] = useState("");

  // 📸 Fotos
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
    // 🔹 Restaurar formulario si se había guardado antes
    const saved = localStorage.getItem("vehicleFormBackup");
    if (saved) {
      const data = JSON.parse(saved);
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
      setCheckKeyCopy(data.checkKeyCopy ?? true); // 🆕
      setCheckManual(data.checkManual ?? true); // 🆕
      setCheckTools(data.checkTools ?? true);
      setCheckKeyCopy(data.checkKeyCopy ?? true);
      setCheckManual(data.checkManual ?? true);
      setNotes(data.notes || "");
      localStorage.removeItem("vehicleFormBackup");
    }

    // 🔹 Si acaba de registrarse un cliente, cargarlo automáticamente
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

  // 🔹 Cargar marcas
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

  // 🔹 Agregar nueva marca
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

  // ✅ Envío del formulario
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
      if (takePrice) form.append("take_price", String(takePrice));
      if (price) form.append("price", String(price));
      form.append("ownership", ownership);
      form.append("check_spare", checkSpare ? "1" : "0");
      form.append("check_jack", checkJack ? "1" : "0"); // Cric
      form.append("check_tools", checkTools ? "1" : "0"); // Herramientas
      form.append("check_docs", checkDocs ? "1" : "0");
      form.append("check_key_copy", checkKeyCopy ? "1" : "0");
      form.append("check_manual", checkManual ? "1" : "0");
      if (notes) form.append("notes", notes);
      if (ownership === "consignado") {
        form.append("customer_dni", dni);
        form.append("customer_name", customerName);
        if (customerEmail) form.append("customer_email", customerEmail);
        if (customerPhone) form.append("customer_phone", customerPhone);
      }

      // 📸 Agregar todas las fotos
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

      // 💾 Guardar el vehículo recién registrado en localStorage
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

          <div className="hstack" style={{ gap: 16 }}>
            <Input
              label="VIN / Chasis"
              value={vin}
              onChange={(e) => setVin(e.currentTarget.value)}
            />
          </div>

          {/* Color, km y combustible */}
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

          {/* Campos de precios */}
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
              label="Valor de toma ($)"
              type="number"
              value={takePrice as any}
              onChange={(e) =>
                setTakePrice(parseFloat(e.currentTarget.value) || "")
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

            <Button
              type="button"
              onClick={() => {
                const state = {
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
                  checkManual, // 🆕
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

        {/* Fotos */}
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
            Crique
          </label>

          <label>
            <input
              type="checkbox"
              checked={checkTools}
              onChange={(e) => setCheckTools(e.currentTarget.checked)}
            />{" "}
            Herramientas
          </label>

          <label>
            <input
              type="checkbox"
              checked={checkDocs}
              onChange={(e) => setCheckDocs(e.currentTarget.checked)}
            />{" "}
            Documentación
          </label>

          <label>
            <input
              type="checkbox"
              checked={checkKeyCopy}
              onChange={(e) => setCheckKeyCopy(e.currentTarget.checked)}
            />{" "}
            Duplicado de llave
          </label>

          <label>
            <input
              type="checkbox"
              checked={checkManual}
              onChange={(e) => setCheckManual(e.currentTarget.checked)}
            />{" "}
            Manual
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

      {/* Modal para nueva marca */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3>Agregar nueva marca</h3>
            <input
              type="text"
              value={newBrand}
              onChange={(e) => setNewBrand(e.currentTarget.value)}
              className="form-control"
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
