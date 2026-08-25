export default function Loading() {
  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center bg-white/92 backdrop-blur-sm">
      <div className="border bg-white p-6 text-center shadow-xl" style={{ borderColor: 'var(--border-color)' }}>
        <div
          className="mx-auto flex h-16 w-16 items-center justify-center rounded-full border-2"
          style={{
            borderColor: 'color-mix(in srgb, var(--color-primary) 28%, transparent)',
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 8%, white)'
          }}
        >
          <span className="text-xl font-black" style={{ color: 'var(--color-primary)' }}>FF</span>
        </div>
        <p className="mt-4 text-xs font-black uppercase tracking-[0.28em]" style={{ color: 'var(--text-primary)' }}>
          Fly Free
        </p>
        <div className="mt-4 h-1 w-40 overflow-hidden" style={{ backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, white)' }}>
          <div className="h-full w-1/2 animate-[flyfree-loader_1s_ease-in-out_infinite]" style={{ backgroundColor: 'var(--color-primary)' }} />
        </div>
      </div>
    </div>
  );
}
