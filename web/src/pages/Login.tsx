import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Box, Button, Container, TextField, Typography, Paper, Alert, Stack } from '@mui/material';
import { Activity } from 'lucide-react';

const loginSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function Login() {
  const navigate = useNavigate();
  const [error, setError] = useState('');

  useEffect(() => {
    if (localStorage.getItem('token')) {
      navigate('/dashboard');
    }
  }, [navigate]);
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    try {
      const res = await api.post('/auth/login', data);
      localStorage.setItem('token', res.data.token);
      navigate('/dashboard');
    } catch {
      setError('Invalid username or password');
    }
  };

  return (
    <Box 
      sx={{ 
        minHeight: '100vh', 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        bgcolor: '#f1f5f9',
        background: 'radial-gradient(circle at 50% -20%, #e0e7ff 0%, #f1f5f9 60%)'
      }}
    >
      <Container component="main" maxWidth="xs">
        <Paper 
          elevation={0}
          sx={{ 
            p: 4, 
            width: '100%', 
            borderRadius: 4,
            boxShadow: '0 25px 50px -12px rgb(0 0 0 / 0.15)',
            border: '1px solid rgba(255,255,255,0.5)'
          }}
        >
          <Stack alignItems="center" spacing={2} sx={{ mb: 4 }}>
            <Box sx={{ p: 1.5, bgcolor: 'primary.main', borderRadius: 2, boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.3)' }}>
              <Activity size={32} color="white" />
            </Box>
            <Typography component="h1" variant="h5" fontWeight="bold">
              Welcome Back
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Sign in to manage your monitors
            </Typography>
          </Stack>

          {error && <Alert severity="error" sx={{ mb: 3, borderRadius: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <Stack spacing={2.5}>
              <TextField
                required
                fullWidth
                label="Username"
                autoFocus
                {...register('username')}
                error={!!errors.username}
                helperText={errors.username?.message}
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <TextField
                required
                fullWidth
                label="Password"
                type="password"
                {...register('password')}
                error={!!errors.password}
                helperText={errors.password?.message}
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                sx={{ py: 1.5, borderRadius: 2, fontSize: '1rem', fontWeight: 600, mt: 1 }}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Signing in...' : 'Sign In'}
              </Button>
            </Stack>
          </Box>
        </Paper>
        <Typography variant="caption" align="center" display="block" sx={{ mt: 4, color: 'text.secondary' }}>
          &copy; {new Date().getFullYear()} Uptime W33d. All rights reserved.
        </Typography>
      </Container>
    </Box>
  );
}
