import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Collapse,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Snackbar,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import CloudIcon from '@mui/icons-material/Cloud';
import FolderIcon from '@mui/icons-material/Folder';
import FolderOpenIcon from '@mui/icons-material/FolderOpen';
import StorageIcon from '@mui/icons-material/Storage';
import LinkIcon from '@mui/icons-material/Link';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  listStorage,
  createStorage,
  deleteStorage,
  testStorage,
  type CreateStorageRequest,
} from '@/api/storage';
import FolderPicker from '@/components/FolderPicker';
import StorageExplorer from '@/components/StorageExplorer';

function LocalPathField({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [pickerOpen, setPickerOpen] = useState(false);
  return (
    <>
      <TextField
        fullWidth
        label="Storage Path"
        placeholder="/data/storage/my-backup"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        helperText="Absolute path on the server filesystem"
        InputProps={{
          endAdornment: (
            <InputAdornment position="end">
              <IconButton onClick={() => setPickerOpen(true)} edge="end" title="Browse folders">
                <FolderOpenIcon />
              </IconButton>
            </InputAdornment>
          ),
        }}
      />
      <FolderPicker
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        onSelect={(path) => onChange(path)}
        initialPath={value || '/data'}
      />
    </>
  );
}

const providerMeta: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  local: { icon: <FolderIcon />, label: 'Local Filesystem', color: '#2e7d32' },
  s3: { icon: <CloudIcon />, label: 'AWS S3', color: '#ff9800' },
  nfs: { icon: <StorageIcon />, label: 'NFS Mount', color: '#9c27b0' },
  azure: { icon: <CloudIcon />, label: 'Azure Blob', color: '#0078d4' },
};

function ProviderConfigFields({
  providerType,
  config,
  onChange,
}: {
  providerType: string;
  config: Record<string, unknown>;
  onChange: (config: Record<string, unknown>) => void;
}) {
  const update = (key: string, value: string) => onChange({ ...config, [key]: value });

  switch (providerType) {
    case 'local':
      return (
        <LocalPathField
          value={(config.path as string) || ''}
          onChange={(val) => update('path', val)}
        />
      );
    case 's3':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Bucket Name"
            placeholder="my-webdav-bucket"
            value={(config.bucket as string) || ''}
            onChange={(e) => update('bucket', e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Region"
            placeholder="us-east-1"
            value={(config.region as string) || ''}
            onChange={(e) => update('region', e.target.value)}
          />
          <TextField
            fullWidth
            label="Access Key ID"
            placeholder="AKIA..."
            value={(config.aws_access_key_id as string) || ''}
            onChange={(e) => update('aws_access_key_id', e.target.value)}
          />
          <TextField
            fullWidth
            label="Secret Access Key"
            type="password"
            value={(config.aws_secret_access_key as string) || ''}
            onChange={(e) => update('aws_secret_access_key', e.target.value)}
          />
          <TextField
            fullWidth
            label="Endpoint URL (optional)"
            placeholder="https://s3.amazonaws.com or MinIO URL"
            value={(config.endpoint_url as string) || ''}
            onChange={(e) => update('endpoint_url', e.target.value)}
            helperText="Leave empty for AWS. Set for S3-compatible services (MinIO, Wasabi, etc.)"
          />
          <TextField
            fullWidth
            label="Path Prefix (optional)"
            placeholder="backups/"
            value={(config.prefix as string) || ''}
            onChange={(e) => update('prefix', e.target.value)}
            helperText="Optional prefix for all objects in this bucket"
          />
        </Box>
      );
    case 'azure':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="Container Name"
            placeholder="webdav-files"
            value={(config.container as string) || ''}
            onChange={(e) => update('container', e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Connection String"
            placeholder="DefaultEndpointsProtocol=https;AccountName=..."
            value={(config.connection_string as string) || ''}
            onChange={(e) => update('connection_string', e.target.value)}
            multiline
            rows={2}
            helperText="Azure Storage account connection string"
          />
          <TextField
            fullWidth
            label="Path Prefix (optional)"
            placeholder="backups/"
            value={(config.prefix as string) || ''}
            onChange={(e) => update('prefix', e.target.value)}
          />
        </Box>
      );
    case 'nfs':
      return (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          <TextField
            fullWidth
            label="NFS Server"
            placeholder="192.168.1.100"
            value={(config.host as string) || ''}
            onChange={(e) => update('host', e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Export Path"
            placeholder="/exports/webdav"
            value={(config.export_path as string) || ''}
            onChange={(e) => update('export_path', e.target.value)}
            required
          />
          <TextField
            fullWidth
            label="Mount Options (optional)"
            placeholder="rw,sync,no_subtree_check"
            value={(config.mount_options as string) || ''}
            onChange={(e) => update('mount_options', e.target.value)}
          />
        </Box>
      );
    default:
      return null;
  }
}

export default function StoragePage() {
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);
  const [explorerOpen, setExplorerOpen] = useState(false);
  const [explorerStorage, setExplorerStorage] = useState<{ id: string; name: string } | null>(null);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({
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
      setActiveStep(0);
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
    onSuccess: (result) => {
      setSnackbar({ open: true, message: result.message, severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Connection test failed', severity: 'error' });
    },
  });

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  const getConfigSummary = (config: Record<string, unknown>, type: string) => {
    switch (type) {
      case 's3':
        return config.bucket ? `s3://${config.bucket}${config.prefix ? '/' + config.prefix : ''}` : 'Not configured';
      case 'azure':
        return config.container ? `azure://${config.container}` : 'Not configured';
      case 'nfs':
        return config.host ? `${config.host}:${config.export_path || '/'}` : 'Not configured';
      case 'local':
        return (config.path as string) || '/data/storage';
      default:
        return 'Unknown';
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Storage Destinations</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Configure where WebDAV files are stored
          </Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
          Add Storage
        </Button>
      </Box>

      {isLoading ? (
        <Typography color="text.secondary">Loading...</Typography>
      ) : data?.destinations.length === 0 ? (
        <Card>
          <CardContent sx={{ textAlign: 'center', py: 8 }}>
            <StorageIcon sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
            <Typography variant="h6" color="text.secondary">
              No storage destinations configured
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1, mb: 3 }}>
              Add a storage backend to start accepting WebDAV file transfers.
            </Typography>
            <Button variant="contained" startIcon={<AddIcon />} onClick={() => setDialogOpen(true)}>
              Add Your First Storage
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={3}>
          {data?.destinations.map((dest) => {
            const meta = providerMeta[dest.provider_type] || providerMeta.local;
            return (
              <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={dest.id}>
                <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                  <CardContent sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
                      <Box
                        sx={{
                          p: 1,
                          borderRadius: 1.5,
                          bgcolor: `${meta.color}14`,
                          color: meta.color,
                          display: 'flex',
                        }}
                      >
                        {meta.icon}
                      </Box>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" fontWeight={600}>
                          {dest.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {meta.label}
                        </Typography>
                      </Box>
                      <Chip
                        label={dest.is_active ? 'Active' : 'Inactive'}
                        size="small"
                        color={dest.is_active ? 'success' : 'default'}
                        variant="outlined"
                      />
                    </Box>

                    <Box
                      sx={{
                        p: 1.5,
                        borderRadius: 1,
                        bgcolor: 'action.hover',
                        mb: 2,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                      }}
                    >
                      <LinkIcon fontSize="small" color="action" />
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {getConfigSummary(dest.config, dest.provider_type)}
                      </Typography>
                    </Box>

                    <Typography variant="caption" color="text.secondary">
                      Created {new Date(dest.created_at).toLocaleDateString()}
                    </Typography>
                  </CardContent>
                  <Divider />
                  <Box sx={{ px: 2, py: 1.5, display: 'flex', gap: 1 }}>
                    <Button
                      size="small"
                      startIcon={<PlayArrowIcon />}
                      onClick={() => testMutation.mutate(dest.id)}
                      color="success"
                    >
                      Test
                    </Button>
                    <Button
                      size="small"
                      startIcon={<FolderOpenIcon />}
                      onClick={() => { setExplorerStorage({ id: dest.id, name: dest.name }); setExplorerOpen(true); }}
                    >
                      Explore
                    </Button>
                    <Box sx={{ flex: 1 }} />
                    <IconButton
                      size="small"
                      color="error"
                      onClick={() => deleteMutation.mutate(dest.id)}
                      aria-label="delete storage"
                    >
                      <DeleteIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Create Storage Dialog — Stepper */}
      <Dialog
        open={dialogOpen}
        onClose={() => { setDialogOpen(false); setActiveStep(0); }}
        maxWidth="sm"
        fullWidth
      >
        <form onSubmit={handleCreate}>
          <DialogTitle>Add Storage Destination</DialogTitle>
          <DialogContent>
            <Stepper activeStep={activeStep} sx={{ mb: 3, mt: 1 }}>
              <Step><StepLabel>Provider</StepLabel></Step>
              <Step><StepLabel>Connection</StepLabel></Step>
            </Stepper>

            <Collapse in={activeStep === 0}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField
                  label="Display Name"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  placeholder="e.g. Production Backups"
                  helperText="A friendly name for this storage destination"
                />
                <TextField
                  label="Provider Type"
                  select
                  value={form.provider_type}
                  onChange={(e) => setForm({ ...form, provider_type: e.target.value, config: {} })}
                >
                  <MenuItem value="local">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <FolderIcon fontSize="small" color="success" /> Local Filesystem
                    </Box>
                  </MenuItem>
                  <MenuItem value="s3">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CloudIcon fontSize="small" sx={{ color: '#ff9800' }} /> AWS S3 / S3-Compatible
                    </Box>
                  </MenuItem>
                  <MenuItem value="azure">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <CloudIcon fontSize="small" sx={{ color: '#0078d4' }} /> Azure Blob Storage
                    </Box>
                  </MenuItem>
                  <MenuItem value="nfs">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <StorageIcon fontSize="small" color="secondary" /> NFS Mount
                    </Box>
                  </MenuItem>
                </TextField>
              </Box>
            </Collapse>

            <Collapse in={activeStep === 1}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Alert severity="info" sx={{ mb: 1 }}>
                  Configure the connection details for your {providerMeta[form.provider_type]?.label || 'storage'} backend.
                </Alert>
                <ProviderConfigFields
                  providerType={form.provider_type}
                  config={form.config}
                  onChange={(config) => setForm({ ...form, config })}
                />
              </Box>
            </Collapse>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 2 }}>
            <Button onClick={() => { setDialogOpen(false); setActiveStep(0); }}>Cancel</Button>
            {activeStep === 0 ? (
              <Button
                variant="contained"
                onClick={() => setActiveStep(1)}
                disabled={!form.name}
              >
                Next
              </Button>
            ) : (
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button onClick={() => setActiveStep(0)}>Back</Button>
                <Button type="submit" variant="contained" disabled={createMutation.isPending}>
                  Create
                </Button>
              </Box>
            )}
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

      {/* Storage Explorer */}
      {explorerStorage && (
        <StorageExplorer
          open={explorerOpen}
          onClose={() => setExplorerOpen(false)}
          storageId={explorerStorage.id}
          storageName={explorerStorage.name}
        />
      )}
    </Box>
  );
}
