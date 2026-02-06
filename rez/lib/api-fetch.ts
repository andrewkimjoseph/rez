/**
 * Fetches with auth cookie, retry-on-401, and safe error parsing.
 * Handles token refresh race conditions and non-JSON error responses.
 */
const AUTH_RETRY_DELAY_MS = 500;

async function parseErrorBody(response: Response): Promise<string | null> {
  try {
    const data = await response.json();
    return typeof data?.error === 'string' ? data.error : null;
  } catch {
    return null;
  }
}

async function fetchWithAuthRetry(
  url: string,
  options: RequestInit = {},
  isRetry = false
): Promise<Response> {
  const fetchOptions: RequestInit = {
    ...options,
    credentials: 'include',
    headers: {
      ...(options.body && { 'Content-Type': 'application/json' }),
      ...options.headers,
    },
  };

  const response = await fetch(url, fetchOptions);

  if (response.ok) {
    return response;
  }

  // Retry once on 401 (token refresh race)
  if (response.status === 401 && !isRetry) {
    await new Promise((resolve) => setTimeout(resolve, AUTH_RETRY_DELAY_MS));
    return fetchWithAuthRetry(url, options, true);
  }

  const errorMessage = await parseErrorBody(response);
  throw new Error(errorMessage || response.statusText || `Request failed (${response.status})`);
}

export { fetchWithAuthRetry };
