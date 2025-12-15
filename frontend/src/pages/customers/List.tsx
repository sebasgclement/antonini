import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import CustomerEventsModal from "../../components/modals/CustomerEventsModal";
import Confirm from "../../components/ui/Confirm";
import Pagination from "../../components/ui/Pagination";
import Toast from "../../components/ui/Toast";
import usePagedList from "../../hooks/usePagedList";
import api from "../../lib/api";
import { displayCustomerName, type Customer } from "../../types/customer";

export default function CustomersList() {
  const nav = useNavigate();
  const {
    items,
    setItems,
    loading,
    error,
    page,
    setPage,
    totalPages,
    search,
    setSearch,
    refetch,
  } = usePagedList<Customer>("/customers");

  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState<Customer | null>(null);
  const [agendaCustomer, setAgendaCustomer] = useState<Customer | null>(null);

  // 🔹 ESTADOS PARA COLAPSAR LAS TABLAS (Por defecto abiertas)
  const [showRegistrados, setShowRegistrados] = useState(true);
  const [showConsultas, setShowConsultas] = useState(true);

  const rows = useMemo(() => items, [items]);

  const clientesRegistrados = rows.filter((c) => c.status === "cliente");
  const consultas = rows.filter((c) => c.status === "consulta" || !c.status);

  const onDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/customers/${toDelete.id}`);
      setItems((prev) => prev.filter((c) => c.id !== toDelete.id));
      if (rows.length === 1 && page > 1) {
        setPage(page - 1);
        setTimeout(refetch, 0);
      }
      setToast("Cliente eliminado ✅");
    } catch (e: any) {
      setToast(e?.response?.data?.message || "No se pudo eliminar");
    } finally {
      setToDelete(null);
    }
  };

  const ActionButtons = ({ c }: { c: Customer }) => (
    <div className="hstack" style={{ justifyContent: "flex-end", gap: 4 }}>
      <button
        className="action-btn"
        title="Agenda"
        style={{ color: "#eab308" }}
        onClick={(e) => {
          e.stopPropagation();
          setAgendaCustomer(c);
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"></rect>
          <line x1="16" y1="2" x2="16" y2="6"></line>
          <line x1="8" y1="2" x2="8" y2="6"></line>
          <line x1="3" y1="10" x2="21" y2="10"></line>
        </svg>
      </button>
      <button
        className="action-btn"
        title="Ver"
        onClick={(e) => {
          e.stopPropagation();
          nav(`/clientes/${c.id}/ver`);
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
          <circle cx="12" cy="12" r="3" />
        </svg>
      </button>
      <button
        className="action-btn"
        title="Editar"
        onClick={(e) => {
          e.stopPropagation();
          nav(`/clientes/${c.id}/edit`);
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
        </svg>
      </button>
      <button
        className="action-btn danger"
        title="Eliminar"
        onClick={(e) => {
          e.stopPropagation();
          setToDelete(c);
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="3 6 5 6 21 6" />
          <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2 2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
        </svg>
      </button>
    </div>
  );

  return (
    <div className="vstack" style={{ gap: 20 }}>
      {/* HEADER */}
      <div
        className="hstack"
        style={{ justifyContent: "space-between", alignItems: "center" }}
      >
        <div className="title" style={{ margin: 0 }}>
          Cartera de Clientes
        </div>
        <Link className="btn" to="/clientes/registro">
          + Nuevo Cliente
        </Link>
      </div>

      {/* BUSCADOR */}
      <div className="card hstack" style={{ padding: "12px 16px" }}>
        <input
          className="input-search"
          placeholder="🔍 Buscar por nombre, email, DNI o teléfono..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{
            border: "none",
            background: "transparent",
            width: "100%",
            fontSize: "1rem",
            outline: "none",
          }}
        />
      </div>

      {loading ? (
        <div
          style={{
            padding: 30,
            textAlign: "center",
            color: "var(--color-muted)",
          }}
        >
          Cargando...
        </div>
      ) : error ? (
        <div style={{ padding: 20, color: "var(--color-danger)" }}>
          Error: {error}
        </div>
      ) : (
        <>
          {/* === TABLA 1: CLIENTES REGISTRADOS (COLLAPSIBLE) === */}
          {clientesRegistrados.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                onClick={() => setShowRegistrados(!showRegistrados)}
                style={{
                  padding: "12px 20px",
                  background: "var(--hover-bg)",
                  borderBottom: showRegistrados
                    ? "1px solid var(--color-border)"
                    : "none",
                  fontWeight: 600,
                  color: "var(--color-primary)",
                  fontSize: "1.05rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    transform: showRegistrados
                      ? "rotate(90deg)"
                      : "rotate(0deg)",
                    transition: "0.2s",
                  }}
                >
                  ▶
                </span>
                Clientes Registrados
                <span
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.7,
                    marginLeft: "auto",
                  }}
                >
                  {clientesRegistrados.length} registros
                </span>
              </div>

              {showRegistrados && (
                <div style={{ overflowX: "auto" }}>
                  <table
                    className="modern-table"
                    style={{ marginTop: 0, border: "none" }}
                  >
                    <thead>
                      <tr>
                        <th>Cliente</th>
                        <th>Documento</th>
                        <th>Contacto</th>
                        <th style={{ textAlign: "right" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {clientesRegistrados.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--color-text)",
                              }}
                            >
                              {displayCustomerName(c)}
                            </div>
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--color-muted)",
                              }}
                            >
                              ID: #{c.id} • {c.city || ""}
                            </div>
                          </td>
                          <td>
                            <span style={{ fontWeight: 500 }}>
                              {c.doc_number}
                            </span>
                          </td>
                          <td>
                            <div
                              style={{
                                display: "flex",
                                flexDirection: "column",
                                fontSize: "0.9rem",
                              }}
                            >
                              {c.phone && <span>{c.phone}</span>}
                              {c.email && (
                                <span
                                  style={{ opacity: 0.8, fontSize: "0.85rem" }}
                                >
                                  {c.email}
                                </span>
                              )}
                            </div>
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <ActionButtons c={c} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* === TABLA 2: CONSULTAS (COLLAPSIBLE) === */}
          {consultas.length > 0 && (
            <div className="card" style={{ padding: 0, overflow: "hidden" }}>
              <div
                onClick={() => setShowConsultas(!showConsultas)}
                style={{
                  padding: "12px 20px",
                  background: "var(--input-bg)",
                  borderBottom: showConsultas
                    ? "1px solid var(--color-border)"
                    : "none",
                  fontWeight: 600,
                  color: "var(--color-text)",
                  fontSize: "1rem",
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  cursor: "pointer",
                  userSelect: "none",
                }}
              >
                <span
                  style={{
                    transform: showConsultas ? "rotate(90deg)" : "rotate(0deg)",
                    transition: "0.2s",
                  }}
                >
                  ▶
                </span>
                Consultas y Prospectos
                <span
                  style={{
                    fontSize: "0.8rem",
                    opacity: 0.7,
                    marginLeft: "auto",
                  }}
                >
                  {consultas.length} registros
                </span>
              </div>

              {showConsultas && (
                <div style={{ overflowX: "auto" }}>
                  <table
                    className="modern-table"
                    style={{ marginTop: 0, border: "none" }}
                  >
                    <thead>
                      <tr>
                        <th>Interesado</th>
                        <th>Teléfono</th>
                        <th>Atendido por</th>
                        <th style={{ textAlign: "right" }}>Acciones</th>
                      </tr>
                    </thead>
                    <tbody>
                      {consultas.map((c) => (
                        <tr key={c.id}>
                          <td>
                            <div
                              style={{
                                fontWeight: 600,
                                color: "var(--color-text)",
                              }}
                            >
                              {c.first_name} {c.last_name}
                            </div>
                            <div
                              style={{
                                fontSize: "0.8rem",
                                color: "var(--color-muted)",
                              }}
                            >
                              {c.created_at
                                ? new Date(c.created_at).toLocaleDateString()
                                : "—"}
                            </div>
                          </td>
                          <td>
                            {c.phone ? (
                              <a
                                href={`https://wa.me/549${c.phone}`}
                                target="_blank"
                                rel="noreferrer"
                                style={{
                                  color: "var(--color-green)",
                                  textDecoration: "none",
                                  fontWeight: 500,
                                }}
                              >
                                {c.phone} ↗
                              </a>
                            ) : (
                              "—"
                            )}
                          </td>
                          <td>
                            {c.user ? (
                              <span
                                className="badge blue"
                                style={{
                                  fontSize: "0.8rem",
                                  padding: "2px 8px",
                                }}
                              >
                                {c.user.name}
                              </span>
                            ) : (
                              <span style={{ opacity: 0.5 }}>—</span>
                            )}
                          </td>
                          <td style={{ textAlign: "right" }}>
                            <ActionButtons c={c} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {rows.length === 0 && (
            <div
              style={{
                padding: 30,
                textAlign: "center",
                color: "var(--color-muted)",
              }}
            >
              No se encontraron resultados.
            </div>
          )}
        </>
      )}

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {toast && (
        <Toast
          message={toast}
          type={toast.includes("✅") ? "success" : "error"}
        />
      )}

      <Confirm
        open={!!toDelete}
        title="Eliminar cliente"
        message={
          <>
            ¿Estás seguro de eliminar a{" "}
            <b>{displayCustomerName(toDelete || ({ id: 0 } as Customer))}</b>?
            <br />
            <br />
            <small style={{ color: "var(--color-danger)" }}>
              Se borrará su historial. Esta acción no se puede deshacer.
            </small>
          </>
        }
        onCancel={() => setToDelete(null)}
        onConfirm={onDelete}
      />

      {agendaCustomer && (
        <CustomerEventsModal
          customer={agendaCustomer}
          onClose={() => setAgendaCustomer(null)}
        />
      )}
    </div>
  );
}
