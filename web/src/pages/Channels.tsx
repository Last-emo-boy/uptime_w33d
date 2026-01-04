import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { 
  Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, 
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  MenuItem, Stack
} from '@mui/material';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const channelSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  type: z.enum(['webhook', 'email', 'discord', 'telegram']),
  config: z.string().min(1, 'Config is required').refine((val) => {
    try {
      JSON.parse(val);
      return true;
    } catch {
      return false;
    }
  }, 'Invalid JSON'),
  enabled: z.boolean().default(true),
});

type ChannelForm = z.infer<typeof channelSchema>;

interface Channel extends ChannelForm {
  id: number;
}

export default function Channels() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: channels, isLoading } = useQuery<Channel[]>({
    queryKey: ['channels'],
    queryFn: async () => {
      const res = await api.get('/channels');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: ChannelForm) => api.post('/channels', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: ChannelForm }) => api.put(`/channels/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['channels'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/channels/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['channels'] }),
  });

  const { control, handleSubmit, reset, setValue } = useForm<ChannelForm>({
    resolver: zodResolver(channelSchema) as any,
    defaultValues: {
      name: '',
      type: 'webhook',
      config: '{"url": "https://..."}',
      enabled: true,
    },
  });


  const handleOpen = (channel?: Channel) => {
    if (channel) {
      setEditingId(channel.id);
      setValue('name', channel.name);
      setValue('type', channel.type);
      setValue('config', channel.config);
      setValue('enabled', channel.enabled);
    } else {
      setEditingId(null);
      reset({
        name: '',
        type: 'webhook',
        config: '{"url": "https://..."}',
        enabled: true,
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = (data: ChannelForm) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Notification Channels</Typography>
        <Button variant="contained" startIcon={<Plus />} onClick={() => handleOpen()}>
          Add Channel
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Type</TableCell>
              <TableCell>Config</TableCell>
              <TableCell>Status</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {channels?.map((channel) => (
              <TableRow key={channel.id}>
                <TableCell>{channel.name}</TableCell>
                <TableCell><Chip label={channel.type} size="small" /></TableCell>
                <TableCell>
                  <Typography variant="caption" sx={{ fontFamily: 'monospace' }}>
                    {channel.config.substring(0, 50)}...
                  </Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={channel.enabled ? 'Enabled' : 'Disabled'} 
                    color={channel.enabled ? 'success' : 'default'} 
                    size="small" 
                  />
                </TableCell>
                <TableCell align="right">
                  <IconButton size="small" onClick={() => handleOpen(channel)}>
                    <Pencil size={18} />
                  </IconButton>
                  <IconButton size="small" color="error" onClick={() => handleDelete(channel.id)}>
                    <Trash2 size={18} />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>{editingId ? 'Edit Channel' : 'New Channel'}</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              <Controller
                name="name"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField 
                    {...field} 
                    label="Name" 
                    fullWidth 
                    error={!!fieldState.error} 
                    helperText={fieldState.error?.message} 
                  />
                )}
              />
              <Controller
                name="type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Type" fullWidth>
                    <MenuItem value="webhook">Webhook</MenuItem>
                    <MenuItem value="email">Email</MenuItem>
                    <MenuItem value="discord">Discord</MenuItem>
                    <MenuItem value="telegram">Telegram</MenuItem>
                  </TextField>
                )}
              />
              <Controller
                name="config"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField 
                    {...field} 
                    label="Config (JSON)" 
                    fullWidth 
                    multiline
                    rows={4}
                    error={!!fieldState.error} 
                    helperText={fieldState.error?.message} 
                  />
                )}
              />
              {/* {type === 'webhook' && ( ... )} */}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained">Save</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
