import { useState } from 'react';
import {
  Box,
  Breadcrumbs,
  Chip,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Skeleton,
  Typography,
} from '@mui/material';
import FolderIcon from '@mui/icons-material/Folder';
import InsertDriveFileIcon from '@mui/icons-material/InsertDriveFile';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import NavigateNextIcon from '@mui/icons-material/NavigateNext';
import StorageIcon from '@mui/icons-material/Storage';
import { useQuery } from '@tanstack/react-query';
import { browseStorage } from '@/api/storage';

interface StorageExplorerProps {
  open: boolean;
  onClose: () => void;
  storageId: string;
  storageName: string;
}

function formatBytes(bytes: number | null): string {
  if (bytes === null || bytes === 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let i = 0;
  let size = bytes;
  while (size >= 1024 && i < units.length - 1) {
    size /= 1024;
    i++;
  }
  return `${size.toFixed(1)} ${units[i]}`;
}

function formatDate(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

export default function StorageExplorer({ open, onClose, storageId, storageName }: StorageExplorerProps) {
  const [currentPath, setCurrentPath] = useState('');

  const { data, isLoading, error } = useQuery({
    queryKey: ['storage-browse', storageId, currentPath],
    queryFn: () => browseStorage(storageId, currentPath),
    enabled: open,
  });

  const pathParts = currentPath.split('/').filter(Boolean);

  return (
    <Dialog open={open} onClose={() => { onClose(); setCurrentPath(''); }} maxWidth="md" fullWidth>
      <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        <StorageIcon color="primary" />
        <Box sx={{ flex: 1 }}>
          <Typography variant="h6">{storageName}</Typography>
          {data && (
            <Typography variant="caption" color="text.secondary">
              {data.stats.total_files} files, {data.stats.total_dirs} folders
              {data.stats.total_size > 0 && ` • ${formatBytes(data.stats.total_size)}`}
            </Typography>
          )}
        </Box>
      </DialogTitle>
      <DialogContent sx={{ p: 0, minHeight: 400 }}>
        {/* Breadcrumb navigation */}
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1, borderBottom: 1, borderColor: 'divider' }}>
          {data?.parent_path !== null && currentPath && (
            <IconButton size="small" onClick={() => setCurrentPath(data?.parent_path || '')}>
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          )}
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ flex: 1 }}>
            <Chip
              label="/"
              size="small"
              onClick={() => setCurrentPath('')}
              variant={currentPath === '' ? 'filled' : 'outlined'}
              color={currentPath === '' ? 'primary' : 'default'}
              sx={{ cursor: 'pointer' }}
            />
            {pathParts.map((part, i) => (
              <Chip
                key={i}
                label={part}
                size="small"
                onClick={() => setCurrentPath(pathParts.slice(0, i + 1).join('/'))}
                variant={i === pathParts.length - 1 ? 'filled' : 'outlined'}
                color={i === pathParts.length - 1 ? 'primary' : 'default'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Breadcrumbs>
        </Box>

        {/* File listing */}
        <Box sx={{ maxHeight: 450, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3, 4, 5].map((i) => (
                <Skeleton key={i} height={48} sx={{ mb: 0.5 }} />
              ))}
            </Box>
          ) : error ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="error">
                {(error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to browse storage'}
              </Typography>
            </Box>
          ) : data?.entries.length === 0 ? (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="text.secondary">This directory is empty</Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {/* Directories first */}
              {data?.entries
                .filter((e) => e.is_directory)
                .map((entry) => (
                  <ListItemButton
                    key={entry.path}
                    onClick={() => setCurrentPath(entry.path)}
                    sx={{ px: 2 }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <FolderIcon color="primary" fontSize="small" />
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.name}
                      secondary={entry.children_count !== null ? `${entry.children_count} items` : undefined}
                      primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(entry.modified)}
                    </Typography>
                  </ListItemButton>
                ))}
              {/* Then files */}
              {data?.entries
                .filter((e) => !e.is_directory)
                .map((entry) => (
                  <ListItemButton key={entry.path} sx={{ px: 2 }} disabled>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <InsertDriveFileIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.name}
                      secondary={formatBytes(entry.size)}
                      primaryTypographyProps={{ variant: 'body2' }}
                      secondaryTypographyProps={{ variant: 'caption' }}
                    />
                    <Typography variant="caption" color="text.secondary">
                      {formatDate(entry.modified)}
                    </Typography>
                  </ListItemButton>
                ))}
            </List>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
}
