import { motion } from "framer-motion";
import { useEffect, useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import Button from "../../src/components/ui/Button";
import Input from "../../src/components/ui/Input";
import Logo from "../../src/components/ui/Logo";
import Toast from "../../src/components/ui/Toast";
import useAuth from "../../src/hooks/useAuth"; // Ajustá la ruta si es necesario (../hooks/...)

export default function Login() {
  const { login } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState("admin@antonini.local");
  const [password, setPassword] = useState("secret123");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

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
        height: "100vh" /* Altura fija de ventana */,
        width: "100%",
        display: "flex",
        flexDirection: "column",
        /* ⛔ QUITAMOS justifyContent: "center" para evitar el corte arriba */
        overflowY: "auto" /* ✅ Scroll habilitado en el padre */,
        background:
          "radial-gradient(circle at 50% 50%, #1a202c 0%, #0f1115 100%)",
        color: "#fff",
      }}
    >
      {/* === FONDO ANIMADO (FIJO) === */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          overflow: "hidden",
          pointerEvents: "none",
          zIndex: 0,
        }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{
            opacity: [0.1, 0.3, 0.1],
            scale: [1, 1.2, 1],
            x: ["-10%", "10%", "-10%"],
          }}
          transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
          style={{
            position: "absolute",
            top: "-20%",
            left: "-20%",
            width: "70%",
            height: "70%",
            background:
              "radial-gradient(circle, rgba(30,167,255,0.15) 0%, transparent 60%)",
            filter: "blur(80px)",
            borderRadius: "50%",
          }}
        />
        <motion.div
          animate={{
            opacity: [0.1, 0.2, 0.1],
            scale: [1.2, 1, 1.2],
            x: ["10%", "-10%", "10%"],
          }}
          transition={{
            duration: 25,
            repeat: Infinity,
            ease: "easeInOut",
            delay: 2,
          }}
          style={{
            position: "absolute",
            bottom: "-20%",
            right: "-20%",
            width: "80%",
            height: "80%",
            background:
              "radial-gradient(circle, rgba(168, 85, 247, 0.1) 0%, transparent 60%)",
            filter: "blur(80px)",
            borderRadius: "50%",
          }}
        />
      </div>

      {/* === CONTENEDOR CENTRADO SEGURO === */}
      {/* Este div crece si hace falta y centra la tarjeta con margin: auto */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: "100%",
          padding: "40px 20px", // Aire arriba y abajo
          zIndex: 10,
        }}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="vstack"
          style={{
            gap: 24,
            padding: "40px 32px",
            width: "100%",
            maxWidth: 400,

            // ✅ LA CLAVE: margin: auto centra verticalmente si hay espacio,
            // y si no hay espacio, respeta el top y deja scrollear.
            margin: "auto",

            // Efecto Vidrio
            background: "rgba(30, 38, 51, 0.5)",
            backdropFilter: "blur(16px) saturate(180%)",
            WebkitBackdropFilter: "blur(16px) saturate(180%)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.5)",
            borderRadius: 24,
            textAlign: "center",
            position: "relative",
          }}
        >
          {/* Logo limpio */}
          <div style={{ marginBottom: 10 }}>
            <Logo size={55} />
          </div>

          <div>
            <h2
              style={{
                color: "#fff",
                fontSize: "1.75rem",
                margin: "0 0 8px 0",
                letterSpacing: "-0.5px",
                fontWeight: 700,
              }}
            >
              Bienvenido
            </h2>
            <p
              style={{
                color: "rgba(255,255,255,0.6)",
                fontSize: "0.95rem",
                margin: 0,
              }}
            >
              Ingresá tus credenciales para acceder.
            </p>
          </div>

          <form
            onSubmit={onSubmit}
            className="vstack"
            style={{ gap: 20, marginTop: 8 }}
          >
            <Input
              label="Email Corporativo"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.currentTarget.value)}
              required
              style={{
                background: "rgba(0,0,0,0.2)",
                border: "1px solid rgba(255,255,255,0.1)",
                color: "#fff",
              }}
            />
            <div>
              <Input
                label="Contraseña"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
                style={{
                  background: "rgba(0,0,0,0.2)",
                  border: "1px solid rgba(255,255,255,0.1)",
                  color: "#fff",
                }}
              />
            </div>

            <Button
              loading={loading}
              type="submit"
              style={{
                padding: "12px",
                fontSize: "1rem",
                background: "var(--color-primary)",
                border: "none",
              }}
            >
              Iniciar Sesión
            </Button>
          </form>
        </motion.div>

        {/* Footer pegado al flujo, con margen para no molestar */}
        <div style={{ textAlign: "center", marginTop: 20, paddingBottom: 10 }}>
          <p style={{ fontSize: "0.85rem", color: "rgba(255,255,255,0.4)" }}>
            © {new Date().getFullYear()} Antonini Automotores.
          </p>
        </div>
      </div>

      {error && <Toast message={error} type="error" />}
    </div>
  );
}
