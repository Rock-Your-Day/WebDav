import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
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
import EditIcon from '@mui/icons-material/Edit';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  type User,
  type CreateUserRequest,
  type UpdateUserRequest,
} from '@/api/users';
import { listStorage } from '@/api/storage';

export default function UsersPage() {
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  const [createForm, setCreateForm] = useState<CreateUserRequest>({
    username: '',
    email: '',
    password: '',
    role: 'user',
  });
  const [editForm, setEditForm] = useState<UpdateUserRequest>({});

  const { data, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: () => listUsers(),
  });

  const { data: storageData } = useQuery({
    queryKey: ['storage-for-users'],
    queryFn: () => listStorage(),
  });

  const createMutation = useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setCreateOpen(false);
      setCreateForm({ username: '', email: '', password: '', role: 'user' });
      setSnackbar({ open: true, message: 'User created successfully', severity: 'success' });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setSnackbar({ open: true, message: axiosErr.response?.data?.detail || 'Failed to create user', severity: 'error' });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateUserRequest }) => updateUser(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setEditOpen(false);
      setEditingUser(null);
      setSnackbar({ open: true, message: 'User updated', severity: 'success' });
    },
    onError: (err: unknown) => {
      const axiosErr = err as { response?: { data?: { detail?: string } } };
      setSnackbar({ open: true, message: axiosErr.response?.data?.detail || 'Failed to update user', severity: 'error' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: deleteUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] });
      setSnackbar({ open: true, message: 'User deleted', severity: 'success' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(createForm);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      email: user.email,
      role: user.role,
      is_active: user.is_active,
      storage_id: user.storage_id,
    });
    setEditOpen(true);
  };

  const handleEditSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingUser) {
      updateMutation.mutate({ id: editingUser.id, data: editForm });
    }
  };

  const roleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'error';
      case 'user': return 'primary';
      case 'readonly': return 'default';
      default: return 'default';
    }
  };

  const getStorageName = (storageId: string | null) => {
    if (!storageId) return '—';
    return storageData?.destinations.find((d) => d.id === storageId)?.name || storageId.slice(0, 8);
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4">User Management</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setCreateOpen(true)}>
          Add User
        </Button>
      </Box>

      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Username</TableCell>
              <TableCell>Email</TableCell>
              <TableCell>Role</TableCell>
              <TableCell>Storage</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Created</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">Loading...</TableCell>
              </TableRow>
            ) : data?.users.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center">No users found</TableCell>
              </TableRow>
            ) : (
              data?.users.map((user) => (
                <TableRow key={user.id} hover>
                  <TableCell sx={{ fontWeight: 500 }}>{user.username}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip label={user.role} size="small" color={roleColor(user.role)} />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color={user.storage_id ? 'text.primary' : 'text.secondary'}>
                      {getStorageName(user.storage_id)}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? 'Active' : 'Disabled'}
                      size="small"
                      color={user.is_active ? 'success' : 'default'}
                      variant="outlined"
                    />
                  </TableCell>
                  <TableCell>{new Date(user.created_at).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => handleEdit(user)} aria-label="edit user">
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(user.id)}
                      aria-label="delete user"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* Create User Dialog */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleCreate}>
          <DialogTitle>Create New User</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Username"
              value={createForm.username}
              onChange={(e) => setCreateForm({ ...createForm, username: e.target.value })}
              required
              helperText="3-100 characters, alphanumeric and _.-"
            />
            <TextField
              label="Email"
              type="email"
              value={createForm.email}
              onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
              required
            />
            <TextField
              label="Password"
              type="password"
              value={createForm.password}
              onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
              required
              helperText="Minimum 8 characters"
            />
            <TextField
              label="Role"
              select
              value={createForm.role}
              onChange={(e) => setCreateForm({ ...createForm, role: e.target.value })}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="readonly">Read Only</MenuItem>
            </TextField>
            <TextField
              label="Storage Destination"
              select
              value={createForm.storage_id || ''}
              onChange={(e) => setCreateForm({ ...createForm, storage_id: e.target.value || null })}
              helperText="Where this user's WebDAV files will be stored"
            >
              <MenuItem value="">None (default path)</MenuItem>
              {storageData?.destinations.map((dest) => (
                <MenuItem key={dest.id} value={dest.id}>
                  {dest.name} ({dest.provider_type})
                </MenuItem>
              ))}
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              Create
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <form onSubmit={handleEditSave}>
          <DialogTitle>Edit User: {editingUser?.username}</DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
            <TextField
              label="Email"
              type="email"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
            />
            <TextField
              label="Role"
              select
              value={editForm.role || editingUser?.role || 'user'}
              onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
            >
              <MenuItem value="user">User</MenuItem>
              <MenuItem value="admin">Admin</MenuItem>
              <MenuItem value="readonly">Read Only</MenuItem>
            </TextField>
            <TextField
              label="Storage Destination"
              select
              value={editForm.storage_id ?? editingUser?.storage_id ?? ''}
              onChange={(e) => setEditForm({ ...editForm, storage_id: e.target.value || null })}
              helperText="Where this user's WebDAV files will be stored"
            >
              <MenuItem value="">None (default path)</MenuItem>
              {storageData?.destinations.map((dest) => (
                <MenuItem key={dest.id} value={dest.id}>
                  {dest.name} ({dest.provider_type})
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Active"
              select
              value={editForm.is_active ?? editingUser?.is_active ?? true ? 'true' : 'false'}
              onChange={(e) => setEditForm({ ...editForm, is_active: e.target.value === 'true' })}
            >
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Disabled</MenuItem>
            </TextField>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => setEditOpen(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={updateMutation.isPending}>
              Save Changes
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
