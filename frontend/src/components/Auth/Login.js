import React, { useState } from 'react';
import {
  Box, Card, CardContent, TextField, Button,
  Typography, Link, Alert, CircularProgress
} from '@mui/material';
import { toast } from 'react-toastify';

const Login = ({ onLogin }) => {
  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      //const body = new URLSearchParams();
      //body.append('username', form.email);
      //body.append('password', form.password);

      //const res = await fetch('http://localhost:8000/api/auth/login', {
        //method: 'POST',
        //headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        //body,
      //});
      const res = await fetch('http://localhost:8000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: form.email, password: form.password }),
      });

      const data = await res.json();
      //if (!res.ok) throw new Error(data.detail || 'Login failed');
      if (!res.ok){
        const msg =typeof data.detail === 'string'
        ? data.detail
        : Array.isArray(data.detail)
        ? data.detail.map(e => e.msg).join(', ')
        : 'Login failed';
        throw new Error(msg);
      }

      // Fetch user info
      const userRes = await fetch('http://localhost:8000/api/auth/me', {
        headers: { Authorization: `Bearer ${data.access_token}` },
      });
      const userData = await userRes.json();
      toast.success('Welcome back!');
      onLogin(userData, data.access_token);
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
            E-Learning
          </Typography>
          <Typography variant="body2" color="text.secondary" textAlign="center" mb={3}>
            Sign in to your account
          </Typography>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          <Box component="form" onSubmit={handleSubmit}>
            <TextField fullWidth label="Email" name="email" type="email"
              value={form.email} onChange={handleChange} required sx={{ mb: 2 }} />
            <TextField fullWidth label="Password" name="password" type="password"
              value={form.password} onChange={handleChange} required sx={{ mb: 3 }} />
            <Button fullWidth variant="contained" type="submit"
              disabled={loading} size="large">
              {loading ? <CircularProgress size={24} /> : 'Sign In'}
            </Button>
          </Box>
          <Typography textAlign="center" mt={2} variant="body2">
            Don't have an account?{' '}
            <Link href="/register" underline="hover">Register</Link>
          </Typography>
        </CardContent>
      </Card>
    </Box>
  );
};

export default Login;