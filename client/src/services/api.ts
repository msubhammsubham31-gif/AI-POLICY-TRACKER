import {
  DashboardMetrics,
  Regulation,
  RegulatoryChange,
  Facility,
  Product,
  Supplier,
  ProcessItem,
  ComplianceAction,
  AlertItem,
  DocumentItem,
  AuditLogItem,
  Jurisdiction,
  User,
} from '../types';

const CLOUD_API_BASE = 'https://ai-policy-tracker-ifp4.onrender.com/api';

function getApiBase(): string {
  const envUrl = import.meta.env.VITE_API_URL;
  if (typeof window !== 'undefined') {
    const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';
    if (!isLocalhost) {
      if (envUrl && !envUrl.includes('localhost') && !envUrl.includes('127.0.0.1')) {
        return envUrl;
      }
      return CLOUD_API_BASE;
    }
  }
  return envUrl || 'http://localhost:5000/api';
}

export function getAuthToken(): string | null {
  const token = localStorage.getItem('regulamap_token');
  if (!token || token === 'null' || token === 'undefined' || token.trim() === '') return null;
  return token;
}

export function setAuthToken(token: string) {
  localStorage.setItem('regulamap_token', token);
}

export function removeAuthToken() {
  localStorage.removeItem('regulamap_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  } else {
    headers['x-demo-user'] = 'true';
  }

  const base = getApiBase();
  const url = `${base}${endpoint}`;

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status === 401) {
        removeAuthToken();
      }
      let errMsg = `Request failed: ${response.status} ${response.statusText}`;
      try {
        const errJson = await response.json();
        errMsg = errJson.error || errMsg;
      } catch (_) {}
      throw new Error(errMsg);
    }

    return await response.json();
  } catch (err: any) {
    // If not on localhost and primary request failed, attempt direct fallback to cloud backend
    if (base !== CLOUD_API_BASE && typeof window !== 'undefined' && !window.location.hostname.includes('localhost')) {
      try {
        const fbResponse = await fetch(`${CLOUD_API_BASE}${endpoint}`, {
          ...options,
          headers,
        });
        if (fbResponse.ok) {
          return await fbResponse.json();
        }
      } catch (_) {}
    }
    throw err;
  }
}

export const api = {
  auth: {
    login: (data: { email: string; password: string }) =>
      request<{ user: User; token: string }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    register: (data: { email: string; password: string; fullName: string; organizationName?: string; industry?: string }) =>
      request<{ user: User; token: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(data),
      }),
    me: () => request<{ user: User }>('/auth/me'),
  },

  dashboard: {
    getMetrics: () => request<DashboardMetrics>('/dashboard'),
  },

  regulations: {
    getAll: (params?: { category?: string; jurisdictionId?: string; status?: string; search?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return request<{ total: number; regulations: Regulation[] }>(`/regulations${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => request<Regulation>(`/regulations/${id}`),
    getVersions: (id: string) => request<{ regulationId: string; currentVersion: number; versions: any[] }>(`/regulations/${id}/versions`),
    create: (data: Partial<Regulation>) => request<Regulation>('/regulations', { method: 'POST', body: JSON.stringify(data) }),
    ingest: (id: string, sampleNewText?: string) =>
      request<any>(`/regulations/${id}/ingest`, {
        method: 'POST',
        body: JSON.stringify({ sampleNewText }),
      }),
  },

  changes: {
    getAll: (params?: { severity?: string; reviewStatus?: string; search?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return request<{ total: number; changes: RegulatoryChange[] }>(`/regulatory-changes${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => request<RegulatoryChange>(`/regulatory-changes/${id}`),
    review: (id: string, data: { reviewStatus: string; reviewNotes?: string; adjustedRiskLevel?: string }) =>
      request<RegulatoryChange>(`/regulatory-changes/${id}/review`, {
        method: 'PATCH',
        body: JSON.stringify(data),
      }),
  },

  facilities: {
    getAll: () => request<{ total: number; facilities: Facility[] }>('/facilities'),
    getById: (id: string) => request<Facility>(`/facilities/${id}`),
    create: (data: Partial<Facility>) => request<Facility>('/facilities', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Facility>) => request<Facility>(`/facilities/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  products: {
    getAll: () => request<{ total: number; products: Product[] }>('/products'),
    getById: (id: string) => request<Product>(`/products/${id}`),
    create: (data: Partial<Product>) => request<Product>('/products', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Product>) => request<Product>(`/products/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  suppliers: {
    getAll: () => request<{ total: number; suppliers: Supplier[] }>('/suppliers'),
    getById: (id: string) => request<Supplier>(`/suppliers/${id}`),
    create: (data: Partial<Supplier>) => request<Supplier>('/suppliers', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<Supplier>) => request<Supplier>(`/suppliers/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  processes: {
    getAll: () => request<{ total: number; processes: ProcessItem[] }>('/processes'),
    create: (data: Partial<ProcessItem>) => request<ProcessItem>('/processes', { method: 'POST', body: JSON.stringify(data) }),
  },

  impacts: {
    getAll: () => request<{ total: number; impactMatrix: any[] }>('/impacts'),
    assess: (data: any) => request<any>('/impacts/assess', { method: 'POST', body: JSON.stringify(data) }),
  },

  actions: {
    getAll: (params?: { status?: string; priority?: string }) => {
      const qs = new URLSearchParams(params as any).toString();
      return request<{ total: number; actions: ComplianceAction[] }>(`/actions${qs ? `?${qs}` : ''}`);
    },
    getById: (id: string) => request<ComplianceAction>(`/actions/${id}`),
    create: (data: Partial<ComplianceAction>) => request<ComplianceAction>('/actions', { method: 'POST', body: JSON.stringify(data) }),
    update: (id: string, data: Partial<ComplianceAction>) => request<ComplianceAction>(`/actions/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),
  },

  timeline: {
    getTimeline: () => request<{ total: number; timeline: any[] }>('/timeline'),
  },

  alerts: {
    getAll: () => request<{ total: number; alerts: AlertItem[] }>('/alerts'),
    markRead: (id: string) => request<AlertItem>(`/alerts/${id}/read`, { method: 'PATCH' }),
  },

  documents: {
    getAll: () => request<{ total: number; documents: DocumentItem[] }>('/documents'),
    upload: (data: any) => request<DocumentItem>('/documents/upload', { method: 'POST', body: JSON.stringify(data) }),
  },

  assistant: {
    query: (query: string, conversationHistory?: any[]) =>
      request<{ query: string; answer: string; disclaimer: string; groundedSourcesUsed: string[] }>('/assistant/query', {
        method: 'POST',
        body: JSON.stringify({ query, conversationHistory }),
      }),
  },

  audit: {
    getLogs: () => request<{ total: number; auditLogs: AuditLogItem[] }>('/audit-log'),
  },

  jurisdictions: {
    getAll: () => request<{ jurisdictions: Jurisdiction[] }>('/jurisdictions'),
  },
};
