export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api/proxy';
  }
  return process.env.API_URL || 'http://localhost:3001';
}
