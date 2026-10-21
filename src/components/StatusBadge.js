export function StatusBadge({ status }) {
  const label = status?.label || 'Sem status';
  const color = status?.color_hex || '#E2E8F0';

  return (
    <span
      className="inline-flex rounded-full px-2.5 py-1 text-xs font-semibold text-slate-800"
      style={{ backgroundColor: color }}
    >
      {label}
    </span>
  );
}
