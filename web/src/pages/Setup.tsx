import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Box, Button, Container, TextField, Typography, Paper, Alert, Stepper, Step, StepLabel } from '@mui/material';

const setupSchema = z.object({
  username: z.string().min(3, 'Username must be at least 3 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type SetupForm = z.infer<typeof setupSchema>;

export default function Setup() {
  const navigate = useNavigate();
  const [error, setError] = useState('');
  
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<SetupForm>({
    resolver: zodResolver(setupSchema),
  });

  const onSubmit = async (data: SetupForm) => {
    try {
      setError('');
      // 1. Register the admin user
      await api.post('/auth/register', {
        username: data.username,
        password: data.password,
        email: data.email
      });

      // 2. Login immediately to get the token
      const loginRes = await api.post('/auth/login', {
        username: data.username,
        password: data.password
      });

      localStorage.setItem('token', loginRes.data.token);
      navigate('/dashboard');
    } catch (err: any) {
      console.error("Setup error:", err);
      const msg = err.response?.data?.error || err.message || 'Setup failed. Please check network connection.';
      setError(msg);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Typography component="h1" variant="h4" gutterBottom fontWeight="bold" color="primary">
          Uptime W33d
        </Typography>
        <Typography variant="h6" color="text.secondary" gutterBottom>
          Initial Setup
        </Typography>

        <Paper sx={{ mt: 3, p: 4, width: '100%', borderRadius: 2 }}>
          <Stepper activeStep={0} sx={{ mb: 4 }}>
            <Step>
              <StepLabel>Create Admin Account</StepLabel>
            </Step>
            {/* Future steps like "Configure Database" or "Site Settings" can be added here */}
          </Stepper>

          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          
          <Box component="form" onSubmit={handleSubmit(onSubmit)} noValidate>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Admin Username"
              autoFocus
              {...register('username')}
              error={!!errors.username}
              helperText={errors.username?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              type="email"
              {...register('email')}
              error={!!errors.email}
              helperText={errors.email?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              {...register('password')}
              error={!!errors.password}
              helperText={errors.password?.message}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Confirm Password"
              type="password"
              {...register('confirmPassword')}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />
            
            <Button
              type="submit"
              fullWidth
              variant="contained"
              size="large"
              sx={{ mt: 4, mb: 2, py: 1.5, fontSize: '1.1rem' }}
              disabled={isSubmitting}
            >
              Complete Setup
            </Button>
          </Box>
        </Paper>
      </Box>
    </Container>
  );
}
