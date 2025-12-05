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

  // 🌓 Fuerza modo oscuro al entrar (Look premium)
  useEffect(() => {
    const html = document.documentElement;
    html.setAttribute("data-theme", "dark");
    html.style.background = "#0f1115";
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
        flexDirection: "column", // Cambiado para acomodar el footer
        justifyContent: "center",
        alignItems: "center",
        background: "radial-gradient(circle at 50% 50%, #1a202c 0%, #0f1115 100%)", // Gradiente central más profundo
        color: '#fff'
      }}
    >
      {/* === FONDO ANIMADO (Tus animaciones, ligeramente ajustadas) === */}
      <div style={{position: 'absolute', inset: 0, overflow: 'hidden', pointerEvents: 'none'}}>
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: [0.1, 0.3, 0.1], scale: [1, 1.2, 1], x: ['-10%', '10%', '-10%'] }}
            transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
            style={{
              position: "absolute",
              top: '-20%', left: '-20%',
              width: "70%", height: "70%",
              background: "radial-gradient(circle, rgba(30,167,255,0.15) 0%, transparent 60%)",
              filter: "blur(80px)",
              borderRadius: '50%'
            }}
          />
          <motion.div
            animate={{ opacity: [0.1, 0.2, 0.1], scale: [1.2, 1, 1.2], x: ['10%', '-10%', '10%'] }}
            transition={{ duration: 25, repeat: Infinity, ease: "easeInOut", delay: 2 }}
            style={{
              position: "absolute",
              bottom: '-20%', right: '-20%',
              width: "80%", height: "80%",
              background: "radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 60%)", // Un toque violeta para contraste
              filter: "blur(80px)",
              borderRadius: '50%'
            }}
          />
      </div>

      {/* === TARJETA DE LOGIN "GLASS" === */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="vstack"
        style={{
          gap: 24,
          padding: "40px 32px",
          width: "100%",
          maxWidth: 400,
          
          // ✨ EFECTO VIDRIO ✨
          background: "rgba(30, 38, 51, 0.5)", // Color base semi-transparente
          backdropFilter: "blur(16px) saturate(180%)", // El desenfoque mágico
          WebkitBackdropFilter: "blur(16px) saturate(180%)", // Soporte Safari
          border: "1px solid rgba(255, 255, 255, 0.1)", // Borde sutil brillante
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)", // Sombra profunda
          borderRadius: 24, // Bordes más redondeados
          
          textAlign: "center",
          zIndex: 10,
          position: 'relative'
        }}
      >
        <div>
          <div style={{ display: 'inline-block', padding: '12px', background: 'rgba(255,255,255,0.05)', borderRadius: '50%', marginBottom: 16 }}>
             <Logo style={{height: 40}} />
          </div>
          <h2 className="title" style={{ color: "#fff", fontSize: "1.75rem", marginBottom: 8, letterSpacing: '-0.5px' }}>
            Bienvenido
          </h2>
          <p style={{ color: "rgba(255,255,255,0.6)", fontSize: '0.95rem', margin: 0 }}>
            Ingresá tus credenciales para acceder al sistema.
          </p>
        </div>

        <form onSubmit={onSubmit} className="vstack" style={{ gap: 20, marginTop: 8 }}>
          <Input
            label="Email Corporativo"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
            required
            // Pequeño truco para oscurecer el input sobre el vidrio
            style={{background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff'}}
          />
          <div>
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
                style={{background: 'rgba(0,0,0,0.2)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff'}}
              />
              <div style={{textAlign: 'right', marginTop: 8}}>
                  <a href="#" style={{fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', textDecoration: 'none'}}>¿Olvidaste tu contraseña?</a>
              </div>
          </div>
          
          <Button loading={loading} type="submit" style={{padding: '12px', fontSize: '1rem', background: 'var(--color-primary)', border: 'none'}}>
            Iniciar Sesión
          </Button>
        </form>
      </motion.div>

      {/* === FOOTER PARA LLENAR ESPACIO === */}
      <div style={{ position: 'absolute', bottom: 20, textAlign: 'center', zIndex: 10 }}>
        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)' }}>
          © {new Date().getFullYear()} Antonini Automotores. Sistema de Gestión Interna.
        </p>
      </div>

      {error && <Toast message={error} type="error" />}
    </div>
  );
}