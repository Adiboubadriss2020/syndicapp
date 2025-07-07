import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Fab, Stack, useTheme, Card, CardContent, CircularProgress, Alert,
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
import { getResidences, addResidence, updateResidence, deleteResidence } from '../api/residences';
import type { Residence, ResidenceInput } from '../api/residences';
import { exportResidencesToExcel } from '../utils/excelExport';
import { useAuth } from '../context/AuthContext';
import { useDashboard } from '../context/DashboardContext';

const initialForm: ResidenceInput = { name: '', address: '', num_apartments: 0, contact: '' };

const Résidences: React.FC = () => {
  const theme = useTheme();
  const { hasPermission } = useAuth();
  const { triggerDashboardRefresh } = useDashboard();
  const [residences, setResidences] = useState<Residence[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<ResidenceInput>(initialForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Bulk import states
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [bulkResidences, setBulkResidences] = useState<ResidenceInput[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [bulkError, setBulkError] = useState<string | null>(null);

  // Add dialogError state
  const [dialogError, setDialogError] = useState<string | null>(null);

  const [paginationModel, setPaginationModel] = useState({ page: 0, pageSize: 7 });

  const fetchData = () => {
    setLoading(true);
    getResidences()
      .then(setResidences)
      .catch(() => setError('Erreur lors du chargement des résidences.'))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenDialog = (residence?: Residence) => {
    setSuccess(null);
    setDialogError(null);
    if (residence) {
      setEditId(residence.id);
      setForm({
        name: residence.name,
        address: residence.address,
        num_apartments: residence.num_apartments,
        contact: residence.contact,
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
      setDialogError('Le nom de la résidence est obligatoire.');
      return;
    }
    if (!form.contact.trim()) {
      setDialogError('Le contact est obligatoire.');
      return;
    }
    if (!form.address.trim()) {
      setDialogError("L'adresse est obligatoire.");
      return;
    }
    if (form.num_apartments === undefined || form.num_apartments === null || form.num_apartments <= 0) {
      setDialogError("Le nombre d'appartements est obligatoire et doit être supérieur à 0.");
      return;
    }

    setSaving(true);
    setDialogError(null);
    setSuccess(null);
    try {
      if (editId) {
        await updateResidence(editId, form);
        setSuccess('Résidence modifiée avec succès !');
      } else {
        await addResidence(form);
        setSuccess('Résidence créée avec succès !');
      }
      fetchData();
      // Trigger dashboard refresh
      triggerDashboardRefresh();
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
        await deleteResidence(deleteId);
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

  const handleBulkFile = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet) as Record<string, unknown>[];

        console.log('Raw Excel data:', jsonData);
        console.log('First row keys:', jsonData.length > 0 ? Object.keys(jsonData[0] as object) : 'No data');

        const mappedData = jsonData.map((row: Record<string, unknown>) => {
          console.log('Processing row:', row);
          
          // More flexible column mapping
          const name = (row.Nom || row.name || row.Name || '') as string;
          const address = (row.Adresse || row.address || row.Address || '') as string;
          const contact = String(row.Contact || row.contact || row.Contact || 'Contact non spécifié');
          
          // Try multiple possible column names for apartments
          const apartmentsValue = row['Nombre d\'appartements'] || 
                                 row['Nombre d\'unités'] || 
                                 row['Unités Total'] || 
                                 row['Unités Occupées'] ||
                                 row.num_apartments || 
                                 row.num_units ||
                                 row.total_units ||
                                 row.occupied_units ||
                                 row['Number of Apartments'] ||
                                 row['Total Units'] ||
                                 row['Occupied Units'];
          
          const numApartments = Number(apartmentsValue);
          
          return {
            name: name,
            address: address,
            num_apartments: isNaN(numApartments) ? 0 : numApartments,
            contact: contact,
          };
        }).filter(item => item.name && item.address && item.num_apartments > 0); // Filter out invalid rows

        console.log('Parsed data:', mappedData);
        setBulkResidences(mappedData);
        setBulkError(null);
      } catch (error) {
        console.error('Error reading file:', error);
        setBulkError('Erreur lors de la lecture du fichier.');
        setBulkResidences([]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleBulkConfirm = async () => {
    setBulkLoading(true);
    try {
      // Log the data being sent for debugging
      console.log('Sending residences data:', bulkResidences);
      
      const response = await fetch('http://localhost:5050/api/residences/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ residences: bulkResidences }),
      });

      const result = await response.json();
      
      if (!response.ok) {
        console.error('Backend error:', result);
        if (result.details && Array.isArray(result.details)) {
          const errorDetails = result.details.map((detail: { row: number; errors: string[] }) => 
            `Ligne ${detail.row}: ${detail.errors.join(', ')}`
          ).join('\n');
          throw new Error(`Erreurs de validation:\n${errorDetails}`);
        }
        throw new Error(result.error || 'Erreur lors de l\'importation');
      }

      setBulkDialogOpen(false);
      setBulkResidences([]);
      fetchData(); // Refresh the list
      // Trigger dashboard refresh
      triggerDashboardRefresh();
      setError(null);
    } catch (error: unknown) {
      console.error('Frontend error:', error);
      setBulkError(error instanceof Error ? error.message : 'Erreur inconnue');
    } finally {
      setBulkLoading(false);
    }
  };

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Nom', flex: 1, minWidth: 160 },
    { field: 'address', headerName: 'Adresse', flex: 2, minWidth: 200 },
    { field: 'num_apartments', headerName: 'Appartements', type: 'number', flex: 1, minWidth: 120 },
    { field: 'contact', headerName: 'Contact', flex: 1, minWidth: 140 },
    {
      field: 'actions',
      type: 'actions',
      headerName: '',
      width: 100,
      getActions: (params) => {
        const actions = [];
        
        if (hasPermission('canEditResidences')) {
          actions.push(
            <GridActionsCellItem 
              icon={<EditIcon />} 
              label="Modifier" 
              onClick={() => handleOpenDialog(params.row)} 
            />
          );
        }
        
        if (hasPermission('canDeleteResidences')) {
          actions.push(
            <GridActionsCellItem 
              icon={<DeleteIcon />} 
              label="Supprimer" 
              onClick={() => setDeleteId(params.row.id)} 
              showInMenu 
            />
          );
        }
        
        return actions;
      },
    },
  ];

  return (
    <Box>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={3}>
        <Typography variant="h4">Résidences</Typography>
        <Stack direction="row" spacing={2}>
          {hasPermission('canCreateResidences') && (
            <Button
              variant="outlined"
              startIcon={<UploadIcon />}
              onClick={() => setBulkDialogOpen(true)}
              sx={{ borderRadius: 2 }}
            >
              Importer des Résidences
            </Button>
          )}
          {hasPermission('canExportResidences') && (
            <Button
              variant="outlined"
              startIcon={<FileDownloadIcon />}
              onClick={() => exportResidencesToExcel(residences)}
              sx={{ borderRadius: 2 }}
            >
              Exporter les Résidences
            </Button>
          )}
          {hasPermission('canCreateResidences') && (
            <Fab 
              color="primary" 
              aria-label="add" 
              onClick={() => handleOpenDialog()} 
              size="medium" 
              sx={{ boxShadow: 2 }}
            >
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
                rows={residences}
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
        <DialogTitle sx={{ fontWeight: 700 }}>{editId ? 'Modifier Résidence' : 'Ajouter Résidence'}</DialogTitle>
        <DialogContent>
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {dialogError && <Alert severity="error" sx={{ mb: 2 }}>{dialogError}</Alert>}
          <Stack spacing={2} mt={1}>
            <TextField label="Nom" fullWidth value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} autoFocus required />
            <TextField label="Contact" fullWidth value={form.contact} onChange={e => setForm(f => ({ ...f, contact: e.target.value }))} required />
            <TextField label="Adresse" fullWidth value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} required />
            <TextField label="Nombre d'Appartements" type="number" fullWidth value={form.num_apartments} onChange={e => setForm(f => ({ ...f, num_apartments: Number(e.target.value) }))} required />
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
          <Typography>Voulez-vous vraiment supprimer cette résidence ?</Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setDeleteId(null)} disabled={saving}>Annuler</Button>
          <Button onClick={handleDelete} color="error" variant="contained" disabled={saving}>Supprimer</Button>
        </DialogActions>
      </Dialog>

      {/* Bulk Import Dialog */}
      <Dialog open={bulkDialogOpen} onClose={() => setBulkDialogOpen(false)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Importer des Résidences</DialogTitle>
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
                Format attendu: Nom, Adresse, Nombre d'appartements, Contact
              </Typography>
            </Box>

            {bulkError && (
              <Alert severity="error">{bulkError}</Alert>
            )}

            {bulkResidences.length > 0 && (
              <Box>
                <Typography variant="h6" sx={{ mb: 2 }}>Aperçu des données ({bulkResidences.length} résidences)</Typography>
                <TableContainer component={Paper} sx={{ maxHeight: 300 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Nom</TableCell>
                        <TableCell>Adresse</TableCell>
                        <TableCell>Nombre d'appartements</TableCell>
                        <TableCell>Contact</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {bulkResidences.slice(0, 10).map((residence, index) => (
                        <TableRow key={index}>
                          <TableCell>{residence.name}</TableCell>
                          <TableCell>{residence.address}</TableCell>
                          <TableCell>{residence.num_apartments}</TableCell>
                          <TableCell>{residence.contact}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
                {bulkResidences.length > 10 && (
                  <Typography variant="caption" sx={{ mt: 1, display: 'block' }}>
                    ... et {bulkResidences.length - 10} autres résidences
                  </Typography>
                )}
              </Box>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setBulkDialogOpen(false)} disabled={bulkLoading}>Annuler</Button>
          <Button 
            onClick={handleBulkConfirm} 
            variant="contained" 
            disabled={bulkLoading || bulkResidences.length === 0}
          >
            {bulkLoading ? <CircularProgress size={20} /> : 'Importer'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Résidences; 