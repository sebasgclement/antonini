import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import api from "../../../lib/api";
import usePagedList from "../../../hooks/usePagedList";
import Toast from "../../../components/ui/Toast";
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
      setToast("Rol eliminado ✅");
    } catch (e: any) {
      setToast(e?.response?.data?.message || "No se pudo eliminar");
    } finally {
      setToDelete(null);
    }
  };

  return (
    <div className="vstack" style={{ gap: 20 }}>
      
      {/* HEADER */}
      <div className="hstack" style={{ justifyContent: "space-between", alignItems: 'center' }}>
        <div className="title" style={{margin: 0}}>Roles y Permisos</div>
        <Link className="btn" to="/admin/roles/crear">
          + Nuevo Rol
        </Link>
      </div>

      {/* BUSCADOR */}
      <div className="card hstack" style={{ padding: '12px 16px' }}>
        <input
          className="input-search"
          placeholder="🔍 Buscar rol por nombre..."
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          style={{ border: 'none', background: 'transparent', width: '100%', fontSize: '1rem', outline: 'none' }}
        />
      </div>

      {/* TABLA MODERNA */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 30, textAlign: 'center', color: 'var(--color-muted)' }}>Cargando roles...</div>
        ) : error ? (
          <div style={{ padding: 20, color: "var(--color-danger)" }}>Error: {error}</div>
        ) : rows.length === 0 ? (
          <div style={{ padding: 30, textAlign: 'center', color: "var(--color-muted)" }}>
            No hay roles definidos.
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="modern-table" style={{marginTop: 0, border: 'none'}}>
              <thead>
                <tr style={{background: 'var(--hover-bg)'}}>
                  <th>Nombre del Rol</th>
                  <th>Descripción</th>
                  <th style={{ textAlign: "right" }}>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => {
                    // Color distintivo para roles críticos
                    const badgeColor = ['admin', 'superadmin'].includes(r.name.toLowerCase()) ? 'purple' : 'blue';
                    
                    return (
                        <tr key={r.id}>
                        {/* Nombre con Badge */}
                        <td>
                            <div style={{display: 'flex', alignItems: 'center', gap: 10}}>
                                <span className={`badge ${badgeColor}`} style={{fontSize: '0.9rem'}}>
                                    {r.name}
                                </span>
                            </div>
                        </td>
                        
                        {/* Descripción */}
                        <td style={{color: 'var(--color-muted)', fontSize: '0.95rem'}}>
                            {r.description || <span style={{fontStyle: 'italic', opacity: 0.5}}>Sin descripción</span>}
                        </td>
                        
                        {/* Acciones */}
                        <td style={{ textAlign: "right" }}>
                            <div className="hstack" style={{ justifyContent: "flex-end", gap: 4 }}>
                            
                            <button
                                className="action-btn"
                                title="Editar Permisos"
                                onClick={() => nav(`/admin/roles/${r.id}/editar`)}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                            </button>

                            <button
                                className="action-btn danger"
                                title="Eliminar Rol"
                                onClick={() => setToDelete(r)}
                            >
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2 2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                            </button>

                            </div>
                        </td>
                        </tr>
                    );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <Pagination page={page} totalPages={totalPages} onPage={setPage} />

      {toast && (
        <Toast
          message={toast}
          type={toast.includes("✅") ? "success" : "error"}
        />
      )}

      <Confirm
        open={!!toDelete}
        title="Eliminar rol"
        message={
          <>
            ¿Estás seguro de eliminar el rol <b>{toDelete?.name}</b>?
            <br/><br/>
            <small style={{color: 'var(--color-danger)'}}>
                ⚠️ Cuidado: Los usuarios que tengan este rol perderán sus permisos asociados.
            </small>
          </>
        }
        onCancel={() => setToDelete(null)}
        onConfirm={onDelete}
      />
    </div>
  );
}