import { redirect } from 'next/navigation';

// Legacy invite links (/invite?email=...) sent before the flow moved to signup.
// Keep this redirect so those emails never land on a 404.
export default async function InviteRedirectPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = Array.isArray(params.email) ? params.email[0] : params.email;
  const email = (raw || '').trim();

  redirect(`/auth/signup?invited=1${email ? `&email=${encodeURIComponent(email)}` : ''}`);
}
