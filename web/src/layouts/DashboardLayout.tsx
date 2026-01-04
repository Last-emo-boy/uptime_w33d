import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  Box, Drawer, AppBar, Toolbar, List, Typography, Divider, 
  ListItem, ListItemButton, ListItemIcon, ListItemText, Avatar, IconButton, Stack
} from '@mui/material';
import { LayoutDashboard, Activity, LogOut, Bell, Menu, ChevronRight } from 'lucide-react';
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
    { text: 'Channels', icon: <Bell size={20} />, path: '/channels' },
  ];

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column', bgcolor: '#f8fafc' }}>
      <Toolbar sx={{ px: 3, mb: 2 }}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
          <Box sx={{ p: 0.5, bgcolor: 'primary.main', borderRadius: 1.5, display: 'flex' }}>
            <Activity size={24} color="white" />
          </Box>
          <Typography variant="h6" fontWeight="bold" color="text.primary">
            Uptime W33d
          </Typography>
        </Stack>
      </Toolbar>
      
      <Box sx={{ px: 2, flexGrow: 1 }}>
        <Typography variant="caption" color="text.secondary" fontWeight="bold" sx={{ px: 2, mb: 1, display: 'block', textTransform: 'uppercase', letterSpacing: 0.5 }}>
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
                    color: isSelected ? 'primary.main' : 'text.secondary',
                    bgcolor: isSelected ? 'primary.light' : 'transparent',
                    '&.Mui-selected': {
                      bgcolor: 'rgba(99, 102, 241, 0.08)',
                      '&:hover': {
                        bgcolor: 'rgba(99, 102, 241, 0.12)',
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
        <Box sx={{ p: 2, bgcolor: 'white', borderRadius: 2, border: 1, borderColor: 'divider', mb: 2 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar sx={{ width: 36, height: 36, bgcolor: 'secondary.main', fontSize: '0.9rem' }}>A</Avatar>
            <Box sx={{ overflow: 'hidden' }}>
              <Typography variant="subtitle2" noWrap fontWeight="bold">Admin User</Typography>
              <Typography variant="caption" color="text.secondary" noWrap display="block">admin@w33d.xyz</Typography>
            </Box>
          </Stack>
        </Box>
        <ListItemButton 
          onClick={handleLogout}
          sx={{ 
            borderRadius: 2, 
            color: 'error.main',
            '&:hover': { bgcolor: 'error.light', color: 'error.dark', bgcolorOpacity: 0.1 }
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
    <Box sx={{ display: 'flex', minHeight: '100vh', bgcolor: '#f1f5f9' }}>
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
