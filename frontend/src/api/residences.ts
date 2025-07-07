import api from './axios';

export interface Residence {
  id: number;
  name: string;
  address: string;
  num_apartments: number;
  contact: string;
}

export type ResidenceInput = Omit<Residence, 'id'>;

export const getResidences = async (): Promise<Residence[]> => {
  const res = await api.get('/api/residences');
  return Array.isArray(res.data) ? res.data : [];
};

export const addResidence = async (data: ResidenceInput): Promise<Residence> => {
  const res = await api.post('/api/residences', data);
  return res.data;
};

export const updateResidence = async (id: number, data: ResidenceInput): Promise<Residence> => {
  const res = await api.put(`/api/residences/${id}`, data);
  return res.data;
};

export const deleteResidence = async (id: number): Promise<void> => {
  await api.delete(`/api/residences/${id}`);
}; 