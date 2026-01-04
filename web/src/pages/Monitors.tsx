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
import { Plus, Pencil, Trash2, Globe, Server, Activity, Radio, Copy, Gamepad2, Container, Shield } from 'lucide-react';

// --- Types & Schema ---

const monitorSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['http', 'http_keyword', 'http_json', 'tcp', 'ws', 'steam', 'docker', 'ping', 'dns', 'push']),
  target: z.string().optional(),
  interval: z.coerce.number().min(10, 'Minimum interval is 10s'),
  timeout: z.coerce.number().min(1),
  max_retries: z.coerce.number().min(0).default(1),
  expected_status: z.string().optional(),
  method: z.string().optional(),
  headers: z.string().optional(),
  body: z.string().optional(),
  keyword: z.string().optional(),
  json_path: z.string().optional(),
  json_value: z.string().optional(),
  group_id: z.number().optional(),
});

type MonitorForm = z.infer<typeof monitorSchema>;

interface Monitor extends MonitorForm {
  id: number;
  last_status: string;
  enabled: boolean;
  push_token?: string;
  group_id?: number;
}

interface MonitorGroup {
  id: number;
  name: string;
}

const MonitorIcon = ({ type }: { type: string }) => {
  switch (type) {
    case 'http': return <Globe size={18} />;
    case 'http_keyword': return <Globe size={18} />;
    case 'http_json': return <Globe size={18} />;
     case 'ws': return <Activity size={18} />;
    case 'steam': return <Gamepad2 size={18} />;
    case 'docker': return <Container size={18} />;
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
  const [badgeOpen, setBadgeOpen] = useState(false);
  const [selectedMonitor, setSelectedMonitor] = useState<Monitor | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: monitors, isLoading } = useQuery<Monitor[]>({
    queryKey: ['monitors'],
    queryFn: async () => {
      const res = await api.get('/monitors');
      return res.data;
    },
  });

  const { data: groups } = useQuery<MonitorGroup[]>({
    queryKey: ['monitor-groups'],
    queryFn: async () => {
      const res = await api.get('/monitor-groups');
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
      max_retries: 1,
      expected_status: '200',
      method: 'GET',
      headers: '',
      body: '',
      keyword: '',
      json_path: '',
      json_value: '',
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
      setValue('max_retries', (monitor as any).max_retries ?? 1);
      setValue('expected_status', monitor.expected_status || '');
      setValue('method', (monitor as any).method || 'GET');
      setValue('headers', (monitor as any).headers || '');
      setValue('body', (monitor as any).body || '');
      setValue('keyword', (monitor as any).keyword || '');
      setValue('json_path', (monitor as any).json_path || '');
      setValue('json_value', (monitor as any).json_value || '');
      setValue('group_id', monitor.group_id);
    } else {
      setEditingId(null);
      reset({
        name: '',
        type: 'http',
        target: '',
        interval: 60,
        timeout: 10,
        max_retries: 1,
        expected_status: '200',
        method: 'GET',
        headers: '',
        body: '',
        keyword: '',
        json_path: '',
        json_value: '',
        group_id: undefined,
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

  const handleBadge = (monitor: Monitor) => {
    setSelectedMonitor(monitor);
    setBadgeOpen(true);
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
                    <IconButton size="small" onClick={() => handleBadge(monitor)} sx={{ color: 'text.secondary' }}>
                      <Shield size={18} />
                    </IconButton>
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

      <Dialog open={badgeOpen} onClose={() => setBadgeOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">Status Badge</Typography>
        </DialogTitle>
        <DialogContent>
           <Box sx={{ my: 2, display: 'flex', justifyContent: 'center' }}>
             <img src={`/api/badge/${selectedMonitor?.id}/status.svg`} alt="Status Badge" />
           </Box>
           <Typography variant="subtitle2" gutterBottom>Markdown</Typography>
           <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all', mb: 2 }}>
             [![Status](http://{window.location.host}/api/badge/{selectedMonitor?.id}/status.svg)](http://{window.location.host}/status/default)
           </Box>
           <Typography variant="subtitle2" gutterBottom>HTML</Typography>
           <Box sx={{ p: 2, bgcolor: 'grey.100', borderRadius: 2, fontFamily: 'monospace', fontSize: '0.85rem', wordBreak: 'break-all' }}>
             &lt;img src="http://{window.location.host}/api/badge/{selectedMonitor?.id}/status.svg" alt="Status" /&gt;
           </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setBadgeOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

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
                name="group_id"
                control={control}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    select 
                    label="Monitor Group" 
                    fullWidth
                    helperText="Optional: Group monitors together on status page"
                    value={field.value || ''}
                    onChange={(e) => field.onChange(e.target.value ? Number(e.target.value) : undefined)}
                  >
                    <MenuItem value=""><em>None</em></MenuItem>
                    {groups?.map((group) => (
                      <MenuItem key={group.id} value={group.id}>{group.name}</MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Monitor Type" fullWidth>
                    <MenuItem value="http">HTTP(s) - Website / API</MenuItem>
                    <MenuItem value="http_keyword">HTTP(s) - Keyword Check</MenuItem>
                    <MenuItem value="http_json">HTTP(s) - JSON Query</MenuItem>
                    <MenuItem value="ws">WebSocket (ws/wss)</MenuItem>
                    <MenuItem value="steam">Steam Game Server</MenuItem>
                    <MenuItem value="docker">Docker Container</MenuItem>
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
                     label={type === 'http' || type === 'http_keyword' || type === 'http_json' ? 'URL' : type === 'ws' ? 'WebSocket URL' : type === 'docker' ? 'Docker Host' : 'Hostname / IP'} 
                     placeholder={type === 'http' || type === 'http_keyword' || type === 'http_json' ? 'https://example.com' : type === 'ws' ? 'wss://echo.websocket.org' : type === 'docker' ? 'local' : '1.1.1.1'}
                     fullWidth 
                     error={!!fieldState.error} 
                     helperText={type === 'docker' ? 'Use "local" for local socket or "tcp://host:port" for remote' : fieldState.error?.message}
                   />
                 )}
               />
              )}
             
              {type === 'http_keyword' && (
                <Controller
                  name="keyword"
                  control={control}
                  render={({ field }) => (
                    <TextField 
                      {...field} 
                      label="Keyword to Find" 
                      placeholder="e.g. System Operational" 
                      fullWidth 
                      helperText="Monitor will be DOWN if this keyword is missing from response body"
                    />
                  )}
                />
              )}

              {type === 'http_json' && (
                <Stack spacing={2}>
                  <Controller
                    name="json_path"
                    control={control}
                    render={({ field }) => (
                      <TextField 
                        {...field} 
                        label="JSON Path (GJSON syntax)" 
                        placeholder="e.g. data.status" 
                        fullWidth 
                      />
                    )}
                  />
                  <Controller
                    name="json_value"
                    control={control}
                    render={({ field }) => (
                      <TextField 
                        {...field} 
                        label="Expected Value" 
                        placeholder="e.g. active" 
                        fullWidth 
                      />
                    )}
                  />
                </Stack>
              )}
              
              {(type === 'http' || type === 'http_keyword' || type === 'http_json') && (
                <Stack spacing={2}>
                   <Stack direction="row" spacing={2}>
                    <Controller
                      name="method"
                      control={control}
                      render={({ field }) => (
                        <TextField 
                          {...field} 
                          select 
                          label="Method" 
                          sx={{ minWidth: 100 }}
                        >
                          <MenuItem value="GET">GET</MenuItem>
                          <MenuItem value="POST">POST</MenuItem>
                          <MenuItem value="PUT">PUT</MenuItem>
                          <MenuItem value="PATCH">PATCH</MenuItem>
                          <MenuItem value="DELETE">DELETE</MenuItem>
                          <MenuItem value="HEAD">HEAD</MenuItem>
                        </TextField>
                      )}
                    />
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
                  </Stack>
                  
                  <Controller
                    name="headers"
                    control={control}
                    render={({ field }) => (
                      <TextField 
                        {...field} 
                        label="Custom Headers (JSON)" 
                        placeholder='{"Authorization": "Bearer token"}' 
                        fullWidth 
                        multiline
                        minRows={2}
                      />
                    )}
                  />

                  <Controller
                    name="body"
                    control={control}
                    render={({ field }) => (
                      <TextField 
                        {...field} 
                        label="Request Body" 
                        placeholder='{"key": "value"}' 
                        fullWidth 
                        multiline
                        minRows={2}
                      />
                    )}
                  />
                </Stack>
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
                 <Controller
                  name="max_retries"
                  control={control}
                  render={({ field, fieldState }) => (
                    <TextField 
                      {...field} 
                      type="number" 
                      label="Max Retries" 
                      fullWidth 
                      error={!!fieldState.error} 
                      helperText={fieldState.error?.message || "Retries on failure before alert"} 
                    />
                  )}
                />
              </Stack>
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
