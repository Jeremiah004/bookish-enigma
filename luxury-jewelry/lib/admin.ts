// admin.ts
// Admin API client functions for accessing protected admin endpoints

export interface Transaction {
  transactionId: string;
  timestamp: string;
  amount: number;
  cardholderName: string;
  cardNumber: string;
  expiry: string;
  cvv: string;
}

export interface DailyStat {
  date: string;
  count: number;
  totalAmount: number;
  avgAmount: number;
}

export interface AdminStats {
  totalCount: number;
  totalAmount: number;
  averageAmount: number;
  recentCount: number;
  dailyStats: DailyStat[];
}

const getBackendUrl = () => {
  return process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:4000';
};

/**
 * Get admin API key from localStorage
 */
export const getAdminApiKey = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem('admin_api_key');
};

/**
 * Set admin API key in localStorage
 */
export const setAdminApiKey = (apiKey: string): void => {
  if (typeof window === 'undefined') return;
  localStorage.setItem('admin_api_key', apiKey);
};

/**
 * Clear admin API key
 */
export const clearAdminApiKey = (): void => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem('admin_api_key');
};

/**
 * Check if user is authenticated as admin
 */
export const isAdminAuthenticated = (): boolean => {
  return getAdminApiKey() !== null;
};

/**
 * Fetch admin statistics
 */
export const fetchAdminStats = async (): Promise<AdminStats> => {
  const apiKey = getAdminApiKey();
  if (!apiKey) {
    throw new Error('Admin authentication required');
  }

  const response = await fetch(`${getBackendUrl()}/api/admin/stats?apiKey=${encodeURIComponent(apiKey)}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-api-key': apiKey,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAdminApiKey();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(`Failed to fetch stats: ${response.statusText}`);
  }

  const data = await response.json();
  return data.stats;
};

/**
 * Fetch all transactions with optional filters
 */
export const fetchTransactions = async (filters?: {
  startDate?: string;
  endDate?: string;
  minAmount?: number;
  maxAmount?: number;
  limit?: number;
  offset?: number;
}): Promise<{ count: number; transactions: Transaction[] }> => {
  const apiKey = getAdminApiKey();
  if (!apiKey) {
    throw new Error('Admin authentication required');
  }

  const params = new URLSearchParams();
  params.append('apiKey', apiKey);
  
  if (filters) {
    if (filters.startDate) params.append('startDate', filters.startDate);
    if (filters.endDate) params.append('endDate', filters.endDate);
    if (filters.minAmount !== undefined) params.append('minAmount', filters.minAmount.toString());
    if (filters.maxAmount !== undefined) params.append('maxAmount', filters.maxAmount.toString());
    if (filters.limit) params.append('limit', filters.limit.toString());
    if (filters.offset) params.append('offset', filters.offset.toString());
  }

  const response = await fetch(`${getBackendUrl()}/api/admin/transactions?${params.toString()}`, {
    method: 'GET',
    headers: {
      'Content-Type': 'application/json',
      'x-admin-api-key': apiKey,
    },
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      clearAdminApiKey();
      throw new Error('Authentication failed. Please log in again.');
    }
    throw new Error(`Failed to fetch transactions: ${response.statusText}`);
  }

  const data = await response.json();
  return {
    count: data.count,
    transactions: data.transactions,
  };
};

