import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Grid,
  IconButton,
  MenuItem,
  Snackbar,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudIcon from '@mui/icons-material/Cloud';
import FolderIcon from '@mui/icons-material/Folder';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listStorage, createStorage, deleteStorage, testStorage, type CreateStorageRequest } from '@/api/storage';

const providerIcons: Record<string, React.ReactNode> = {
  local: <FolderIcon />,
  s3: <CloudIcon />,
  nfs: <FolderIcon />,
  azure: <CloudIcon />,
};

export default function StoragePage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [form, setForm] = useState<CreateStorageRequest>({
    name: '',
    provider_type: 'local',
    config: {},
  });

  const { data, isLoading } = useQuery({
    queryKey: ['storage'],
    queryFn: () => listStorage(),
  });

  const createMutation = useMutation({
    mutationFn: createStorage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      setDialogOpen(false);
      setForm({ name: '', provider_type: 'local', config: {} });
      setSnackbar({ open: true, message: 'Storage destination created', severity: 'success' });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setSnackbar({
        open: true,
        message: axiosErr.response?.data?.detail || 'Failed to create storage',
        severity: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteStorage,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['storage'] });
      setSnackbar({ open: true, message: 'Storage deleted', severity: 'success' });
    },
  });

  const testMutation = useMutation({
    mutationFn: testStorage,
    onSuccess: (data) => {
      setSnackbar({ open: true, message: data.message, severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Connection test failed', severity: 'error' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Storage Destinations</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Storage
        </Button>
      </Box>

      {isLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : data?.destinations.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <Typography color="text.secondary">
              No storage destinations configured. Add one to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {data?.destinations.map((dest) => (
            <Grid size={{ xs: 12, sm: 6, md: 4 }} key={dest.id}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <Box sx={{ color: 'primary.main' }}>
                      {providerIcons[dest.provider_type] || <CloudIcon />}
                    </Box>
                    <Typography variant="h6" sx={{ flex: 1 }}>
                      {dest.name}
                    </Typography>
                    <Chip
                      label={dest.is_active ? 'Active' : 'Inactive'}
                      size="small"
                      color={dest.is_active ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Provider: {dest.provider_type.toUpperCase()}
                  </Typography>
                  <Box sx={{ display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => testMutation.mutate(dest.id)}
                    >
                      Test
                    </Button>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(dest.id)}
                      aria-label="delete storage"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Create Storage Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle>Add Storage Destination</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <TextField
              label="Provider Type"
              select
              value={form.provider_type}
              onChange={(e) => setForm({ ...form, provider_type: e.target.value })}
            >
              <MenuItem value="local">Local Filesystem</MenuItem>
              <MenuItem value="s3">AWS S3</MenuItem>
              <MenuItem value="nfs">NFS</MenuItem>
              <MenuItem value="azure">Azure Blob Storage</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
