export default function Loading() {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/92 backdrop-blur-sm">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2 border-black">
          <span className="text-xl font-black" style={{ color: 'var(--color-primary)' }}>FF</span>
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.28em]" style={{ color: 'var(--text-primary)' }}>
          Fly Free
        </p>
        <div className="mt-4 h-1 w-40 overflow-hidden bg-black/10">
          <div className="h-full w-1/2 animate-[flyfree-loader_1s_ease-in-out_infinite] bg-black" />
        </div>
      </div>
    </div>
  );
}
