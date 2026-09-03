type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE';

export class ApiError extends Error {
  response: unknown;
  constructor(
    public status: number,
    message: string,
    response: unknown
  ) {
    super(message);
    this.name = 'ApiError';
    this.response = response;
  }
}

export class HttpClient {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    url: string,
    method: HttpMethod,
    data?: unknown,
    signal?: AbortSignal
  ): Promise<T> {
    const abortSignal = signal || new AbortController().signal;

    const response = await fetch(`${this.baseUrl}${url}`, {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(data),
      signal: abortSignal,
    });

    if (!response.ok) {
      throw new ApiError(response.status, 'Request failed', await response.json());
    }

    return response.json() as Promise<T>;
  }

  public async get<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, 'GET', undefined, signal);
  }

  public async post<T>(endpoint: string, data: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, 'POST', data, signal);
  }

  public async put<T>(endpoint: string, data: unknown, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, 'PUT', data, signal);
  }

  public async delete<T>(endpoint: string, signal?: AbortSignal): Promise<T> {
    return this.request<T>(endpoint, 'DELETE', undefined, signal);
  }
}
