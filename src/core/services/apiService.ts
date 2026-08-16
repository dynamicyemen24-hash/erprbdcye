// Enterprise API Service Layer for NexoraOS™ (Multi-tenant High Performance REST/Data Engine)

export interface ApiRequestOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
}

export class EnterpriseApiService {
  private static baseUrl = '/api';

  private static getHeaders(customHeaders?: HeadersInit): HeadersInit {
    let orgId = '00000000-0000-0000-0000-000000000001';
    let token = '';
    try {
      const savedOrg = localStorage.getItem('nexora_active_org');
      if (savedOrg) orgId = savedOrg;
      else {
        const savedUser = localStorage.getItem('rbd_user') || localStorage.getItem('roh_user');
        if (savedUser) {
          const parsed = JSON.parse(savedUser);
          if (parsed.organization_id) orgId = parsed.organization_id;
        }
      }
      token = localStorage.getItem('rbd_token') || '';
    } catch (e) {}

    const defaultHeaders: Record<string, string> = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'x-organization-id': orgId,
    };

    if (token) {
      defaultHeaders['Authorization'] = `Bearer ${token}`;
    }

    return {
      ...defaultHeaders,
      ...(customHeaders || {}),
    };
  }

  private static buildUrl(endpoint: string, params?: Record<string, any>): string {
    const url = new URL(`${this.baseUrl}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`, window.location.origin);
    if (params) {
      Object.entries(params).forEach(([key, val]) => {
        if (val !== undefined && val !== null) {
          url.searchParams.append(key, String(val));
        }
      });
    }
    return url.toString();
  }

  public static async get<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'GET',
      headers: this.getHeaders(options?.headers),
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  public static async post<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'POST',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  public static async put<T>(endpoint: string, data?: any, options?: ApiRequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'PUT',
      headers: this.getHeaders(options?.headers),
      body: data ? JSON.stringify(data) : undefined,
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  public static async delete<T>(endpoint: string, options?: ApiRequestOptions): Promise<T> {
    const url = this.buildUrl(endpoint, options?.params);
    const response = await fetch(url, {
      method: 'DELETE',
      headers: this.getHeaders(options?.headers),
      ...options,
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }
}
