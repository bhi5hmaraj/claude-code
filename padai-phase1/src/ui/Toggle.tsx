export function Toggle({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string; }) {
  return (
    <label className="inline-flex items-center gap-2 select-none">
      <input type="checkbox" className="toggle" checked={value} onChange={(e) => onChange(e.currentTarget.checked)} />
      <span className="text-sm">{label}</span>
    </label>
  );
}
