import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, IconButton, Stack
} from '@mui/material';
import { LayoutDashboard, Activity, LogOut, Bell, Menu, ChevronRight, AlertTriangle, Globe } from 'lucide-react';
import { useState } from 'react';

const drawerWidth = 260;

export default function DashboardLayout() {
  const location = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  };

  const menuItems = [
    { text: 'Dashboard', icon: <LayoutDashboard size={20} />, path: '/dashboard' },
    { text: 'Monitors', icon: <Activity size={20} />, path: '/monitors' },
    { text: 'Status Pages', icon: <Globe size={20} />, path: '/status-pages' },
    { text: 'Channels', icon: <Bell size={20} />, path: '/channels' },
    { text: 'Incidents', icon: <AlertTriangle size={20} />, path: '/incidents' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#0f172a', color: 'white' }}>
      <Toolbar sx={{ px: 3, mb: 4, mt: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 0.5, bgcolor: 'primary.main', borderRadius: 1.5, display: 'flex', boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)' }}>
            <Activity size={24} color="white" />
          </Box>
          <Typography variant="h6" fontWeight="bold" sx={{ color: 'white', letterSpacing: 0.5 }}>
            Uptime W33d
          </Typography>
        </Stack>
      </Toolbar>
      
      <Box sx={{ px: 2, flexGrow: 1 }}>
        <Typography variant="caption" sx={{ px: 2, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 1, color: '#64748b', fontWeight: 700, fontSize: '0.7rem' }}>
          Menu
        </Typography>
        <List>
          {menuItems.map((item) => {
            const isSelected = location.pathname === item.path;
            return (
              <ListItem key={item.text} disablePadding sx={{ mb: 0.5 }}>
                <ListItemButton 
                  component={Link} 
                  to={item.path}
                  selected={isSelected}
                  sx={{
                    borderRadius: 2,
                    py: 1.2,
                    color: isSelected ? 'white' : '#94a3b8',
                    bgcolor: isSelected ? 'primary.main' : 'transparent',
                    transition: 'all 0.2s',
                    '&:hover': {
                      bgcolor: isSelected ? 'primary.main' : 'rgba(255, 255, 255, 0.05)',
                      color: 'white',
                      transform: 'translateX(4px)',
                    },
                    '&.Mui-selected': {
                      bgcolor: 'primary.main',
                      boxShadow: '0 4px 12px rgba(99, 102, 241, 0.4)',
                      '&:hover': {
                        bgcolor: 'primary.main',
                      },
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ fontWeight: isSelected ? 600 : 500, fontSize: '0.95rem' }} 
                  />
                  {isSelected && <ChevronRight size={16} />}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>
      </Box>

      <Box sx={{ p: 2 }}>
        <Box sx={{ p: 2, bgcolor: 'rgba(255,255,255,0.03)', borderRadius: 2, border: 1, borderColor: 'rgba(255,255,255,0.1)', mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontSize: '0.9rem', border: '2px solid #1e293b' }}>A</Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle2" noWrap fontWeight="bold" sx={{ color: 'white' }}>Admin User</Typography>
              <Typography variant="caption" sx={{ color: '#94a3b8' }} noWrap display="block">admin@w33d.xyz</Typography>
            </Box>
          </Stack>
        </Box>
        <ListItemButton 
          onClick={handleLogout}
          sx={{ 
            borderRadius: 2, 
            color: '#ef4444',
            '&:hover': { bgcolor: 'rgba(239, 68, 68, 0.1)' }
          }}
        >
          <ListItemIcon sx={{ minWidth: 40, color: 'inherit' }}>
            <LogOut size={20} />
          </ListItemIcon>
          <ListItemText primary="Logout" primaryTypographyProps={{ fontWeight: 600 }} />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f8fafc' }}>
      <AppBar 
        position="fixed" 
        sx={{ 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          ml: { sm: `${drawerWidth}px` },
          bgcolor: 'transparent',
          boxShadow: 'none',
          display: { sm: 'none' }
        }}
      >
        <Toolbar>
          <IconButton
            color="primary"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { sm: 'none' }, bgcolor: 'white', boxShadow: 1 }}
          >
            <Menu />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: 'none' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, borderRight: '1px solid #e2e8f0' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{ 
          flexGrow: 1, 
          p: { xs: 2, md: 4 }, 
          width: { sm: `calc(100% - ${drawerWidth}px)` },
          mt: { xs: 8, sm: 0 }
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
