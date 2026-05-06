import { Box, Card, CardContent, Chip, Grid, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Skeleton } from '@mui/material';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import { useQuery } from '@tanstack/react-query';
import { getActivityReport, getStorageUsage, getSLAReport } from '@/api/reports';

const COLORS = ['#1976d2', '#2e7d32', '#ed6c02', '#d32f2f', '#9c27b0'];

export default function ReportsPage() {
  const { data: activityData, isLoading: activityLoading } = useQuery({
    queryKey: ['reports-activity'],
    queryFn: () => getActivityReport(14),
  });

  const { data: storageData, isLoading: storageLoading } = useQuery({
    queryKey: ['reports-storage-usage'],
    queryFn: getStorageUsage,
  });

  const { data: slaData, isLoading: slaLoading } = useQuery({
    queryKey: ['reports-sla'],
    queryFn: getSLAReport,
  });

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Reports & Analytics
      </Typography>

      <Grid container spacing={3}>
        {/* Activity Chart */}
        <Grid size={{ xs: 12, md: 8 }}>
          <Card>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Activity (Last 14 Days)
              </Typography>
              {activityLoading ? (
                <Skeleton variant="rectangular" height={300} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={activityData?.activity || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="uploads" fill="#1976d2" name="Uploads" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="downloads" fill="#2e7d32" name="Downloads" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="deletes" fill="#d32f2f" name="Deletes" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* Storage Usage Pie */}
        <Grid size={{ xs: 12, md: 4 }}>
          <Card sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Storage Usage
              </Typography>
              {storageLoading ? (
                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto' }} />
              ) : storageData?.usage.length === 0 ? (
                <Typography color="text.secondary" sx={{ textAlign: 'center', mt: 4 }}>
                  No storage data available
                </Typography>
              ) : (
                <ResponsiveContainer width="100%" height={280}>
                  <PieChart>
                    <Pie
                      data={storageData?.usage || []}
                      dataKey="total_bytes"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      label={({ name }) => name}
                    >
                      {storageData?.usage.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${(value / 1024 / 1024).toFixed(1)} MB`} />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>
        </Grid>

        {/* SLA Compliance */}
        <Grid size={12}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2 }}>
                <Typography variant="h6">SLA Compliance</Typography>
                {!slaLoading && (
                  <>
                    <Chip
                      label={`${slaData?.total_compliant ?? 0} Compliant`}
                      color="success"
                      size="small"
                    />
                    <Chip
                      label={`${slaData?.total_violations ?? 0} Violations`}
                      color="error"
                      size="small"
                    />
                  </>
                )}
              </Box>
              {slaLoading ? (
                <Skeleton variant="rectangular" height={200} />
              ) : (
                <TableContainer component={Paper} variant="outlined">
                  <Table size="small">
                    <TableHead>
                      <TableRow>
                        <TableCell>Username</TableCell>
                        <TableCell>Last Activity</TableCell>
                        <TableCell>Status</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {[...(slaData?.violations || []), ...(slaData?.compliant || [])].map((entry) => (
                        <TableRow key={entry.user_id}>
                          <TableCell>{entry.username}</TableCell>
                          <TableCell>
                            {entry.last_activity
                              ? new Date(entry.last_activity).toLocaleString()
                              : 'Never'}
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={entry.last_activity && new Date(entry.last_activity) > new Date(Date.now() - 86400000) ? 'Compliant' : 'Violation'}
                              size="small"
                              color={entry.last_activity && new Date(entry.last_activity) > new Date(Date.now() - 86400000) ? 'success' : 'error'}
                              variant="outlined"
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!slaData?.violations?.length && !slaData?.compliant?.length) && (
                        <TableRow>
                          <TableCell colSpan={3} align="center">No SLA data available</TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
