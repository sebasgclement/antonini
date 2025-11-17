import { useEffect, useState } from "react";
import api from "../../lib/api";
import Button from "../ui/Button";
import Input from "../ui/Input";

type Props = {
  onClose: () => void;
  onCreated: (method: any) => void;
};

type MethodType = "" | "cash" | "bank" | "check" | "card" | "credit_bank";

export default function PaymentMethodModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState("");
  const [type, setType] = useState<MethodType>("");
  const [requiresDetails, setRequiresDetails] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChangeType = (value: MethodType) => {
    setType(value);

    // Pequeña ayudita de UX:
    // - cash: normalmente no hace falta detalle → lo apagamos
    // - otros: lo prendemos por defecto (se puede desmarcar)
    if (value === "cash") {
      setRequiresDetails(false);
    } else if (value) {
      setRequiresDetails(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return setError("El nombre es obligatorio");
    if (!type) return setError("Seleccioná un tipo de método");

    setLoading(true);
    setError("");

    try {
      const res = await api.post("/payment-methods", {
        name,
        type,
        requires_details: requiresDetails,
      });

      onCreated(res.data.data || res.data);
      onClose();
    } catch (err: any) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data?.errors?.type?.[0] ||
          "Error al crear método de pago"
      );
    } finally {
      setLoading(false);
    }
  };

  // Permitir cerrar con ESC
  useEffect(() => {
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card vstack" onClick={(e) => e.stopPropagation()}>
        <h3>Nuevo medio de pago</h3>

        <form onSubmit={handleSubmit} className="vstack">
          <Input
            label="Nombre del método"
            value={name}
            onChange={(e) => setName(e.currentTarget.value)}
            placeholder="Ej: Tarjeta Banco Nación"
            required
          />

          <label>Tipo *</label>
          <select
            value={type}
            onChange={(e) =>
              handleChangeType(e.currentTarget.value as MethodType)
            }
          >
            <option value="">Seleccionar…</option>
            <option value="cash">Efectivo</option>
            <option value="bank">Transferencia Bancaria</option>
            <option value="check">Cheque</option>
            <option value="card">Tarjeta de Débito/Crédito</option>
            <option value="credit_bank">Crédito Bancario</option>
          </select>

          <label className="hstack" style={{ gap: 6 }}>
            <input
              type="checkbox"
              checked={requiresDetails}
              onChange={(e) => setRequiresDetails(e.target.checked)}
              // Podrías bloquearlo en efectivo si querés:
              // disabled={type === "cash"}
            />
            Requiere datos adicionales (CBU, N° de cheque, etc.)
          </label>

          {error && <p className="text-danger">{error}</p>}

          <div className="hstack" style={{ justifyContent: "flex-end" }}>
            <Button
              type="button"
              onClick={onClose}
              className="btn-secondary"
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button type="submit" loading={loading}>
              Guardar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
