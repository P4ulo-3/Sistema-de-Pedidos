export default function LoadingSpinner({ text = "Carregando..." }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="w-8 h-8 rounded-full border-2 border-surface-600 border-t-brand-500 animate-spin" />
      <p className="text-sm text-gray-500">{text}</p>
    </div>
  );
}
