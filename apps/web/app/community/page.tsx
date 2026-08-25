export const metadata = { title: 'Community | Fly Free' };

export default function CommunityPage() {
  return (
    <main className="grid min-h-[60vh] place-items-center px-5" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <div className="text-center">
        <p className="text-sm font-black uppercase" style={{ color: 'var(--color-primary)' }}>Fly Free</p>
        <h1 className="mt-2 text-4xl font-black uppercase md:text-6xl">Community</h1>
        <p className="mt-3 font-semibold" style={{ color: 'var(--text-secondary)' }}>Coming soon.</p>
      </div>
    </main>
  );
}
