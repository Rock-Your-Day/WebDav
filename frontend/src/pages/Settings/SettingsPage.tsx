import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Snackbar,
  Switch,
  TextField,
  Typography,
  FormControlLabel,
} from '@mui/material';
import SaveIcon from '@mui/icons-material/Save';
import PaletteIcon from '@mui/icons-material/Palette';
import KeyIcon from '@mui/icons-material/Key';
import GroupIcon from '@mui/icons-material/Group';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTheme, updateTheme, type ThemeUpdateRequest } from '@/api/settings';
import { getOIDCConfig, updateOIDCConfig, getRoleMapping, updateRoleMapping, type OIDCConfigRequest, type RoleMappingRequest } from '@/api/oidc';
import { useThemeContext } from '@/theme/ThemeContext';

export default function SettingsPage() {
  const queryClient = useQueryClient();
  const { updateConfig } = useThemeContext();
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Theme form
  const [themeForm, setThemeForm] = useState<ThemeUpdateRequest>({
    app_name: 'OpenWebDav',
    primary_color: '#1976d2',
    secondary_color: '#dc004e',
    dark_mode_default: false,
  });

  // OIDC form
  const [oidcForm, setOidcForm] = useState<OIDCConfigRequest>({
    enabled: false,
    provider_url: '',
    client_id: '',
    client_secret: '',
    scopes: 'openid profile email',
    redirect_uri: '',
  });

  // Role mapping form
  const [roleForm, setRoleForm] = useState<RoleMappingRequest>({
    admin_groups: [],
    user_groups: [],
    readonly_groups: [],
    default_role: 'user',
  });
  const [adminGroupsInput, setAdminGroupsInput] = useState('');
  const [userGroupsInput, setUserGroupsInput] = useState('');
  const [readonlyGroupsInput, setReadonlyGroupsInput] = useState('');

  // Queries
  const { data: themeData } = useQuery({ queryKey: ['theme-settings'], queryFn: getTheme });
  const { data: oidcData } = useQuery({ queryKey: ['oidc-config'], queryFn: getOIDCConfig });
  const { data: roleData } = useQuery({ queryKey: ['role-mapping'], queryFn: getRoleMapping });

  useEffect(() => {
    if (themeData) {
      setThemeForm({
        app_name: themeData.app_name,
        primary_color: themeData.primary_color,
        secondary_color: themeData.secondary_color,
        dark_mode_default: themeData.dark_mode_default,
      });
    }
  }, [themeData]);

  useEffect(() => {
    if (oidcData) {
      setOidcForm({
        enabled: oidcData.enabled,
        provider_url: oidcData.provider_url || '',
        client_id: oidcData.client_id || '',
        client_secret: '',
        scopes: oidcData.scopes || 'openid profile email',
        redirect_uri: oidcData.redirect_uri || '',
      });
    }
  }, [oidcData]);

  useEffect(() => {
    if (roleData) {
      setRoleForm(roleData);
      setAdminGroupsInput(roleData.admin_groups.join(', '));
      setUserGroupsInput(roleData.user_groups.join(', '));
      setReadonlyGroupsInput(roleData.readonly_groups.join(', '));
    }
  }, [roleData]);

  // Mutations
  const themeMutation = useMutation({
    mutationFn: updateTheme,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['theme-settings'] });
      updateConfig({
        appName: data.app_name,
        primaryColor: data.primary_color,
        secondaryColor: data.secondary_color,
        darkModeDefault: data.dark_mode_default,
      });
      setSnackbar({ open: true, message: 'Theme saved', severity: 'success' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to save theme', severity: 'error' }),
  });

  const oidcMutation = useMutation({
    mutationFn: updateOIDCConfig,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['oidc-config'] });
      setSnackbar({ open: true, message: data.message || 'OIDC config saved', severity: 'info' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to save OIDC config', severity: 'error' }),
  });

  const roleMutation = useMutation({
    mutationFn: updateRoleMapping,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['role-mapping'] });
      setSnackbar({ open: true, message: data.message || 'Role mapping saved', severity: 'success' });
    },
    onError: () => setSnackbar({ open: true, message: 'Failed to save role mapping', severity: 'error' }),
  });

  const handleThemeSave = (e: React.FormEvent) => {
    e.preventDefault();
    themeMutation.mutate(themeForm);
  };

  const handleOidcSave = (e: React.FormEvent) => {
    e.preventDefault();
    oidcMutation.mutate(oidcForm);
  };

  const handleRoleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const parseGroups = (s: string) => s.split(',').map((g) => g.trim()).filter(Boolean);
    roleMutation.mutate({
      admin_groups: parseGroups(adminGroupsInput),
      user_groups: parseGroups(userGroupsInput),
      readonly_groups: parseGroups(readonlyGroupsInput),
      default_role: roleForm.default_role,
    });
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>Settings</Typography>

      <Grid container spacing={3}>
        {/* Theme & Branding */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <PaletteIcon color="primary" />
                <Typography variant="h6">Theme & Branding</Typography>
              </Box>
              <form onSubmit={handleThemeSave}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                  <TextField
                    label="Application Name"
                    value={themeForm.app_name || ''}
                    onChange={(e) => setThemeForm({ ...themeForm, app_name: e.target.value })}
                    helperText="Displayed in the sidebar and login page"
                  />
                  <TextField
                    label="Primary Color"
                    type="color"
                    value={themeForm.primary_color || '#1976d2'}
                    onChange={(e) => setThemeForm({ ...themeForm, primary_color: e.target.value })}
                    InputProps={{ sx: { height: 56 } }}
                  />
                  <TextField
                    label="Secondary Color"
                    type="color"
                    value={themeForm.secondary_color || '#dc004e'}
                    onChange={(e) => setThemeForm({ ...themeForm, secondary_color: e.target.value })}
                    InputProps={{ sx: { height: 56 } }}
                  />
                  <FormControlLabel
                    control={<Switch checked={themeForm.dark_mode_default || false} onChange={(e) => setThemeForm({ ...themeForm, dark_mode_default: e.target.checked })} />}
                    label="Dark mode by default"
                  />
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={themeMutation.isPending} sx={{ alignSelf: 'flex-start' }}>
                    Save Theme
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Preview */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>Preview</Typography>
              <Box sx={{ p: 3, borderRadius: 2, bgcolor: themeForm.primary_color, color: 'white', mb: 2 }}>
                <Typography variant="h6">{themeForm.app_name}</Typography>
                <Typography variant="body2" sx={{ opacity: 0.8 }}>Primary color preview</Typography>
              </Box>
              <Box sx={{ p: 3, borderRadius: 2, bgcolor: themeForm.secondary_color, color: 'white' }}>
                <Typography variant="body2">Secondary color preview</Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* OIDC Configuration */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <KeyIcon color="primary" />
                <Typography variant="h6">OIDC / SSO</Typography>
                <Chip label={oidcData?.enabled ? 'Enabled' : 'Disabled'} size="small" color={oidcData?.enabled ? 'success' : 'default'} variant="outlined" />
              </Box>
              <form onSubmit={handleOidcSave}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <FormControlLabel
                    control={<Switch checked={oidcForm.enabled} onChange={(e) => setOidcForm({ ...oidcForm, enabled: e.target.checked })} />}
                    label="Enable OIDC Authentication"
                  />
                  <TextField
                    label="Provider URL"
                    value={oidcForm.provider_url || ''}
                    onChange={(e) => setOidcForm({ ...oidcForm, provider_url: e.target.value })}
                    placeholder="https://keycloak.example.com/realms/myrealm"
                    helperText="OpenID Connect discovery endpoint base URL"
                    disabled={!oidcForm.enabled}
                  />
                  <TextField
                    label="Client ID"
                    value={oidcForm.client_id || ''}
                    onChange={(e) => setOidcForm({ ...oidcForm, client_id: e.target.value })}
                    disabled={!oidcForm.enabled}
                  />
                  <TextField
                    label="Client Secret"
                    type="password"
                    value={oidcForm.client_secret || ''}
                    onChange={(e) => setOidcForm({ ...oidcForm, client_secret: e.target.value })}
                    helperText={oidcData?.client_secret_set ? 'Secret is set. Leave empty to keep current.' : 'Enter client secret'}
                    disabled={!oidcForm.enabled}
                  />
                  <TextField
                    label="Scopes"
                    value={oidcForm.scopes || ''}
                    onChange={(e) => setOidcForm({ ...oidcForm, scopes: e.target.value })}
                    helperText="Space-separated OIDC scopes"
                    disabled={!oidcForm.enabled}
                  />
                  <TextField
                    label="Redirect URI (optional)"
                    value={oidcForm.redirect_uri || ''}
                    onChange={(e) => setOidcForm({ ...oidcForm, redirect_uri: e.target.value })}
                    placeholder="Auto-detected if empty"
                    disabled={!oidcForm.enabled}
                  />
                  <Alert severity="info" sx={{ mt: 1 }}>
                    Changes require an application restart to take effect.
                  </Alert>
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={oidcMutation.isPending} sx={{ alignSelf: 'flex-start' }}>
                    Save OIDC Config
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>

        {/* Role Mapping */}
        <Grid size={{ xs: 12, md: 6 }}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 3 }}>
                <GroupIcon color="primary" />
                <Typography variant="h6">OIDC Role Mapping</Typography>
              </Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Map OIDC groups/roles to OpenWebDav roles. Users are assigned the highest matching role on each login.
              </Typography>
              <form onSubmit={handleRoleSave}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  <TextField
                    label="Admin Groups"
                    value={adminGroupsInput}
                    onChange={(e) => setAdminGroupsInput(e.target.value)}
                    placeholder="admin, webdav-admins"
                    helperText="Comma-separated group names that grant admin role"
                  />
                  <TextField
                    label="User Groups"
                    value={userGroupsInput}
                    onChange={(e) => setUserGroupsInput(e.target.value)}
                    placeholder="users, webdav-users"
                    helperText="Comma-separated group names that grant user role"
                  />
                  <TextField
                    label="Read-Only Groups"
                    value={readonlyGroupsInput}
                    onChange={(e) => setReadonlyGroupsInput(e.target.value)}
                    placeholder="viewers, readonly"
                    helperText="Comma-separated group names that grant read-only role"
                  />
                  <TextField
                    label="Default Role"
                    select
                    value={roleForm.default_role}
                    onChange={(e) => setRoleForm({ ...roleForm, default_role: e.target.value })}
                    helperText="Role assigned when no group matches"
                    SelectProps={{ native: true }}
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                    <option value="readonly">Read Only</option>
                  </TextField>
                  <Button type="submit" variant="contained" startIcon={<SaveIcon />} disabled={roleMutation.isPending} sx={{ alignSelf: 'flex-start' }}>
                    Save Role Mapping
                  </Button>
                </Box>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar open={snackbar.open} autoHideDuration={4000} onClose={() => setSnackbar({ ...snackbar, open: false })}>
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({ ...snackbar, open: false })}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
