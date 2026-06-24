/**
 * Fetches with auth cookie, retry-on-401, and safe error parsing.
 * Handles token refresh race conditions and non-JSON error responses.
 */
const AUTH_RETRY_DELAY_MS = 500;
const NETWORK_RETRY_DELAY_MS = 400;

type FetchWithAuthOptions = RequestInit & {
  retryOnNetworkError?: boolean;
};

async function parseErrorBody(response: Response): Promise<string | null> {
  try {
    const data = await response.json();
    return typeof data?.error === 'string' ? data.error : null;
  } catch {
    return null;
  }
}

function isNetworkFetchError(error: unknown): boolean {
  if (error instanceof TypeError) return true;
  if (error instanceof DOMException && error.name === 'AbortError') return false;
  return error instanceof Error && error.message === 'Failed to fetch';
}

async function fetchWithAuthRetry(
  url: string,
  options: FetchWithAuthOptions = {},
  isAuthRetry = false,
  isNetworkRetry = false,
): Promise<Response> {
  const { retryOnNetworkError = false, ...requestInit } = options;

  const fetchOptions: RequestInit = {
    ...requestInit,
    credentials: 'include',
    headers: {
      ...(requestInit.body && { 'Content-Type': 'application/json' }),
      ...requestInit.headers,
    },
  };

  try {
    const response = await fetch(url, fetchOptions);

    if (response.ok) {
      return response;
    }

    if (response.status === 401 && !isAuthRetry) {
      await new Promise((resolve) => setTimeout(resolve, AUTH_RETRY_DELAY_MS));
      return fetchWithAuthRetry(url, options, true, isNetworkRetry);
    }

    const errorMessage = await parseErrorBody(response);
    throw new Error(
      errorMessage || response.statusText || `Request failed (${response.status})`,
    );
  } catch (error) {
    if (
      retryOnNetworkError &&
      !isNetworkRetry &&
      isNetworkFetchError(error) &&
      (fetchOptions.method ?? 'GET').toUpperCase() === 'GET'
    ) {
      await new Promise((resolve) => setTimeout(resolve, NETWORK_RETRY_DELAY_MS));
      return fetchWithAuthRetry(url, options, isAuthRetry, true);
    }
    throw error;
  }
}

export { fetchWithAuthRetry };
export type { FetchWithAuthOptions };
