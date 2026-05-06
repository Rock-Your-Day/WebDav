import { Box, Card, CardContent, Typography, Alert } from '@mui/material';
import SecurityIcon from '@mui/icons-material/Security';

export default function AccessControlPage() {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Access Control
      </Typography>

      <Alert severity="info" sx={{ mb: 3 }}>
        Configure which users have access to which storage destinations and their permission levels.
      </Alert>

      <Card>
        <CardContent sx={{ textAlign: 'center', py: 6 }}>
          <SecurityIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            Access Control Matrix
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Create users and storage destinations first, then configure access permissions here.
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
}
