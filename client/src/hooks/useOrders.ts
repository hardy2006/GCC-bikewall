import { useState, useCallback } from 'react';
import { authFetch } from '../lib/api';

export interface RepairOrder {
  id: number;
  customerId: number;
  customerName: string;
  customerPhone?: string;
  technicianId: number | null;
  technicianName: string | null;
  bikeBrand: string | null;
  bikeColor: string | null;
  problemDescription: string;
  urgentLevel: string;
  status: string;
  repairNotes: string | null;
  serviceType: string | null;
  imagePaths: string[];
  repairDay: string | null;
  rushTime: string | null;
  location: string | null;
  isRush: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressLog {
  id: number;
  orderId: number;
  operatorId: number;
  operatorName: string;
  action: string;
  oldStatus: string | null;
  newStatus: string;
  note: string | null;
  createdAt: string;
}

export function useOrders() {
  const [orders, setOrders] = useState<RepairOrder[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrders = useCallback(async (roleFilter?: string, filters?: { repairDay?: string; location?: string }) => {
    setLoading(true);
    setError(null);
    try {
      let endpoint = roleFilter === 'customer' ? '/orders/my'
        : roleFilter === 'technician' ? '/orders/technician' : '/orders';
      if (filters) {
        const params = new URLSearchParams();
        if (filters.repairDay && filters.repairDay !== 'all') params.set('repairDay', filters.repairDay);
        if (filters.location && filters.location !== 'all') params.set('location', filters.location);
        const qs = params.toString();
        if (qs) endpoint += '?' + qs;
      }
      const data = await authFetch<{ orders: RepairOrder[] }>(endpoint);
      setOrders(data.orders);
      return data.orders;
    } catch (err: any) { setError(err.message); throw err; }
    finally { setLoading(false); }
  }, []);

  const createOrder = useCallback(async (params: any) => {
    const data = await authFetch<{ order: RepairOrder }>('/orders', { method: 'POST', body: JSON.stringify(params) });
    return data.order;
  }, []);

  const uploadImage = useCallback(async (base64: string): Promise<string> => {
    const data = await authFetch<{ url: string }>('/orders/upload', { method: 'POST', body: JSON.stringify({ image: base64 }) });
    return data.url;
  }, []);

  const getOrderDetail = useCallback(async (orderId: number) => {
    const data = await authFetch<{ order: RepairOrder; logs: ProgressLog[] }>(`/orders/${orderId}`);
    return data;
  }, []);

  const acceptOrder = useCallback(async (orderId: number) => {
    const data = await authFetch<{ order: RepairOrder }>(`/orders/${orderId}/accept`, { method: 'PATCH' });
    return data.order;
  }, []);

  const updateStatus = useCallback(async (orderId: number, status: string, note?: string) => {
    const data = await authFetch<{ order: RepairOrder }>(`/orders/${orderId}/status`, {
      method: 'PATCH', body: JSON.stringify({ status, note }),
    });
    return data.order;
  }, []);

  return { orders, loading, error, fetchOrders, createOrder, uploadImage, getOrderDetail, acceptOrder, updateStatus };
}
