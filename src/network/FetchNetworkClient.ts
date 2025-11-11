import type {
  NetworkClient,
  NetworkResponse,
  Optional,
} from '@sudobility/types';

/**
 * Fetch-based implementation of NetworkClient
 * Uses native fetch API for HTTP requests
 */
export class FetchNetworkClient implements NetworkClient {
  private readonly timeout: number;

  constructor(timeout: number = 30000) {
    this.timeout = timeout;
  }

  async request<T = unknown>(
    url: string,
    options?: Optional<{
      method?: Optional<'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH'>;
      headers?: Optional<Record<string, string>>;
      body?: Optional<string | FormData | Blob>;
      signal?: Optional<AbortSignal>;
      timeout?: Optional<number>;
    }>
  ): Promise<NetworkResponse<T>> {
    const controller = new AbortController();
    const timeoutId = setTimeout(
      () => controller.abort(),
      options?.timeout || this.timeout
    );

    try {
      const fetchOptions: RequestInit = {
        method: options?.method || 'GET',
        headers: options?.headers || {},
        signal: options?.signal || controller.signal,
      };

      // Only add body if it's defined and not null/undefined
      if (options?.body !== null && options?.body !== undefined) {
        fetchOptions.body = options.body;
      }

      const response = await fetch(url, fetchOptions);

      clearTimeout(timeoutId);

      const text = await response.text();
      let data: T;
      try {
        data = JSON.parse(text) as T;
      } catch {
        data = text as any;
      }

      // Build headers object from Headers
      const headers: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        headers[key] = value;
      });

      return {
        ok: response.ok,
        status: response.status,
        statusText: response.statusText,
        data,
        headers,
        success: response.ok,
        timestamp: new Date().toISOString(),
      };
    } catch (error: any) {
      clearTimeout(timeoutId);
      throw new Error(
        `Network request failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  async get<T = unknown>(
    url: string,
    options?: Optional<
      Omit<Parameters<NetworkClient['request']>[1], 'method' | 'body'>
    >
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'GET' });
  }

  async post<T = unknown>(
    url: string,
    body?: Optional<unknown>,
    options?: Optional<Omit<Parameters<NetworkClient['request']>[1], 'method'>>
  ): Promise<NetworkResponse<T>> {
    const bodyString = body ? JSON.stringify(body) : undefined;
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const headers =
      options && 'headers' in options && options.headers
        ? { ...baseHeaders, ...options.headers }
        : baseHeaders;

    return this.request<T>(url, {
      ...options,
      method: 'POST',
      body: bodyString,
      headers,
    });
  }

  async put<T = unknown>(
    url: string,
    body?: Optional<unknown>,
    options?: Optional<Omit<Parameters<NetworkClient['request']>[1], 'method'>>
  ): Promise<NetworkResponse<T>> {
    const bodyString = body ? JSON.stringify(body) : undefined;
    const baseHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const headers =
      options && 'headers' in options && options.headers
        ? { ...baseHeaders, ...options.headers }
        : baseHeaders;

    return this.request<T>(url, {
      ...options,
      method: 'PUT',
      body: bodyString,
      headers,
    });
  }

  async delete<T = unknown>(
    url: string,
    options?: Optional<
      Omit<Parameters<NetworkClient['request']>[1], 'method' | 'body'>
    >
  ): Promise<NetworkResponse<T>> {
    return this.request<T>(url, { ...options, method: 'DELETE' });
  }
}
