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
import TimerIcon from '@mui/icons-material/Timer';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listSLAPolicies, createSLAPolicy, deleteSLAPolicy, type CreateSLAPolicyRequest } from '@/api/sla';
import { listStorage } from '@/api/storage';
import { listUsers } from '@/api/users';

export default function SLAPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [form, setForm] = useState<CreateSLAPolicyRequest>({
    name: '',
    storage_id: '',
    expected_frequency_hours: 24,
    alert_email: '',
    alert_webhook: '',
  });

  const { data: policiesData, isLoading } = useQuery({
    queryKey: ['sla-policies'],
    queryFn: listSLAPolicies,
  });

  const { data: storageData } = useQuery({
    queryKey: ['storage-for-sla'],
    queryFn: () => listStorage(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-for-sla'],
    queryFn: () => listUsers(),
  });

  const createMutation = useMutation({
    mutationFn: createSLAPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      setDialogOpen(false);
      setForm({ name: '', storage_id: '', expected_frequency_hours: 24, alert_email: '', alert_webhook: '' });
      setSnackbar({ open: true, message: 'SLA policy created', severity: 'success' });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setSnackbar({ open: true, message: axiosErr.response?.data?.detail || 'Failed to create policy', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteSLAPolicy,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sla-policies'] });
      setSnackbar({ open: true, message: 'Policy deleted', severity: 'success' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate({
      ...form,
      alert_email: form.alert_email || null,
      alert_webhook: form.alert_webhook || null,
      user_id: form.user_id || null,
    });
  };

  const getStorageName = (id: string) =>
    storageData?.destinations.find((d) => d.id === id)?.name || id;

  const getUserName = (id: string | null) => {
    if (!id) return 'All Users';
    return usersData?.users.find((u) => u.id === id)?.username || id;
  };

  const formatHours = (hours: number) => {
    if (hours < 24) return `${hours}h`;
    if (hours % 24 === 0) return `${hours / 24}d`;
    return `${Math.floor(hours / 24)}d ${hours % 24}h`;
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">SLA Policies</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Monitor backup frequency and alert on missed schedules
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Policy
        </Button>
      </Box>

      {isLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : policiesData?.policies.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <TimerIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No SLA policies configured
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Create a policy to monitor backup frequency and get alerted on missed schedules.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Create First Policy
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {policiesData?.policies.map((policy) => (
            <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={policy.id}>
              <Card sx={{ height: '100%' }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                    <TimerIcon color="primary" />
                    <Typography variant="subtitle1" fontWeight={600} sx={{ flex: 1 }}>
                      {policy.name}
                    </Typography>
                    <Chip
                      label={policy.is_active ? 'Active' : 'Paused'}
                      size="small"
                      color={policy.is_active ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </Box>

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      Storage: <strong>{getStorageName(policy.storage_id)}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Scope: <strong>{getUserName(policy.user_id)}</strong>
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Expected: every <strong>{formatHours(policy.expected_frequency_hours)}</strong>
                    </Typography>
                  </Box>

                  {(policy.alert_email || policy.alert_webhook) && (
                    <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap', mb: 1 }}>
                      {policy.alert_email && (
                        <Chip icon={<NotificationsIcon />} label="Email" size="small" variant="outlined" />
                      )}
                      {policy.alert_webhook && (
                        <Chip icon={<NotificationsIcon />} label="Webhook" size="small" variant="outlined" />
                      )}
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(policy.id)}
                      aria-label="delete policy"
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

      {/* Create Policy Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle>Create SLA Policy</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 2 }}>
            <TextField
              label="Policy Name"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
              placeholder="e.g. Daily Backup Check"
            />
            <TextField
              label="Storage Destination"
              select
              value={form.storage_id}
              onChange={(e) => setForm({ ...form, storage_id: e.target.value })}
              required
            >
              {storageData?.destinations.map((dest) => (
                <MenuItem key={dest.id} value={dest.id}>
                  {dest.name} ({dest.provider_type})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="User (optional)"
              select
              value={form.user_id || ''}
              onChange={(e) => setForm({ ...form, user_id: e.target.value || undefined })}
              helperText="Leave empty to monitor all users"
            >
              <MenuItem value="">All Users</MenuItem>
              {usersData?.users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Expected Frequency (hours)"
              type="number"
              value={form.expected_frequency_hours}
              onChange={(e) => setForm({ ...form, expected_frequency_hours: parseInt(e.target.value) || 24 })}
              helperText="Alert if no activity within this many hours"
              inputProps={{ min: 1, max: 8760 }}
            />
            <TextField
              label="Alert Email (optional)"
              type="email"
              value={form.alert_email || ''}
              onChange={(e) => setForm({ ...form, alert_email: e.target.value })}
              placeholder="alerts@company.com"
            />
            <TextField
              label="Alert Webhook URL (optional)"
              value={form.alert_webhook || ''}
              onChange={(e) => setForm({ ...form, alert_webhook: e.target.value })}
              placeholder="https://hooks.slack.com/..."
              helperText="Slack, Teams, or any webhook endpoint"
            />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              Create Policy
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
