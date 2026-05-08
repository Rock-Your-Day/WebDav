import { useState } from 'react';
import {
  Box,
  Button,
  Card,
  Chip,
  MenuItem,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
} from '@mui/material';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import CloudDownloadIcon from '@mui/icons-material/CloudDownload';
import DeleteIcon from '@mui/icons-material/Delete';
import CreateNewFolderIcon from '@mui/icons-material/CreateNewFolder';
import DriveFileMoveIcon from '@mui/icons-material/DriveFileMove';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { listActivity } from '@/api/activity';
import apiClient from '@/api/client';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

const actionIcons: Record<string, React.ReactNode> = {
  upload: <CloudUploadIcon fontSize="small" color="primary" />,
  download: <CloudDownloadIcon fontSize="small" color="success" />,
  delete: <DeleteIcon fontSize="small" color="error" />,
  mkdir: <CreateNewFolderIcon fontSize="small" color="info" />,
  move: <DriveFileMoveIcon fontSize="small" color="warning" />,
  copy: <ContentCopyIcon fontSize="small" color="secondary" />,
};

const actionColors: Record<string, 'primary' | 'success' | 'error' | 'info' | 'warning' | 'secondary' | 'default'> = {
  upload: 'primary',
  download: 'success',
  delete: 'error',
  mkdir: 'info',
  move: 'warning',
  copy: 'secondary',
};

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '—';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

export default function ActivityPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [actionFilter, setActionFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['activity', page, rowsPerPage, actionFilter],
    queryFn: () =>
      listActivity(page * rowsPerPage, rowsPerPage, undefined, actionFilter || undefined),
  });

  const clearMutation = useMutation({
    mutationFn: () => apiClient.delete('/activity/'),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['activity'] }),
  });

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Box>
          <Typography variant="h4">Activity Log</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
            Audit trail of all file operations
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <TextField
            select
            size="small"
            value={actionFilter}
            onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
            sx={{ minWidth: 150 }}
            label="Filter"
          >
            <MenuItem value="">All Actions</MenuItem>
            <MenuItem value="upload">Uploads</MenuItem>
            <MenuItem value="download">Downloads</MenuItem>
            <MenuItem value="delete">Deletes</MenuItem>
            <MenuItem value="mkdir">Directories</MenuItem>
            <MenuItem value="move">Moves</MenuItem>
            <MenuItem value="copy">Copies</MenuItem>
          </TextField>
          <Button
            variant="outlined"
            color="error"
            size="small"
            startIcon={<DeleteSweepIcon />}
            onClick={() => { if (confirm('Clear all activity logs?')) clearMutation.mutate(); }}
            disabled={clearMutation.isPending || !data?.total}
          >
            Clear
          </Button>
        </Box>
      </Box>

      <Card>
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Action</TableCell>
                <TableCell>File Path</TableCell>
                <TableCell>Size</TableCell>
                <TableCell>Timestamp</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">Loading...</TableCell>
                </TableRow>
              ) : data?.entries.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography color="text.secondary" sx={{ py: 4 }}>
                      No activity recorded yet. Transfer files via WebDAV to see activity here.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                data?.entries.map((entry) => (
                  <TableRow key={entry.id} hover>
                    <TableCell>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {actionIcons[entry.action]}
                        <Chip
                          label={entry.action}
                          size="small"
                          color={actionColors[entry.action] || 'default'}
                          variant="outlined"
                        />
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12 }}>
                        {entry.file_path}
                      </Typography>
                    </TableCell>
                    <TableCell>{formatBytes(entry.file_size)}</TableCell>
                    <TableCell>
                      <Typography variant="body2" color="text.secondary">
                        {entry.timestamp ? new Date(entry.timestamp).toLocaleString() : '—'}
                      </Typography>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
        {data && data.total > rowsPerPage && (
          <TablePagination
            component="div"
            count={data.total}
            page={page}
            onPageChange={(_, p) => setPage(p)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value)); setPage(0); }}
            rowsPerPageOptions={[10, 25, 50, 100]}
          />
        )}
      </Card>
    </Box>
  );
}
