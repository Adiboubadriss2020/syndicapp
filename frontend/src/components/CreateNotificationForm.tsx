import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { fr } from 'date-fns/locale';
import { createNotification } from '../api/notifications';
import { useAuth } from '../context/AuthContext';

interface CreateNotificationFormProps {
  open: boolean;
  onClose: () => void;
  userId: number;
  onNotificationCreated?: () => void;
}

interface NotificationFormData {
  title: string;
  description: string;
  trigger_date: string;
  user_id: number;
}

const CreateNotificationForm: React.FC<CreateNotificationFormProps> = ({
  open,
  onClose,
  userId,
  onNotificationCreated
}) => {
  const { hasPermission } = useAuth();
  const [formData, setFormData] = useState<NotificationFormData>({
    title: '',
    description: '',
    trigger_date: new Date().toISOString(),
    user_id: userId
  });
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string>('');

  if (!hasPermission('canCreateNotifications')) {
    return (
      <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
        <DialogTitle>Créer une nouvelle notification</DialogTitle>
        <DialogContent>
          <Alert severity="warning">Vous n'avez pas la permission de créer des notifications.</Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={onClose}>Fermer</Button>
        </DialogActions>
      </Dialog>
    );
  }

  const handleInputChange = (field: keyof NotificationFormData, value: string | Date) => {
    setFormData(prev => ({
      ...prev,
      [field]: field === 'trigger_date' ? (value as Date).toISOString() : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (!formData.title.trim() || !formData.description.trim()) {
      setError('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (new Date(formData.trigger_date) <= new Date()) {
      setError('La date de déclenchement doit être dans le futur');
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      await createNotification(formData);
      
      // Show success message
      setSuccessMessage('Notification créée avec succès !');
      
      // Reset form
      setFormData({
        title: '',
        description: '',
        trigger_date: new Date().toISOString(),
        user_id: userId
      });
      
      // Close dialog after a short delay to show success message
      setTimeout(() => {
        onClose();
        setSuccessMessage('');
        onNotificationCreated?.();
      }, 1500);
      
    } catch (error) {
      console.error('Error creating notification:', error);
      setError('Erreur lors de la création de la notification');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setFormData({
        title: '',
        description: '',
        trigger_date: new Date().toISOString(),
        user_id: userId
      });
      setError(null);
      setSuccessMessage('');
      onClose();
    }
  };

  return (
    <>
      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          fontWeight: 600
        }}>
          Créer une nouvelle notification
        </DialogTitle>
        
        <form onSubmit={handleSubmit}>
          <DialogContent sx={{ pt: 3 }}>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            {successMessage && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {successMessage}
              </Alert>
            )}
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
              <TextField
                label="Titre de la notification"
                value={formData.title}
                onChange={(e) => handleInputChange('title', e.target.value)}
                fullWidth
                required
                variant="outlined"
                placeholder="Ex: Rappel de paiement"
                disabled={loading}
              />
              
              <TextField
                label="Description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                fullWidth
                required
                multiline
                rows={4}
                variant="outlined"
                placeholder="Ex: N'oubliez pas de payer les charges du mois de décembre"
                disabled={loading}
              />
              
              <LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={fr}>
                <DateTimePicker
                  label="Date et heure de déclenchement"
                  value={new Date(formData.trigger_date)}
                  onChange={(newValue) => {
                    if (newValue) {
                      handleInputChange('trigger_date', newValue);
                    }
                  }}
                  slotProps={{
                    textField: {
                      fullWidth: true,
                      required: true,
                      variant: 'outlined',
                      disabled: loading
                    }
                  }}
                  minDateTime={new Date()}
                />
              </LocalizationProvider>
              
              <Box sx={{ 
                p: 2, 
                bgcolor: 'rgba(102,126,234,0.05)', 
                borderRadius: 1,
                border: '1px solid rgba(102,126,234,0.2)'
              }}>
                <Typography variant="body2" color="text.secondary">
                  <strong>Note:</strong> La notification sera déclenchée automatiquement à la date et heure spécifiées.
                </Typography>
              </Box>
            </Box>
          </DialogContent>
          
          <DialogActions sx={{ p: 3, pt: 1 }}>
            <Button 
              onClick={handleClose} 
              disabled={loading}
              variant="outlined"
            >
              Annuler
            </Button>
            <Button 
              type="submit" 
              variant="contained"
              disabled={loading}
              sx={{
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                }
              }}
            >
              {loading ? (
                <CircularProgress size={20} color="inherit" />
              ) : (
                'Créer la notification'
              )}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </>
  );
};

export default CreateNotificationForm; 