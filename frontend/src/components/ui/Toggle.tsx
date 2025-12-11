
interface ToggleProps {
  label?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export default function Toggle({ label, checked, onChange, disabled = false }: ToggleProps) {
  return (
    <label className="toggle-wrapper" style={{ opacity: disabled ? 0.6 : 1, pointerEvents: disabled ? 'none' : 'auto' }}>
      <input
        type="checkbox"
        className="toggle-input"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        disabled={disabled}
      />
      <div className="toggle-track">
        <div className="toggle-thumb" />
      </div>
      {label && <span className="toggle-label">{label}</span>}
    </label>
  );
}