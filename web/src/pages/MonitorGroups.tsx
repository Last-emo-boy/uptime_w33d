import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { 
  Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, 
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Stack, Box
} from '@mui/material';
import { Plus, Pencil, Trash2, Folder } from 'lucide-react';

const groupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  order: z.coerce.number().default(0),
});

type GroupForm = z.infer<typeof groupSchema>;

interface MonitorGroup extends GroupForm {
  id: number;
}

export default function MonitorGroups() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: groups, isLoading } = useQuery<MonitorGroup[]>({
    queryKey: ['monitor-groups'],
    queryFn: async () => {
      const res = await api.get('/monitor-groups');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: GroupForm) => api.post('/monitor-groups', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor-groups'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: GroupForm }) => api.put(`/monitor-groups/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['monitor-groups'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/monitor-groups/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['monitor-groups'] }),
  });

  const { control, handleSubmit, reset, setValue } = useForm<GroupForm>({
    resolver: zodResolver(groupSchema) as any,
    defaultValues: {
      name: '',
      order: 0,
    },
  });

  const handleOpen = (group?: MonitorGroup) => {
    if (group) {
      setEditingId(group.id);
      setValue('name', group.name);
      setValue('order', group.order);
    } else {
      setEditingId(null);
      reset({ name: '', order: 0 });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = (data: GroupForm) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure? Monitors in this group will be ungrouped.')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Monitor Groups</Typography>
          <Typography variant="body2" color="text.secondary">Categorize your monitors</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus />} 
          onClick={() => handleOpen()}
          sx={{ px: 3, py: 1 }}
        >
          Add Group
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Group Name</TableCell>
              <TableCell>Order</TableCell>
              <TableCell align="right" sx={{ pr: 3 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {groups?.map((group) => (
              <TableRow key={group.id} hover>
                <TableCell sx={{ pl: 3 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Folder size={20} className="text-indigo-500" />
                    <Typography variant="subtitle2" fontWeight="bold">{group.name}</Typography>
                  </Stack>
                </TableCell>
                <TableCell>{group.order}</TableCell>
                <TableCell align="right" sx={{ pr: 3 }}>
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <IconButton size="small" onClick={() => handleOpen(group)} sx={{ color: 'text.secondary' }}>
                      <Pencil size={18} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(group.id)} sx={{ opacity: 0.8 }}>
                      <Trash2 size={18} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {groups?.length === 0 && (
              <TableRow>
                <TableCell colSpan={3} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">No groups found.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {editingId ? 'Edit Group' : 'New Group'}
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
                    label="Group Name" 
                    fullWidth 
                    error={!!fieldState.error} 
                    helperText={fieldState.error?.message} 
                    placeholder="e.g. API Services"
                  />
                )}
              />
              <Controller
                name="order"
                control={control}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    type="number"
                    label="Sort Order" 
                    fullWidth 
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} color="inherit" sx={{ mr: 1 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ px: 4 }}>Save Group</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
