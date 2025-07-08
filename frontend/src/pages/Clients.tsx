import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Fab, Stack, useTheme, Card, CardContent, MenuItem, Select, InputLabel, FormControl, CircularProgress, Alert, FormControlLabel, Switch, IconButton
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DownloadIcon from '@mui/icons-material/Download';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import { getClients, addClient, updateClient, deleteClient } from '../api/clients';
import { getResidences } from '../api/residences';
import * as XLSX from 'xlsx';
import api from '../api/axios';
import { upsertInvoice, getInvoicesByClient, generateInvoicePdf, downloadInvoicePdf } from '../api/invoices';
import { exportClientsToExcel } from '../utils/excelExport';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';

interface Client {
  id: number;
  name: string;
  balance: number;
  payment_status: 'Payé' | 'Non Payé';
  residence_id: number;
  Residence?: { id: number; name: string };
}

type ClientInput = Omit<Client, 'id' | 'Residence'>;

const initialForm: ClientInput = {
  name: '',
  balance: 0,
  payment_status: 'Non Payé',
  residence_id: 1,
};

const Clients: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const { triggerDashboardRefresh } = useDashboard();
  const [clients, setClients] = useState<Client[]>([]);
  const [residences, setResidences] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientInput>(initialForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [bulkDialog, setBulkDialog] = useState(false);
  const [bulkClients, setBulkClients] = useState<ClientInput[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);
  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 7 });
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyError, setHistoryError] = useState<string | null>(null);
  const [invoiceDialogOpen] = useState(false);
  const [invoiceClient] = useState<Client | null>(null);
  const [invoiceMonth, setInvoiceMonth] = useState('');
  const [invoiceYear, setInvoiceYear] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [invoiceStatus, setInvoiceStatus] = useState<'Payé' | 'Non Payé'>('Payé');
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [invoiceError, setInvoiceError] = useState<string | null>(null);
  const [invoiceSuccess, setInvoiceSuccess] = useState<string | null>(null);
  const [clientInvoices, setClientInvoices] = useState<any[]>([]);
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);
  const [bulkOperationLoading, setBulkOperationLoading] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<string>('');
  const [currentYear, setCurrentYear] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Payé' | 'Non Payé'>('all');
  const [success, setSuccess] = useState<string | null>(null);
  // Add dialogError state
  const [dialogError, setDialogError] = useState<string | null>(null);
  const [generatingBulkPdf, setGeneratingBulkPdf] = useState(false);
  const [bulkSuccess, setBulkSuccess] = useState<string | null>(null);

  const fetchData = () => {
    setLoading(true);
    Promise.all([getClients(), getResidences()])
      .then(([clientsData, residencesData]) => {
        setClients(clientsData);
        setResidences(residencesData);
      })
      .catch(() => setError('Erreur lors du chargement des clients ou résidences.'))
      .finally(() => setLoading(false));
  };

  // Filter clients based on search term and status filter
  const filteredClients = clients.filter(client => {
    const matchesSearch = client.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (client.Residence?.name || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || client.payment_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  useEffect(() => {
    fetchData();
    // Initialize current month and year
    const now = new Date();
    setCurrentMonth(String(now.getMonth() + 1)); // getMonth() returns 0-11, so add 1
    setCurrentYear(String(now.getFullYear()));
  }, []);

  const handleOpenDialog = (client?: Client) => {
    setSuccess(null);
    setDialogError(null);
    if (client) {
      setEditId(client.id);
      setForm({
        name: client.name,
        balance: client.balance,
        payment_status: client.payment_status,
        residence_id: client.residence_id,
      });
    } else {
      setEditId(null);
      setForm(initialForm);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setSuccess(null);
    setDialogError(null);
    setOpenDialog(false);
    setForm(initialForm);
    setEditId(null);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!form.name.trim()) {
      setDialogError('Le nom du client est obligatoire.');
      return;
    }
    if (!form.residence_id) {
      setDialogError('La résidence est obligatoire.');
      return;
    }
    if (form.balance === undefined || form.balance === null || form.balance < 0) {
      setDialogError('Le montant de la balance est obligatoire et doit être positif.');
      return;
    }

    setSaving(true);
    setDialogError(null);
    setSuccess(null);
    try {
      if (editId) {
        console.log('Updating client with new balance:', form.balance);
        await updateClient(editId, form);
        setSuccess('Client modifié avec succès !');
      } else {
        await addClient(form);
        setSuccess('Client créé avec succès !');
      }
      fetchData();
      
      // Trigger dashboard refresh immediately since backend now includes client balances
      console.log('Triggering dashboard refresh after client update...');
      triggerDashboardRefresh();
      console.log('Dashboard refresh triggered');
      
      setTimeout(() => {
        handleCloseDialog();
      }, 1200);
    } catch {
      setDialogError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setSaving(true);
    try {
      if (deleteId) {
        await deleteClient(deleteId);
        fetchData();
        // Trigger dashboard refresh
        triggerDashboardRefresh();
        setDeleteId(null);
      }
    } catch {
      setError('Erreur lors de la suppression.');
    } finally {
      setSaving(false);
    }
  };

  // Bulk upload handlers
  const handleBulkFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (evt) => {
      const data = new Uint8Array(evt.target?.result as ArrayBuffer);
      const workbook = XLSX.read(data, { type: 'array' });
      const sheet = workbook.Sheets[workbook.SheetNames[0]];
      const json: any[] = XLSX.utils.sheet_to_json(sheet, { defval: '' });
      // Map Excel columns to ClientInput fields
      const mapped = json.map(row => ({
        name: row['Nom'] || row['name'] || '',
        balance: Number(row['Balance']) || 0,
        payment_status: row['Statut de Paiement'] || row['payment_status'] || 'Non Payé',
        residence_id: Number(row['Résidence ID'] || row['residence_id'] || 1),
      }));
      setBulkClients(mapped);
      setBulkError(null);
    };
    reader.onerror = () => setBulkError('Erreur lors de la lecture du fichier.');
    reader.readAsArrayBuffer(file);
  };

  const handleBulkConfirm = async () => {
    setBulkLoading(true);
    setBulkError(null);
    try {
      const res = await api.post('/api/clients/bulk', {
        clients: bulkClients,
      });
      if (res.status !== 200) throw new Error('Erreur lors de l\'import.');
      setBulkDialog(false);
      setBulkClients([]);
      fetchData();
      // Trigger dashboard refresh
      triggerDashboardRefresh();
    } catch (err) {
      setBulkError('Erreur lors de l\'import.');
    } finally {
      setBulkLoading(false);
    }
  };

  const handleOpenHistory = async (client: Client) => {
    setSelectedClient(client);
    setHistoryDialogOpen(true);
    setHistoryLoading(true);
    setHistoryError(null);
    try {
      const invoices = await getInvoicesByClient(client.id);
      setClientInvoices(invoices);
    } catch {
      setHistoryError("Erreur lors du chargement de l'historique des factures.");
    } finally {
      setHistoryLoading(false);
    }
  };

  const handleCloseHistory = () => {
    setHistoryDialogOpen(false);
    setSelectedClient(null);
    setClientInvoices([]);
    setHistoryError(null);
  };

  const handleInvoiceSubmit = async () => {
    setInvoiceLoading(true);
    setInvoiceError(null);
    setInvoiceSuccess(null);
    try {
      if (!invoiceClient || !invoiceMonth || !invoiceYear || !invoiceAmount) {
        setInvoiceError('Tous les champs sont obligatoires.');
        setInvoiceLoading(false);
        return;
      }
      await api.post('/api/invoices/upsert', {
        client_id: invoiceClient.id,
        month: Number(invoiceMonth),
        year: Number(invoiceYear),
        amount: Number(invoiceAmount),
        status: invoiceStatus
      });
      setInvoiceSuccess('Facture enregistrée avec succès !');
      // Trigger dashboard refresh
      triggerDashboardRefresh();
      setTimeout(() => {
        handleCloseDialog();
      }, 1200);
    } catch (err: any) {
      setInvoiceError(err?.response?.data?.error || 'Erreur lors de l\'enregistrement de la facture.');
    } finally {
      setInvoiceLoading(false);
    }
  };

  const handleStatusSwitch = async (client: Client, checked: boolean) => {
    try {
      await upsertInvoice({
        client_id: client.id,
        month: Number(currentMonth),
        year: Number(currentYear),
        amount: Number(client.balance),
        status: checked ? 'Payé' : 'Non Payé',
      });
      await updateClient(client.id, { residence_id: client.residence_id, name: client.name, balance: client.balance, payment_status: checked ? 'Payé' : 'Non Payé' });
      // Automatically generate PDF if switched to Payé
      if (checked) {
        try {
          await generateInvoicePdf({
            client_id: client.id,
            month: Number(currentMonth),
            year: Number(currentYear),
            amount: Number(client.balance)
          });
          console.log('PDF generated successfully');
        } catch (pdfError) {
          console.error('PDF generation failed:', pdfError);
          // Don't fail the entire operation if PDF generation fails
        }
      }
      fetchData();
      // Trigger dashboard refresh
      triggerDashboardRefresh();
    } catch (error) {
      console.error('Error in handleStatusSwitch:', error);
      // Optionally show error
    }
  };

  const handleGeneratePdf = async (invoice: any) => {
    setGeneratingPdf(true);
    try {
      await generateInvoicePdf({
        client_id: invoice.client_id,
        month: invoice.month,
        year: invoice.year,
        amount: invoice.amount
      });
      // Refresh the invoice list
      if (selectedClient) {
        const invoices = await getInvoicesByClient(selectedClient.id);
        setClientInvoices(invoices);
      }
    } catch (err: any) {
      setHistoryError(err?.response?.data?.error || 'Erreur lors de la génération du PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async (invoice: any) => {
    try {
      const monthStr = `${invoice.year}-${String(invoice.month).padStart(2, '0')}`;
      const blob = await downloadInvoicePdf(invoice.client_id, monthStr);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `facture_${invoice.client_id}_${monthStr}.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setHistoryError('Erreur lors du téléchargement du PDF.');
    }
  };

  const handleViewPdf = (pdfUrl: string) => {
    // Extract filename from the PDF URL and use the clean PDF endpoint
    const filename = pdfUrl.split('/').pop();
    const cleanPdfUrl = `http://localhost:5050/api/invoices/pdf-view/${filename}`;
    setSelectedPdfUrl(cleanPdfUrl);
    setPdfModalOpen(true);
  };

  const handleClosePdfModal = () => {
    setPdfModalOpen(false);
    setSelectedPdfUrl(null);
  };

  const handleBulkStatusChange = async (setToPaid: boolean) => {
    setBulkOperationLoading(true);
    try {
      console.log('Starting bulk operation for', filteredClients.length, 'filtered clients');
      console.log('Current month:', currentMonth, 'Current year:', currentYear);
      
      // Validate that we have valid data
      if (!currentMonth || !currentYear) {
        throw new Error('Mois ou année invalide');
      }
      
      // Process filtered clients
      const promises = filteredClients.map(async (client) => {
        // Validate client data
        if (!client.id || client.balance === undefined || client.balance === null) {
          throw new Error(`Données invalides pour le client: ${client.name}`);
        }
        
        const invoiceData = {
          client_id: Number(client.id),
          month: Number(currentMonth),
          year: Number(currentYear),
          amount: Number(client.balance),
          status: setToPaid ? 'Payé' : 'Non Payé',
        };
        
        console.log('Processing client:', client.name, 'ID:', client.id);
        console.log('Client balance:', client.balance, 'Type:', typeof client.balance);
        console.log('Invoice data being sent:', JSON.stringify(invoiceData, null, 2));
        
        // Validate each field individually
        if (!invoiceData.client_id || isNaN(invoiceData.client_id)) {
          throw new Error(`client_id invalide pour ${client.name}: ${invoiceData.client_id}`);
        }
        if (!invoiceData.month || isNaN(invoiceData.month)) {
          throw new Error(`month invalide pour ${client.name}: ${invoiceData.month}`);
        }
        if (!invoiceData.year || isNaN(invoiceData.year)) {
          throw new Error(`year invalide pour ${client.name}: ${invoiceData.year}`);
        }
        if (invoiceData.amount === undefined || invoiceData.amount === null || isNaN(invoiceData.amount)) {
          throw new Error(`amount invalide pour ${client.name}: ${invoiceData.amount}`);
        }
        if (!invoiceData.status) {
          throw new Error(`status invalide pour ${client.name}: ${invoiceData.status}`);
        }
        
        try {
          // First create/update the invoice using direct API call like handleInvoiceSubmit
          console.log('Sending API request for', client.name, 'with data:', invoiceData);
          const invoiceResult = await api.post('/api/invoices/upsert', invoiceData);
          console.log('Invoice result for', client.name, ':', invoiceResult.data);
          
          // Then update the client status
          const clientResult = await updateClient(client.id, { residence_id: client.residence_id, name: client.name, balance: client.balance, payment_status: setToPaid ? 'Payé' : 'Non Payé' });
          console.log('Client update result for', client.name, ':', clientResult);
          
          console.log('Successfully processed client:', client.name);
        } catch (error: any) {
          console.error('Error processing client:', client.name, error);
          console.error('Error response data:', error?.response?.data);
          console.error('Error response status:', error?.response?.status);
          const errorMessage = error?.response?.data?.error || error?.message || 'Erreur inconnue';
          throw new Error(`Erreur pour le client ${client.name}: ${errorMessage}`);
        }
      });

      await Promise.all(promises);
      console.log('All filtered clients processed successfully');

      // Generate PDFs for all filtered clients if setting to paid
      if (setToPaid) {
        console.log('Generating PDFs for all filtered clients...');
        const pdfPromises = filteredClients.map(client =>
          generateInvoicePdf({
            client_id: client.id,
            month: Number(currentMonth),
            year: Number(currentYear),
            amount: Number(client.balance)
          }).catch(err => {
            console.error(`PDF generation failed for client ${client.id}:`, err);
            // Don't fail the entire operation if PDF generation fails
          })
        );
        await Promise.all(pdfPromises);
        console.log('PDF generation completed');
      }

      fetchData();
      // Trigger dashboard refresh
      triggerDashboardRefresh();
    } catch (error: any) {
      console.error('Error in bulk status change:', error);
      setError(`Erreur lors de la mise à jour en masse: ${error.message || 'Erreur inconnue'}`);
    } finally {
      setBulkOperationLoading(false);
    }
  };

  const handleDownloadMergedPdf = async () => {
    const paidClients = filteredClients.filter(client => client.payment_status === 'Payé');
    if (paidClients.length === 0) {
      setError('Aucun client avec le statut "Payé" trouvé.');
      return;
    }
    setGeneratingBulkPdf(true);
    setBulkSuccess(null);
    setError(null);
    try {
      const response = await fetch('http://localhost:5050/api/invoices/merged-pdf', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clientIds: paidClients.map(c => c.id),
          month: currentMonth,
          year: currentYear,
        }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erreur lors de la génération du PDF fusionné');
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'factures_payees.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
      setBulkSuccess(`PDF fusionné téléchargé avec succès pour ${paidClients.length} client(s) payé(s) !`);
      
      // Clear success message after 5 seconds
      setTimeout(() => {
        setBulkSuccess(null);
      }, 5000);
      
    } catch (error: any) {
      console.error('Error in bulk PDF download:', error);
      setError(error.message || 'Erreur lors du téléchargement du PDF fusionné');
    } finally {
      setGeneratingBulkPdf(false);
    }
  };

  const handleExportExcel = () => {
    exportClientsToExcel(filteredClients);
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nom', flex: 1, minWidth: 160 },
    {
      field: 'residenceName',
      headerName: 'Résidence Associée',
      flex: 1,
      minWidth: 160,
      renderCell: (params) => params.row.Residence?.name || '',
    },
    {
      field: 'balance',
      headerName: 'Balance (DH)',
      flex: 1,
      minWidth: 120,
      renderCell: (params) => params.value != null ? Number(params.value).toLocaleString('fr-FR') : '',
    },
    { field: 'payment_status', headerName: 'Statut de Paiement', flex: 1, minWidth: 140, renderCell: (params) => (
      <Typography color={params.value === 'Payé' ? 'primary' : 'error'} fontWeight={600}>{params.value}</Typography>
    ) },
    {
      field: 'currentMonthInvoice',
      headerName: 'Payé ce mois',
      flex: 1,
      minWidth: 130,
      renderCell: (params) => (
        <FormControlLabel
          control={
            <Switch
              checked={params.row.payment_status === 'Payé'}
              onChange={(_, checked) => handleStatusSwitch(params.row, checked)}
              color="success"
            />
          }
          label="Payé ce mois"
        />
      ),
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 100,
      getActions: (params) => {
        const actions = [];
        
        if (hasPermission('canEditClients')) {
          actions.push(
            <GridActionsCellItem icon={<EditIcon />} label="Modifier" onClick={() => handleOpenDialog(params.row)} />
          );
        }
        
        if (hasPermission('canDeleteClients')) {
          actions.push(
            <GridActionsCellItem icon={<DeleteIcon />} label="Supprimer" onClick={() => setDeleteId(params.row.id)} showInMenu />
          );
        }
        
        if (hasPermission('canViewFinancialData')) {
          actions.push(
            <GridActionsCellItem icon={<EditIcon />} label="Historique" onClick={() => handleOpenHistory(params.row)} showInMenu />
          );
        }
        
        return actions;
      },
    },
  ];

  console.log('Clients data for DataGrid:', clients);

  return (
    <Box sx={{ 
      width: '100%', 
      maxWidth: '100%'
    }}>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Clients</Typography>
        <Stack direction="row" spacing={1}>
          {hasPermission('canEditClients') && (
            <Button 
              variant="outlined" 
              color="success"
              size="small"
              onClick={() => handleBulkStatusChange(true)}
              disabled={bulkOperationLoading || filteredClients.length === 0}
              startIcon={bulkOperationLoading ? <CircularProgress size={14} /> : null}
            >
              {bulkOperationLoading ? 'Traitement...' : `Marquer ${filteredClients.length} Payé`}
            </Button>
          )}
          {hasPermission('canEditClients') && (
            <Button 
              variant="outlined" 
              color="error"
              size="small"
              onClick={() => handleBulkStatusChange(false)}
              disabled={bulkOperationLoading || filteredClients.length === 0}
              startIcon={bulkOperationLoading ? <CircularProgress size={14} /> : null}
            >
              {bulkOperationLoading ? 'Traitement...' : `Marquer ${filteredClients.length} Non Payé`}
            </Button>
          )}
          {hasPermission('canExportClients') && (
            <Button 
              variant="outlined" 
              color="primary"
              size="small"
              onClick={handleDownloadMergedPdf}
              disabled={generatingBulkPdf || filteredClients.filter(c => c.payment_status === 'Payé').length === 0}
              startIcon={generatingBulkPdf ? <CircularProgress size={14} /> : <DownloadIcon />}
            >
              {generatingBulkPdf ? 'Téléchargement...' : `Télécharger PDF (${filteredClients.filter(c => c.payment_status === 'Payé').length})`}
            </Button>
          )}
          {hasPermission('canCreateClients') && (
            <Fab color="primary" aria-label="add" onClick={() => handleOpenDialog()} size="small" sx={{ boxShadow: 2 }}>
              <AddIcon />
            </Fab>
          )}
          {hasPermission('canCreateClients') && (
            <Button variant="outlined" size="small" onClick={() => setBulkDialog(true)}>
              Importer
            </Button>
          )}
          {hasPermission('canExportClients') && (
            <Button variant="outlined" size="small" onClick={handleExportExcel} startIcon={<FileDownloadIcon />}>
              Excel
            </Button>
          )}
        </Stack>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {bulkSuccess && <Alert severity="success" sx={{ mb: 2 }}>{bulkSuccess}</Alert>}
      
      {/* Search and Filter Section */}
      <Card elevation={2} sx={{ borderRadius: 3, mb: 2, p: 1.5 }}>
        <Stack direction="row" spacing={1.5} alignItems="center" flexWrap="wrap" gap={1.5}>
          {/* Search Input */}
          <TextField
            label="Rechercher un client ou résidence"
            variant="outlined"
            size="small"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            sx={{ minWidth: 250, flexGrow: 1 }}
            InputProps={{
              startAdornment: (
                <Box component="span" sx={{ color: 'text.secondary', mr: 1 }}>
                  🔍
                </Box>
              ),
              endAdornment: searchTerm && (
                <IconButton
                  size="small"
                  onClick={() => setSearchTerm('')}
                  sx={{ mr: -0.5 }}
                >
                  ✕
                </IconButton>
              ),
            }}
          />
          
          {/* Status Filter */}
          <FormControl size="small" sx={{ minWidth: 150 }}>
            <InputLabel>Statut de paiement</InputLabel>
            <Select
              value={statusFilter}
              label="Statut de paiement"
              onChange={(e) => setStatusFilter(e.target.value as 'all' | 'Payé' | 'Non Payé')}
            >
              <MenuItem value="all">Tous les clients</MenuItem>
              <MenuItem value="Payé">Clients payés</MenuItem>
              <MenuItem value="Non Payé">Clients non payés</MenuItem>
            </Select>
          </FormControl>
          
          {/* Clear Filters Button */}
          {(searchTerm || statusFilter !== 'all') && (
            <Button
              variant="outlined"
              size="small"
              onClick={() => {
                setSearchTerm('');
                setStatusFilter('all');
              }}
              sx={{ minWidth: 120 }}
            >
              Effacer les filtres
            </Button>
          )}
          
          {/* Results Count */}
          <Typography variant="body2" color="text.secondary" sx={{ ml: 'auto' }}>
            {filteredClients.length} client{filteredClients.length !== 1 ? 's' : ''} trouvé{filteredClients.length !== 1 ? 's' : ''}
          </Typography>
        </Stack>
      </Card>
      
      <Card elevation={3} sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="320px">
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: 420, width: '100%' }}>
              <DataGrid
                rows={filteredClients}
                columns={columns}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[7, 14, 21]}
                disableRowSelectionOnClick
                sx={{
                  border: 0,
                  fontSize: 16,
                  background: theme.palette.background.paper,
                  '& .MuiDataGrid-columnHeaders': { background: theme.palette.mode === 'dark' ? '#23272f' : '#f4f6fa', fontWeight: 700 },
                  '& .MuiDataGrid-row:hover': { background: theme.palette.action.hover },
                  '& .MuiDataGrid-cell': { borderBottom: '1px solid #eee' },
                  borderRadius: 3,
                }}
                autoHeight={false}
              />
            </Box>
          )}
        </CardContent>
      </Card>
      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>{editId ? 'Modifier Client' : 'Ajouter Client'}</DialogTitle>
        <DialogContent>
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField label="Nom" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus required />
            <FormControl fullWidth required>
              <InputLabel id="residence-label">Résidence</InputLabel>
              <Select
                labelId="residence-label"
                value={form.residence_id}
                label="Résidence"
                onChange={e => setForm(f => ({ ...f, residence_id: Number(e.target.value) }))}
                required
              >
                {residences.map((res) => (
                  <MenuItem key={res.id} value={res.id}>{res.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField label="Balance (DH)" type="number" fullWidth value={form.balance} onChange={e => setForm(f => ({ ...f, balance: Number(e.target.value) }))} required />
            <FormControl fullWidth>
              <InputLabel id="statut-label">Statut de Paiement</InputLabel>
              <Select
                labelId="statut-label"
                value={form.payment_status}
                label="Statut de Paiement"
                onChange={e => setForm(f => ({ ...f, payment_status: e.target.value as 'Payé' | 'Non Payé' }))}
              >
                <MenuItem value="Payé">Payé</MenuItem>
                <MenuItem value="Non Payé">Non Payé</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={handleCloseDialog} disabled={saving}>Annuler</Button>
          <Button onClick={handleSave} variant="contained" disabled={saving}>{editId ? 'Enregistrer' : 'Ajouter'}</Button>
        </DialogActions>
      </Dialog>
      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)} PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>Voulez-vous vraiment supprimer ce client ?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} disabled={saving}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>Supprimer</Button>
        </DialogActions>
      </Dialog>
      {/* Bulk Import Dialog */}
      <Dialog open={bulkDialog} onClose={() => setBulkDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Importer des Clients (Excel/CSV)</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <Button variant="contained" component="label">
              Sélectionner un fichier Excel/CSV
              <input type="file" accept=".xlsx,.xls,.csv" hidden onChange={handleBulkFile} />
            </Button>
            {bulkError && <Alert severity="error">{bulkError}</Alert>}
            {bulkClients.length > 0 && (
              <Box mt={2}>
                <Typography variant="subtitle1" mb={1}>Aperçu :</Typography>
                <Box sx={{ maxHeight: 300, overflow: 'auto' }}>
                  <table className="table table-bordered table-sm">
                    <thead>
                      <tr>
                        <th>Nom</th>
                        <th>Balance</th>
                        <th>Statut de Paiement</th>
                        <th>Résidence ID</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bulkClients.map((c, i) => (
                        <tr key={i}>
                          <td>{c.name}</td>
                          <td>{c.balance}</td>
                          <td>{c.payment_status}</td>
                          <td>{c.residence_id}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </Box>
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setBulkDialog(false)} disabled={bulkLoading}>Annuler</Button>
          <Button onClick={handleBulkConfirm} variant="contained" disabled={bulkLoading || bulkClients.length === 0}>
            Confirmer l'import
          </Button>
        </DialogActions>
      </Dialog>
      {/* Payment History Dialog */}
      <Dialog open={historyDialogOpen} onClose={handleCloseHistory} maxWidth="md" fullWidth>
        <DialogTitle>Historique des Factures - {selectedClient?.name}</DialogTitle>
        <DialogContent>
          {historyLoading ? (
            <div className="d-flex justify-content-center align-items-center" style={{ minHeight: 120 }}>
              <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Chargement...</span>
              </div>
            </div>
          ) : historyError ? (
            <div className="alert alert-danger">{historyError}</div>
          ) : (
            <table className="table table-sm table-bordered align-middle mt-2">
              <thead>
                <tr>
                  <th>Mois</th>
                  <th>Année</th>
                  <th>Montant</th>
                  <th>Statut</th>
                  <th>Date de création</th>
                  <th>Facture PDF</th>
                </tr>
              </thead>
              <tbody>
                {clientInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>{String(inv.month).padStart(2, '0')}</td>
                    <td>{inv.year}</td>
                    <td>{Number(inv.amount).toLocaleString('fr-FR')} DH</td>
                    <td>
                      <span className={`badge bg-${inv.status === 'Payé' ? 'success' : 'secondary'}`}>{inv.status}</span>
                    </td>
                    <td>{new Date(inv.createdAt).toLocaleDateString('fr-FR')}</td>
                    <td>
                      {inv.status === 'Non Payé' ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <span className="text-muted">Non généré</span>
                          <Button size="small" variant="outlined" disabled>
                            Générer PDF
                          </Button>
                        </Box>
                      ) : inv.pdf_url ? (
                        <Box display="flex" alignItems="center" gap={1}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleViewPdf(inv.pdf_url)}
                            title="Voir PDF"
                            color="primary"
                            disabled={inv.status === 'Non Payé'}
                          >
                            <VisibilityIcon fontSize="small" />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => handleDownloadPdf(inv)}
                            title="Télécharger PDF"
                            color="secondary"
                            disabled={inv.status === 'Non Payé'}
                          >
                            <DownloadIcon fontSize="small" />
                          </IconButton>
                        </Box>
                      ) : (
                        <Box display="flex" alignItems="center" gap={1}>
                          <span className="text-muted">Non généré</span>
                          <Button 
                            size="small" 
                            variant="outlined"
                            onClick={() => handleGeneratePdf(inv)}
                            disabled={generatingPdf || inv.status === 'Non Payé'}
                          >
                            {generatingPdf ? <CircularProgress size={16} /> : 'Générer PDF'}
                          </Button>
                        </Box>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseHistory}>Fermer</Button>
        </DialogActions>
      </Dialog>
      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onClose={handleCloseDialog} maxWidth="xs" fullWidth>
        <DialogTitle>Ajouter/Modifier Facture - {invoiceClient?.name}</DialogTitle>
        <DialogContent>
          <Box display="flex" flexDirection="column" gap={2} mt={1}>
            <TextField
              label="Mois (1-12)"
              type="number"
              value={invoiceMonth}
              onChange={e => setInvoiceMonth(e.target.value)}
              inputProps={{ min: 1, max: 12 }}
              fullWidth
            />
            <TextField
              label="Année (ex: 2025)"
              type="number"
              value={invoiceYear}
              onChange={e => setInvoiceYear(e.target.value)}
              fullWidth
            />
            <TextField
              label="Montant (DH)"
              type="number"
              value={invoiceAmount}
              onChange={e => setInvoiceAmount(e.target.value)}
              fullWidth
            />
            <TextField
              select
              label="Statut"
              value={invoiceStatus}
              onChange={e => setInvoiceStatus(e.target.value as 'Payé' | 'Non Payé')}
              fullWidth
            >
              <MenuItem value="Payé">Payé</MenuItem>
              <MenuItem value="Non Payé">Non Payé</MenuItem>
            </TextField>
            {invoiceError && <div className="alert alert-danger">{invoiceError}</div>}
            {invoiceSuccess && <div className="alert alert-success">{invoiceSuccess}</div>}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} disabled={invoiceLoading}>Annuler</Button>
          <Button onClick={handleInvoiceSubmit} variant="contained" color="primary" disabled={invoiceLoading}>
            {invoiceLoading ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </DialogActions>
      </Dialog>
      {/* PDF Viewer Modal */}
      <Dialog 
        open={pdfModalOpen} 
        onClose={handleClosePdfModal} 
        maxWidth={false}
        fullWidth 
        PaperProps={{ 
          sx: { 
            height: '95vh',
            maxHeight: '95vh',
            width: '95vw',
            maxWidth: '95vw',
            m: 0
          } 
        }}
      >
        <DialogTitle sx={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center',
          p: 2,
          borderBottom: '1px solid #e0e0e0'
        }}>
          Aperçu de la Facture
          <IconButton onClick={handleClosePdfModal} size="small">
            <DeleteIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent sx={{ p: 0, height: 'calc(95vh - 80px)', overflow: 'hidden' }}>
          {selectedPdfUrl && (
            <iframe
              src={selectedPdfUrl}
              style={{
                width: '100%',
                height: '100%',
                border: 'none',
                display: 'block'
              }}
              title="PDF Viewer"
              allowFullScreen
            />
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
};

export default Clients; 