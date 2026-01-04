import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';
import { 
  Typography, Paper, Box, Stack, LinearProgress, Chip, 
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow 
} from '@mui/material';
import { 
  Activity, ArrowUpCircle, ArrowDownCircle, Clock, 
  CheckCircle, XCircle 
} from 'lucide-react';

interface Monitor {
  id: number;
  name: string;
  type: string;
  last_status: string;
  last_checked_at: string;
  interval: number;
}

const StatCard = ({ title, value, icon: Icon, color, subtext }: any) => (
  <Paper elevation={0} sx={{ p: 3, height: '100%', borderRadius: 3, border: 1, borderColor: 'divider' }}>
    <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
      <Box>
        <Typography variant="subtitle2" color="text.secondary" fontWeight="bold" gutterBottom>
          {title}
        </Typography>
        <Typography variant="h4" fontWeight="bold">
          {value}
        </Typography>
        {subtext && (
           <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
             {subtext}
           </Typography>
        )}
      </Box>
      <Box sx={{ p: 1.5, borderRadius: 2, bgcolor: `${color}.50`, color: `${color}.main` }}>
        <Icon size={24} />
      </Box>
    </Stack>
  </Paper>
);

export default function Dashboard() {
  const { data: monitors, isLoading } = useQuery<Monitor[]>({
    queryKey: ['monitors'],
    queryFn: async () => {
      const res = await api.get('/monitors');
      return res.data;
    },
    refetchInterval: 30000,
  });

  if (isLoading) return <LinearProgress />;

  const total = monitors?.length || 0;
  const up = monitors?.filter(m => m.last_status === 'up').length || 0;
  const down = monitors?.filter(m => m.last_status === 'down').length || 0;
  const uptime = total > 0 ? ((up / total) * 100).toFixed(1) : '0.0';

  return (
    <Box>
      <Typography variant="h4" fontWeight="bold" sx={{ mb: 4 }}>Dashboard</Typography>
      
      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr 1fr' }, gap: 3, mb: 4 }}>
        <Box>
          <StatCard 
            title="Total Monitors" 
            value={total} 
            icon={Activity} 
            color="primary" 
            subtext="Active checks"
          />
        </Box>
        <Box>
          <StatCard 
            title="Systems Up" 
            value={up} 
            icon={ArrowUpCircle} 
            color="success" 
            subtext={`${uptime}% operational`}
          />
        </Box>
        <Box>
          <StatCard 
            title="Systems Down" 
            value={down} 
            icon={ArrowDownCircle} 
            color="error" 
            subtext="Current outages"
          />
        </Box>
        <Box>
          <StatCard 
            title="Avg Response" 
            value="45ms" 
            icon={Clock} 
            color="info" 
            subtext="Last 24 hours"
          />
        </Box>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '2fr 1fr' }, gap: 3 }}>
        <Box>
          <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: 'divider' }}>
             <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
               Monitor Status
             </Typography>
             <TableContainer>
               <Table>
                 <TableHead>
                   <TableRow>
                     <TableCell>Name</TableCell>
                     <TableCell>Type</TableCell>
                     <TableCell>Status</TableCell>
                     <TableCell align="right">Last Checked</TableCell>
                   </TableRow>
                 </TableHead>
                 <TableBody>
                   {monitors?.slice(0, 5).map((m) => (
                     <TableRow key={m.id} hover>
                       <TableCell sx={{ fontWeight: 500 }}>{m.name}</TableCell>
                       <TableCell>
                         <Chip label={m.type} size="small" variant="outlined" sx={{ textTransform: 'uppercase', fontSize: 10 }} />
                       </TableCell>
                       <TableCell>
                         <Stack direction="row" alignItems="center" spacing={1}>
                           {m.last_status === 'up' ? (
                             <CheckCircle size={16} className="text-green-500" />
                           ) : (
                             <XCircle size={16} className="text-red-500" />
                           )}
                           <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>
                             {m.last_status}
                           </Typography>
                         </Stack>
                       </TableCell>
                       <TableCell align="right" sx={{ color: 'text.secondary', fontSize: 12 }}>
                         {m.last_checked_at ? new Date(m.last_checked_at).toLocaleTimeString() : 'Never'}
                       </TableCell>
                     </TableRow>
                   ))}
                 </TableBody>
               </Table>
             </TableContainer>
          </Paper>
        </Box>
        <Box>
           <Paper elevation={0} sx={{ p: 3, borderRadius: 3, border: 1, borderColor: 'divider', height: '100%' }}>
             <Typography variant="h6" fontWeight="bold" sx={{ mb: 3 }}>
               Recent Activity
             </Typography>
             <Stack spacing={2}>
               {/* Mock Activity Stream */}
               {[1, 2, 3].map((i) => (
                 <Stack key={i} direction="row" spacing={2} alignItems="center">
                   <Box sx={{ p: 1, bgcolor: 'grey.100', borderRadius: '50%' }}>
                     <Activity size={16} className="text-gray-500" />
                   </Box>
                   <Box>
                     <Typography variant="body2" fontWeight={500}>System check completed</Typography>
                     <Typography variant="caption" color="text.secondary">All systems normal • 2m ago</Typography>
                   </Box>
                 </Stack>
               ))}
             </Stack>
           </Paper>
        </Box>
      </Box>
    </Box>
  );
}
