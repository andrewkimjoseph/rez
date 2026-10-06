export class InsightsApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "InsightsApiError";
    this.status = status;
  }
}

export async function insightsApi<T>(path: string, init?: RequestInit): Promise<T> {
  const base = process.env.INSIGHTS_API_BASE_URL?.replace(/\/$/, "");
  const key = process.env.INSIGHTS_API_KEY;
  if (!base || !key) {
    throw new Error("Missing INSIGHTS_API_BASE_URL or INSIGHTS_API_KEY");
  }

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${key}`);
  if (init?.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`${base}${path}`, { ...init, headers });
  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = null;
    }
  }

  if (!response.ok) {
    const message =
      body && typeof body === "object" && body !== null && "error" in body && typeof body.error === "string"
        ? body.error
        : `Insights API ${response.status}`;
    throw new InsightsApiError(response.status, message);
  }

  return body as T;
}
