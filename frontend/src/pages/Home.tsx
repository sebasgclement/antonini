import { Link } from "react-router-dom";
import useAuth from "../hooks/useAuth";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="page vstack">
      {/* Encabezado de la página */}
      <div className="page-header">
        <h1 className="page-title">
          Dashboard — {user?.name || "Usuario"}
        </h1>
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
          <Link className="btn-link" to="/reservas/registro">
            + Registrar reserva
          </Link>
          <Link className="btn-link" to="/transferencias/registro">
            + Registrar transferencia
          </Link>
        </div>
      </section>
    </div>
  );
}
