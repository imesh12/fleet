'use client';

export type ApiMeta = {
  requestId?: string;
  pagination?: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  [key: string]: unknown;
};

export type ApiSuccess<T> = {
  success: true;
  data: T;
  meta: ApiMeta;
};

export type ApiFailure = {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta: ApiMeta;
};

export type ApiEnvelope<T> = ApiSuccess<T> | ApiFailure;

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly status: number,
    public readonly code?: string,
    public readonly details?: unknown,
    public readonly requestId?: string
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

const ACCESS_TOKEN_KEY = 'trackigniter8.accessToken';
const ORGANIZATION_ID_KEY = 'trackigniter8.organizationId';

export function getApiBaseUrl() {
  return process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:3000/api/v1';
}

export function getAccessToken() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(ACCESS_TOKEN_KEY);
}

export function setAccessToken(token: string) {
  window.localStorage.setItem(ACCESS_TOKEN_KEY, token);
}

export function clearAccessToken() {
  if (typeof window !== 'undefined') {
    window.localStorage.removeItem(ACCESS_TOKEN_KEY);
    window.dispatchEvent(new CustomEvent('trackigniter8:logout'));
  }
}

export function getSelectedOrganizationId() {
  if (typeof window === 'undefined') {
    return null;
  }
  return window.localStorage.getItem(ORGANIZATION_ID_KEY);
}

export function setSelectedOrganizationId(organizationId: string | null) {
  if (typeof window === 'undefined') {
    return;
  }

  if (organizationId) {
    window.localStorage.setItem(ORGANIZATION_ID_KEY, organizationId);
  } else {
    window.localStorage.removeItem(ORGANIZATION_ID_KEY);
  }

  window.dispatchEvent(new CustomEvent('trackigniter8:organization-change', { detail: { organizationId } }));
}

type RequestOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  token?: string | null;
  headers?: Record<string, string>;
  organizationId?: string | null;
};

export type ListResponse<T> = {
  items: T[];
};

export type ItemResponse<T> = {
  item: T;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}) {
  const token = options.token ?? getAccessToken();
  const organizationId = options.organizationId === undefined ? getSelectedOrganizationId() : options.organizationId;
  const headers: Record<string, string> = {
    accept: 'application/json',
    ...(options.body !== undefined ? { 'content-type': 'application/json' } : {}),
    ...(token ? { authorization: `Bearer ${token}` } : {}),
    ...(organizationId ? { 'x-organization-id': organizationId } : {}),
    ...(options.headers ?? {}),
  };

  const requestInit: RequestInit = {
    method: options.method ?? 'GET',
    headers,
    ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
  };

  const response = await fetch(`${getApiBaseUrl()}${path}`, requestInit);

  const text = await response.text();
  const payload = text ? (JSON.parse(text) as ApiEnvelope<T>) : null;

  if (response.status === 401) {
    clearAccessToken();
  }

  if (!response.ok || !payload || payload.success === false) {
    const failure = payload && payload.success === false ? payload : null;
    throw new ApiClientError(
      failure?.error.message ?? `Request failed with status ${response.status}`,
      response.status,
      failure?.error.code,
      failure?.error.details,
      failure?.meta.requestId
    );
  }

  return payload;
}

export function buildQuery(params: Record<string, string | number | boolean | null | undefined>) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value !== undefined && value !== null && value !== '') {
      query.set(key, String(value));
    }
  }
  const serialized = query.toString();
  return serialized ? `?${serialized}` : '';
}

export function getErrorMessage(error: unknown) {
  if (error instanceof ApiClientError) {
    return error.message;
  }
  if (error instanceof Error) {
    return error.message;
  }
  return 'Something went wrong';
}

export async function getList<T>(path: string, params: Record<string, string | number | boolean | null | undefined> = {}) {
  return apiRequest<ListResponse<T>>(`${path}${buildQuery(params)}`);
}

export async function getOne<T>(path: string) {
  return apiRequest<ItemResponse<T>>(path);
}

export async function fetchDetail<T>(path: string) {
  const response = await getOne<T>(path);
  return response.data.item;
}

export function asArray<T = Record<string, unknown>>(value: unknown): T[] {
  return Array.isArray(value) ? (value as T[]) : [];
}

export async function post<T>(path: string, body?: unknown) {
  return apiRequest<T>(path, { method: 'POST', body });
}

export async function patch<T>(path: string, body: unknown) {
  return apiRequest<T>(path, { method: 'PATCH', body });
}

export async function remove<T>(path: string) {
  return apiRequest<T>(path, { method: 'DELETE' });
}
