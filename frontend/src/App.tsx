import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation, Navigate, Outlet } from 'react-router-dom';
import { Box, CssBaseline, Drawer, List, ListItem, ListItemIcon, ListItemText, AppBar, Toolbar, Typography, IconButton, useMediaQuery, Avatar, Fab, Button } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import AddIcon from '@mui/icons-material/Add';
import DashboardIcon from '@mui/icons-material/Dashboard';
import HomeWorkIcon from '@mui/icons-material/HomeWork';
import PeopleIcon from '@mui/icons-material/People';
import ReceiptIcon from '@mui/icons-material/Receipt';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import Dashboard from './pages/Dashboard';
import Residences from './pages/Residences';
import Clients from './pages/Clients';
import Charges from './pages/Charges';
import NotificationDropdown from './components/NotificationDropdown';
import CreateNotificationForm from './components/CreateNotificationForm';
import { getTheme } from './theme/theme';
import { AuthProvider, useAuth, type User } from './context/AuthContext';
import { DashboardProvider } from './context/DashboardContext';
import Login from './pages/Login';
import AdminUsers from './pages/AdminUsers';

const drawerWidth = 280;

// Permission type for nav items
// You may want to import this from your types if available

// Separate component that uses useLocation inside Router context
const Navigation: React.FC<{ mode: 'light' | 'dark' }> = ({ mode }) => {
  const location = useLocation();
  const { user, hasPermission } = useAuth();
  
  const isActive = (path: string) => location.pathname === path;

  const navItems: { text: string; icon: React.ReactNode; path: string; permission: keyof User['permissions'] }[] = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/', permission: 'canViewDashboard' },
    { text: 'Résidences', icon: <HomeWorkIcon />, path: '/residences', permission: 'canViewResidences' },
    { text: 'Clients', icon: <PeopleIcon />, path: '/clients', permission: 'canViewClients' },
    { text: 'Charges', icon: <ReceiptIcon />, path: '/charges', permission: 'canViewCharges' },
  ];

  // Add admin users link for users with permission
  if (hasPermission('canViewUsers')) {
    navItems.push({ text: 'Gestion Utilisateurs', icon: <AdminPanelSettingsIcon />, path: '/admin/users', permission: 'canViewUsers' });
  }

  // Filter nav items based on permissions
  const filteredNavItems = navItems.filter(item => {
    // If user is admin and permissions are not loaded, show all items
    if (user?.role === 'admin' && !user?.permissions) {
      return true;
    }
    return hasPermission(item.permission);
  });

  return (
    <Drawer
      variant="permanent"
      sx={{
        width: drawerWidth,
        flexShrink: 0,
        [`& .MuiDrawer-paper`]: { 
          width: drawerWidth, 
          boxSizing: 'border-box',
          background: mode === 'light' 
            ? 'linear-gradient(180deg, #f8fafc 0%, #e2e8f0 100%)'
            : 'linear-gradient(180deg, #1a1d24 0%, #0f1117 100%)',
          borderRight: mode === 'light' 
            ? '1px solid rgba(0,0,0,0.08)' 
            : '1px solid rgba(255,255,255,0.05)',
          boxShadow: mode === 'light' 
            ? '4px 0 20px rgba(0,0,0,0.05)' 
            : '4px 0 20px rgba(0,0,0,0.3)'
        },
      }}
    >
      <Toolbar sx={{ minHeight: '70px' }} />
      
      {/* User Profile Section */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        borderBottom: mode === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)'
      }}>
        <Avatar 
          sx={{ 
            width: 60, 
            height: 60, 
            mx: 'auto', 
            mb: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            boxShadow: '0 4px 15px rgba(102,126,234,0.3)'
          }}
        >
          <AccountCircleIcon sx={{ fontSize: 40 }} />
        </Avatar>
        <Typography 
          variant="h6" 
          sx={{ 
            fontWeight: 600,
            color: mode === 'light' ? '#1a202c' : '#fff',
            mb: 0.5
          }}
        >
          {user?.username || 'Utilisateur'}
        </Typography>
        <Typography 
          variant="body2" 
          sx={{ 
            color: mode === 'light' ? '#718096' : '#a0aec0',
            fontSize: '0.875rem'
          }}
        >
          {user?.role === 'admin' ? 'Administrateur' : 'Utilisateur'}
        </Typography>
      </Box>

      {/* Navigation Menu */}
      <Box sx={{ overflow: 'auto', py: 2 }}>
        <List sx={{ px: 2 }}>
          {filteredNavItems.map((item) => (
            <ListItem 
              key={item.text} 
              component={Link} 
              to={item.path}
              sx={{
                mb: 1,
                borderRadius: 3,
                background: isActive(item.path) 
                  ? mode === 'light'
                    ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    : 'linear-gradient(135deg, #4a5568 0%, #2d3748 100%)'
                  : 'transparent',
                color: isActive(item.path) ? '#fff' : (mode === 'light' ? '#4a5568' : '#a0aec0'),
                '&:hover': {
                  background: isActive(item.path)
                    ? mode === 'light'
                      ? 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                      : 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)'
                    : mode === 'light'
                      ? 'rgba(102,126,234,0.1)'
                      : 'rgba(255,255,255,0.05)',
                  transform: 'translateX(4px)',
                  color: isActive(item.path) ? '#fff' : (mode === 'light' ? '#2d3748' : '#fff')
                },
                transition: 'all 0.3s ease',
                textDecoration: 'none',
                position: 'relative',
                '&::before': isActive(item.path) ? {
                  content: '""',
                  position: 'absolute',
                  left: 0,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 4,
                  height: '60%',
                  background: '#fff',
                  borderRadius: '0 2px 2px 0',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.2)'
                } : {}
              }}
            >
              <ListItemIcon 
                sx={{ 
                  color: 'inherit',
                  minWidth: 40,
                  '& .MuiSvgIcon-root': {
                    fontSize: 24
                  }
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText 
                primary={item.text} 
                sx={{
                  '& .MuiListItemText-primary': {
                    fontWeight: isActive(item.path) ? 600 : 500,
                    fontSize: '0.95rem'
                  }
                }}
              />
            </ListItem>
          ))}
        </List>
      </Box>

      {/* Footer Section */}
      <Box sx={{ 
        mt: 'auto', 
        p: 3,
        borderTop: mode === 'light' ? '1px solid rgba(0,0,0,0.08)' : '1px solid rgba(255,255,255,0.05)'
      }}>
        <Typography 
          variant="caption" 
          sx={{ 
            color: mode === 'light' ? '#a0aec0' : '#718096',
            textAlign: 'center',
            display: 'block'
          }}
        >
          Version 1.0.0
        </Typography>
      </Box>
    </Drawer>
  );
};

// RequireAuth: Protects routes for authenticated users
function RequireAuth() {
  const { user } = useAuth();
  const location = useLocation();
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  return <Outlet />;
}

// RequirePermission: Protects routes based on specific permissions
function RequirePermission(permission: string) {
  return function RequirePermissionComponent() {
    const { user, hasPermission } = useAuth();
    const location = useLocation();
    
    if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
    if (!hasPermission(permission as any)) return <Navigate to="/" replace />;
    return <Outlet />;
  };
}

// Create permission components
const RequireDashboardPermission = RequirePermission('canViewDashboard');
const RequireResidencesPermission = RequirePermission('canViewResidences');
const RequireClientsPermission = RequirePermission('canViewClients');
const RequireChargesPermission = RequirePermission('canViewCharges');
const RequireUsersPermission = RequirePermission('canViewUsers');

// AppHeader: Shows user info and logout
function AppHeader() {
  const { user, logout } = useAuth();
  return (
    <AppBar position="static" color="default" elevation={1} sx={{ mb: 2 }}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>SyndicApp</Typography>
        {user && (
          <>
            <Typography variant="body1" sx={{ mr: 2 }}>{user.username} ({user.role})</Typography>
            <Button color="inherit" onClick={logout}>Déconnexion</Button>
          </>
        )}
      </Toolbar>
    </AppBar>
  );
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route element={<RequireAuth />}>
        {/* Main app routes go here, e.g. Dashboard, Clients, etc. */}
        <Route path="/" element={<RequireDashboardPermission />}>
          <Route index element={<Dashboard />} />
        </Route>
        <Route path="/residences" element={<RequireResidencesPermission />}>
          <Route index element={<Residences />} />
        </Route>
        <Route path="/clients" element={<RequireClientsPermission />}>
          <Route index element={<Clients />} />
        </Route>
        <Route path="/charges" element={<RequireChargesPermission />}>
          <Route index element={<Charges />} />
        </Route>
        <Route element={<RequireUsersPermission />}>
          <Route path="/admin/users" element={<AdminUsers />} />
        </Route>
        {/* Fallback: redirect to /login if route not found */}
        <Route path="*" element={<Navigate to="/login" />} />
      </Route>
    </Routes>
  );
}

const App: React.FC = () => {
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
  const [mode, setMode] = useState<'light' | 'dark'>(prefersDarkMode ? 'dark' : 'light');
  const [createNotificationOpen, setCreateNotificationOpen] = useState(false);
  const theme = getTheme(mode);

  const toggleDarkMode = () => setMode((prev) => (prev === 'light' ? 'dark' : 'light'));

  const handleNotificationCreated = () => {
    // This will be passed to the NotificationDropdown to refresh the count
    // The NotificationDropdown handles its own refresh
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <DashboardProvider>
          <AppContent 
            mode={mode} 
            toggleDarkMode={toggleDarkMode}
            createNotificationOpen={createNotificationOpen}
            setCreateNotificationOpen={setCreateNotificationOpen}
            handleNotificationCreated={handleNotificationCreated}
          />
        </DashboardProvider>
      </AuthProvider>
    </ThemeProvider>
  );
};

// Separate component that uses useAuth inside AuthProvider context
const AppContent: React.FC<{
  mode: 'light' | 'dark';
  toggleDarkMode: () => void;
  createNotificationOpen: boolean;
  setCreateNotificationOpen: (open: boolean) => void;
  handleNotificationCreated: () => void;
}> = ({ mode, toggleDarkMode, createNotificationOpen, setCreateNotificationOpen, handleNotificationCreated }) => {
  const { hasPermission } = useAuth();

  return (
    <Router>
      <Box sx={{ display: 'flex' }}>
        {/* Modern AppBar */}
        <AppBar 
          position="fixed" 
          sx={{ 
            zIndex: (theme) => theme.zIndex.drawer + 1,
            background: mode === 'light' 
              ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
              : 'linear-gradient(135deg, #23272f 0%, #181a20 100%)',
            boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
            borderBottom: mode === 'light' ? '1px solid rgba(255,255,255,0.1)' : '1px solid rgba(255,255,255,0.05)'
          }}
        >
          <Toolbar sx={{ minHeight: '70px' }}>
            <Typography 
              variant="h5" 
              noWrap 
              component="div" 
              sx={{ 
                flexGrow: 1,
                fontWeight: 700,
                background: 'linear-gradient(45deg, #fff, #f0f0f0)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                textShadow: '0 2px 4px rgba(0,0,0,0.1)'
              }}
            >
              🏢 SyndicApp
            </Typography>
            <IconButton 
              color="inherit" 
              onClick={toggleDarkMode}
              sx={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.2)',
                  transform: 'scale(1.05)'
                },
                transition: 'all 0.3s ease'
              }}
            >
              {mode === 'dark' ? <Brightness7Icon /> : <Brightness4Icon />}
            </IconButton>
            <NotificationDropdown userId={1} />
          </Toolbar>
        </AppBar>

        {/* Navigation Component */}
        <Navigation mode={mode} />

        {/* Main Content */}
        <Box component="main" sx={{ 
          flexGrow: 1, 
          p: 3,
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          background: mode === 'light' ? '#f7fafc' : '#0f1117'
        }}>
          <Toolbar sx={{ minHeight: '70px' }} />
          <Box sx={{ 
            flex: 1,
            maxWidth: '100%',
            width: '100%'
          }}>
            <AppHeader />
            <AppRoutes />
          </Box>
        </Box>

        {/* Floating Action Button for creating notifications */}
        {hasPermission('canCreateNotifications') && (
          <Fab
            color="primary"
            aria-label="add notification"
            onClick={() => setCreateNotificationOpen(true)}
            sx={{
              position: 'fixed',
              bottom: 24,
              right: 24,
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              '&:hover': {
                background: 'linear-gradient(135deg, #5a67d8 0%, #6b46c1 100%)',
                transform: 'scale(1.1)'
              },
              transition: 'all 0.3s ease',
              zIndex: 1000
            }}
          >
            <AddIcon />
          </Fab>
        )}

        {/* Create Notification Form */}
        <CreateNotificationForm
          open={createNotificationOpen}
          onClose={() => setCreateNotificationOpen(false)}
          userId={1}
          onNotificationCreated={handleNotificationCreated}
        />
      </Box>
    </Router>
  );
};

export default App;
