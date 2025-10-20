import React, { useState } from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, Chip,
  IconButton, Menu, MenuItem, Avatar
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';

const Navbar = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const isActive = (path) => location.pathname === path;

  const navBtn = (label, path) => (
    <Button
      color="inherit"
      onClick={() => navigate(path)}
      sx={{
        borderBottom: isActive(path) ? '2px solid white' : '2px solid transparent',
        borderRadius: 0,
        px: 2
      }}
    >
      {label}
    </Button>
  );

  return (
    <AppBar position="static" elevation={1}>
      <Toolbar>
        {/* Logo / Home */}
        <Typography
          variant="h6" fontWeight={700}
          sx={{ cursor: 'pointer', mr: 3 }}
          onClick={() => navigate('/dashboard')}
        >
          🎓 E-Learning
        </Typography>

        {/* Nav Links */}
        <Box sx={{ display: 'flex', alignItems: 'center', flexGrow: 1, gap: 0.5 }}>
          {navBtn('Dashboard', '/dashboard')}
          {navBtn('Courses', '/courses')}

          {user?.role === 'student' && (
            <>
              {navBtn('Progress', '/progress')}
              {navBtn('AI Picks', '/recommendations')}
            </>
          )}

          {(user?.role === 'instructor' || user?.role === 'admin') && (
            navBtn('Analytics', '/analytics')
          )}
        </Box>

        {/* User Menu */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Chip
            label={user?.role}
            size="small"
            color="secondary"
            sx={{ textTransform: 'capitalize' }}
          />
          <IconButton
            color="inherit"
            onClick={e => setAnchorEl(e.currentTarget)}
          >
            <Avatar sx={{ width: 32, height: 32, bgcolor: 'secondary.dark', fontSize: 14 }}>
              {user?.name?.charAt(0)?.toUpperCase() || '?'}
            </Avatar>
          </IconButton>
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
          >
            <MenuItem disabled>
              <Box>
                <Typography variant="body2" fontWeight={600}>{user?.name}</Typography>
                <Typography variant="caption" color="text.secondary">{user?.email}</Typography>
              </Box>
            </MenuItem>
            <MenuItem onClick={() => { navigate('/dashboard'); setAnchorEl(null); }}>
              🏠 Dashboard
            </MenuItem>
            {user?.role === 'student' && (
              <MenuItem onClick={() => { navigate('/profile'); setAnchorEl(null); }}>
                👤 My Profile
              </MenuItem>
            )}
            <MenuItem onClick={() => { onLogout(); setAnchorEl(null); }} sx={{ color: 'error.main' }}>
              🚪 Logout
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navbar;