import { ThemeProvider, CssBaseline } from '@mui/material';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { theme } from './lib/theme';
import SystemGuard from './components/SystemGuard';

// Layouts
import DashboardLayout from './layouts/DashboardLayout';

// Pages
import Login from './pages/Login';
import Setup from './pages/Setup';
import Dashboard from './pages/Dashboard';
import Monitors from './pages/Monitors';
import Channels from './pages/Channels';
import Incidents from './pages/Incidents';
import StatusPage from './pages/StatusPage';
import StatusPages from './pages/StatusPages';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <BrowserRouter>
          <SystemGuard>
            <Routes>
              <Route path="/setup" element={<Setup />} />
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<StatusPage />} />
              <Route path="/status/:slug" element={<StatusPage />} />
              
              <Route element={<DashboardLayout />}>
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/monitors" element={<Monitors />} />
                <Route path="/status-pages" element={<StatusPages />} />
                <Route path="/channels" element={<Channels />} />
                <Route path="/incidents" element={<Incidents />} />
              </Route>
            </Routes>
          </SystemGuard>
        </BrowserRouter>
        {/* <ReactQueryDevtools initialIsOpen={false} /> */}
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
