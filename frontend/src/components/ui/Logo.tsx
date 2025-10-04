import { motion } from "framer-motion";

export default function Logo({ size = 50, showText = false }: { size?: number; showText?: boolean }) {
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
        src="/antonini-logo-white-h160-safe.png"
        alt="Antonini Automotores"
        style={{
          height: size,
          width: "auto",
          maxWidth: "90%",
          display: "block",
          objectFit: "contain",
          filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.4))",
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
