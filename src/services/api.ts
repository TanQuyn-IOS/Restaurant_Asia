/// <reference types="vite/client" />
/**
 * RESTAURANT ASIA - API CLIENT
 * Three-Tier Architecture REST API Client with Automatic JWT Refresh
 */

const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || 'http://localhost:5000/api/v1';

export interface ApiResponse<T = any> {
  success: boolean;
  statusCode: number;
  message: string;
  data: T;
  meta?: {
    page?: number;
    limit?: number;
    total?: number;
    totalPages?: number;
  };
}

class ApiClient {
  private isRefreshing = false;
  private failedQueue: Array<{
    resolve: (token: string) => void;
    reject: (error: any) => void;
  }> = [];

  private getAccessToken(): string | null {
    return localStorage.getItem('restaurant_access_token');
  }

  private getRefreshToken(): string | null {
    return localStorage.getItem('restaurant_refresh_token');
  }

  public setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('restaurant_access_token', accessToken);
    localStorage.setItem('restaurant_refresh_token', refreshToken);
  }

  public clearTokens() {
    localStorage.removeItem('restaurant_access_token');
    localStorage.removeItem('restaurant_refresh_token');
    localStorage.removeItem('restaurant_current_user');
  }

  private processQueue(error: any, token: string | null = null) {
    this.failedQueue.forEach((prom) => {
      if (error) {
        prom.reject(error);
      } else {
        prom.resolve(token!);
      }
    });
    this.failedQueue = [];
  }

  public async request<T = any>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${API_BASE_URL}${endpoint}`;
    const token = this.getAccessToken();

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string>),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    try {
      const response = await fetch(url, { ...options, headers });
      const data: ApiResponse<T> = await response.json();

      // Nếu gặp 401 do hết hạn token, tiến hành refresh token tự động
      if (response.status === 401 && !endpoint.includes('/auth/login') && !endpoint.includes('/auth/refresh-token')) {
        if (this.isRefreshing) {
          return new Promise<string>((resolve, reject) => {
            this.failedQueue.push({ resolve, reject });
          }).then((newToken) => {
            headers['Authorization'] = `Bearer ${newToken}`;
            return fetch(url, { ...options, headers }).then((res) => res.json());
          });
        }

        this.isRefreshing = true;
        const refreshToken = this.getRefreshToken();

        if (!refreshToken) {
          this.clearTokens();
          window.dispatchEvent(new CustomEvent('auth:expired'));
          throw new Error('Phiên đăng nhập đã hết hạn');
        }

        try {
          const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ refreshToken }),
          });

          const refreshData = await refreshRes.json();
          if (!refreshRes.ok || !refreshData.success) {
            throw new Error('Làm mới token thất bại');
          }

          const newAccessToken = refreshData.data.accessToken;
          const newRefreshToken = refreshData.data.refreshToken;
          this.setTokens(newAccessToken, newRefreshToken);

          this.processQueue(null, newAccessToken);
          headers['Authorization'] = `Bearer ${newAccessToken}`;

          const retryRes = await fetch(url, { ...options, headers });
          return retryRes.json();
        } catch (refreshErr) {
          this.processQueue(refreshErr, null);
          this.clearTokens();
          window.dispatchEvent(new CustomEvent('auth:expired'));
          throw refreshErr;
        } finally {
          this.isRefreshing = false;
        }
      }

      if (!response.ok) {
        throw new Error(data.message || 'Lỗi xử lý yêu cầu máy chủ');
      }

      return data;
    } catch (err: any) {
      throw err;
    }
  }

  // === AUTH ===
  auth = {
    login: (body: { username: string; password: string }) =>
      this.request('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
    logout: () => {
      const refreshToken = this.getRefreshToken();
      this.clearTokens();
      return this.request('/auth/logout', {
        method: 'POST',
        body: JSON.stringify({ refreshToken }),
      });
    },
    getProfile: () => this.request('/auth/profile'),
  };

  // === TABLES ===
  tables = {
    getAll: (areaId?: string) =>
      this.request(`/tables${areaId ? `?areaId=${areaId}` : ''}`),
    getAreas: () => this.request('/tables/areas'),
    getById: (id: string) => this.request(`/tables/${id}`),
    update: (id: string, data: any) =>
      this.request(`/tables/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    updatePositions: (positions: any[]) =>
      this.request('/tables/positions', { method: 'POST', body: JSON.stringify({ positions }) }),
    transfer: (data: {
      sourceTableId: string;
      targetTableId: string;
      orderId: string;
      sourceVersion: number;
      targetVersion: number;
    }) => this.request('/tables/transfer', { method: 'POST', body: JSON.stringify(data) }),
  };

  // === MENU ===
  menu = {
    getCategories: () => this.request('/menu/categories'),
    getItems: (params?: { categoryId?: string; search?: string; isAvailable?: boolean }) => {
      const q = new URLSearchParams();
      if (params?.categoryId) q.set('categoryId', params.categoryId);
      if (params?.search) q.set('search', params.search);
      if (params?.isAvailable !== undefined) q.set('isAvailable', String(params.isAvailable));
      return this.request(`/menu/items?${q.toString()}`);
    },
    getById: (id: string) => this.request(`/menu/items/${id}`),
    createItem: (data: any) =>
      this.request('/menu/items', { method: 'POST', body: JSON.stringify(data) }),
    updateItem: (id: string, data: any) =>
      this.request(`/menu/items/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    deleteItem: (id: string) =>
      this.request(`/menu/items/${id}`, { method: 'DELETE' }),
    toggleAvailability: (id: string) =>
      this.request(`/menu/items/${id}/toggle-availability`, { method: 'PATCH' }),
  };

  // === INVENTORY ===
  inventory = {
    getAll: (params?: { category?: string; isLowStock?: boolean; search?: string }) => {
      const q = new URLSearchParams();
      if (params?.category) q.set('category', params.category);
      if (params?.isLowStock) q.set('isLowStock', 'true');
      if (params?.search) q.set('search', params.search);
      return this.request(`/inventory?${q.toString()}`);
    },
    getById: (id: string) => this.request(`/inventory/${id}`),
    adjustStock: (data: { ingredientId: string; actualStock: number; notes: string }) =>
      this.request('/inventory/adjustment', { method: 'POST', body: JSON.stringify(data) }),
    recordWaste: (data: { ingredientId: string; quantity: number; notes: string }) =>
      this.request('/inventory/waste', { method: 'POST', body: JSON.stringify(data) }),
  };

  // === ORDERS ===
  orders = {
    getAll: (params?: { status?: string; tableId?: string; page?: number; limit?: number }) => {
      const q = new URLSearchParams();
      if (params?.status) q.set('status', params.status);
      if (params?.tableId) q.set('tableId', params.tableId);
      if (params?.page) q.set('page', String(params.page));
      if (params?.limit) q.set('limit', String(params.limit));
      return this.request(`/orders?${q.toString()}`);
    },
    getActiveByTable: (tableId: string) =>
      this.request(`/orders/table/${tableId}`),
    getById: (id: string) => this.request(`/orders/${id}`),
    create: (data: any) =>
      this.request('/orders', { method: 'POST', body: JSON.stringify(data) }),
    addItems: (orderId: string, items: any[]) =>
      this.request(`/orders/${orderId}/items`, { method: 'POST', body: JSON.stringify({ items }) }),
    cancelItem: (orderId: string, itemId: string, reason?: string) =>
      this.request(`/orders/${orderId}/items/${itemId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
    applyDiscount: (orderId: string, data: { discountPercent?: number; discountAmount?: number }) =>
      this.request(`/orders/${orderId}/discount`, { method: 'POST', body: JSON.stringify(data) }),
    split: (orderId: string, data: { splits: any[]; targetTableId?: string }) =>
      this.request(`/orders/${orderId}/split`, { method: 'POST', body: JSON.stringify(data) }),
  };

  // === KITCHEN ===
  kitchen = {
    getQueue: () => this.request('/kitchen/queue'),
    startCooking: (itemId: string) =>
      this.request(`/kitchen/items/${itemId}/cook`, { method: 'POST' }),
    markReady: (itemId: string) =>
      this.request(`/kitchen/items/${itemId}/ready`, { method: 'POST' }),
    cancelCookedItem: (itemId: string, reason: string) =>
      this.request(`/kitchen/items/${itemId}/cancel-cooked`, {
        method: 'POST',
        body: JSON.stringify({ reason }),
      }),
  };

  // === WAITER ===
  waiter = {
    markServed: (itemId: string) =>
      this.request(`/waiter/items/${itemId}/served`, { method: 'POST' }),
    getServiceRequests: (status?: string, tableId?: string) => {
      const q = new URLSearchParams();
      if (status) q.set('status', status);
      if (tableId) q.set('tableId', tableId);
      return this.request(`/waiter/service-requests?${q.toString()}`);
    },
    createServiceRequest: (data: any) =>
      this.request('/waiter/service-requests', { method: 'POST', body: JSON.stringify(data) }),
    updateServiceRequest: (id: string, data: any) =>
      this.request(`/waiter/service-requests/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  };

  // === PAYMENTS ===
  payments = {
    create: (data: {
      orderId: string;
      amount: number;
      paymentMethod: string;
      receivedAmount?: number;
      referenceCode?: string;
    }) => this.request('/payments', { method: 'POST', body: JSON.stringify(data) }),
    refund: (data: {
      paymentId: string;
      amount: number;
      reason: string;
      refundMethod: string;
    }) => this.request('/payments/refund', { method: 'POST', body: JSON.stringify(data) }),
    generateVietQR: (orderId: string) =>
      this.request('/payments/vietqr', { method: 'POST', body: JSON.stringify({ orderId }) }),
  };

  // === SUPPLIERS ===
  suppliers = {
    getAll: () => this.request('/suppliers'),
    getReceipts: () => this.request('/suppliers/receipts/all'),
    createReceipt: (data: any) =>
      this.request('/suppliers/receipts', { method: 'POST', body: JSON.stringify(data) }),
    createPayment: (data: any) =>
      this.request('/suppliers/payments', { method: 'POST', body: JSON.stringify(data) }),
  };

  // === CASH FLOW ===
  cashflow = {
    getRecords: (params?: { type?: string; category?: string; startDate?: string; endDate?: string }) => {
      const q = new URLSearchParams();
      if (params?.type) q.set('type', params.type);
      if (params?.category) q.set('category', params.category);
      if (params?.startDate) q.set('startDate', params.startDate);
      if (params?.endDate) q.set('endDate', params.endDate);
      return this.request(`/cashflow?${q.toString()}`);
    },
    getSummary: (startDate?: string, endDate?: string) => {
      const q = new URLSearchParams();
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);
      return this.request(`/cashflow/summary?${q.toString()}`);
    },
    createRecord: (data: any) =>
      this.request('/cashflow', { method: 'POST', body: JSON.stringify(data) }),
  };

  // === HR ===
  hr = {
    getEmployees: (status?: string) =>
      this.request(`/hr/employees${status ? `?status=${status}` : ''}`),
    createEmployee: (data: any) =>
      this.request('/hr/employees', { method: 'POST', body: JSON.stringify(data) }),
    updateEmployee: (id: string, data: any) =>
      this.request(`/hr/employees/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
    getSchedules: (params?: { startDate?: string; endDate?: string; employeeId?: string }) => {
      const q = new URLSearchParams();
      if (params?.startDate) q.set('startDate', params.startDate);
      if (params?.endDate) q.set('endDate', params.endDate);
      if (params?.employeeId) q.set('employeeId', params.employeeId);
      return this.request(`/hr/schedules?${q.toString()}`);
    },
    createSchedule: (data: any) =>
      this.request('/hr/schedules', { method: 'POST', body: JSON.stringify(data) }),
    checkAttendance: (scheduleId: string, type: 'CHECK_IN' | 'CHECK_OUT') =>
      this.request(`/hr/schedules/${scheduleId}/attendance`, {
        method: 'POST',
        body: JSON.stringify({ type }),
      }),
    getLeaves: (employeeId?: string) =>
      this.request(`/hr/leaves${employeeId ? `?employeeId=${employeeId}` : ''}`),
    requestLeave: (data: any) =>
      this.request('/hr/leaves', { method: 'POST', body: JSON.stringify(data) }),
    approveLeave: (id: string, status: string) =>
      this.request(`/hr/leaves/${id}/approve`, { method: 'PUT', body: JSON.stringify({ status }) }),
  };

  // === CUSTOMERS ===
  customers = {
    getAll: (params?: { search?: string; customerType?: string }) => {
      const q = new URLSearchParams();
      if (params?.search) q.set('search', params.search);
      if (params?.customerType) q.set('customerType', params.customerType);
      return this.request(`/customers?${q.toString()}`);
    },
    getById: (id: string) => this.request(`/customers/${id}`),
    create: (data: any) =>
      this.request('/customers', { method: 'POST', body: JSON.stringify(data) }),
  };

  // === RESERVATIONS ===
  reservations = {
    getAll: (params?: { date?: string; tableId?: string; status?: string }) => {
      const q = new URLSearchParams();
      if (params?.date) q.set('date', params.date);
      if (params?.tableId) q.set('tableId', params.tableId);
      if (params?.status) q.set('status', params.status);
      return this.request(`/reservations?${q.toString()}`);
    },
    create: (data: any) =>
      this.request('/reservations', { method: 'POST', body: JSON.stringify(data) }),
    updateStatus: (id: string, status: string) =>
      this.request(`/reservations/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      }),
  };

  // === REPORTS ===
  reports = {
    getDashboard: () => this.request('/reports/dashboard'),
    getPnL: (startDate?: string, endDate?: string) => {
      const q = new URLSearchParams();
      if (startDate) q.set('startDate', startDate);
      if (endDate) q.set('endDate', endDate);
      return this.request(`/reports/pnl?${q.toString()}`);
    },
    getStockValuation: () => this.request('/reports/stock-valuation'),
    getTopSelling: (limit?: number) =>
      this.request(`/reports/top-selling${limit ? `?limit=${limit}` : ''}`),
  };
}

export const api = new ApiClient();
