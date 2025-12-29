import { useEffect, useState, type ChangeEvent, type FormEvent } from "react";
import { useNavigate, useParams } from "react-router-dom";
import Button from "../../components/ui/Button";
import Input from "../../components/ui/Input";
import Toast from "../../components/ui/Toast";
import api from "../../lib/api";
import type { Customer } from "../../types/customer";

export default function CustomerEdit() {
  const { id } = useParams();
  const nav = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  // Controla el modo visual
  const [customerType, setCustomerType] = useState<"consulta" | "completo">(
    "consulta"
  );

  // Estado del cliente
  const [c, setC] = useState<Partial<Customer>>({});

  // Fotos
  const [dniFront, setDniFront] = useState<File | null>(null);
  const [dniBack, setDniBack] = useState<File | null>(null);
  const [previewFront, setPreviewFront] = useState<string | null>(null);
  const [previewBack, setPreviewBack] = useState<string | null>(null);

  // Flags para borrar foto
  const [deleteFront, setDeleteFront] = useState(false);
  const [deleteBack, setDeleteBack] = useState(false);

  // Helper para limpiar URLs (igual que en el View)
  const getCleanUrl = (url: any) => {
    if (!url) return null;
    if (typeof url === "string" && url.includes("/api/storage")) {
      return url.replace("/api/storage", "/storage");
    }
    return url;
  };

  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get(`/customers/${id}`);
        const cliente = data?.data ?? data ?? {};
        setC(cliente);

        // 🔹 LÓGICA BASADA EN STATUS REAL (Robustez total)
        if (cliente.status === "cliente") {
          setCustomerType("completo");
        } else {
          // Si es 'consulta' o null (viejos), lo tratamos como consulta
          setCustomerType("consulta");
        }

        // Previews iniciales (con limpieza de URL)
        if (cliente.dni_front_url)
          setPreviewFront(getCleanUrl(cliente.dni_front_url));
        if (cliente.dni_back_url)
          setPreviewBack(getCleanUrl(cliente.dni_back_url));
      } catch (e: any) {
        setToast(e?.response?.data?.message || "No se pudo cargar el cliente");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const handleFileChange = (
    e: ChangeEvent<HTMLInputElement>,
    side: "front" | "back"
  ) => {
    const file = e.target.files?.[0] || null;
    if (!file) return;
    const url = URL.createObjectURL(file);

    if (side === "front") {
      setDniFront(file);
      setPreviewFront(url);
      setDeleteFront(false);
    } else {
      setDniBack(file);
      setPreviewBack(url);
      setDeleteBack(false);
    }
  };

  const handleDeleteImage = (side: "front" | "back") => {
    if (side === "front") {
      setDniFront(null);
      setPreviewFront(null);
      setDeleteFront(true);
    } else {
      setDniBack(null);
      setPreviewBack(null);
      setDeleteBack(true);
    }
  };

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaving(true);

    try {
      const form = new FormData();

      // 🔥 MANDAMOS EL STATUS NUEVO (Por si queremos promoverlo)
      form.append(
        "status",
        customerType === "consulta" ? "consulta" : "cliente"
      );

      // Datos Base OBLIGATORIOS (Ahora incluye DNI)
      form.append("first_name", c.first_name || "");
      form.append("last_name", c.last_name || "");

      // DNI siempre visible (ahora opcional en backend, pero lo mandamos si está)
      if (c.doc_type) form.append("doc_type", c.doc_type);
      if (c.doc_number) form.append("doc_number", c.doc_number);

      form.append("phone", c.phone || ""); // El teléfono principal es clave

      // Datos opcionales comunes
      if (c.email) form.append("email", c.email);
      if (c.alt_phone) form.append("alt_phone", c.alt_phone);
      if (c.notes) form.append("notes", c.notes);

      // 🔹 CONDICIONAL: Solo enviamos datos extra si es COMPLETO
      if (customerType === "completo") {
        if (c.cuit) form.append("cuit", c.cuit);
        if (c.marital_status) form.append("marital_status", c.marital_status);
        if (c.address) form.append("address", c.address);
        if (c.city) form.append("city", c.city);

        // Fotos nuevas
        if (dniFront) form.append("dni_front", dniFront);
        if (dniBack) form.append("dni_back", dniBack);

        // Eliminar imágenes
        if (deleteFront && !dniFront) form.append("delete_dni_front", "1");
        if (deleteBack && !dniBack) form.append("delete_dni_back", "1");
      }

      await api.post(`/customers/${id}?_method=PUT`, form, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      setToast("Cliente actualizado ✅");
      setTimeout(() => nav("/clientes"), 800);
    } catch (e: any) {
      setToast(e?.response?.data?.message || "No se pudo actualizar");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div
        className="container"
        style={{
          padding: 20,
          textAlign: "center",
          color: "var(--color-muted)",
        }}
      >
        Cargando...
      </div>
    );

  return (
    <div className="container vstack detail-page" style={{ gap: 24 }}>
      {/* Header */}
      <div
        className="hstack"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <div className="title" style={{ margin: 0 }}>
          Editar Cliente #{id}
        </div>
        <Button
          onClick={() => nav("/clientes")}
          style={{
            background: "transparent",
            color: "var(--color-muted)",
            border: "none",
          }}
        >
          Cancelar
        </Button>
      </div>

      <form onSubmit={onSubmit} className="vstack" style={{ gap: 24 }}>
        {/* 🟢 SECCIÓN DE TIPO */}
        <div className="card">
          <div className="title" style={{ marginBottom: 16, fontSize: "1rem" }}>
            Estado del Registro
          </div>

          <div className="selection-grid">
            <div
              className={`selection-card ${
                customerType === "consulta" ? "selected" : ""
              }`}
              onClick={() => setCustomerType("consulta")}
            >
              <div className="selection-title">📝 Consulta / Lead</div>
              <div className="selection-subtitle">
                Solo contacto + DNI (Opcional)
              </div>
            </div>

            <div
              className={`selection-card ${
                customerType === "completo" ? "selected" : ""
              }`}
              onClick={() => setCustomerType("completo")}
            >
              <div className="selection-title">🪪 Cliente Confirmado</div>
              <div className="selection-subtitle">Datos legales completos</div>
            </div>
          </div>
        </div>

        {/* === TARJETA 1: IDENTIDAD === */}
        <div className="card vstack" style={{ gap: 16 }}>
          <div className="title" style={{ fontSize: "1.1rem", margin: 0 }}>
            Identidad
          </div>

          <div className="form-row">
            <Input
              label="Nombre *"
              value={c.first_name || ""}
              onChange={(e) =>
                setC({ ...c, first_name: e.currentTarget.value })
              }
              required
            />
            <Input
              label="Apellido *"
              value={c.last_name || ""}
              onChange={(e) => setC({ ...c, last_name: e.currentTarget.value })}
              required
            />
          </div>

          {/* 🔥 EL DNI AHORA ES VISIBLE SIEMPRE */}
          <div className="form-row">
            <div className="form-group" style={{ flex: 0.5 }}>
              <label>Tipo Doc</label>
              <select
                className="form-control"
                value={c.doc_type || "DNI"}
                onChange={(e) =>
                  setC({ ...c, doc_type: e.currentTarget.value })
                }
              >
                <option value="DNI">DNI</option>
                <option value="CUIT">CUIT</option>
                <option value="Pasaporte">Pasaporte</option>
              </select>
            </div>
            <Input
              label={`Número de Documento ${
                customerType === "completo" ? "*" : ""
              }`}
              value={c.doc_number || ""}
              onChange={(e) =>
                setC({ ...c, doc_number: e.currentTarget.value })
              }
              required={customerType === "completo"}
            />
          </div>

          {/* 🔹 SOLO SI ES COMPLETO */}
          {customerType === "completo" && (
            <>
              <div className="form-row">
                <Input
                  label="CUIT / CUIL"
                  value={c.cuit || ""}
                  onChange={(e) => setC({ ...c, cuit: e.currentTarget.value })}
                />
              </div>

              <div className="form-group">
                <label>Estado Civil</label>
                <div className="hstack" style={{ gap: 16 }}>
                  {["soltero", "casado", "otro"].map((status) => (
                    <label
                      key={status}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        cursor: "pointer",
                        textTransform: "capitalize",
                      }}
                    >
                      <input
                        type="radio"
                        name="marital"
                        value={status}
                        checked={c.marital_status === status}
                        onChange={() => setC({ ...c, marital_status: status })}
                      />
                      {status}
                    </label>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>

        {/* === TARJETA 2: CONTACTO Y UBICACIÓN === */}
        <div className="card vstack" style={{ gap: 16 }}>
          <div className="title" style={{ fontSize: "1.1rem", margin: 0 }}>
            Contacto
          </div>

          <div className="form-row">
            <Input
              label="Teléfono Principal *"
              value={c.phone || ""}
              onChange={(e) => setC({ ...c, phone: e.currentTarget.value })}
              required
            />
            <Input
              label="Teléfono Alternativo"
              value={c.alt_phone || ""}
              onChange={(e) => setC({ ...c, alt_phone: e.currentTarget.value })}
            />
          </div>

          <Input
            label="Email"
            type="email"
            value={c.email || ""}
            onChange={(e) => setC({ ...c, email: e.currentTarget.value })}
          />

          {/* Dirección solo en completo */}
          {customerType === "completo" && (
            <div className="form-row">
              <Input
                label="Dirección / Calle"
                value={c.address || ""}
                onChange={(e) => setC({ ...c, address: e.currentTarget.value })}
                style={{ flex: 2 }}
              />
              <Input
                label="Ciudad / Localidad"
                value={c.city || ""}
                onChange={(e) => setC({ ...c, city: e.currentTarget.value })}
                style={{ flex: 1 }}
              />
            </div>
          )}
        </div>

        {/* === TARJETA 3: DOCUMENTACIÓN (SOLO COMPLETO) === */}
        {customerType === "completo" && (
          <div className="card vstack" style={{ gap: 16 }}>
            <div className="title" style={{ fontSize: "1.1rem", margin: 0 }}>
              Documentación
            </div>

            <div className="hstack" style={{ gap: 16, flexWrap: "wrap" }}>
              {/* FRENTE */}
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label>Frente del DNI</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "front")}
                  className="form-control"
                  style={{ padding: 8 }}
                />

                {previewFront ? (
                  <div style={{ position: "relative", marginTop: 10 }}>
                    <img
                      src={previewFront}
                      alt="Preview"
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        border: "1px solid var(--color-border)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage("front")}
                      title="Eliminar foto"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(239,68,68,0.9)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 8px",
                        cursor: "pointer",
                      }}
                    >
                      🗑
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 20,
                      border: "2px dashed var(--color-border)",
                      borderRadius: 8,
                      textAlign: "center",
                      color: "var(--color-muted)",
                    }}
                  >
                    Sin imagen
                  </div>
                )}
              </div>

              {/* DORSO */}
              <div className="form-group" style={{ flex: 1, minWidth: 200 }}>
                <label>Dorso del DNI</label>
                <input
                  type="file"
                  accept="image/*"
                  onChange={(e) => handleFileChange(e, "back")}
                  className="form-control"
                  style={{ padding: 8 }}
                />

                {previewBack ? (
                  <div style={{ position: "relative", marginTop: 10 }}>
                    <img
                      src={previewBack}
                      alt="Preview"
                      style={{
                        width: "100%",
                        borderRadius: 8,
                        border: "1px solid var(--color-border)",
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage("back")}
                      title="Eliminar foto"
                      style={{
                        position: "absolute",
                        top: 8,
                        right: 8,
                        background: "rgba(239,68,68,0.9)",
                        color: "#fff",
                        border: "none",
                        borderRadius: 6,
                        padding: "4px 8px",
                        cursor: "pointer",
                      }}
                    >
                      🗑
                    </button>
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: 10,
                      padding: 20,
                      border: "2px dashed var(--color-border)",
                      borderRadius: 8,
                      textAlign: "center",
                      color: "var(--color-muted)",
                    }}
                  >
                    Sin imagen
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* === TARJETA 4: NOTAS === */}
        <div className="card vstack" style={{ gap: 16 }}>
          <div className="title" style={{ fontSize: "1.1rem", margin: 0 }}>
            Observaciones
          </div>
          <textarea
            className="form-control"
            rows={3}
            value={c.notes || ""}
            onChange={(e) => setC({ ...c, notes: e.currentTarget.value })}
            placeholder="Datos adicionales..."
          />
        </div>

        <div className="hstack" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" loading={saving}>
            Guardar Cambios
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
