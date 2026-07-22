export function getApiBaseUrl() {
  // For browser context, use the configured API URL
  if (typeof window !== 'undefined') {
    const rawUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
    const baseUrl = rawUrl.replace(/\/$/, "");
    return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
  }

  // For server-side rendering, use the actual API server
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";
  const baseUrl = apiUrl.replace(/\/$/, "");
  return baseUrl.endsWith("/api") ? baseUrl : `${baseUrl}/api`;
}

export async function readApiResponse(response: Response) {
  const contentType = response.headers.get("content-type") || "";
  const text = await response.text();

  if (contentType.includes("application/json") && text) {
    return JSON.parse(text);
  }

  if (!text) {
    return null;
  }

  try {
    return JSON.parse(text);
  } catch {
    return {
      error: response.ok
        ? "The server returned an unexpected response."
        : `Request failed with HTTP ${response.status}. Please check the API server.`
    };
  }
}
