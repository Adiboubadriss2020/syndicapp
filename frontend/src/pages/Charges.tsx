import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Fab, Stack, useTheme, Card, CardContent, CircularProgress, Alert, MenuItem, Select, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import UploadIcon from '@mui/icons-material/Upload';
import FileDownloadIcon from '@mui/icons-material/FileDownload';
import { DataGrid, GridActionsCellItem } from '@mui/x-data-grid';
import type { GridColDef } from '@mui/x-data-grid';
import * as XLSX from 'xlsx';
import { getCharges, addCharge, updateCharge, deleteCharge } from '../api/charges';
import { getResidences } from '../api/residences';
import { exportChargesToExcel } from '../utils/excelExport';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';

interface Charge {
  id: number;
  date: string;
  description: string;
  amount: number;
  residence_id: number;
  Residence?: { id: number; name: string };
}

interface ChargeInput {
  date: string;
  description: string;
  amount: number;
  residence_id: number;
}

const initialForm: ChargeInput = { date: '', description: '', amount: 0, residence_id: 1 };

const Charges: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const { triggerDashboardRefresh } = useDashboard();
  const [charges, setCharges] = useState<Charge[]>([]);
  const [residences, setResidences] = useState<{ id: number; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ChargeInput>(initialForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Bulk import states
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkCharges, setBulkCharges] = useState<any[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 7 });

  const fetchData = () => {
    setLoading(true);
    Promise.all([getCharges(), getResidences()])
      .then(([chargesData, residencesData]) => {
        setCharges(chargesData);
        setResidences(residencesData);
      })
      .catch(() => setError('Erreur lors du chargement des charges ou résidences.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (charge?: Charge) => {
    if (charge) {
      setEditId(charge.id);
      setForm({
        date: charge.date,
        description: charge.description,
        amount: charge.amount,
        residence_id: charge.residence_id,
      });
    } else {
      setEditId(null);
      setForm(initialForm);
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setForm(initialForm);
    setEditId(null);
  };

  const handleSave = async () => {
    // Validate required fields
    if (!form.date) {
      setError('La date est obligatoire.');
      return;
    }
    if (!form.description.trim()) {
      setError('La description est obligatoire.');
      return;
    }
    if (form.amount === undefined || form.amount === null || form.amount <= 0) {
      setError('Le montant est obligatoire et doit être positif.');
      return;
    }
    if (!form.residence_id) {
      setError('La résidence est obligatoire.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      if (editId) {
        await updateCharge(editId, form);
      } else {
        await addCharge(form);
      }
      fetchData();
      // Trigger dashboard refresh
      triggerDashboardRefresh();
      handleCloseDialog();
    } catch {
      setError('Erreur lors de la sauvegarde.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setSaving(true);
    try {
      await deleteCharge(deleteId);
      fetchData();
      // Trigger dashboard refresh
      triggerDashboardRefresh();
      setDeleteId(null);
    } catch {
      setError('Erreur lors de la suppression.');
    } finally {
      setSaving(false);
    }
  };

  const handleBulkFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    console.log('Selected file:', file.name, file.size, file.type);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        console.log('File read successfully, processing...');
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        console.log('Data length:', data.length);
        
        const workbook = XLSX.read(data, { type: 'array' });
        console.log('Workbook sheets:', workbook.SheetNames);
        
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        console.log('Worksheet range:', worksheet['!ref']);
        
        const jsonData = XLSX.utils.sheet_to_json(worksheet);
        console.log('Raw charges data:', jsonData);

        if (jsonData.length === 0) {
          throw new Error('Aucune donnée trouvée dans le fichier Excel');
        }

        // Helper to convert Excel serial date to YYYY-MM-DD
        function excelDateToISO(serial: number) {
          const utc_days = Math.floor(serial - 25569);
          const utc_value = utc_days * 86400;
          const date_info = new Date(utc_value * 1000);
          return date_info.toISOString().split('T')[0];
        }

        const mappedData = jsonData.map((row: any) => {
          console.log('Processing charge row:', row);
          
          // Handle description (remove duplicates if present)
          const description = String(row.Description || row.description || '');
          const cleanDescription = description.replace(/(.+)\1/, '$1'); // Remove duplicates
          
          // Handle amount - try multiple formats
          const amountValue = row.Montant || row.amount || row.Amount || 0;
          const amount = typeof amountValue === 'string' ? parseFloat(amountValue.replace(/[^\d.-]/g, '')) : Number(amountValue);
          
          // Handle date - convert Excel serial or French format to YYYY-MM-DD
          let date = row.Date || row.date || '';
          if (typeof date === 'number') {
            date = excelDateToISO(date);
          } else if (typeof date === 'string' && date.match(/[a-zéû.]/i)) {
            // Optionally add French date parsing here if needed
          }
          
          // Handle residence ID
          const residenceId = Number(row['Résidence ID'] || row.residence_id || row['Residence ID'] || 1);
          
          return {
            description: cleanDescription,
            amount: isNaN(amount) ? 0 : amount,
            residence_id: residenceId,
            date: date || new Date().toISOString().split('T')[0],
          };
        }).filter(item => item.description && item.amount > 0);

        console.log('Parsed charges data:', mappedData);
        
        if (mappedData.length === 0) {
          throw new Error('Aucune donnée valide trouvée après traitement');
        }
        
        setBulkCharges(mappedData);
        setBulkError(null);
      } catch (err: any) {
        console.error('Error processing file:', err);
        setBulkError(`Erreur lors de la lecture du fichier: ${err.message}`);
        setBulkCharges([]);
      }
    };
    
    reader.onerror = () => {
      console.error('FileReader error:', reader.error);
      setBulkError('Erreur lors de la lecture du fichier');
      setBulkCharges([]);
    };
    
    reader.readAsArrayBuffer(file);
  };

  const handleBulkConfirm = async () => {
    setBulkLoading(true);
    try {
      const response = await fetch('http://localhost:5050/api/charges/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ charges: bulkCharges }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        throw new Error(result.error || 'Erreur lors de l\'importation');
      }

      setBulkDialogOpen(false);
      setBulkCharges([]);
      fetchData(); // Refresh the list
      setError(null);
    } catch (err: any) {
      setBulkError(err.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'date', headerName: 'Date', flex: 1, minWidth: 120 },
    { field: 'description', headerName: 'Description', flex: 2, minWidth: 180 },
    {
      field: 'amount',
      headerName: 'Montant (DH)',
      flex: 1,
      minWidth: 120,
      renderCell: (params) =>
        params.value != null ? Number(params.value).toLocaleString('fr-FR') : '',
    },
    {
      field: 'residenceName',
      headerName: 'Résidence',
      flex: 1,
      minWidth: 160,
      renderCell: (params) => params.row.Residence?.name || '',
    },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 100,
      getActions: (params) => {
        const actions = [];
        if (hasPermission('canEditCharges')) {
          actions.push(
            <GridActionsCellItem icon={<EditIcon />} label="Modifier" onClick={() => handleOpenDialog(params.row)} />
          );
        }
        if (hasPermission('canDeleteCharges')) {
          actions.push(
            <GridActionsCellItem icon={<DeleteIcon />} label="Supprimer" onClick={() => setDeleteId(params.row.id)} showInMenu />
          );
        }
        return actions;
      },
    },
  ];

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Charges</Typography>
        <Stack direction="row" spacing={2}>
          {hasPermission('canExportCharges') && (
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={() => exportChargesToExcel(charges)}
              sx={{ borderRadius: 2 }}
            >
              Exporter Excel
            </Button>
          )}
          {hasPermission('canCreateCharges') && (
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setBulkDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Importer des Charges
            </Button>
          )}
          {hasPermission('canCreateCharges') && (
            <Fab color="primary" aria-label="add" onClick={() => handleOpenDialog()} size="medium" sx={{ boxShadow: 2 }}>
              <AddIcon />
            </Fab>
          )}
        </Stack>
      </Stack>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Card elevation={3} sx={{ borderRadius: 3, mb: 4 }}>
        <CardContent>
          {loading ? (
            <Box display="flex" justifyContent="center" alignItems="center" minHeight="320px">
              <CircularProgress />
            </Box>
          ) : (
            <Box sx={{ height: 420, width: '100%' }}>
              <DataGrid
                rows={charges}
                columns={columns}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[7, 14, 21]}
                getRowId={(row) => row.id}
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
        <DialogTitle sx={{ fontWeight: 700 }}>{editId ? 'Modifier Charge' : 'Ajouter Charge'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} mt={1}>
            <TextField label="Date" type="date" fullWidth value={form.date} onChange={e => setForm(f => ({ ...f, date: e.target.value }))} InputLabelProps={{ shrink: true }} required />
            <TextField label="Description" fullWidth value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} required />
            <TextField label="Montant (DH)" type="number" fullWidth value={form.amount} onChange={e => setForm(f => ({ ...f, amount: Number(e.target.value) }))} required />
            <FormControl fullWidth>
              <InputLabel id="residence-label">Résidence</InputLabel>
              <Select
                labelId="residence-label"
                value={form.residence_id}
                label="Résidence"
                onChange={e => setForm(f => ({ ...f, residence_id: Number(e.target.value) }))}
              >
                {residences.map((res) => (
                  <MenuItem key={res.id} value={res.id}>{res.name}</MenuItem>
                ))}
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
          <Typography>Voulez-vous vraiment supprimer cette charge ?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} disabled={saving}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Importer des Charges</DialogTitle>
        <DialogContent>
          <Stack spacing={3} mt={1}>
            <Box>
              <input
                accept=".xlsx,.xls,.csv"
                style={{ display: 'none' }}
                id="bulk-file-input"
                type="file"
                onChange={handleBulkFile}
              />
              <label htmlFor="bulk-file-input">
                <Button variant="outlined" component="span" startIcon={<UploadIcon />}>
                  Sélectionner un fichier Excel/CSV
                </Button>
              </label>
              <Typography variant="caption" display="block" sx={{ mt: 1, color: 'text.secondary' }}>
                Format attendu: Description, Montant, Date, Résidence ID
              </Typography>
            </Box>

            {bulkError && (
              <Alert severity="error">{bulkError}</Alert>
            )}

            {bulkCharges.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Aperçu des données ({bulkCharges.length} charges)</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Description</TableCell>
                        <TableCell>Montant</TableCell>
                        <TableCell>Date</TableCell>
                        <TableCell>Résidence ID</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bulkCharges.slice(0, 10).map((charge, index) => (
                        <TableRow key={index}>
                          <TableCell>{charge.description}</TableCell>
                          <TableCell>{charge.amount}</TableCell>
                          <TableCell>{charge.date}</TableCell>
                          <TableCell>{charge.residence_id}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {bulkCharges.length > 10 && (
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    ... et {bulkCharges.length - 10} autres charges
                  </Typography>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkDialogOpen(false)} disabled={bulkLoading}>
            Annuler
          </Button>
          <Button 
            onClick={handleBulkConfirm} 
            variant="contained" 
            disabled={bulkLoading || bulkCharges.length === 0}
          >
            {bulkLoading ? <CircularProgress size={20} /> : 'Confirmer l\'import'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Charges; 