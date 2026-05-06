import { useState } from 'react';
import {
  Box,
  Breadcrumbs,
  Button,
  Chip,
  Dialog,
  DialogActions,
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
import { useQuery } from '@tanstack/react-query';
import { browseFilesystem } from '@/api/filesystem';

interface FolderPickerProps {
  open: boolean;
  onClose: () => void;
  onSelect: (path: string) => void;
  initialPath?: string;
}

export default function FolderPicker({ open, onClose, onSelect, initialPath = '/data' }: FolderPickerProps) {
  const [currentPath, setCurrentPath] = useState(initialPath);

  const { data, isLoading, error } = useQuery({
    queryKey: ['filesystem-browse', currentPath],
    queryFn: () => browseFilesystem(currentPath),
    enabled: open,
  });

  const pathParts = currentPath.split('/').filter(Boolean);

  const handleSelect = () => {
    onSelect(currentPath);
    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>Select Folder</DialogTitle>
      <DialogContent sx={{ p: 0 }}>
        {/* Breadcrumb navigation */}
        <Box sx={{ px: 2, py: 1.5, bgcolor: 'action.hover', display: 'flex', alignItems: 'center', gap: 1 }}>
          {data?.parent_path && (
            <IconButton size="small" onClick={() => setCurrentPath(data.parent_path!)}>
              <ArrowUpwardIcon fontSize="small" />
            </IconButton>
          )}
          <Breadcrumbs separator={<NavigateNextIcon fontSize="small" />} sx={{ flex: 1 }}>
            <Chip
              label="/"
              size="small"
              onClick={() => setCurrentPath('/data')}
              variant="outlined"
              sx={{ cursor: 'pointer' }}
            />
            {pathParts.map((part, i) => (
              <Chip
                key={i}
                label={part}
                size="small"
                onClick={() => setCurrentPath('/' + pathParts.slice(0, i + 1).join('/'))}
                variant={i === pathParts.length - 1 ? 'filled' : 'outlined'}
                color={i === pathParts.length - 1 ? 'primary' : 'default'}
                sx={{ cursor: 'pointer' }}
              />
            ))}
          </Breadcrumbs>
        </Box>

        {/* Current path display */}
        <Box sx={{ px: 2, py: 1, borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: 12, color: 'text.secondary' }}>
            {currentPath}
          </Typography>
        </Box>

        {/* Directory listing */}
        <Box sx={{ maxHeight: 350, overflow: 'auto' }}>
          {isLoading ? (
            <Box sx={{ p: 2 }}>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} height={40} sx={{ mb: 0.5 }} />
              ))}
            </Box>
          ) : error ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="error">
                {(error as { response?: { data?: { detail?: string } } })?.response?.data?.detail || 'Failed to browse directory'}
              </Typography>
            </Box>
          ) : data?.entries.filter((e) => e.is_directory).length === 0 ? (
            <Box sx={{ p: 3, textAlign: 'center' }}>
              <Typography color="text.secondary">No subdirectories</Typography>
            </Box>
          ) : (
            <List dense disablePadding>
              {data?.entries
                .filter((entry) => entry.is_directory)
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
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItemButton>
                ))}
              {data?.entries
                .filter((entry) => !entry.is_directory)
                .slice(0, 5)
                .map((entry) => (
                  <ListItemButton key={entry.path} disabled sx={{ px: 2, opacity: 0.5 }}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <InsertDriveFileIcon fontSize="small" color="action" />
                    </ListItemIcon>
                    <ListItemText
                      primary={entry.name}
                      primaryTypographyProps={{ variant: 'body2' }}
                    />
                  </ListItemButton>
                ))}
            </List>
          )}
        </Box>
      </DialogContent>
      <DialogActions sx={{ px: 2, py: 1.5 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSelect}>
          Select: {currentPath}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
