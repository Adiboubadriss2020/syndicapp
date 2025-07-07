import api from './axios';

export interface DashboardStats {
  totalResidences: number;
  totalClients: number;
  totalCharges: number;
  totalBalance: number;
  monthlyRevenues: number;
  monthlyCharges: number;
  netRevenue: number;
  chartData: { month: string; revenues: number; charges: number; net: number }[];
}

export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  const res = await api.get('/api/dashboard/stats');
  return res.data;
}; 