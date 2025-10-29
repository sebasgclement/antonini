import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../lib/api";
import usePagedList from "../../../hooks/usePagedList";
import Toast from "../../../components/ui/Toast";
import Button from "../../../components/ui/Button";
import Confirm from "../../../components/ui/Confirm";
import Pagination from "../../../components/ui/Pagination";

export type Role = {
  id: number;
  name: string;
  description?: string;
};

export default function RolesList() {
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
  } = usePagedList<Role>("/admin/roles");

  const [toast, setToast] = useState("");
  const [toDelete, setToDelete] = useState<Role | null>(null);

  const rows = useMemo(() => items, [items]);

  const onDelete = async () => {
    if (!toDelete) return;
    try {
      await api.delete(`/admin/roles/${toDelete.id}`);
      setItems((prev) => prev.filter((r) => r.id !== toDelete.id));
      if (rows.length === 1 && page > 1) {
        setPage(page - 1);
        setTimeout(refetch, 0);
      }
      setToast("Rol eliminado");
    } catch (e: any) {
      setToast(e?.response?.data?.message || "No se pudo eliminar");
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="vstack" style={{ gap: 12 }}>
      <div className="hstack" style={{ justifyContent: "space-between" }}>
        <div className="title">Roles</div>
        <Link className="enlace" to="/admin/roles/crear">
          + Nuevo
        </Link>
      </div>

      {/* 🔍 Buscador con estilo global */}
      <div className="card hstack" style={{ justifyContent: "space-between" }}>
        <input
          className="form-control"
          placeholder="Buscar rol…"
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
        />
      </div>

      <div className="card" style={{ overflowX: "auto" }}>
        {loading ? (
          <div style={{ padding: 16 }}>Cargando…</div>
        ) : error ? (
          <div style={{ padding: 16, color: "var(--color-danger)" }}>
            Error: {error}
          </div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 16, color: "var(--color-muted)" }}>
            No hay roles para mostrar.
          </div>
        ) : (
          <table style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ textAlign: "left", color: "var(--color-muted)" }}>
                <th style={{ padding: 8 }}>#</th>
                <th style={{ padding: 8 }}>Nombre</th>
                <th style={{ padding: 8 }}>Descripción</th>
                <th style={{ padding: 8, textAlign: "right" }}>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} style={{ borderTop: "1px solid #1f2430" }}>
                  <td style={{ padding: 8 }}>{r.id}</td>
                  <td style={{ padding: 8 }}>{r.name}</td>
                  <td style={{ padding: 8 }}>{r.description || "—"}</td>
                  <td style={{ padding: 8 }}>
                    <div
                      className="hstack"
                      style={{ justifyContent: "flex-end", gap: 8 }}
                    >
                      <Button onClick={() => nav(`/admin/roles/${r.id}/editar`)}>
                        Editar
                      </Button>
                      <Button onClick={() => setToDelete(r)}>Eliminar</Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {toast && (
        <Toast
          message={toast}
          type={toast.includes("eliminado") ? "success" : "error"}
        />
      )}

      <Confirm
        open={!!toDelete}
        title="Eliminar rol"
        message={
          <>
            Vas a eliminar <b>{toDelete?.name}</b>. Esta acción no se puede
            deshacer.
          </>
        }
        onCancel={() => setToDelete(null)}
        onConfirm={onDelete}
      />
    </div>
  );
}
