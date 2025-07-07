import api from './axios';

export interface Charge {
  id: number;
  date: string;
  description: string;
  amount: number;
  residence_id: number;
  Residence?: { id: number; name: string };
}

export type ChargeInput = Omit<Charge, 'id' | 'Residence'>;

export const getCharges = async (): Promise<Charge[]> => {
  const res = await api.get('/api/charges');
  return Array.isArray(res.data)
    ? res.data.map((c: any) => ({ ...c, amount: Number(c.amount) }))
    : [];
};

export const addCharge = async (data: ChargeInput): Promise<Charge> => {
  const res = await api.post('/api/charges', data);
  return res.data;
};

export const updateCharge = async (id: number, data: ChargeInput): Promise<Charge> => {
  const res = await api.put(`/api/charges/${id}`, data);
  return res.data;
};

export const deleteCharge = async (id: number): Promise<void> => {
  await api.delete(`/api/charges/${id}`);
}; 