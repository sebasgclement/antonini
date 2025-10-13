import { useState } from "react";
import type { FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../lib/api";
import Button from "../../components/ui/Button";
import Toast from "../../components/ui/Toast";

export default function ChangePassword() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState("");
  const nav = useNavigate();

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!currentPassword || !newPassword || !confirmPassword) {
      setToast("Por favor completá todos los campos");
      return;
    }
    if (newPassword !== confirmPassword) {
      setToast("Las contraseñas nuevas no coinciden");
      return;
    }

    try {
      setLoading(true);
      const { data } = await api.post("/user/change-password", {
        current_password: currentPassword,
        new_password: newPassword,
        new_password_confirmation: confirmPassword,
      });

      if (data.ok) {
        setToast("Contraseña actualizada ✅");
        setTimeout(() => nav(-1), 1000);
      } else {
        setToast(data.message || "No se pudo cambiar la contraseña");
      }
    } catch (err: any) {
      setToast(err?.response?.data?.message || "Error al cambiar la contraseña");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container vstack" style={{ gap: 20 }}>
      <div className="title">🔒 Cambiar contraseña</div>

      <form onSubmit={handleSubmit} className="card vstack" style={{ gap: 14 }}>
        <label>Contraseña actual *</label>
        <input
          type="password"
          value={currentPassword}
          onChange={(e) => setCurrentPassword(e.currentTarget.value)}
          required
        />

        <label>Nueva contraseña *</label>
        <input
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.currentTarget.value)}
          required
        />

        <label>Confirmar nueva contraseña *</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.currentTarget.value)}
          required
        />

        <div className="hstack" style={{ justifyContent: "flex-end" }}>
          <Button type="submit" loading={loading}>
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
