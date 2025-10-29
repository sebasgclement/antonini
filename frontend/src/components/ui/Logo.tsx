import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function Logo({
  size = 50,
  showText = false,
}: {
  size?: number;
  showText?: boolean;
}) {
  const [isLight, setIsLight] = useState(false);

  // 🔹 Detecta el tema activo desde el atributo data-theme o el modo del sistema
  useEffect(() => {
    const html = document.documentElement;
    const checkTheme = () => {
      const theme = html.getAttribute("data-theme");
      if (theme === "light") setIsLight(true);
      else if (theme === "dark") setIsLight(false);
      else {
        // Si no está definido, usa preferencia del sistema
        const prefersLight = window.matchMedia("(prefers-color-scheme: light)").matches;
        setIsLight(prefersLight);
      }
    };

    checkTheme();

    // Si cambiás el tema dinámicamente
    const observer = new MutationObserver(checkTheme);
    observer.observe(html, { attributes: true, attributeFilter: ["data-theme"] });

    return () => observer.disconnect();
  }, []);

  // 🔹 Cambia automáticamente el logo según el modo
  const logoSrc = isLight
    ? "/antonini-logo-dark-h160-safe.png" // versión para modo claro
    : "/antonini-logo-white-h160-safe.png"; // versión para modo oscuro

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: showText ? 10 : 0,
        width: "100%",
        textAlign: "center",
      }}
    >
      <img
        src={logoSrc}
        alt="Antonini Automotores"
        style={{
          height: size,
          width: "auto",
          maxWidth: "90%",
          display: "block",
          objectFit: "contain",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
          transition: "filter 0.3s, opacity 0.3s",
        }}
      />

      {showText && (
        <motion.span
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          style={{
            fontWeight: 700,
            fontSize: "1.3rem",
            letterSpacing: 1,
            color: "var(--color-text)",
          }}
        >
          ANTONINI
        </motion.span>
      )}
    </motion.div>
  );
}
