import api from './axios';

export interface Client {
  id: number;
  name: string;
  balance: number;
  payment_status: 'Payé' | 'Non Payé';
  residence_id: number;
  Residence?: { id: number; name: string };
}

export type ClientInput = Omit<Client, 'id' | 'Residence'>;

export const getClients = async (): Promise<Client[]> => {
  const res = await api.get('/api/clients');
  return Array.isArray(res.data)
    ? res.data.map((c: any) => ({ ...c, balance: Number(c.balance) }))
    : [];
};

export const addClient = async (data: ClientInput): Promise<Client> => {
  const res = await api.post('/api/clients', data);
  return res.data;
};

export const updateClient = async (id: number, data: ClientInput): Promise<Client> => {
  const res = await api.put(`/api/clients/${id}`, data);
  return res.data;
};

export const deleteClient = async (id: number): Promise<void> => {
  await api.delete(`/api/clients/${id}`);
}; 