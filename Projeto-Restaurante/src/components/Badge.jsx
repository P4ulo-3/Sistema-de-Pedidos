const variants = {
  orange: "bg-brand-500/15 text-brand-400 border border-brand-500/30",
  green: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  blue: "bg-blue-500/15 text-blue-400 border border-blue-500/30",
  red: "bg-red-500/15 text-red-400 border border-red-500/30",
  yellow: "bg-yellow-500/15 text-yellow-400 border border-yellow-500/30",
  gray: "bg-surface-700/60 text-gray-400 border border-surface-600",
};

export default function Badge({ variant = "gray", children, className = "" }) {
  return (
    <span
      className={`
      inline-flex items-center px-2 py-0.5
      rounded-full text-xs font-medium
      ${variants[variant] ?? variants.gray}
      ${className}
    `}
    >
      {children}
    </span>
  );
}
