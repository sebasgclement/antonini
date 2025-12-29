import { useState, useEffect } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // ✅ Cierra el menú si cambia el tamaño de pantalla a modo escritorio
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth > 900) {
        setSidebarOpen(false);
        document.body.classList.remove("sidebar-open");
      }
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // ✅ Controla el bloqueo de scroll en móvil
  useEffect(() => {
    document.body.classList.toggle("sidebar-open", sidebarOpen);
  }, [sidebarOpen]);

  return (
    <div className="layout-container">
      {/* 🔹 Header con botón hamburguesa visible solo en móvil */}
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="layout-grid">
        {/* 🔹 Backdrop (oscurece fondo cuando el menú está abierto en móvil) */}
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* 🔹 Sidebar fija en escritorio / deslizable en móvil */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* 🔹 Contenido principal */}
        <main className="main-content vstack">{children}</main>
      </div>
    </div>
  );
}
