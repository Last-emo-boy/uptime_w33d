import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { 
  Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, 
  Button, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  Stack, Box, Link, Select, MenuItem, InputLabel, FormControl, OutlinedInput, Checkbox, ListItemText
} from '@mui/material';
import { Plus, Pencil, Trash2, ExternalLink } from 'lucide-react';
import { Link as RouterLink } from 'react-router-dom';

// --- Types & Schema ---

const statusPageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().min(1, 'Slug is required').regex(/^[a-z0-9-]+$/, 'Slug must be lowercase alphanumeric with dashes'),
  description: z.string().optional(),
  theme: z.enum(['light', 'dark']).default('light'),
  custom_css: z.string().optional(),
  monitor_ids: z.array(z.number()).default([]),
});

type StatusPageForm = z.infer<typeof statusPageSchema>;

interface StatusPage extends StatusPageForm {
  id: number;
  public: boolean;
  monitors?: { id: number; name: string }[];
}

interface Monitor {
  id: number;
  name: string;
}

// --- Component ---

export default function StatusPages() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);

  const { data: pages, isLoading } = useQuery<StatusPage[]>({
    queryKey: ['status-pages'],
    queryFn: async () => {
      const res = await api.get('/status-pages');
      return res.data;
    },
  });

  const { data: monitors } = useQuery<Monitor[]>({
    queryKey: ['monitors'],
    queryFn: async () => {
      const res = await api.get('/monitors');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: StatusPageForm) => api.post('/status-pages', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-pages'] });
      handleClose();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: number; data: StatusPageForm }) => api.put(`/status-pages/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['status-pages'] });
      handleClose();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/status-pages/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['status-pages'] }),
  });

  const { control, handleSubmit, reset, setValue } = useForm<StatusPageForm>({
    resolver: zodResolver(statusPageSchema) as any,
    defaultValues: {
      title: '',
      slug: '',
      description: '',
      theme: 'light',
      custom_css: '',
      monitor_ids: [],
    },
  });

  const handleOpen = (page?: StatusPage) => {
    if (page) {
      setEditingId(page.id);
      setValue('title', page.title);
      setValue('slug', page.slug);
      setValue('description', page.description || '');
      setValue('theme', page.theme as 'light' | 'dark');
      setValue('custom_css', page.custom_css || '');
      setValue('monitor_ids', page.monitors?.map(m => m.id) || []);
    } else {
      setEditingId(null);
      reset({
        title: '',
        slug: '',
        description: '',
        theme: 'light',
        custom_css: '',
        monitor_ids: [],
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingId(null);
    reset();
  };

  const onSubmit = (data: StatusPageForm) => {
    if (editingId) {
      updateMutation.mutate({ id: editingId, data });
    } else {
      createMutation.mutate(data);
    }
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this status page?')) {
      deleteMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
        <Box>
          <Typography variant="h4" fontWeight="bold">Status Pages</Typography>
          <Typography variant="body2" color="text.secondary">Manage your public status pages</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<Plus />} 
          onClick={() => handleOpen()}
          sx={{ px: 3, py: 1 }}
        >
          Create Page
        </Button>
      </Stack>

      <TableContainer component={Paper} elevation={1} sx={{ borderRadius: 3, overflow: 'hidden' }}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ pl: 3 }}>Title</TableCell>
              <TableCell>Slug / URL</TableCell>
              <TableCell>Monitors</TableCell>
              <TableCell align="right" sx={{ pr: 3 }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {pages?.map((page) => (
              <TableRow key={page.id} hover>
                <TableCell sx={{ pl: 3 }}>
                  <Typography variant="subtitle2" fontWeight="bold">{page.title}</Typography>
                  <Typography variant="caption" color="text.secondary">{page.description}</Typography>
                </TableCell>
                <TableCell>
                  <Stack direction="row" alignItems="center" spacing={1}>
                    <Chip label={`/${page.slug}`} size="small" sx={{ fontFamily: 'monospace' }} />
                    <Link component={RouterLink} to={`/status/${page.slug}`} target="_blank">
                      <ExternalLink size={14} />
                    </Link>
                  </Stack>
                </TableCell>
                <TableCell>
                  <Chip label={`${page.monitors?.length || 0} Monitors`} size="small" variant="outlined" />
                </TableCell>
                <TableCell align="right" sx={{ pr: 3 }}>
                  <Stack direction="row" justifyContent="flex-end" spacing={1}>
                    <IconButton size="small" onClick={() => handleOpen(page)} sx={{ color: 'text.secondary' }}>
                      <Pencil size={18} />
                    </IconButton>
                    <IconButton size="small" color="error" onClick={() => handleDelete(page.id)} sx={{ opacity: 0.8 }}>
                      <Trash2 size={18} />
                    </IconButton>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {pages?.length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 8 }}>
                  <Typography variant="body1" color="text.secondary">No status pages found. Create one to get started.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: 3 } }}>
        <DialogTitle sx={{ pb: 1 }}>
          <Typography variant="h6" fontWeight="bold">
            {editingId ? 'Edit Status Page' : 'New Status Page'}
          </Typography>
        </DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2.5}>
              <Controller
                name="title"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField 
                    {...field} 
                    label="Page Title" 
                    fullWidth 
                    error={!!fieldState.error} 
                    helperText={fieldState.error?.message} 
                    placeholder="My Status Page"
                  />
                )}
              />
              <Controller
                name="slug"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField 
                    {...field} 
                    label="Slug (URL Path)" 
                    fullWidth 
                    error={!!fieldState.error} 
                    helperText={fieldState.error?.message || "e.g. 'production' -> /status/production"} 
                    placeholder="production"
                  />
                )}
              />
              <Controller
                name="description"
                control={control}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Description" 
                    fullWidth 
                    multiline
                    minRows={2}
                    placeholder="Brief description for the status page header"
                  />
                )}
              />
              
              <Controller
                name="monitor_ids"
                control={control}
                render={({ field }) => (
                  <FormControl fullWidth>
                    <InputLabel>Select Monitors</InputLabel>
                    <Select
                      {...field}
                      multiple
                      input={<OutlinedInput label="Select Monitors" />}
                      renderValue={(selected) => (
                        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                          {(selected as number[]).map((value) => {
                            const m = monitors?.find(m => m.id === value);
                            return <Chip key={value} label={m?.name || value} size="small" />;
                          })}
                        </Box>
                      )}
                    >
                      {monitors?.map((monitor) => (
                        <MenuItem key={monitor.id} value={monitor.id}>
                          <Checkbox checked={(field.value as number[]).indexOf(monitor.id) > -1} />
                          <ListItemText primary={monitor.name} />
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                )}
              />

              <Controller
                name="custom_css"
                control={control}
                render={({ field }) => (
                  <TextField 
                    {...field} 
                    label="Custom CSS" 
                    fullWidth 
                    multiline
                    minRows={3}
                    placeholder="body { background: #f0f0f0; }"
                    helperText="Advanced: Inject custom CSS styles"
                  />
                )}
              />
            </Stack>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleClose} color="inherit" sx={{ mr: 1 }}>Cancel</Button>
            <Button type="submit" variant="contained" sx={{ px: 4 }}>Save Page</Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
