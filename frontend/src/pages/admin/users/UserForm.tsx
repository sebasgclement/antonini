import { useEffect, useMemo, useState } from "react";
import api from "../../../lib/api";
import Button from "../../../components/ui/Button";
import Input from "../../../components/ui/Input";
import type { AuthUser } from "../../../hooks/useAuth";

type Role = { id: number; name: string };

type Props = {
  initial?: Partial<AuthUser>;
  onSubmit: (payload: {
    name: string;
    email: string;
    password?: string;
    role: string;
  }) => Promise<void>;
  submitting?: boolean;
  isEdit?: boolean;
};

function readRoleName(r: unknown): string {
  if (!r) return "";
  if (typeof r === "string") return r;
  if (typeof r === "object") {
    const o = r as Record<string, unknown>;
    const cand = o.name ?? o.rol ?? o.role ?? o.slug ?? o.id;
    return cand != null ? String(cand) : "";
  }
  return String(r);
}

export default function UserForm({
  initial = {},
  onSubmit,
  submitting,
  isEdit,
}: Props) {
  
  // Rol inicial
  const initialRole = useMemo(() => {
    if (initial.role) return String(initial.role);
    if (Array.isArray(initial.roles) && initial.roles.length)
      return readRoleName(initial.roles[0]);
    return "";
  }, [initial]);

  const [name, setName] = useState(initial.name ?? "");
  const [email, setEmail] = useState(initial.email ?? "");
  const [role, setRole] = useState(initialRole);
  const [password, setPassword] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);

  // 🔹 Cargar roles dinámicamente
  useEffect(() => {
    (async () => {
      try {
        const { data } = await api.get<Role[]>("/admin/roles-list");
        setRoles(data);
        // Si no hay valor inicial y cargaron roles, preseleccionar el primero si es Create
        if (!initialRole && !isEdit && data.length > 0) {
           // Opcional: preseleccionar Vendedor por defecto
           const vendedor = data.find(r => r.name.toLowerCase() === 'vendedor');
           setRole(vendedor ? vendedor.name : data[0].name);
        } else if (initialRole) {
            setRole(initialRole);
        }
      } catch (err) {
        console.error("Error cargando roles:", err);
      }
    })();
  }, [initialRole, isEdit]);

  // Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload: any = { name, email, role };
    if (!isEdit || password.trim()) payload.password = password;
    await onSubmit(payload);
  };

  return (
    <form onSubmit={handleSubmit} className="vstack" style={{ gap: 24 }}>
      
      {/* Datos Personales */}
      <div className="card vstack" style={{ gap: 16 }}>
        <div className="title" style={{fontSize: '1rem', margin: 0}}>Datos de Cuenta</div>
        
        <div className="form-row">
            <Input
                label="Nombre Completo *"
                value={name}
                onChange={(e) => setName(e.currentTarget.value)}
                required
                placeholder="Ej: Juan Pérez"
            />
            <Input
                label="Correo Electrónico *"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.currentTarget.value)}
                required
                placeholder="juan@empresa.com"
            />
        </div>

        <Input
            label={isEdit ? "Contraseña (Dejar vacío para mantener la actual)" : "Contraseña *"}
            type="password"
            value={password}
            onChange={(e) => setPassword(e.currentTarget.value)}
            required={!isEdit}
            placeholder={isEdit ? "••••••••" : "Mínimo 6 caracteres"}
        />
      </div>

      {/* Selector de Rol Visual */}
      <div className="card vstack" style={{ gap: 16 }}>
        <div className="title" style={{fontSize: '1rem', margin: 0}}>Asignación de Rol</div>
        
        {roles.length === 0 ? (
            <div style={{color: 'var(--color-muted)'}}>Cargando roles...</div>
        ) : (
            <div className="selection-grid">
                {roles.map(r => {
                    const isActive = role === r.name;
                    // Iconito según rol (simple)
                    const icon = r.name.toLowerCase().includes('admin') ? '🛡️' : '👤';
                    
                    return (
                        <div 
                            key={r.id}
                            className={`selection-card ${isActive ? 'selected' : ''}`}
                            onClick={() => setRole(r.name)}
                        >
                            <div style={{fontSize: '1.5rem', marginBottom: 8}}>{icon}</div>
                            <div className="selection-title">{r.name}</div>
                        </div>
                    )
                })}
            </div>
        )}
      </div>

      {/* Botón Guardar */}
      <div className="hstack" style={{ justifyContent: "flex-end" }}>
        <Button type="submit" loading={!!submitting} style={{padding: '10px 24px'}}>
          {submitting ? "Guardando..." : isEdit ? "Guardar Cambios" : "Crear Usuario"}
        </Button>
      </div>
    </form>
  );
}