import { useEffect, useState } from "react";

// 1. Definimos los tipos aquí para que sea más legible
type ToastProps = {
  message: string;
  type?: "info" | "error" | "success";
  onClose?: () => void; // <--- Agregamos esto como opcional (?)
};

export default function Toast({ message, type = "info", onClose }: ToastProps) {
  const [open, setOpen] = useState(!!message);

  useEffect(() => {
    setOpen(!!message);
  }, [message]);

  if (!open) return null;

  const bg = type === "error" ? "var(--color-danger)" : "var(--color-primary)";

  // Función para manejar el cierre
  const handleClose = () => {
    setOpen(false);
    // 2. Si existe la función onClose (que viene del padre), la ejecutamos
    if (onClose) onClose();
  };

  return (
    <div
      style={{
        position: "fixed",
        bottom: 20,
        right: 20,
        background: bg,
        color: "#0b0e14",
        padding: "10px 12px",
        borderRadius: 10,
        fontWeight: 700,
        cursor: "pointer", // Agregué cursor pointer
      }}
      onClick={handleClose} // 3. Usamos el nuevo manejador
    >
      {message}
    </div>
  );
}
