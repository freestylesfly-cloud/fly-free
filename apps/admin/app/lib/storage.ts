/**
 * Media storage helpers.
 *
 * Files are stored on Cloudinary. Images go through the API; videos and theme
 * songs are too large for a JSON body, so the API signs an upload and the
 * browser sends the bytes to Cloudinary directly. The secret never leaves the API.
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

async function readUploadError(response: Response) {
  const body = await response.json().catch(() => null);
  return body?.message || body?.error || 'Media upload failed';
}

/**
 * @param _bucket kept for call-site compatibility; storage is decided by the API.
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
    throw new Error(await readUploadError(response));
  }

  const data = await response.json();
  return data.url as string;
}

export async function uploadMedia(bucket: string, file: File, folder = ''): Promise<string> {
  // Video and audio go direct to Cloudinary with a signed request: they are too
  // large to survive being base64'd into a JSON body. Everything else takes the
  // simpler API-proxied path.
  const isLargeMedia = file.type.startsWith('video/') || file.type.startsWith('audio/');
  if (!isLargeMedia) {
    return uploadImage(bucket, file, folder);
  }

  const endpoint = typeof window !== 'undefined' ? '/admin/media-upload-url' : '/api/admin/media-upload-url';
  const response = await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ mimeType: file.type, size: file.size, folder }),
  });

  if (!response.ok) {
    throw new Error(await readUploadError(response));
  }

  // Signed fields from the API; the file itself goes straight to Cloudinary.
  const upload = await response.json();
  const form = new FormData();
  for (const [key, value] of Object.entries(upload.fields as Record<string, string>)) {
    form.append(key, value);
  }
  form.append('file', file);

  const stored = await fetch(upload.uploadUrl, { method: 'POST', body: form });
  const result = await stored.json().catch(() => null);
  if (!stored.ok || !result?.secure_url) {
    const kind = file.type.startsWith('audio/') ? 'Audio' : 'Video';
    throw new Error(`${kind} upload failed: ${result?.error?.message || stored.statusText}`);
  }

  return result.secure_url as string;
}

export async function deleteImage(_bucket: string, urlOrPath: string): Promise<void> {
  // The API only removes files it stored on Cloudinary; anything else is ignored.
  if (!urlOrPath || !urlOrPath.includes('res.cloudinary.com/')) return;

  const endpoint = typeof window !== 'undefined' ? '/admin/delete-image' : '/api/admin/delete-image';
  await fetch(`${API_BASE}${endpoint}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...authHeaders() },
    body: JSON.stringify({ url: urlOrPath }),
  }).catch(() => {
    // Removing the stored file is best-effort; the record is already updated.
  });
}
