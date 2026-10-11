/**
 * An event's dates as one label: "9 Oct 2026", "8–9 Oct 2026",
 * "30 Oct – 2 Nov 2026" or "30 Dec 2026 – 1 Jan 2027".
 *
 * Formatted in India's time zone on purpose: these pages are server-rendered,
 * and on a UTC server an evening event in IST would otherwise print as the
 * previous or next day.
 */
export function formatEventDates(
  start?: string | null,
  end?: string | null,
  month: 'short' | 'long' = 'short'
): string {
  if (!start) return '';
  const zone = 'Asia/Kolkata';
  const parts = (value: string) => {
    const date = new Date(value);
    const get = (options: Intl.DateTimeFormatOptions) =>
      new Intl.DateTimeFormat('en-IN', { timeZone: zone, ...options }).format(date);
    return { day: get({ day: 'numeric' }), month: get({ month }), year: get({ year: 'numeric' }) };
  };

  const a = parts(start);
  if (!end) return `${a.day} ${a.month} ${a.year}`;
  const b = parts(end);

  if (a.year !== b.year) return `${a.day} ${a.month} ${a.year} – ${b.day} ${b.month} ${b.year}`;
  if (a.month !== b.month) return `${a.day} ${a.month} – ${b.day} ${b.month} ${b.year}`;
  if (a.day !== b.day) return `${a.day}–${b.day} ${a.month} ${a.year}`;
  return `${a.day} ${a.month} ${a.year}`;
}
