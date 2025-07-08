import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Button, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Fab, Stack, useTheme, Card, CardContent, CircularProgress, Alert, MenuItem, Select, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Chip,
  Accordion, AccordionSummary, AccordionDetails, Checkbox, FormControlLabel, Divider
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { useAuth } from '../context/AuthContext';

interface User {
  id: number;
  username: string;
  email: string;
  role: 'admin' | 'user';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
  permissions: {
    canViewDashboard: boolean;
    canViewResidences: boolean;
    canViewClients: boolean;
    canViewCharges: boolean;
    canViewUsers: boolean;
    canCreateResidences: boolean;
    canEditResidences: boolean;
    canDeleteResidences: boolean;
    canExportResidences: boolean;
    canCreateClients: boolean;
    canEditClients: boolean;
    canDeleteClients: boolean;
    canExportClients: boolean;
    canCreateCharges: boolean;
    canEditCharges: boolean;
    canDeleteCharges: boolean;
    canExportCharges: boolean;
    canCreateUsers: boolean;
    canEditUsers: boolean;
    canDeleteUsers: boolean;
    canCreateNotifications: boolean;
    canViewNotifications: boolean;
    canViewDashboardCharges: boolean;
    canViewDashboardRevenues: boolean;
    canViewDashboardBalance: boolean;
    canViewFinancialData: boolean;
    canExportData: boolean;
    canManageSettings: boolean;
  };
}

interface UserInput {
  username: string;
  email: string;
  password: string;
  role: 'admin' | 'user';
  permissions: User['permissions'];
}

const defaultPermissions = {
  canViewDashboard: true,
  canViewResidences: true,
  canViewClients: true,
  canViewCharges: true,
  canViewUsers: false,
  canCreateResidences: false,
  canEditResidences: false,
  canDeleteResidences: false,
  canExportResidences: false,
  canCreateClients: false,
  canEditClients: false,
  canDeleteClients: false,
  canExportClients: false,
  canCreateCharges: false,
  canEditCharges: false,
  canDeleteCharges: false,
  canExportCharges: false,
  canCreateUsers: false,
  canEditUsers: false,
  canDeleteUsers: false,
  canCreateNotifications: false,
  canViewNotifications: true,
  canViewDashboardCharges: true,
  canViewDashboardRevenues: true,
  canViewDashboardBalance: true,
  canViewFinancialData: false,
  canExportData: false,
  canManageSettings: false
};

const initialForm: UserInput = {
  username: '',
  email: '',
  password: '',
  role: 'user',
  permissions: { ...defaultPermissions },
};

const AdminUsers: React.FC = () => {
  const theme = useTheme();
  const { token } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<UserInput>(initialForm);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      const response = await fetch('http://localhost:5050/api/auth/users', {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        throw new Error('Erreur lors du chargement des utilisateurs');
      }
      
      const data = await response.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [token]);

  const handleOpenDialog = (user?: User) => {
    if (user) {
      setEditId(user.id);
      setForm({
        username: user.username,
        email: user.email,
        password: '',
        role: user.role,
        permissions: user.permissions || { ...defaultPermissions },
      });
    } else {
      setEditId(null);
      setForm(initialForm);
    }
    setOpenDialog(true);
    setSuccess(null);
    setError(null);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setForm(initialForm);
    setEditId(null);
    setSuccess(null);
    setError(null);
  };

  const handlePermissionChange = (permission: keyof User['permissions']) => {
    setForm(prev => ({
      ...prev,
      permissions: {
        ...prev.permissions,
        [permission]: !prev.permissions[permission]
      }
    }));
  };

  const handleRoleChange = (role: 'admin' | 'user') => {
    setForm(prev => ({
      ...prev,
      role,
      permissions: role === 'admin' ? {
        canViewDashboard: true,
        canViewResidences: true,
        canViewClients: true,
        canViewCharges: true,
        canViewUsers: true,
        canCreateResidences: true,
        canEditResidences: true,
        canDeleteResidences: true,
        canExportResidences: true,
        canCreateClients: true,
        canEditClients: true,
        canDeleteClients: true,
        canExportClients: true,
        canCreateCharges: true,
        canEditCharges: true,
        canDeleteCharges: true,
        canExportCharges: true,
        canCreateUsers: true,
        canEditUsers: true,
        canDeleteUsers: true,
        canCreateNotifications: true,
        canViewNotifications: true,
        canViewDashboardCharges: true,
        canViewDashboardRevenues: true,
        canViewDashboardBalance: true,
        canViewFinancialData: true,
        canExportData: true,
        canManageSettings: true
      } : { ...defaultPermissions }
    }));
  };

  const handleSave = async () => {
    if (!form.username.trim() || !form.email.trim()) {
      setError('Nom d\'utilisateur et email sont obligatoires');
      return;
    }
    
    if (!editId && !form.password.trim()) {
      setError('Mot de passe obligatoire pour un nouvel utilisateur');
      return;
    }

    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const url = editId ? `http://localhost:5050/api/auth/users/${editId}` : 'http://localhost:5050/api/auth/register';
      const method = editId ? 'PUT' : 'POST';
      
      const body = editId 
        ? { username: form.username, email: form.email, role: form.role, permissions: form.permissions }
        : { username: form.username, email: form.email, password: form.password, role: form.role, permissions: form.permissions };

      const response = await fetch(url, {
        method,
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erreur lors de la sauvegarde');
      }

      setSuccess(editId ? 'Utilisateur modifié avec succès !' : 'Utilisateur créé avec succès !');
      fetchUsers();
      
      setTimeout(() => {
        handleCloseDialog();
      }, 1500);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteId) return;

    try {
      const response = await fetch(`http://localhost:5050/api/auth/users/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Erreur lors de la suppression');
      }

      setSuccess('Utilisateur supprimé avec succès !');
      fetchUsers();
      setDeleteId(null);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const PermissionSection: React.FC<{ title: string; permissions: Array<{ key: keyof User['permissions']; label: string }> }> = ({ title, permissions }) => (
    <Accordion defaultExpanded>
      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>{title}</Typography>
      </AccordionSummary>
      <AccordionDetails>
        <Stack spacing={1}>
          {permissions.map(({ key, label }) => (
            <FormControlLabel
              key={key}
              control={
                <Checkbox
                  checked={form.permissions[key]}
                  onChange={() => handlePermissionChange(key)}
                  color="primary"
                />
              }
              label={label}
            />
          ))}
        </Stack>
      </AccordionDetails>
    </Accordion>
  );

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4" fontWeight={700}>
          Gestion des Utilisateurs
        </Typography>
        <Fab
          color="primary"
          onClick={() => handleOpenDialog()}
          sx={{
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            '&:hover': {
              background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
            }
          }}
        >
          <AddIcon />
        </Fab>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

      <Card sx={{ borderRadius: 3, boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}>
        <CardContent>
          {users.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="h6" color="textSecondary">
                Aucun utilisateur trouvé
              </Typography>
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow sx={{ background: theme.palette.mode === 'dark' ? '#23272f' : '#f4f6fa' }}>
                    <TableCell sx={{ fontWeight: 700 }}>Utilisateur</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Email</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Rôle</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Statut</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Dernière connexion</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Créé le</TableCell>
                    <TableCell sx={{ fontWeight: 700 }}>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id} hover>
                      <TableCell>
                        <Typography variant="body1" fontWeight={500}>
                          {user.username}
                        </Typography>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Chip 
                          label={user.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
                          color={user.role === 'admin' ? 'primary' : 'default'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={user.isActive ? 'Actif' : 'Inactif'}
                          color={user.isActive ? 'success' : 'error'}
                          size="small"
                        />
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? formatDate(user.lastLogin) : 'Jamais connecté'}
                      </TableCell>
                      <TableCell>{formatDate(user.createdAt)}</TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <IconButton 
                            size="small" 
                            onClick={() => handleOpenDialog(user)}
                            color="primary"
                          >
                            <EditIcon />
                          </IconButton>
                          <IconButton 
                            size="small" 
                            onClick={() => setDeleteId(user.id)}
                            color="error"
                          >
                            <DeleteIcon />
                          </IconButton>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>
          {editId ? 'Modifier Utilisateur' : 'Créer Utilisateur'}
        </DialogTitle>
        <DialogContent>
          {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Stack spacing={3} mt={1}>
            <Stack direction="row" spacing={2}>
              <TextField 
                label="Nom d'utilisateur" 
                fullWidth 
                value={form.username} 
                onChange={e => setForm(f => ({ ...f, username: e.target.value }))} 
                required 
              />
              <TextField 
                label="Email" 
                type="email"
                fullWidth 
                value={form.email} 
                onChange={e => setForm(f => ({ ...f, email: e.target.value }))} 
                required 
              />
            </Stack>
            
            {!editId && (
              <TextField 
                label="Mot de passe" 
                type="password"
                fullWidth 
                value={form.password} 
                onChange={e => setForm(f => ({ ...f, password: e.target.value }))} 
                required 
              />
            )}
            
            <FormControl fullWidth>
              <InputLabel id="role-label">Rôle</InputLabel>
              <Select
                labelId="role-label"
                value={form.role}
                label="Rôle"
                onChange={e => handleRoleChange(e.target.value as 'admin' | 'user')}
              >
                <MenuItem value="user">Utilisateur</MenuItem>
                <MenuItem value="admin">Administrateur</MenuItem>
              </Select>
            </FormControl>

            <Divider />

            <Typography variant="h6" fontWeight={600}>Permissions</Typography>
            
            <PermissionSection 
              title="Navigation" 
              permissions={[
                { key: 'canViewDashboard', label: 'Voir le tableau de bord' },
                { key: 'canViewResidences', label: 'Voir les résidences' },
                { key: 'canViewClients', label: 'Voir les clients' },
                { key: 'canViewCharges', label: 'Voir les charges' },
                { key: 'canViewUsers', label: 'Voir les utilisateurs' },
              ]} 
            />

            <PermissionSection 
              title="Résidences" 
              permissions={[
                { key: 'canCreateResidences', label: 'Créer des résidences' },
                { key: 'canEditResidences', label: 'Modifier des résidences' },
                { key: 'canDeleteResidences', label: 'Supprimer des résidences' },
                { key: 'canExportResidences', label: 'Exporter les résidences' },
              ]} 
            />

            <PermissionSection 
              title="Clients" 
              permissions={[
                { key: 'canCreateClients', label: 'Créer des clients' },
                { key: 'canEditClients', label: 'Modifier des clients' },
                { key: 'canDeleteClients', label: 'Supprimer des clients' },
                { key: 'canExportClients', label: 'Exporter les clients' },
              ]} 
            />

            <PermissionSection 
              title="Charges" 
              permissions={[
                { key: 'canCreateCharges', label: 'Créer des charges' },
                { key: 'canEditCharges', label: 'Modifier des charges' },
                { key: 'canDeleteCharges', label: 'Supprimer des charges' },
                { key: 'canExportCharges', label: 'Exporter les charges' },
              ]} 
            />

            <PermissionSection 
              title="Utilisateurs" 
              permissions={[
                { key: 'canCreateUsers', label: 'Créer des utilisateurs' },
                { key: 'canEditUsers', label: 'Modifier des utilisateurs' },
                { key: 'canDeleteUsers', label: 'Supprimer des utilisateurs' },
              ]} 
            />

            <PermissionSection 
              title="Notifications" 
              permissions={[
                { key: 'canCreateNotifications', label: 'Créer des notifications' },
                { key: 'canViewNotifications', label: 'Voir les notifications' },
              ]} 
            />

            <PermissionSection 
              title="Tableau de bord" 
              permissions={[
                { key: 'canViewDashboardCharges', label: 'Voir les charges du tableau de bord' },
                { key: 'canViewDashboardRevenues', label: 'Voir les revenus du tableau de bord' },
                { key: 'canViewDashboardBalance', label: 'Voir le solde du tableau de bord' },
              ]} 
            />

            <Divider sx={{ my: 2 }} />
            
            <Box sx={{ p: 2, bgcolor: 'rgba(102,126,234,0.05)', borderRadius: 2, border: '1px solid rgba(102,126,234,0.2)' }}>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2, color: 'primary.main' }}>
                🎛️ Paramètres du Tableau de Bord
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Contrôlez quelles informations financières sont visibles pour cet utilisateur sur le tableau de bord.
              </Typography>
              
              <Stack spacing={1}>
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.permissions.canViewDashboardCharges}
                      onChange={() => handlePermissionChange('canViewDashboardCharges')}
                      color="primary"
                    />
                  }
                  label="Afficher les charges (82 530 DH)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.permissions.canViewDashboardRevenues}
                      onChange={() => handlePermissionChange('canViewDashboardRevenues')}
                      color="primary"
                    />
                  }
                  label="Afficher les revenus (7 184,5 DH)"
                />
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={form.permissions.canViewDashboardBalance}
                      onChange={() => handlePermissionChange('canViewDashboardBalance')}
                      color="primary"
                    />
                  }
                  label="Afficher le solde (-75 345,5 DH)"
                />
              </Stack>
            </Box>

            <PermissionSection 
              title="Système" 
              permissions={[
                { key: 'canViewFinancialData', label: 'Voir les données financières' },
                { key: 'canExportData', label: 'Exporter des données' },
                { key: 'canManageSettings', label: 'Gérer les paramètres' },
              ]} 
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}>
          <Button onClick={handleCloseDialog} color="inherit">
            Annuler
          </Button>
          <Button 
            onClick={handleSave} 
            variant="contained" 
            disabled={saving}
            sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
              }
            }}
          >
            {saving ? <CircularProgress size={20} /> : (editId ? 'Modifier' : 'Créer')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteId} onClose={() => setDeleteId(null)}>
        <DialogTitle>Confirmer la suppression</DialogTitle>
        <DialogContent>
          <Typography>
            Êtes-vous sûr de vouloir supprimer cet utilisateur ? Cette action est irréversible.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteId(null)} color="inherit">
            Annuler
          </Button>
          <Button onClick={handleDelete} color="error" variant="contained">
            Supprimer
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AdminUsers; 