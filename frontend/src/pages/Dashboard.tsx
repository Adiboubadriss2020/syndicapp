import React, { useEffect, useState } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell
} from 'recharts';
import { useLocation } from 'react-router-dom';
import { fetchDashboardStats } from '../api/dashboard';
import { getCharges } from '../api/charges';
import { getPaymentsByMonth } from '../api/payments';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';
import type { Payment } from '../api/payments';

interface DashboardStats {
  totalResidences: number;
  totalClients: number;
  totalCharges: number;
  totalBalance: number;
  monthlyRevenues: number;
  monthlyCharges: number;
  netRevenue: number;
  chartData: { month: string; revenues: number; charges: number; net: number }[];
}

interface Charge {
  id: number;
  date: string;
  description: string;
  amount: number;
  residence_id: number;
  Residence?: { id: number; name: string };
}

const COLORS = ['#0d6efd', '#198754', '#ffc107', '#dc3545', '#6f42c1', '#fd7e14'];

const Dashboard: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [charges, setCharges] = useState<Charge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentsByMonth, setPaymentsByMonth] = useState<{ [month: string]: Payment[] }>({});
  const { hasPermission } = useAuth();
  const { refreshTrigger } = useDashboard();
  const location = useLocation();

  // Add CSS for spinning animation
  const spinStyle = {
    animation: 'spin 1s linear infinite'
  };

  const fetchData = async () => {
    console.log('Dashboard fetchData called at:', new Date().toISOString());
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const [statsData, chargesData] = await Promise.all([
        fetchDashboardStats(),
        getCharges()
      ]);
      console.log('Dashboard stats:', statsData);
      console.log('Charges data:', chargesData);
      console.log('Stats totalCharges:', statsData.totalCharges, 'Type:', typeof statsData.totalCharges);
      console.log('Stats totalBalance:', statsData.totalBalance, 'Type:', typeof statsData.totalBalance);
      console.log('Stats monthlyRevenues:', statsData.monthlyRevenues, 'Type:', typeof statsData.monthlyRevenues);
      console.log('Stats monthlyCharges:', statsData.monthlyCharges, 'Type:', typeof statsData.monthlyCharges);
      console.log('Stats netRevenue:', statsData.netRevenue, 'Type:', typeof statsData.netRevenue);
      setStats(statsData);
      setCharges(chargesData);

      // Get all months from charges
      const months = Array.from(new Set(chargesData.map((c) => {
        const date = new Date(c.date);
        return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      })));
      
      // Fetch payments for each month
      const paymentsResults = await Promise.all(
        months.map((month) => getPaymentsByMonth(month))
      );
      const paymentsMap: { [month: string]: Payment[] } = {};
      months.forEach((month, idx) => {
        paymentsMap[month] = paymentsResults[idx];
      });
      setPaymentsByMonth(paymentsMap);
      
      // Show success message if this was a manual refresh
      if (!loading) {
        setSuccess('Données actualisées avec succès !');
        setTimeout(() => setSuccess(null), 3000);
      }
      console.log('Dashboard data fetch completed successfully');
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError('Erreur lors du chargement des données du tableau de bord.');
    } finally {
      setLoading(false);
    }
  };

  // Initial data fetch
  useEffect(() => {
    fetchData();
  }, []);

  // Refresh data when navigating to dashboard
  useEffect(() => {
    if (location.pathname === '/') {
      console.log('Dashboard route accessed - refreshing data...');
      fetchData();
    }
  }, [location.pathname]);

  // Refresh data when refreshTrigger changes (from other components)
  useEffect(() => {
    if (refreshTrigger > 0) {
      console.log('Dashboard refresh triggered by external update, trigger value:', refreshTrigger);
      setSuccess('Actualisation automatique des données...');
      fetchData();
    }
  }, [refreshTrigger]);

  // Clear success message after a delay
  useEffect(() => {
    if (success && success.includes('Actualisation automatique')) {
      const timer = setTimeout(() => {
        setSuccess(null);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [success]);

  // Updated processChargesData to use backend chart data when available
  const processChargesData = () => {
    // Use backend chart data if available, otherwise fallback to frontend processing
    if (stats?.chartData && stats.chartData.length > 0) {
      const monthlyData = stats.chartData.map(item => ({
        month: item.month,
        charges: item.charges,
        revenue: item.revenues,
        net: item.net || (item.revenues - item.charges) // Fallback calculation if net is missing
      })).sort((a, b) => a.month.localeCompare(b.month));
      
      // Process residence data from charges
      const residenceCharges: { [key: string]: number } = {};
      charges.forEach(charge => {
        const residenceName = charge.Residence?.name || 'Inconnu';
        residenceCharges[residenceName] = (residenceCharges[residenceName] || 0) + charge.amount;
      });
      const residenceData = Object.entries(residenceCharges)
        .map(([name, total]) => ({ name, total }))
        .sort((a, b) => b.total - a.total)
        .slice(0, 6); // Top 6 residences
      
      return { monthlyData, residenceData };
    }

    // Fallback to frontend processing if no backend data
    if (!charges.length) return { monthlyData: [], residenceData: [] };
    
    // Monthly charges data
    const monthlyCharges: { [key: string]: number } = {};
    charges.forEach(charge => {
      const date = new Date(charge.date);
      const monthKey = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
      monthlyCharges[monthKey] = (monthlyCharges[monthKey] || 0) + charge.amount;
    });
    console.log('Monthly Charges Data:', monthlyCharges);
    const allMonths = Object.keys(monthlyCharges);
    
    // Build monthly data with real revenue
    const monthlyData = allMonths.map(month => {
      const payments = paymentsByMonth[month] || [];
      const revenue = payments.filter(p => p.status === 'Payé').reduce((sum, p) => sum + Number(p.amount), 0);
      const charges = monthlyCharges[month];
      return {
        month,
        charges,
        revenue,
        net: revenue - charges
      };
    }).sort((a, b) => a.month.localeCompare(b.month));
    
    // Residence charges data
    const residenceCharges: { [key: string]: number } = {};
    charges.forEach(charge => {
      const residenceName = charge.Residence?.name || 'Inconnu';
      residenceCharges[residenceName] = (residenceCharges[residenceName] || 0) + charge.amount;
    });
    const residenceData = Object.entries(residenceCharges)
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total)
      .slice(0, 6); // Top 6 residences
    return { monthlyData, residenceData };
  };

  const { monthlyData, residenceData } = processChargesData();

  // Calculate total sum for residenceData for percentage in tooltip
  const totalResidenceCharges = residenceData.reduce((sum, r) => sum + r.total, 0);

  // Custom tooltip for PieChart (Répartition par Résidence)
  const renderResidencePieTooltip = (props: any) => {
    const { active, payload } = props;
    if (active && payload && payload.length) {
      const { name, total } = payload[0].payload;
      const color = payload[0].color;
      const percent = totalResidenceCharges ? total / totalResidenceCharges : 0;
      return (
        <div className="bg-white p-2 rounded shadow-sm border" style={{ minWidth: 140 }}>
          <div className="d-flex align-items-center mb-1">
            <span style={{
              display: 'inline-block',
              width: 16,
              height: 16,
              borderRadius: '50%',
              background: color,
              marginRight: 8,
              border: '1px solid #eee'
            }} />
            <span className="fw-bold">{name}</span>
          </div>
          <div>
            <span className="text-muted">Montant: </span>
            <span className="fw-bold">{total.toLocaleString('fr-FR')} DH</span>
          </div>
          <div>
            <span className="text-muted">Pourcentage: </span>
            <span className="fw-bold">{(percent * 100).toFixed(1)}%</span>
          </div>
        </div>
      );
    }
    return null;
  };

  // Calculate total charges
  const totalCharges = charges.reduce((sum, c) => sum + (typeof c.amount === 'number' ? c.amount : Number(c.amount)), 0);

  // Use backend data if available, otherwise use frontend calculated values
  const displayTotalCharges = stats?.totalCharges || totalCharges;

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '400px' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Chargement...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alert alert-danger" role="alert">
        {error}
      </div>
    );
  }

  return (
    <div className="container-fluid py-4 px-0" style={{ paddingLeft: 0 }}>
      {/* Dashboard Title */}
      <div className="row mb-5">
        <div className="col-12">
          <div className="d-flex justify-content-between align-items-center">
            <h1 className="display-4 fw-bold mb-0" style={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}>Tableau de Bord</h1>
            <button 
              onClick={fetchData}
              disabled={loading}
              className="btn btn-outline-primary d-flex align-items-center gap-2"
              title="Actualiser les données"
            >
              <i 
                className="bi bi-arrow-clockwise" 
                style={loading ? spinStyle : {}}
              ></i>
              {loading ? 'Actualisation...' : 'Actualiser'}
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards Row */}
      <div className="row g-3 mb-4">
        <div className="col-12 col-sm-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100 stat-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', borderLeft: '4px solid #4f46e5', borderRadius: '0.75rem', minHeight: '120px' }}>
            <div className="card-body text-center text-white p-2">
              <div className="d-inline-flex align-items-center justify-content-center mb-2"
                style={{
                  width: '45px', height: '45px',
                  background: 'linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)',
                  boxShadow: '0 4px 16px 0 rgba(102,126,234,0.15)',
                  borderRadius: '50%'
                }}>
                <i className="bi bi-building-fill fs-4"></i>
              </div>
              <h6 className="card-subtitle mb-1 text-white small fw-semibold">Résidences</h6>
              <h5 className="card-title mb-0 fw-bold">{stats?.totalResidences || 0}</h5>
            </div>
          </div>
        </div>
        <div className="col-12 col-sm-6 col-lg-2">
          <div className="card border-0 shadow-sm h-100 stat-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', borderLeft: '4px solid #f5576c', borderRadius: '0.75rem', minHeight: '120px' }}>
            <div className="card-body text-center text-white p-2">
              <div className="d-inline-flex align-items-center justify-content-center mb-2"
                style={{
                  width: '45px', height: '45px',
                  background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
                  boxShadow: '0 4px 16px 0 rgba(240,147,251,0.15)',
                  borderRadius: '50%'
                }}>
                <i className="bi bi-people-fill fs-4"></i>
              </div>
              <h6 className="card-subtitle mb-1 text-whitet small fw-semibold">Clients</h6>
              <h5 className="card-title mb-0 fw-bold">{stats?.totalClients || 0}</h5>
            </div>
          </div>
        </div>
        {hasPermission('canViewDashboardCharges') && (
          <div className="col-12 col-sm-6 col-lg-2">
            <div className="card border-0 shadow-sm h-100 stat-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', borderLeft: '4px solid #00c6fb', borderRadius: '0.75rem', minHeight: '120px' }}>
              <div className="card-body text-center text-white p-2">
                <div className="d-inline-flex align-items-center justify-content-center mb-2"
                  style={{
                    width: '45px', height: '45px',
                    background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
                    boxShadow: '0 4px 16px 0 rgba(79,172,254,0.15)',
                    borderRadius: '50%'
                  }}>
                  <i className="bi bi-receipt-cutoff fs-4"></i>
                </div>
                <h6 className="card-subtitle mb-1 text-white small fw-semibold">Charges</h6>
                <h5 className="card-title mb-0 fw-bold">{displayTotalCharges ? displayTotalCharges.toLocaleString('fr-FR') + ' DH' : '—'}</h5>
              </div>
            </div>
          </div>
        )}
        {hasPermission('canViewDashboardRevenues') && (
          <div className="col-12 col-sm-6 col-lg-2">
            <div className="card border-0 shadow-sm h-100 stat-card" style={{ background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)', borderLeft: '4px solid #28a745', borderRadius: '0.75rem', minHeight: '120px' }}>
              <div className="card-body text-center text-white p-2">
                <div className="d-inline-flex align-items-center justify-content-center mb-2"
                  style={{
                    width: '45px', height: '45px',
                    background: 'linear-gradient(135deg, #28a745 0%, #20c997 100%)',
                    boxShadow: '0 4px 16px 0 rgba(40,167,69,0.15)',
                    borderRadius: '50%'
                  }}>
                  <i className="bi bi-cash-stack fs-4"></i>
                </div>
                <h6 className="card-subtitle mb-1 text-white small fw-semibold">Revenus</h6>
                <h5 className="card-title mb-0 fw-bold">{stats?.monthlyRevenues ? stats.monthlyRevenues.toLocaleString('fr-FR') + ' DH' : '—'}</h5>
              </div>
            </div>
          </div>
        )}
        {hasPermission('canViewDashboardBalance') && (
          <div className="col-12 col-sm-6 col-lg-2">
            <div className="card border-0 shadow-sm h-100 stat-card" style={{ background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)', borderLeft: '4px solid #ee5a24', borderRadius: '0.75rem', minHeight: '120px' }}>
              <div className="card-body text-center text-white p-2">
                <div className="d-inline-flex align-items-center justify-content-center mb-2"
                  style={{
                    width: '45px', height: '45px',
                    background: 'linear-gradient(135deg, #ff6b6b 0%, #ee5a24 100%)',
                    boxShadow: '0 4px 16px 0 rgba(255,107,107,0.15)',
                    borderRadius: '50%'
                  }}>
                  <i className="bi bi-calculator-fill fs-4"></i>
                </div>
                <h6 className="card-subtitle mb-1 text-white small fw-semibold">Balance</h6>
                <h5 className="card-title mb-0 fw-bold">
                  {(() => {
                    const revenues = stats?.monthlyRevenues;
                    const charges = stats?.totalCharges;
                    console.log('Balance calculation:', { revenues, charges, result: revenues !== undefined && charges !== undefined ? revenues - charges : 'undefined' });
                    return revenues !== undefined && charges !== undefined ? 
                      (revenues - charges).toLocaleString('fr-FR') + ' DH' : '—';
                  })()}
                </h5>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Charts Row */}
      <div className="row g-4 mb-5">
        {/* Monthly Charges Chart - Takes full width on mobile, half on desktop */}
        <div className="col-12 col-xl-8">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="card-title mb-0 fw-bold d-flex align-items-center">
                <i className="bi bi-graph-up text-primary me-2 fs-5"></i>
                Évolution des Charges Mensuelles
              </h5>
            </div>
            <div className="card-body" style={{ height: '450px' }}>
              {monthlyData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                    <XAxis 
                      dataKey="month" 
                      tickFormatter={(value) => {
                        const [year, month] = value.split('-');
                        return `${month}/${year.slice(2)}`;
                      }}
                      stroke="#6c757d"
                      fontSize={12}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k DH`}
                      stroke="#6c757d"
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value: number, name: string) => [`${value.toLocaleString('fr-FR')} DH`, name === 'charges' ? 'Charges' : 'Revenus']}
                      labelFormatter={(label) => {
                        const [year, month] = label.split('-');
                        const monthNames = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
                        return `${monthNames[parseInt(month) - 1]} ${year}`;
                      }}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
                      }}
                    />
                    <Legend />
                    <Line 
                      type="monotone" 
                      dataKey="charges" 
                      stroke="#0d6efd" 
                      strokeWidth={4}
                      name="Charges"
                      dot={{ fill: '#0d6efd', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#0d6efd', strokeWidth: 2, fill: '#fff' }}
                    />
                    <Line 
                      type="monotone" 
                      dataKey="revenue" 
                      stroke="#198754" 
                      strokeWidth={4}
                      name="Revenus"
                      dot={{ fill: '#198754', strokeWidth: 2, r: 6 }}
                      activeDot={{ r: 8, stroke: '#198754', strokeWidth: 2, fill: '#fff' }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="text-center text-muted">
                    <i className="bi bi-graph-up fs-1 mb-3"></i>
                    <p>Aucune donnée disponible pour afficher le graphique</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Residence Charges Pie Chart */}
        <div className="col-12 col-xl-4">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="card-title mb-0 fw-bold d-flex align-items-center">
                <i className="bi bi-pie-chart text-success me-2 fs-5"></i>
                Répartition par Résidence
              </h5>
            </div>
            <div className="card-body d-flex align-items-center justify-content-center" style={{ height: '450px' }}>
              {residenceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={residenceData}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      outerRadius={130}
                      innerRadius={60}
                      fill="#8884d8"
                      dataKey="total"
                    >
                      {residenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip content={renderResidencePieTooltip} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="text-center text-muted">
                  <i className="bi bi-pie-chart fs-1 mb-3"></i>
                  <p>Aucune donnée disponible</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar Chart - Full Width */}
      <div className="row">
        <div className="col-12">
          <div className="card border-0 shadow-sm">
            <div className="card-header bg-white border-0 py-3">
              <h5 className="card-title mb-0 fw-bold d-flex align-items-center">
                <i className="bi bi-bar-chart text-warning me-2 fs-5"></i>
                Top Résidences par Volume de Charges
              </h5>
            </div>
            <div className="card-body" style={{ height: '400px' }}>
              {residenceData.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={residenceData} margin={{ top: 20, right: 30, left: 20, bottom: 20 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f3f4" />
                    <XAxis 
                      dataKey="name" 
                      stroke="#6c757d"
                      fontSize={12}
                      angle={-45}
                      textAnchor="end"
                      height={80}
                    />
                    <YAxis 
                      tickFormatter={(value) => `${(value / 1000).toFixed(0)}k DH`}
                      stroke="#6c757d"
                      fontSize={12}
                    />
                    <Tooltip 
                      formatter={(value: number) => [`${value.toLocaleString('fr-FR')} DH`, 'Total des Charges']}
                      contentStyle={{
                        backgroundColor: '#fff',
                        border: '1px solid #dee2e6',
                        borderRadius: '8px',
                        boxShadow: '0 0.125rem 0.25rem rgba(0, 0, 0, 0.075)'
                      }}
                    />
                    <Legend />
                    <Bar 
                      dataKey="total" 
                      name="Total des Charges"
                      radius={[6, 6, 0, 0]}
                    >
                      {residenceData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="d-flex align-items-center justify-content-center h-100">
                  <div className="text-center text-muted">
                    <i className="bi bi-bar-chart fs-1 mb-3"></i>
                    <p>Aucune donnée disponible pour afficher le graphique</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;