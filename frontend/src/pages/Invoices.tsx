import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Stack, useTheme, Card, CardContent, CircularProgress, Alert, MenuItem, Select, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, IconButton, Chip
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DownloadIcon from '@mui/icons-material/Download';
import VisibilityIcon from '@mui/icons-material/Visibility';
import DeleteIcon from '@mui/icons-material/Delete';
import { DataGrid, type GridColDef } from '@mui/x-data-grid';
import { getClients } from '../api/clients';
import { getInvoicesByClient, generateInvoicePdf, downloadInvoicePdf, type Invoice } from '../api/invoices';

interface Client {
  id: number;
  name: string;
  balance: number;
  payment_status: 'Payé' | 'Non Payé';
  residence_id: number;
  Residence?: { id: number; name: string };
}

interface InvoiceWithClient extends Invoice {
  Client?: Client;
}

const Invoices: React.FC = () => {
  const theme = useTheme();
  const [clients, setClients] = useState<Client[]>([]);
  const [invoices, setInvoices] = useState<InvoiceWithClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedClient, setSelectedClient] = useState<number | null>(null);
  const [clientInvoices, setClientInvoices] = useState<Invoice[]>([]);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [invoiceMonth, setInvoiceMonth] = useState('');
  const [invoiceYear, setInvoiceYear] = useState('');
  const [invoiceAmount, setInvoiceAmount] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [pdfModalOpen, setPdfModalOpen] = useState(false);
  const [selectedPdfUrl, setSelectedPdfUrl] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const clientsData = await getClients();
      setClients(clientsData);
      
      // Get all invoices for all clients
      const allInvoices: InvoiceWithClient[] = [];
      for (const client of clientsData) {
        try {
          const clientInvoices = await getInvoicesByClient(client.id);
          const invoicesWithClient = clientInvoices.map(invoice => ({
            ...invoice,
            Client: client
          }));
          allInvoices.push(...invoicesWithClient);
        } catch (err) {
          console.error(`Error fetching invoices for client ${client.id}:`, err);
        }
      }
      setInvoices(allInvoices);
    } catch (err) {
      setError('Erreur lors du chargement des données.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleClientChange = async (clientId: number) => {
    setSelectedClient(clientId);
    if (clientId) {
      try {
        const clientInvoices = await getInvoicesByClient(clientId);
        setClientInvoices(clientInvoices);
      } catch (err) {
        setError('Erreur lors du chargement des factures du client.');
      }
    } else {
      setClientInvoices([]);
    }
  };

  const handleGeneratePdf = async (invoice: Invoice) => {
    setGeneratingPdf(true);
    try {
      await generateInvoicePdf({
        client_id: invoice.client_id,
        month: invoice.month,
        year: invoice.year,
        amount: invoice.amount
      });
      setSuccess('PDF généré avec succès !');
      setTimeout(() => setSuccess(null), 3000);
      fetchData(); // Refresh to get updated pdf_url
    } catch (err: any) {
      setError(err?.response?.data?.error || 'Erreur lors de la génération du PDF.');
    } finally {
      setGeneratingPdf(false);
    }
  };

  const handleDownloadPdf = async (invoice: Invoice) => {
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
      setError('Erreur lors du téléchargement du PDF.');
    }
  };

  const handleOpenInvoiceDialog = (invoice?: Invoice) => {
    if (invoice) {
      setSelectedInvoice(invoice);
      setInvoiceMonth(invoice.month.toString());
      setInvoiceYear(invoice.year.toString());
      setInvoiceAmount(invoice.amount.toString());
    } else {
      setSelectedInvoice(null);
      setInvoiceMonth('');
      setInvoiceYear('');
      setInvoiceAmount('');
    }
    setInvoiceDialogOpen(true);
  };

  const handleCloseInvoiceDialog = () => {
    setInvoiceDialogOpen(false);
    setSelectedInvoice(null);
    setInvoiceMonth('');
    setInvoiceYear('');
    setInvoiceAmount('');
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

  const columns: GridColDef[] = [
    { 
      field: 'clientName', 
      headerName: 'Client', 
      flex: 1, 
      minWidth: 150,
      valueGetter: (params) => params.row.Client?.name || 'N/A'
    },
    { 
      field: 'month', 
      headerName: 'Mois', 
      width: 80,
      valueGetter: (params) => String(params.row.month).padStart(2, '0')
    },
    { 
      field: 'year', 
      headerName: 'Année', 
      width: 100 
    },
    { 
      field: 'amount', 
      headerName: 'Montant (DH)', 
      width: 120,
      valueGetter: (params) => Number(params.row.amount).toLocaleString('fr-FR')
    },
    { 
      field: 'status', 
      headerName: 'Statut', 
      width: 120,
      renderCell: (params) => (
        <Chip 
          label={params.value} 
          color={params.value === 'Payé' ? 'success' : 'default'}
          size="small"
        />
      )
    },
    { 
      field: 'pdf_url', 
      headerName: 'PDF', 
      width: 120,
      renderCell: (params) => (
        params.row.status === 'Non Payé' ? (
          <Box display="flex" alignItems="center" gap={1}>
            <span className="text-muted">Non généré</span>
            <Button size="small" variant="outlined" disabled>
              Générer PDF
            </Button>
          </Box>
        ) : params.value ? (
          <Box>
            <IconButton 
              size="small" 
              onClick={() => handleViewPdf(params.value)}
              title="Voir PDF"
              color="primary"
              disabled={params.row.status === 'Non Payé'}
            >
              <VisibilityIcon />
            </IconButton>
            <IconButton 
              size="small" 
              onClick={() => handleDownloadPdf(params.row)}
              title="Télécharger PDF"
              color="secondary"
              disabled={params.row.status === 'Non Payé'}
            >
              <DownloadIcon />
            </IconButton>
          </Box>
        ) : (
          <Box display="flex" alignItems="center" gap={1}>
            <span className="text-muted">Non généré</span>
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => handleGeneratePdf(params.row)}
              disabled={generatingPdf || params.row.status === 'Non Payé'}
            >
              {generatingPdf ? <CircularProgress size={16} /> : 'Générer PDF'}
            </Button>
          </Box>
        )
      )
    },
    { 
      field: 'createdAt', 
      headerName: 'Créé le', 
      width: 120,
      valueGetter: (params) => new Date(params.row.createdAt).toLocaleDateString('fr-FR')
    }
  ];

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 700, mb: 3 }}>
        Gestion des Factures
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
          {success}
        </Alert>
      )}

      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h6" gutterBottom>
            Filtrer par Client
          </Typography>
          <FormControl fullWidth sx={{ maxWidth: 300 }}>
            <InputLabel>Client</InputLabel>
            <Select
              value={selectedClient || ''}
              label="Client"
              onChange={(e) => handleClientChange(e.target.value as number)}
            >
              <MenuItem value="">Tous les clients</MenuItem>
              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Box sx={{ height: 600, width: '100%' }}>
            <DataGrid
              rows={selectedClient ? clientInvoices : invoices}
              columns={columns}
              pageSizeOptions={[10, 25, 50]}
              initialState={{
                pagination: {
                  paginationModel: { page: 0, pageSize: 25 },
                },
                sorting: {
                  sortModel: [{ field: 'createdAt', sort: 'desc' }],
                },
              }}
              disableRowSelectionOnClick
            />
          </Box>
        </CardContent>
      </Card>

      {/* Invoice Dialog */}
      <Dialog open={invoiceDialogOpen} onClose={handleCloseInvoiceDialog} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedInvoice ? 'Modifier Facture' : 'Nouvelle Facture'}
        </DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField
              label="Mois (1-12)"
              type="number"
              value={invoiceMonth}
              onChange={(e) => setInvoiceMonth(e.target.value)}
              inputProps={{ min: 1, max: 12 }}
              fullWidth
            />
            <TextField
              label="Année"
              type="number"
              value={invoiceYear}
              onChange={(e) => setInvoiceYear(e.target.value)}
              fullWidth
            />
            <TextField
              label="Montant (DH)"
              type="number"
              value={invoiceAmount}
              onChange={(e) => setInvoiceAmount(e.target.value)}
              fullWidth
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseInvoiceDialog}>Annuler</Button>
          <Button variant="contained" onClick={handleCloseInvoiceDialog}>
            {selectedInvoice ? 'Modifier' : 'Créer'}
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

export default Invoices; 