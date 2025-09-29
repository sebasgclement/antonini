import { useState } from "react";
import Header from "./Header";
import Sidebar from "./Sidebar";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="layout-container">
      <Header onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="layout-grid">
        {/* Backdrop en mobile */}
        {sidebarOpen && (
          <div
            className="sidebar-backdrop"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar con toggle */}
        <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
          <Sidebar onClose={() => setSidebarOpen(false)} />
        </aside>

        {/* Contenido principal */}
        <main className="main-content vstack">{children}</main>
      </div>
    </div>
  );
}
