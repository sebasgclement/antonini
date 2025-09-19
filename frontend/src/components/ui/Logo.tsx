// src/components/Logo.tsx
import { Link } from "react-router-dom";

export default function Logo() {
  return (
    <Link to="/" className="hstack" style={{ alignItems: "center", gap: 8, textDecoration: "none" }}>
      <img
        src="\antonini-logo-white-h160-safe.png"
        alt="Antonini"
        style={{ height: 30, width: "auto", display: "block" }}
      />
    </Link>
  );
}
