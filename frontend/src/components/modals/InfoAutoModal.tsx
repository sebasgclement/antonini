import { useEffect } from "react";
import { useInfoAuto } from "../../hooks/useInfoAuto";
import Button from "../ui/Button";

interface Props {
  onClose: () => void;
  onImport: (data: any) => void;
}

export default function InfoAutoModal({ onClose, onImport }: Props) {
  const info = useInfoAuto();

  // Cerrar con ESC
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", handleEsc);
    return () => window.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleConfirm = () => {
    if (info.modelDetail && info.selectedYearPrice) {
      const brandName =
        info.brands.find((b) => b.id === info.selectedBrand)?.name || "";
      const groupName =
        info.groups.find((g) => g.id === info.selectedGroup)?.name || "";

      const data = {
        brand: brandName,
        model: `${groupName} ${info.modelDetail.description}`,
        year: info.selectedYearPrice.year,
        price: info.selectedYearPrice.price * 1000,
        photo: info.modelDetail.photo_url,
      };

      onImport(data);
      onClose();
    }
  };

  return (
    // 1. OVERLAY FLEX: Asegura centrado perfecto y límites de pantalla
    <div
      className="modal-overlay"
      onClick={onClose}
      style={{
        zIndex: 2000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "10px", // Margen de seguridad para móviles
      }}
    >
      <div
        // 2. CARD: Flex column + max-height
        onClick={(e) => e.stopPropagation()}
        style={{
          background: "var(--color-card)",
          color: "var(--color-text)",
          border: "1px solid var(--color-border)",
          borderRadius: 12,
          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.2)",

          width: "100%",
          maxWidth: "700px",
          maxHeight: "90vh", // Límite estricto de altura

          display: "flex",
          flexDirection: "column",
          overflow: "hidden", // Corta lo que sobre
        }}
      >
        {/* --- HEADER (Fijo) --- */}
        <div
          className="hstack"
          style={{
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--color-border)",
            background: "var(--color-card)",
            flexShrink: 0, // No se aplasta
          }}
        >
          <div>
            <h3
              style={{
                margin: 0,
                display: "flex",
                alignItems: "center",
                gap: 8,
                fontSize: "1.1rem",
              }}
            >
              🚀 Catálogo InfoAuto
            </h3>
            <p
              style={{
                margin: "2px 0 0 0",
                color: "var(--color-muted)",
                fontSize: "0.85rem",
              }}
            >
              Buscador oficial de precios
            </p>
          </div>
          <button
            onClick={onClose}
            style={{
              background: "transparent",
              border: "none",
              color: "var(--color-text)",
              cursor: "pointer",
              fontSize: "1.2rem",
              padding: 4,
            }}
          >
            ✕
          </button>
        </div>

        {/* --- BODY (Con Scroll Mágico) --- */}
        <div
          style={{
            flex: 1,
            overflowY: "auto", // Scroll vertical activo
            minHeight: 0, // <--- EL TRUCO MÁGICO: Permite que flex encoja el div para activar el scroll
            padding: "20px",
            display: "flex",
            flexDirection: "column",
            gap: 20,
          }}
        >
          {/* Grid de Selectores */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
              gap: 16,
            }}
          >
            <div className="form-group">
              <label>Marca</label>
              <select
                className="form-control"
                style={selectStyle}
                value={info.selectedBrand || ""}
                onChange={(e) => info.setSelectedBrand(Number(e.target.value))}
              >
                <option value="">Seleccionar...</option>
                {info.brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group">
              <label>Modelo / Familia</label>
              <select
                style={selectStyle}
                disabled={!info.selectedBrand}
                value={info.selectedGroup || ""}
                onChange={(e) => info.setSelectedGroup(Number(e.target.value))}
              >
                <option value="">Seleccionar...</option>
                {info.groups.map((g) => (
                  <option key={g.id} value={g.id}>
                    {g.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Versión</label>
              <select
                style={selectStyle}
                disabled={!info.selectedGroup}
                value={info.selectedModelCodia || ""}
                onChange={(e) =>
                  info.setSelectedModelCodia(Number(e.target.value))
                }
              >
                <option value="">Seleccionar...</option>
                {info.models.map((m) => (
                  <option key={m.codia} value={m.codia}>
                    {m.description}
                  </option>
                ))}
              </select>
            </div>

            <div className="form-group" style={{ gridColumn: "1 / -1" }}>
              <label>Año (Determina Precio)</label>
              <select
                style={selectStyle}
                disabled={!info.selectedModelCodia}
                value={info.selectedYearPrice?.year || ""}
                onChange={(e) => {
                  const yr = info.prices.find(
                    (p) => p.year === Number(e.target.value)
                  );
                  info.setSelectedYearPrice(yr || null);
                }}
              >
                <option value="">Seleccionar...</option>
                {info.prices.map((p) => (
                  <option key={p.year} value={p.year}>
                    {p.year} {p.isZeroKm ? "(0km)" : ""} - $
                    {(p.price * 1000).toLocaleString("es-AR")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* === PREVIEW CARD === */}
          {info.modelDetail && info.selectedYearPrice && (
            <div
              style={{
                background: "var(--hover-bg)",
                border: "1px solid var(--color-border)",
                borderRadius: 12,
                overflow: "hidden",
                marginTop: 10,
                flexShrink: 0, // Asegura que la tarjeta no se aplaste
              }}
            >
              {/* FOTO */}
              <div
                style={{
                  width: "100%",
                  height: 200,
                  background: "white",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderBottom: "1px solid var(--color-border)",
                  position: "relative",
                }}
              >
                {info.modelDetail.photo_url ? (
                  <img
                    src={info.modelDetail.photo_url}
                    alt="Vehículo"
                    style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "contain",
                      padding: 10,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      color: "#999",
                      display: "flex",
                      flexDirection: "column",
                      alignItems: "center",
                      gap: 8,
                    }}
                  >
                    <span style={{ fontSize: "2rem" }}>📷</span>
                    <span style={{ fontSize: "0.9rem" }}>
                      Sin imagen disponible
                    </span>
                  </div>
                )}

                <div
                  style={{
                    position: "absolute",
                    top: 10,
                    right: 10,
                    background: "rgba(0,0,0,0.8)",
                    color: "white",
                    padding: "4px 8px",
                    borderRadius: 6,
                    fontSize: "0.85rem",
                    fontWeight: 600,
                  }}
                >
                  {info.selectedYearPrice.year}
                </div>
              </div>

              {/* DETALLE */}
              <div style={{ padding: 16 }}>
                <div
                  style={{
                    fontSize: "0.85rem",
                    color: "var(--color-primary)",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    marginBottom: 4,
                  }}
                >
                  {info.brands.find((b) => b.id === info.selectedBrand)?.name}
                </div>
                <div
                  style={{
                    fontSize: "1.1rem",
                    fontWeight: 700,
                    marginBottom: 12,
                    color: "var(--color-text)",
                    lineHeight: 1.3,
                  }}
                >
                  {info.groups.find((g) => g.id === info.selectedGroup)?.name}{" "}
                  {info.modelDetail.description}
                </div>

                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    borderTop: "1px solid var(--color-border)",
                    paddingTop: 12,
                  }}
                >
                  <span
                    style={{ fontSize: "0.9rem", color: "var(--color-muted)" }}
                  >
                    Precio Sugerido
                  </span>
                  <span
                    style={{
                      fontWeight: 700,
                      fontSize: "1.4rem",
                      color: "var(--color-success)",
                    }}
                  >
                    $
                    {(info.selectedYearPrice.price * 1000).toLocaleString(
                      "es-AR"
                    )}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* --- FOOTER (Fijo) --- */}
        <div
          className="hstack"
          style={{
            justifyContent: "flex-end",
            gap: 12,
            padding: "20px 24px",
            borderTop: "1px solid var(--color-border)",
            background: "var(--color-card)",
            flexShrink: 0, // No se aplasta
          }}
        >
          <Button
            type="button"
            onClick={onClose}
            style={{
              background: "transparent",
              border: "1px solid var(--color-border)",
              color: "var(--color-text)",
            }}
          >
            Cancelar
          </Button>
          <Button
            onClick={handleConfirm}
            disabled={!info.selectedYearPrice}
            loading={info.loading}
          >
            Confirmar e Importar
          </Button>
        </div>
      </div>
    </div>
  );
}

const selectStyle = {
  width: "100%",
  padding: "12px",
  borderRadius: "8px",
  border: "1px solid var(--color-border)",
  background: "var(--input-bg)",
  color: "var(--color-text)",
  fontSize: "0.95rem",
};
