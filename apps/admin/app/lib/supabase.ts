/**
 * Media storage helpers.
 *
 * Uploads go through the API rather than straight to Supabase: the storage
 * buckets have no INSERT policy, so the browser's anon key is rejected by RLS.
 * The server performs the write with the service-role key.
 */

const API_BASE = typeof window !== 'undefined'
  ? '/api/proxy'
  : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001');

function authHeaders(): Record<string, string> {
  return {};
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error(`Could not read ${file.name}`));
    reader.readAsDataURL(file);
  });
}

/**
 * @param _bucket kept for call-site compatibility; the server always writes to
 *                the `product-images` bucket.
 */
export async function uploadImage(_bucket: string, file: File, folder = ''): Promise<string> {
  const image = await fileToDataUrl(file);

  const endpoint = typeof window !== 'undefined' ? '/admin/upload-image' : '/api/admin/upload-image';
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ image, folder }),
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    throw new Error(body?.message || body?.error || 'Media upload failed');
  }

  const data = await response.json();
  return data.url as string;
}

export async function uploadMedia(bucket: string, file: File, folder = ''): Promise<string> {
  return uploadImage(bucket, file, folder);
}

export async function deleteImage(_bucket: string, urlOrPath: string): Promise<void> {
  if (!urlOrPath || !urlOrPath.includes('/storage/v1/object/public/')) return;

  const endpoint = typeof window !== 'undefined' ? '/admin/delete-image' : '/api/admin/delete-image';
  await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ url: urlOrPath }),
  }).catch(() => {
    // Removing the stored file is best-effort; the record is already updated.
  });
}
