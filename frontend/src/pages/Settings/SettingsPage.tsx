import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Snackbar,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PaletteIcon from '@mui/icons-material/Palette';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTheme, updateTheme, type ThemeUpdateRequest } from '@/api/settings';
import { useThemeContext } from '@/theme/ThemeContext';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { updateConfig } = useThemeContext();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const [form, setForm] = useState<ThemeUpdateRequest>({
    app_name: 'OpenWebDav',
    primary_color: '#1976d2',
    secondary_color: '#dc004e',
    dark_mode_default: false,
  });

  const { data: themeData } = useQuery({
    queryKey: ['theme-settings'],
    queryFn: getTheme,
  });

  useEffect(() => {
    if (themeData) {
      setForm({
        app_name: themeData.app_name,
        primary_color: themeData.primary_color,
        secondary_color: themeData.secondary_color,
        dark_mode_default: themeData.dark_mode_default,
      });
    }
  }, [themeData]);

  const saveMutation = useMutation({
    mutationFn: updateTheme,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['theme-settings'] });
      // Apply theme changes live
      updateConfig({
        appName: data.app_name,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        darkModeDefault: data.dark_mode_default,
      });
      setSnackbar({ open: true, message: 'Settings saved successfully', severity: 'success' });
    },
    onError: () => {
      setSnackbar({ open: true, message: 'Failed to save settings', severity: 'error' });
    },
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(form);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Settings
      </Typography>

      <Grid container spacing={3}>
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <PaletteIcon color="primary" />
                <Typography variant="h6">Theme & Branding</Typography>
              </Box>
              <form onSubmit={handleSave}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Application Name"
                    value={form.app_name || ''}
                    onChange={(e) => setForm({ ...form, app_name: e.target.value })}
                    helperText="Displayed in the sidebar and login page"
                  />
                  <TextField
                    label="Primary Color"
                    type="color"
                    value={form.primary_color || '#1976d2'}
                    onChange={(e) => setForm({ ...form, primary_color: e.target.value })}
                    InputProps={{ sx: { height: 56 } }}
                    helperText="Main brand color used for buttons and accents"
                  />
                  <TextField
                    label="Secondary Color"
                    type="color"
                    value={form.secondary_color || '#dc004e'}
                    onChange={(e) => setForm({ ...form, secondary_color: e.target.value })}
                    InputProps={{ sx: { height: 56 } }}
                    helperText="Secondary accent color"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={form.dark_mode_default || false}
                        onChange={(e) => setForm({ ...form, dark_mode_default: e.target.checked })}
                      />
                    }
                    label="Dark mode by default"
                  />
                  <Button
                    type="submit"
                    variant="contained"
                    startIcon={<SaveIcon />}
                    disabled={saveMutation.isPending}
                    sx={{ alignSelf: 'flex-start' }}
                  >
                    Save Changes
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Preview
              </Typography>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: form.primary_color,
                  color: 'white',
                  mb: 2,
                }}
              >
                <Typography variant="h6">{form.app_name}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>
                  Primary color preview
                </Typography>
              </Box>
              <Box
                sx={{
                  p: 3,
                  borderRadius: 2,
                  bgcolor: form.secondary_color,
                  color: 'white',
                }}
              >
                <Typography variant="body2">Secondary color preview</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

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
