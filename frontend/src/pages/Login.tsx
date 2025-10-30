import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import useAuth from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Input from "../components/ui/Input";
import Toast from "../components/ui/Toast";
import Logo from "../components/ui/Logo";

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@antonini.local");
  const [password, setPassword] = useState("secret123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🌓 Fuerza modo oscuro al entrar a la pantalla de login
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", "dark");
    html.style.background = "#0f1115"; // previene flash blanco en carga
  }, []);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      await login(email, password);
      nav("/");
    } catch (err: any) {
      setError(err?.response?.data?.message || "Error de autenticación");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      style={{
        position: "relative",
        minHeight: "100vh",
        overflow: "hidden",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: "radial-gradient(circle at 30% 30%, #1e2635 0%, #0f1115 80%)",
      }}
    >
      {/* === FONDO ANIMADO === */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: [0.2, 0.4, 0.2], scale: [1, 1.05, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: "120%",
          height: "120%",
          background:
            "radial-gradient(circle at 70% 80%, rgba(30,167,255,0.08), transparent 60%)",
          filter: "blur(60px)",
        }}
      />
      <motion.div
        animate={{
          x: ["0%", "10%", "-10%", "0%"],
          y: ["0%", "5%", "-5%", "0%"],
        }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        style={{
          position: "absolute",
          width: "120%",
          height: "120%",
          background:
            "radial-gradient(circle at 20% 30%, rgba(255,255,255,0.05), transparent 70%)",
          filter: "blur(80px)",
        }}
      />

      {/* === TARJETA DE LOGIN === */}
      <div
        className="card vstack"
        style={{
          gap: 20,
          padding: 36,
          width: "100%",
          maxWidth: 380,
          boxShadow: "var(--shadow)",
          borderRadius: "var(--radius)",
          background: "var(--color-card)",
          textAlign: "center",
          zIndex: 10,
        }}
      >
        <div style={{ marginBottom: 10 }}>
          <Logo />
        </div>

        <div
          className="title"
          style={{
            textAlign: "center",
            fontSize: "1.4rem",
            fontWeight: 600,
            marginBottom: 4,
            color: "var(--color-text)",
          }}
        >
          Ingresar a la Intranet
        </div>

        <form onSubmit={onSubmit} className="vstack" style={{ gap: 14 }}>
          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
          />
          <Input
            label="Contraseña"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required
          />
          <Button loading={loading} type="submit">
            Entrar
          </Button>
        </form>
      </div>

      {error && <Toast message={error} type="error" />}
    </div>
  );
}
