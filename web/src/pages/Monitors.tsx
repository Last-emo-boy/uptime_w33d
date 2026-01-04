import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { 
  Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, 
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  MenuItem, Stack, Box, Avatar
} from '@mui/material';
import { Plus, Pencil, Trash2, Globe, Server, Activity, Radio, Copy } from 'lucide-react';

// --- Types & Schema ---

const monitorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['http', 'tcp', 'ping', 'dns', 'push']),
  target: z.string().optional(),
  interval: z.coerce.number().min(10, 'Minimum interval is 10s'),
  timeout: z.coerce.number().min(1),
  expected_status: z.string().optional(),
});

type MonitorForm = z.infer<typeof monitorSchema>;

interface Monitor extends MonitorForm {
  id: number;
  last_status: string;
  enabled: boolean;
  push_token?: string;
}

const MonitorIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'http': return <Globe size={18} />;
    case 'tcp': return <Server size={18} />;
    case 'ping': return <Activity size={18} />;
    case 'push': return <Radio size={18} />;
    default: return <Activity size={18} />;
  }
};

// --- Component ---

export default function Monitors() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: monitors, isLoading } = useQuery<Monitor[]>({
    queryKey: ['monitors'],
    queryFn: async () => {
      const res = await api.get('/monitors');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: MonitorForm) => api.post('/monitors', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: MonitorForm }) => api.put(`/monitors/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitors'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/monitors/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitors'] }),
  });

  const { control, handleSubmit, reset, setValue, watch } = useForm<MonitorForm>({
    resolver: zodResolver(monitorSchema) as any,
    defaultValues: {
      name: '',
      type: 'http',
      target: '',
      interval: 60,
      timeout: 10,
      expected_status: '200',
    },
  });

  const type = watch('type');

  const handleOpen = (monitor?: Monitor) => {
    if (monitor) {
      setEditingId(monitor.id);
      setValue('name', monitor.name);
      setValue('type', monitor.type);
      setValue('target', monitor.target);
      setValue('interval', monitor.interval);
      setValue('timeout', monitor.timeout);
      setValue('expected_status', monitor.expected_status || '');
    } else {
      setEditingId(null);
      reset({
        name: '',
        type: 'http',
        target: '',
        interval: 60,
        timeout: 10,
        expected_status: '200',
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = (data: MonitorForm) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this monitor?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Monitors</Typography>
          <Typography variant="body2" color="text.secondary">Manage your uptime checks</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus />} 
          onClick={() => handleOpen()}
          sx={{ px: 3, py: 1 }}
        >
          Add Monitor
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Name & Target</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Interval</TableCell>
              <TableCell align="right" sx={{ pr: 3 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {monitors?.map((monitor) => (
              <TableRow key={monitor.id} hover>
                <TableCell sx={{ pl: 3 }}>
                  <Stack direction="row" spacing={2} alignItems="center">
                    <Avatar sx={{ bgcolor: 'background.default', color: 'primary.main', borderRadius: 2 }}>
                      <MonitorIcon type={monitor.type} />
                    </Avatar>
                    <Box>
                      <Typography variant="subtitle2" fontWeight="bold">{monitor.name}</Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 200 }} noWrap>
                        {monitor.target}
                      </Typography>
                      {monitor.type === 'push' && (
                        <Stack direction="row" alignItems="center" spacing={0.5} sx={{ mt: 0.5 }}>
                          <Typography variant="caption" sx={{ fontFamily: 'monospace', bgcolor: 'grey.100', px: 0.5, borderRadius: 0.5 }}>
                            {monitor.push_token?.substring(0, 8)}...
                          </Typography>
                          <Copy size={12} className="cursor-pointer text-gray-400 hover:text-gray-600" />
                        </Stack>
                      )}
                    </Box>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={monitor.last_status || 'Unknown'} 
                    color={monitor.last_status === 'up' ? 'success' : monitor.last_status === 'down' ? 'error' : 'default'} 
                    size="small"
                    sx={{ fontWeight: 600, minWidth: 80 }}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={monitor.type} 
                    size="small" 
                    variant="outlined" 
                    sx={{ textTransform: 'uppercase', borderColor: 'divider' }} 
                  />
                </TableCell>
                <TableCell>
                  <Typography variant="body2" color="text.secondary">Every {monitor.interval}s</Typography>
                </TableCell>
                <TableCell align="right" sx={{ pr: 3 }}>
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <IconButton size="small" onClick={() => handleOpen(monitor)} sx={{ color: 'text.secondary' }}>
                      <Pencil size={18} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(monitor.id)} sx={{ opacity: 0.8 }}>
                      <Trash2 size={18} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {monitors?.length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">No monitors found. Create one to get started.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {editingId ? 'Edit Monitor' : 'New Monitor'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2.5}>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField 
                    {...field} 
                    label="Friendly Name" 
                    fullWidth 
                    error={!!fieldState.error} 
                    helperText={fieldState.error?.message} 
                    placeholder="e.g. Production API"
                  />
                )}
              />
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Monitor Type" fullWidth>
                    <MenuItem value="http">HTTP(s) - Website / API</MenuItem>
                    <MenuItem value="tcp">TCP - Port Check</MenuItem>
                    <MenuItem value="ping">Ping - Server Reachability</MenuItem>
                    <MenuItem value="dns">DNS - Resolve Check</MenuItem>
                    <MenuItem value="push">Push - Heartbeat</MenuItem>
                  </TextField>
                )}
              />
              {type !== 'push' && (
                 <Controller
                 name="target"
                 control={control}
                 render={({ field, fieldState }) => (
                   <TextField 
                     {...field} 
                     label={type === 'http' ? 'URL' : 'Hostname / IP'} 
                     placeholder={type === 'http' ? 'https://example.com' : '1.1.1.1'}
                     fullWidth 
                     error={!!fieldState.error} 
                     helperText={fieldState.error?.message} 
                   />
                 )}
               />
              )}
             
              <Stack direction="row" spacing={2}>
                <Controller
                  name="interval"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField 
                      {...field} 
                      type="number" 
                      label="Check Interval (s)" 
                      fullWidth 
                      error={!!fieldState.error} 
                      helperText={fieldState.error?.message} 
                    />
                  )}
                />
                <Controller
                  name="timeout"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField 
                      {...field} 
                      type="number" 
                      label="Timeout (s)" 
                      fullWidth 
                      error={!!fieldState.error} 
                      helperText={fieldState.error?.message} 
                    />
                  )}
                />
              </Stack>

              {type === 'http' && (
                <Controller
                  name="expected_status"
                  control={control}
                  render={({ field }) => (
                    <TextField 
                      {...field} 
                      label="Expected Status Code" 
                      placeholder="200" 
                      helperText="Leave empty for 2xx" 
                      fullWidth 
                    />
                  )}
                />
              )}
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} color="inherit" sx={{ mr: 1 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ px: 4 }}>Save Monitor</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
