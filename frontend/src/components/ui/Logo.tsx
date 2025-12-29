import { motion } from "framer-motion";

export default function Logo({
  size = 42, // Tamaño base (altura)
  showText = true, // Ahora por defecto mostramos texto
  style = {}
}: {
  size?: number;
  showText?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, x: -10 }}
      animate={{ opacity: 1, scale: 1, x: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 12, // Espacio entre ícono y texto
        userSelect: "none", // Evita que se seleccione el texto al hacer doble click
        ...style
      }}
    >
      {/* 🚗 ÍCONO VECTORIAL (SVG) */}
      <div 
        style={{ 
            color: 'var(--color-primary)', // Usa el azul de tu tema
            filter: 'drop-shadow(0 0 8px rgba(30, 167, 255, 0.3))', // Un brillito sutil
            display: 'flex'
        }}
      >
        <svg
          height={size}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Silueta de auto deportivo moderna */}
          <path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 16 10s-1.3-1.4-2.2-2.3c-.5-.4-1.1-.7-1.8-.7H5c-.6 0-1.1.4-1.4.9l-1.4 2.9A3.7 3.7 0 0 0 2 12v4c0 .6.4 1 1 1h2" />
          <circle cx="7" cy="17" r="2" />
          <path d="M9 17h6" />
          <circle cx="17" cy="17" r="2" />
        </svg>
      </div>

      {/* 🔠 TEXTO "ANTONINI" */}
      {showText && (
        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1, textAlign: 'left' }}>
          <span 
            style={{
                fontFamily: 'system-ui, sans-serif',
                fontWeight: 800,
                fontSize: size * 0.75, // El texto escala con el prop size
                color: 'var(--color-text)', // Se adapta a dark/light mode solo
                letterSpacing: '-0.5px'
            }}
          >
            ANTONINI
          </span>
          <span 
            style={{
                fontSize: size * 0.28,
                fontWeight: 600,
                color: 'var(--color-muted)', // Gris suave
                textTransform: 'uppercase',
                letterSpacing: '2px',
                marginLeft: 2
            }}
          >
            Automotores
          </span>
        </div>
      )}
    </motion.div>
  );
}