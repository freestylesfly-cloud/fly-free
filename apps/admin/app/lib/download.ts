/**
 * Saves a fetched file to disk.
 *
 * Guarded endpoints have to be fetched with the admin token and then handed to
 * the browser as a blob — a direct link cannot carry an Authorization header.
 */
export function saveBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');

  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();

  // Revoked on the next tick so the click has already started the download.
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}
