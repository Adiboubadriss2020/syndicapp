import api from './axios';

export interface Invoice {
  id: number;
  client_id: number;
  month: number;
  year: number;
  amount: number;
  status: 'Payé' | 'Non Payé';
  pdf_url?: string;
  createdAt: string;
  updatedAt: string;
}

export async function upsertInvoice(data: {
  client_id: number;
  month: number;
  year: number;
  amount: number;
  status: 'Payé' | 'Non Payé';
}) {
  const res = await api.post('/api/invoices/upsert', data);
  return res.data.invoice as Invoice;
}

export async function getInvoicesByClient(client_id: number): Promise<Invoice[]> {
  const res = await api.get('/api/invoices/by-client', { params: { client_id } });
  return res.data as Invoice[];
}

export async function generateInvoicePdf(data: {
  client_id: number;
  month: number;
  year: number;
  amount?: number;
}) {
  const res = await api.post('/api/invoices/generate-pdf', data);
  return res.data;
}

export async function downloadInvoicePdf(client_id: number, month: string) {
  const res = await api.get('/api/invoices/pdf', { 
    params: { client_id, month },
    responseType: 'blob'
  });
  return res.data;
} 