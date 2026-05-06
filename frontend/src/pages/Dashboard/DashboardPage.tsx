import {
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  Skeleton,
  Tooltip,
  Typography,
} from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  Legend,
} from 'recharts';
import StorageIcon from '@mui/icons-material/Storage';
import PeopleIcon from '@mui/icons-material/People';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import WarningIcon from '@mui/icons-material/Warning';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import LinkIcon from '@mui/icons-material/Link';
import { useQuery } from '@tanstack/react-query';
import { getDashboardStats, getActivityReport, getSLAReport } from '@/api/reports';
import { useAuthStore } from '@/stores/auth';
import { useState } from 'react';

function StatCard({
  title,
  value,
  icon,
  color,
  loading,
  subtitle,
}: {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  color: string;
  loading?: boolean;
  subtitle?: string;
}) {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2, py: 3 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            bgcolor: `${color}14`,
            color,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {icon}
        </Box>
        <Box sx={{ flex: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {title}
          </Typography>
          {loading ? (
            <Skeleton width={60} height={32} />
          ) : (
            <Typography variant="h5" fontWeight="bold">
              {value}
            </Typography>
          )}
          {subtitle && (
            <Typography variant="caption" color="text.secondary">
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}

function ConnectCard() {
  const { user } = useAuthStore();
  const [copied, setCopied] = useState(false);
  const webdavUrl = `${window.location.origin}/dav/${user?.username || 'your-username'}/`;

  const handleCopy = () => {
    navigator.clipboard.writeText(webdavUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card
      sx={{
        background: (theme) =>
          theme.palette.mode === 'light'
            ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
            : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        color: 'white',
      }}
    >
      <CardContent sx={{ py: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
          <LinkIcon />
          <Typography variant="h6" fontWeight={600}>
            WebDAV Connection
          </Typography>
        </Box>
        <Typography variant="body2" sx={{ opacity: 0.85, mb: 2 }}>
          Connect any WebDAV client using the URL below:
        </Typography>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            p: 1.5,
            borderRadius: 1,
            bgcolor: 'rgba(255,255,255,0.15)',
            backdropFilter: 'blur(4px)',
          }}
        >
          <Typography
            variant="body2"
            sx={{ flex: 1, fontFamily: 'monospace', fontSize: 13, wordBreak: 'break-all' }}
          >
            {webdavUrl}
          </Typography>
          <Tooltip title={copied ? 'Copied!' : 'Copy URL'}>
            <IconButton size="small" onClick={handleCopy} sx={{ color: 'white' }}>
              <ContentCopyIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
        <Box sx={{ mt: 2, display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label="Basic Auth" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
          <Chip label="Bearer Token" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
          <Chip label="All Clients" size="small" sx={{ bgcolor: 'rgba(255,255,255,0.2)', color: 'white' }} />
        </Box>
      </CardContent>
    </Card>
  );
}

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: getDashboardStats,
  });

  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['activity-report'],
    queryFn: () => getActivityReport(7),
  });

  const { data: slaData } = useQuery({
    queryKey: ['sla-report'],
    queryFn: getSLAReport,
  });

  return (
    <Box>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" fontWeight={700}>
          Dashboard
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Overview of your WebDAV server
        </Typography>
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Total Users"
            value={stats?.total_users ?? 0}
            icon={<PeopleIcon />}
            color="#1976d2"
            loading={statsLoading}
            subtitle={`${stats?.active_users ?? 0} active`}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Storage Backends"
            value={stats?.total_storage_destinations ?? 0}
            icon={<StorageIcon />}
            color="#2e7d32"
            loading={statsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="Transfers Today"
            value={stats?.transfers_today ?? 0}
            icon={<CloudUploadIcon />}
            color="#ed6c02"
            loading={statsLoading}
          />
        </Grid>
        <Grid size={{ xs: 12, sm: 6, md: 3 }}>
          <StatCard
            title="SLA Violations"
            value={slaData?.total_violations ?? 0}
            icon={<WarningIcon />}
            color="#d32f2f"
            loading={statsLoading}
            subtitle={slaData?.total_violations ? 'Action needed' : 'All compliant'}
          />
        </Grid>
      </Grid>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid size={{ xs: 12, md: 8 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Weekly Activity
              </Typography>
              {activityLoading ? (
                <Skeleton variant="rectangular" height={280} sx={{ borderRadius: 1 }} />
              ) : activityData?.activity?.length === 0 ? (
                <Box sx={{ height: 280, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Typography color="text.secondary">No activity data yet</Typography>
                </Box>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <BarChart data={activityData?.activity || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <RechartsTooltip />
                    <Legend />
                    <Bar dataKey="uploads" fill="#1976d2" name="Uploads" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="downloads" fill="#2e7d32" name="Downloads" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <ConnectCard />
        </Grid>
      </Grid>

      <Grid container spacing={3}>
        <Grid size={12}>
          <Card>
            <CardContent>
              <Typography variant="h6" fontWeight={600} sx={{ mb: 2 }}>
                Transfer Trend (7 days)
              </Typography>
              {activityLoading ? (
                <Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
              ) : (
                <ResponsiveContainer width="100%" height={200}>
                  <LineChart data={activityData?.activity || []}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="date" fontSize={12} />
                    <YAxis fontSize={12} />
                    <RechartsTooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="uploads"
                      stroke="#1976d2"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Uploads"
                    />
                    <Line
                      type="monotone"
                      dataKey="downloads"
                      stroke="#2e7d32"
                      strokeWidth={2}
                      dot={{ r: 4 }}
                      name="Downloads"
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
