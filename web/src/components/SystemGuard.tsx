import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../lib/api';
import { Box, CircularProgress } from '@mui/material';

export default function SystemGuard({ children }: { children: React.ReactNode }) {
  const [checking, setChecking] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const checkSystem = async () => {
      try {
        const res = await api.get('/system/status');
        const setupRequired = res.data.setup_required;

        if (setupRequired) {
           if (location.pathname !== '/setup') {
             navigate('/setup', { replace: true });
           }
        } else {
           if (location.pathname === '/setup') {
             navigate('/login', { replace: true });
           }
        }
      } catch (e) {
        console.error("System check failed", e);
      } finally {
        setChecking(false);
      }
    };
    
    checkSystem();
  }, [navigate, location.pathname]); // Check on every navigation to be safe/correct

  // Show loader only on initial check? 
  // If we check on every page, we don't want to show loader every time.
  // But for the first load (checking=true), we must show loader to prevent flashing protected content.
  // After first load, we might want to be less intrusive, but for now let's keep it simple.
  
  if (checking) {
      return (
          <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
              <CircularProgress />
          </Box>
      );
  }

  return <>{children}</>;
}
