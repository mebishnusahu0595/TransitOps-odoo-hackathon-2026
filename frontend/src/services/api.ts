const BASE_URL = 'http://localhost:8000';

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('token');
  const headers = new Headers(options.headers || {});
  
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }
  
  if (options.body && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorDetail = 'Request failed';
    try {
      const errorJson = await response.json();
      errorDetail = errorJson.detail || errorDetail;
    } catch {
      // Ignored if response is not JSON
    }
    throw new Error(errorDetail);
  }

  return response.json();
}

export const api = {
  // Auth
  login: (credentials: any) => request<any>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  }),
  getMe: () => request<any>('/auth/me'),

  // Dashboard
  getStats: (params?: { type?: string; status?: string }) => {
    const search = new URLSearchParams(params as any).toString();
    return request<any>(`/dashboard/stats?${search}`);
  },

  // Vehicles
  listVehicles: (params?: { type?: string; status?: string; q?: string }) => {
    const search = new URLSearchParams(params as any).toString();
    return request<any[]>(`/vehicles?${search}`);
  },
  createVehicle: (data: any) => request<any>('/vehicles', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateVehicle: (id: number, data: any) => request<any>(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Drivers
  listDrivers: (params?: { status?: string; q?: string }) => {
    const search = new URLSearchParams(params as any).toString();
    return request<any[]>(`/drivers?${search}`);
  },
  createDriver: (data: any) => request<any>('/drivers', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  updateDriver: (id: number, data: any) => request<any>(`/drivers/${id}`, {
    method: 'PUT',
    body: JSON.stringify(data),
  }),

  // Trips
  listTrips: (params?: { status?: string; q?: string }) => {
    const search = new URLSearchParams(params as any).toString();
    return request<any[]>(`/trips?${search}`);
  },
  createTrip: (data: any) => request<any>('/trips', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  dispatchTrip: (id: number) => request<any>(`/trips/${id}/dispatch`, { method: 'POST' }),
  completeTrip: (id: number, data: any) => request<any>(`/trips/${id}/complete`, {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  cancelTrip: (id: number) => request<any>(`/trips/${id}/cancel`, { method: 'POST' }),

  // Maintenance
  listMaintenance: () => request<any[]>('/maintenance'),
  createMaintenance: (data: any) => request<any>('/maintenance', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  completeMaintenance: (id: number) => request<any>(`/maintenance/${id}/complete`, { method: 'POST' }),

  // Expenses & Fuel
  listFuelLogs: () => request<any[]>('/expenses/fuel'),
  createFuelLog: (data: any) => request<any>('/expenses/fuel', {
    method: 'POST',
    body: JSON.stringify(data),
  }),
  listExpenses: () => request<any[]>('/expenses'),
  createExpense: (data: any) => request<any>('/expenses', {
    method: 'POST',
    body: JSON.stringify(data),
  }),

  // Notifications & Audit Logs
  listNotifications: () => request<any[]>('/notifications'),
  markNotificationRead: (id: number) => request<any>(`/notifications/${id}/read`, { method: 'POST' }),
  listActivityLogs: () => request<any[]>('/activity-logs'),
};
