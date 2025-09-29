import useAuth from "../hooks/useAuth";
import Button from "../components/ui/Button";
import Logo from "../components/ui/Logo";

type HeaderProps = {
  onToggleSidebar?: () => void;
};

export default function Header({ onToggleSidebar }: HeaderProps) {
  const { user, logout } = useAuth();

  return (
    <header>
      <div className="hstack">
        {/* Menú hamburguesa visible solo en mobile */}
        <button
          className="btn menu-toggle"
          onClick={onToggleSidebar}
        >
          ☰
        </button>
        <Logo />
      </div>

      {/* Bloque solo en desktop */}
      <div className="hstack header-right">
        <span style={{ color: "var(--color-muted)" }}>
          {user?.name || user?.email}
        </span>
        <Button onClick={logout}>Salir</Button>
      </div>
    </header>
  );
}
