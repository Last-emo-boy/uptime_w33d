import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Link as RouterLink, useParams } from 'react-router-dom';
import { 
  Typography, Paper, Container, Box, Chip, Stack, LinearProgress,
  Accordion, AccordionSummary, AccordionDetails, Link
} from '@mui/material';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, Activity, Globe, Server, Radio, Gamepad2, Container as ContainerIcon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { motion } from 'framer-motion';

interface PublicMonitor {
  id: number;
  name: string;
  type: string;
  last_status: string;
  last_checked_at: string;
  uptime_24h: number;
  certificate_expiry?: string;
  group_name?: string;
}

interface Incident {
  id: number;
  title: string;
  status: string;
  impact: string;
  start_time: string;
  created_at: string;
}

interface StatusPageConfig {
  id: number;
  title: string;
  description: string;
  theme: string;
  custom_css: string;
  slug: string;
}

interface StatusResponse {
  system_status: string;
  monitors: PublicMonitor[];
  config?: StatusPageConfig;
}

interface HistoryPoint {
  created_at: string;
  response_time: number;
  status: string;
}

const MonitorHistoryChart = ({ monitorId }: { monitorId: number }) => {
  const { data: history } = useQuery<HistoryPoint[]>({
    queryKey: ['monitor_history', monitorId],
    queryFn: async () => {
      const res = await api.get(`/public/monitors/${monitorId}/history`);
      return res.data.map((p: HistoryPoint) => ({
        ...p,
        created_at: new Date(p.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      })).reverse();
    },
    staleTime: 60000,
  });

  if (!history || history.length === 0) return <Typography variant="caption" color="text.secondary">No history data available</Typography>;

  return (
    <div style={{ width: '100%', height: 160 }}>
      <ResponsiveContainer>
        <AreaChart data={history}>
          <defs>
            <linearGradient id="colorRt" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
          <XAxis 
            dataKey="created_at" 
            tick={{ fontSize: 11, fill: '#94a3b8' }} 
            axisLine={false}
            tickLine={false}
          />
          <YAxis 
            tick={{ fontSize: 11, fill: '#94a3b8' }} 
            axisLine={false}
            tickLine={false}
          />
          <Tooltip 
            contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
            labelStyle={{ color: '#64748b' }}
          />
          <Area 
            type="monotone" 
            dataKey="response_time" 
            stroke="#6366f1" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorRt)" 
            name="Response Time (ms)" 
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

const MonitorIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'http': return <Globe size={20} className="text-blue-500" />;
    case 'http_keyword': return <Globe size={20} className="text-blue-500" />;
    case 'http_json': return <Globe size={20} className="text-blue-500" />;
    case 'tcp': return <Server size={20} className="text-purple-500" />;
    case 'ping': return <Activity size={20} className="text-green-500" />;
    case 'push': return <Radio size={20} className="text-pink-500" />;
    case 'ws': return <Activity size={20} className="text-cyan-500" />;
    case 'steam': return <Gamepad2 size={20} className="text-indigo-500" />;
    case 'docker': return <ContainerIcon size={20} className="text-sky-600" />;
    default: return <Activity size={20} />;
  }
};

export default function StatusPage() {
  const { slug } = useParams<{ slug?: string }>();
  // const theme = useTheme();

  const { data: incidents } = useQuery<Incident[]>({
    queryKey: ['public_incidents'],
    queryFn: async () => {
      const res = await api.get('/public/incidents');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data, isLoading } = useQuery<StatusResponse>({
    queryKey: ['public_status', slug],
    queryFn: async () => {
      const url = slug ? `/public/status/${slug}` : '/public/status';
      const res = await api.get(url);
      return res.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LinearProgress sx={{ width: 200 }} />
    </Box>
  );

  const overallStatus = (!data?.monitors || data.monitors.length === 0 || data.monitors.every(m => m.last_status === 'up'))
    ? 'All Systems Operational' 
    : 'Some Systems Down';

  const isOperational = overallStatus === 'All Systems Operational';

  const pageTitle = data?.config?.title || 'Uptime W33d';
  const pageDesc = data?.config?.description || (isOperational ? 'Everything is running smoothly.' : 'We are currently experiencing issues.');

  // Group Monitors
  const groupedMonitors = (data?.monitors || []).reduce((acc, monitor) => {
    const group = monitor.group_name || 'Other Services';
    if (!acc[group]) acc[group] = [];
    acc[group].push(monitor);
    return acc;
  }, {} as Record<string, PublicMonitor[]>);

  const sortedGroups = Object.keys(groupedMonitors).sort((a, b) => {
    if (a === 'Other Services') return 1;
    if (b === 'Other Services') return -1;
    return a.localeCompare(b);
  });

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* Custom CSS Injection */}
      {data?.config?.custom_css && (
        <style dangerouslySetInnerHTML={{ __html: data.config.custom_css }} />
      )}

      {/* Navbar Placeholder */}
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2, mb: 6 }}>
        <Container maxWidth="md">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Activity size={32} className="text-indigo-600" />
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              {pageTitle}
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="md">
        {/* Hero Status */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <Paper 
            elevation={0}
            sx={{ 
              p: 4, 
              mb: 6,
              bgcolor: isOperational ? 'success.main' : 'error.main', 
              color: 'white', 
              borderRadius: 3,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)'
            }}
          >
            <Box>
              <Typography variant="h4" fontWeight="bold" gutterBottom>
                {overallStatus}
              </Typography>
              <Typography variant="subtitle1" sx={{ opacity: 0.9 }}>
                {pageDesc}
              </Typography>
            </Box>
            {isOperational ? <CheckCircle size={64} opacity={0.8} /> : <AlertCircle size={64} opacity={0.8} />}
          </Paper>
        </motion.div>

        {/* Active Incidents */}
        {incidents && incidents.length > 0 && (
          <Box sx={{ mb: 6 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
              Active Incidents
            </Typography>
            <Stack spacing={2}>
              {incidents.map((incident) => (
                <Paper 
                  key={incident.id} 
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    borderLeft: 6, 
                    borderColor: 'warning.main',
                    bgcolor: 'warning.light',
                    bgOpacity: 0.1
                  }}
                >
                  <Typography variant="h6" fontWeight="bold" gutterBottom>
                    {incident.title}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 2 }}>
                    {incident.impact}
                  </Typography>
                  <Chip label={incident.status} color="warning" size="small" />
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {/* Monitor Groups */}
        {sortedGroups.map((groupName) => (
          <Box key={groupName} sx={{ mb: 5 }}>
            <Typography 
              variant="h6" 
              fontWeight="bold" 
              color="text.secondary" 
              gutterBottom 
              sx={{ mb: 2, px: 1, textTransform: 'uppercase', fontSize: '0.85rem', letterSpacing: 1 }}
            >
              {groupName}
            </Typography>
            
            <Stack spacing={2}>
              {groupedMonitors[groupName].map((monitor) => (
                <Accordion 
                  key={monitor.id} 
                  disableGutters 
                  elevation={0}
                  sx={{ 
                    border: '1px solid',
                    borderColor: 'divider',
                    borderRadius: '12px !important',
                    '&:before': { display: 'none' },
                    overflow: 'hidden',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(0,0,0,0.05)'
                    }
                  }}
                >
                  <AccordionSummary expandIcon={<ChevronDown size={20} />}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between" width="100%" pr={2}>
                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ 
                          p: 1, 
                          borderRadius: 2, 
                          bgcolor: monitor.last_status === 'up' ? 'success.light' : 'error.light',
                          color: monitor.last_status === 'up' ? 'success.dark' : 'error.dark',
                          bgOpacity: 0.2
                        }}>
                          <MonitorIcon type={monitor.type} />
                        </Box>
                        <Box>
                          <Typography fontWeight="600" variant="body1">
                            {monitor.name}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            {monitor.certificate_expiry && (
                              <Chip 
                                label={`SSL: ${new Date(monitor.certificate_expiry).toLocaleDateString()}`} 
                                size="small" 
                                variant="outlined" 
                                sx={{ height: 20, fontSize: '0.65rem' }} 
                              />
                            )}
                          </Stack>
                        </Box>
                      </Stack>

                      <Stack direction="row" alignItems="center" spacing={2}>
                        <Box sx={{ width: 100, display: { xs: 'none', sm: 'block' } }}>
                          <LinearProgress 
                            variant="determinate" 
                            value={monitor.uptime_24h} 
                            color={monitor.uptime_24h > 98 ? "success" : monitor.uptime_24h > 90 ? "warning" : "error"}
                            sx={{ height: 6, borderRadius: 3 }} 
                          />
                        </Box>
                        <Typography 
                          fontWeight="bold" 
                          color={monitor.last_status === 'up' ? 'success.main' : 'error.main'}
                        >
                          {monitor.last_status === 'up' ? 'Operational' : 'Down'}
                        </Typography>
                      </Stack>
                    </Stack>
                  </AccordionSummary>
                  <AccordionDetails sx={{ bgcolor: 'background.paper', borderTop: 1, borderColor: 'divider', p: 3 }}>
                    <Typography variant="subtitle2" gutterBottom>Response Time (Last 50 Checks)</Typography>
                    <Box sx={{ height: 200, width: '100%' }}>
                      <MonitorHistoryChart monitorId={monitor.id} />
                    </Box>
                  </AccordionDetails>
                </Accordion>
              ))}
            </Stack>
          </Box>
        ))}

        <Box sx={{ mt: 8, textAlign: 'center', pb: 4 }}>
          <Typography variant="body2" color="text.secondary">
            Powered by <span style={{ fontWeight: 600, color: '#6366f1' }}>Uptime W33d</span> &copy; {new Date().getFullYear()}
            {' • '}
            <Link component={RouterLink} to="/login" color="inherit" underline="hover">
              Admin Login
            </Link>
          </Typography>
        </Box>
      </Container>
    </Box>
  );
}
