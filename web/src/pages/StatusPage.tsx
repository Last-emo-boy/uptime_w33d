import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { Link as RouterLink } from 'react-router-dom';
import { 
  Typography, Paper, Container, Box, Chip, Stack, LinearProgress,
  Accordion, AccordionSummary, AccordionDetails, Link
} from '@mui/material';
import { CheckCircle, XCircle, AlertCircle, ChevronDown, Activity, Globe, Server, Radio } from 'lucide-react';
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
}

interface Incident {
  id: number;
  title: string;
  status: string;
  impact: string;
  start_time: string;
  created_at: string;
}

interface StatusResponse {
  system_status: string;
  monitors: PublicMonitor[];
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
    case 'tcp': return <Server size={20} className="text-purple-500" />;
    case 'ping': return <Activity size={20} className="text-green-500" />;
    case 'push': return <Radio size={20} className="text-pink-500" />;
    default: return <Activity size={20} />;
  }
};

export default function StatusPage() {
  const { data: incidents } = useQuery<Incident[]>({
    queryKey: ['public_incidents'],
    queryFn: async () => {
      const res = await api.get('/public/incidents');
      return res.data;
    },
    refetchInterval: 30000,
  });

  const { data, isLoading } = useQuery<StatusResponse>({
    queryKey: ['public_status'],
    queryFn: async () => {
      const res = await api.get('/public/status');
      return res.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) return (
    <Box sx={{ width: '100%', height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <LinearProgress sx={{ width: 200 }} />
    </Box>
  );

  const overallStatus = data?.monitors?.every(m => m.last_status === 'up') 
    ? 'All Systems Operational' 
    : 'Some Systems Down';

  const isOperational = overallStatus === 'All Systems Operational';

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: 'background.default', pb: 10 }}>
      {/* Navbar Placeholder */}
      <Box sx={{ bgcolor: 'white', borderBottom: 1, borderColor: 'divider', py: 2, mb: 6 }}>
        <Container maxWidth="md">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Activity size={32} className="text-indigo-600" />
            <Typography variant="h5" fontWeight="bold" color="text.primary">
              Uptime W33d
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
                {isOperational ? 'Everything is running smoothly.' : 'We are currently experiencing issues.'}
              </Typography>
            </Box>
            {isOperational ? <CheckCircle size={64} opacity={0.8} /> : <AlertCircle size={64} opacity={0.8} />}
          </Paper>
        </motion.div>

        {/* Incidents Section */}
        {incidents && incidents.length > 0 && (
          <Box sx={{ mb: 6 }}>
             <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 2 }}>
              Active Incidents
            </Typography>
            <Stack spacing={2}>
              {incidents.map((incident) => (
                <Paper 
                  key={incident.id}
                  elevation={0}
                  sx={{ 
                    p: 3, 
                    border: 1, 
                    borderColor: 'warning.light', 
                    bgcolor: '#fffbeb',
                    borderRadius: 3 
                  }}
                >
                  <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                    <AlertCircle size={20} className="text-amber-600" />
                    <Typography variant="h6" fontWeight="bold" color="warning.dark">
                      {incident.title}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    Started at: {new Date(incident.start_time).toLocaleString()}
                  </Typography>
                  <Chip 
                    label={incident.impact.toUpperCase()} 
                    size="small" 
                    color="warning" 
                    sx={{ mt: 2, fontWeight: 'bold' }} 
                  />
                </Paper>
              ))}
            </Stack>
          </Box>
        )}

        {/* Monitors List */}
        <Typography variant="h5" fontWeight="bold" gutterBottom sx={{ mb: 3 }}>
          System Metrics
        </Typography>
        
        <Stack spacing={3}>
          {data?.monitors?.map((monitor, index) => (
            <motion.div
              key={monitor.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <Accordion 
                elevation={0} 
                sx={{ 
                  border: 1, 
                  borderColor: 'divider', 
                  borderRadius: '12px !important',
                  overflow: 'hidden',
                  '&:before': { display: 'none' }
                }}
              >
                <AccordionSummary expandIcon={<ChevronDown className="text-slate-400" />}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" width="100%" pr={2}>
                    <Stack direction="row" alignItems="center" spacing={2}>
                      <Box sx={{ p: 1, bgcolor: 'background.default', borderRadius: 2 }}>
                        <MonitorIcon type={monitor.type} />
                      </Box>
                      <Box>
                        <Typography variant="h6" fontWeight="bold">
                          {monitor.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'uppercase', letterSpacing: 0.5 }}>
                          {monitor.type}
                        </Typography>
                      </Box>
                    </Stack>
                    
                    <Stack direction="row" spacing={3} alignItems="center">
                      {monitor.certificate_expiry && (
                        <Chip 
                          label={`SSL: ${new Date(monitor.certificate_expiry).toLocaleDateString()}`}
                          size="small"
                          variant="outlined"
                          color={new Date(monitor.certificate_expiry) < new Date(Date.now() + 7*24*60*60*1000) ? 'warning' : 'default'}
                        />
                      )}

                      <Box sx={{ textAlign: 'right', display: { xs: 'none', sm: 'block' } }}>
                        <Typography variant="body2" color="text.secondary">
                          Uptime (24h)
                        </Typography>
                        <Typography variant="body1" fontWeight="bold" color="success.main">
                          {monitor.uptime_24h}%
                        </Typography>
                      </Box>
                      
                      <Chip 
                        icon={monitor.last_status === 'up' ? <CheckCircle size={14} /> : <XCircle size={14} />}
                        label={monitor.last_status === 'up' ? 'Operational' : 'Down'} 
                        color={monitor.last_status === 'up' ? 'success' : 'error'} 
                        variant="filled"
                        size="small"
                        sx={{ fontWeight: 600, px: 1 }}
                      />
                    </Stack>
                  </Stack>
                </AccordionSummary>
                <AccordionDetails sx={{ bgcolor: '#f8fafc', p: 3 }}>
                  <Typography variant="subtitle2" gutterBottom color="text.secondary" sx={{ mb: 2 }}>
                    Response Time (Last 50 checks)
                  </Typography>
                  <MonitorHistoryChart monitorId={monitor.id} />
                </AccordionDetails>
              </Accordion>
            </motion.div>
          ))}
        </Stack>

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
