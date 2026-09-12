const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001";

export type ApiError = {
  code: string;
  message: string;
};

export async function api<T>(
  path: string,
  options: {
    method?: string;
    body?: unknown;
    accessToken?: string | null;
  } = {},
): Promise<T> {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (options.accessToken) {
    headers.Authorization = `Bearer ${options.accessToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? "GET",
    headers,
    body: options.body === undefined ? undefined : JSON.stringify(options.body),
  });

  const data = (await response.json().catch(() => ({}))) as T & { error?: ApiError };
  if (!response.ok) {
    const error = data.error ?? { code: "REQUEST_FAILED", message: "Falha na requisição." };
    throw Object.assign(new Error(error.message), { code: error.code, status: response.status });
  }
  return data;
}
