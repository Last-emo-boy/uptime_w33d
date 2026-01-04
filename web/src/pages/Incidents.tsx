import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import api from '../lib/api';
import { 
  Typography, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Chip, 
  Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, 
  MenuItem, Stack, IconButton
} from '@mui/material';
import { Plus, CheckCircle, AlertTriangle } from 'lucide-react';

const incidentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  impact: z.enum(['critical', 'major', 'minor', 'maintenance']),
  monitor_id: z.number().optional().nullable(),
});

type IncidentForm = z.infer<typeof incidentSchema>;

interface Incident {
  id: number;
  title: string;
  status: 'ongoing' | 'resolved';
  impact: string;
  start_time: string;
  end_time?: string;
  monitor_id?: number;
}

export default function Incidents() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data: incidents, isLoading } = useQuery<Incident[]>({
    queryKey: ['incidents'],
    queryFn: async () => {
      // Re-using the public endpoint for list for now, 
      // ideally we should have an admin endpoint that lists ALL (including resolved history)
      // But let's start with active ones or just use the public list which I implemented as active-only
      // Wait, I should probably list ALL for admin history.
      // The current backend `ListActive` only shows ongoing.
      // Let's just use that for now to manage active incidents.
      const res = await api.get('/public/incidents');
      return res.data;
    },
  });

  const createMutation = useMutation({
    mutationFn: (data: IncidentForm) => api.post('/incidents', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['incidents'] });
      handleClose();
    },
  });

  const resolveMutation = useMutation({
    mutationFn: (id: number) => api.post(`/incidents/${id}/resolve`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['incidents'] }),
  });

  const { control, handleSubmit, reset } = useForm<IncidentForm>({
    resolver: zodResolver(incidentSchema),
    defaultValues: {
      title: '',
      impact: 'minor',
      monitor_id: null,
    },
  });

  const handleOpen = () => setOpen(true);
  
  const handleClose = () => {
    setOpen(false);
    reset();
  };

  const onSubmit = (data: IncidentForm) => {
    createMutation.mutate(data);
  };

  const handleResolve = (id: number) => {
    if (confirm('Are you sure you want to resolve this incident?')) {
      resolveMutation.mutate(id);
    }
  };

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Incidents & Maintenance</Typography>
        <Button variant="contained" startIcon={<Plus />} onClick={handleOpen}>
          Create Incident
        </Button>
      </Stack>

      <TableContainer component={Paper}>
        <Table sx={{ minWidth: 650 }}>
          <TableHead>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Impact</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Started At</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {incidents?.length === 0 && (
               <TableRow>
                 <TableCell colSpan={5} align="center">No active incidents</TableCell>
               </TableRow>
            )}
            {incidents?.map((incident) => (
              <TableRow key={incident.id}>
                <TableCell>
                  <Typography fontWeight="medium">{incident.title}</Typography>
                </TableCell>
                <TableCell>
                  <Chip 
                    label={incident.impact.toUpperCase()} 
                    size="small" 
                    color={incident.impact === 'maintenance' ? 'info' : 'warning'}
                  />
                </TableCell>
                <TableCell>
                  <Chip 
                    label={incident.status.toUpperCase()} 
                    size="small" 
                    color={incident.status === 'ongoing' ? 'error' : 'success'} 
                  />
                </TableCell>
                <TableCell>
                  {new Date(incident.start_time).toLocaleString()}
                </TableCell>
                <TableCell align="right">
                  {incident.status === 'ongoing' && (
                    <Button 
                      size="small" 
                      color="success" 
                      startIcon={<CheckCircle size={16} />}
                      onClick={() => handleResolve(incident.id)}
                    >
                      Resolve
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Incident</DialogTitle>
        <form onSubmit={handleSubmit(onSubmit)}>
          <DialogContent>
            <Stack spacing={2}>
              <Controller
                name="title"
                control={control}
                render={({ field, fieldState }) => (
                  <TextField 
                    {...field} 
                    label="Title" 
                    fullWidth 
                    error={!!fieldState.error} 
                    helperText={fieldState.error?.message} 
                    placeholder="e.g. Database Connectivity Issues"
                  />
                )}
              />
              <Controller
                name="impact"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Impact" fullWidth>
                    <MenuItem value="minor">Minor Issue</MenuItem>
                    <MenuItem value="major">Major Outage</MenuItem>
                    <MenuItem value="critical">Critical Failure</MenuItem>
                    <MenuItem value="maintenance">Scheduled Maintenance</MenuItem>
                  </TextField>
                )}
              />
              {/* Optional: Select Monitor logic can be added later */}
            </Stack>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" color="error">
              Create & Publish
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </div>
  );
}
