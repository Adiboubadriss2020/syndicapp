import api from './axios';

export interface Payment {
  id: number;
  client_id: number;
  amount: number;
  month: string; // 'YYYY-MM'
  status: 'Payé' | 'Non Payé';
  createdAt: string;
  updatedAt: string;
}

export const getPaymentsByMonth = async (month: string): Promise<Payment[]> => {
  const res = await api.get(`/api/payments/month?month=${month}`);
  return res.data;
};

export const getPaymentsByClient = async (client_id: number): Promise<Payment[]> => {
  const res = await api.get(`/api/payments/client?client_id=${client_id}`);
  return res.data;
};

export const upsertPayment = async (data: {
  client_id: number;
  amount: number;
  month: string;
  status: 'Payé' | 'Non Payé';
}): Promise<Payment> => {
  const res = await api.post('/api/payments', data);
  return res.data;
}; 