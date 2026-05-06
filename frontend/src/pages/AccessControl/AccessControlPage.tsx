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
  IconButton,
  MenuItem,
  Paper,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import SecurityIcon from '@mui/icons-material/Security';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listAccessRules, createAccessRule, deleteAccessRule, type CreateAccessRuleRequest } from '@/api/access';
import { listUsers } from '@/api/users';
import { listStorage } from '@/api/storage';

export default function AccessControlPage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [form, setForm] = useState<CreateAccessRuleRequest>({
    user_id: '',
    storage_id: '',
    permission: 'read',
  });

  const { data: rulesData, isLoading } = useQuery({
    queryKey: ['access-rules'],
    queryFn: () => listAccessRules(),
  });

  const { data: usersData } = useQuery({
    queryKey: ['users-for-access'],
    queryFn: () => listUsers(),
  });

  const { data: storageData } = useQuery({
    queryKey: ['storage-for-access'],
    queryFn: () => listStorage(),
  });

  const createMutation = useMutation({
    mutationFn: createAccessRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-rules'] });
      setDialogOpen(false);
      setForm({ user_id: '', storage_id: '', permission: 'read' });
      setSnackbar({ open: true, message: 'Access rule created', severity: 'success' });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setSnackbar({
        open: true,
        message: axiosErr.response?.data?.detail || 'Failed to create rule',
        severity: 'error',
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteAccessRule,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['access-rules'] });
      setSnackbar({ open: true, message: 'Access rule removed', severity: 'success' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const getUserName = (userId: string) =>
    usersData?.users.find((u) => u.id === userId)?.username || userId;

  const getStorageName = (storageId: string) =>
    storageData?.destinations.find((d) => d.id === storageId)?.name || storageId;

  const permissionColor = (perm: string) => {
    switch (perm) {
      case 'admin': return 'error';
      case 'write': return 'warning';
      case 'read': return 'info';
      default: return 'default';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">Access Control</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Grant Access
        </Button>
      </Box>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configure which users can access which storage destinations and their permission level.
      </Alert>

      {isLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : rulesData?.rules.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 6 }}>
            <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No access rules configured
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Grant users access to storage destinations to get started.
            </Typography>
          </CardContent>
        </Card>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>User</TableCell>
                <TableCell>Storage Destination</TableCell>
                <TableCell>Permission</TableCell>
                <TableCell>Path Prefix</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {rulesData?.rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>{getUserName(rule.user_id)}</TableCell>
                  <TableCell>{getStorageName(rule.storage_id)}</TableCell>
                  <TableCell>
                    <Chip
                      label={rule.permission}
                      size="small"
                      color={permissionColor(rule.permission)}
                    />
                  </TableCell>
                  <TableCell>{rule.path_prefix || '/'}</TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(rule.id)}
                      aria-label="delete rule"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      {/* Grant Access Dialog */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle>Grant Access</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="User"
              select
              value={form.user_id}
              onChange={(e) => setForm({ ...form, user_id: e.target.value })}
              required
            >
              {usersData?.users.map((user) => (
                <MenuItem key={user.id} value={user.id}>
                  {user.username} ({user.email})
                </MenuItem>
              ))}
            </TextField>
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
              label="Permission"
              select
              value={form.permission}
              onChange={(e) => setForm({ ...form, permission: e.target.value })}
            >
              <MenuItem value="read">Read</MenuItem>
              <MenuItem value="write">Write</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              Grant
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
