import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Link, Alert, CircularProgress,
  FormControl, InputLabel, Select, MenuItem
} from '@mui/material';
import { toast } from 'react-toastify';

const Register = ({ onRegister }) => {
  const [form, setForm] = useState({
    full_name: '', email: '', password: '', role: 'student'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    if (form.password.length < 8) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      // Register — map full_name → name for backend
      const res = await fetch('http://localhost:8000/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          name: form.full_name,
          password: form.password,
          role: form.role
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const msg = typeof data.detail === 'string'
          ? data.detail
          : Array.isArray(data.detail)
          ? data.detail.map(e => e.msg).join(', ')
          : 'Registration failed';
        throw new Error(msg);
      }

      // Auto login
      const loginRes = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });
      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error('Login after registration failed');

      // Fetch full user object
      const userRes = await fetch('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${loginData.access_token}` }
      });
      const userData = await userRes.json();

      toast.success('Account created! Welcome 🎉');
      onRegister(userData, loginData.access_token);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', bgcolor: 'background.default' }}>
      <Card sx={{ width: '100%', maxWidth: 420, p: 2 }}>
        <CardContent>
          <Typography variant="h4" fontWeight={700} textAlign="center" mb={1}>
            Create Account
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Join the e-learning platform
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Full Name" name="full_name"
              value={form.full_name} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Email" name="email" type="email"
              value={form.email} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Password" name="password" type="password"
              value={form.password} onChange={handleChange} required sx={{ mb: 2 }}
              helperText="Minimum 8 characters"
              error={form.password.length > 0 && form.password.length < 8}
            />
            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel>Role</InputLabel>
              <Select name="role" value={form.role} label="Role" onChange={handleChange}>
                <MenuItem value="student">Student</MenuItem>
                <MenuItem value="instructor">Instructor</MenuItem>
              </Select>
            </FormControl>
            <Button fullWidth variant="contained" type="submit"
              disabled={loading} size="large">
              {loading ? <CircularProgress size={24} /> : 'Create Account'}
            </Button>
          </Box>
          <Typography textAlign="center" mt={2} variant="body2">
            Already have an account?{' '}
            <Link href="/login" underline="hover">Sign In</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Register;