import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  // ✅ Si el usuario tiene el rol admin
  const isAdmin =
    user?.roles?.some(
      (r: any) => r.name?.toLowerCase() === "admin" || r.name?.toLowerCase() === "superadmin"
    ) || false;

  return (
    <div className="page vstack">
      {/* Encabezado de la página */}
      <div className="page-header">
        <h1 className="page-title">Dashboard — {user?.name || "Usuario"}</h1>
      </div>

      {/* Sección de atajos */}
      <section className="card vstack">
        <div className="title">Atajos</div>
        <div className="quick-actions">
          <Link className="btn-link" to="/clientes/registro">
            + Registrar cliente
          </Link>
          <Link className="btn-link" to="/vehiculos/registro">
            + Registrar vehículo
          </Link>
          <Link className="btn-link" to="/reservas/nueva">
            + Registrar reserva
          </Link>

          {/* ✅ Solo visible para administradores */}
          {isAdmin && (
            <Link className="btn-link" to="/admin/reportes">
              + Ver reportes
            </Link>
          )}
        </div>
      </section>
    </div>
  );
}
