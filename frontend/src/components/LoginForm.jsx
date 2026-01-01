import { useState } from 'react';
import { config } from '../config';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Collapse,
} from '@mui/material';
import LoginIcon from '@mui/icons-material/Login';

const LoginForm = ({ onLoginSuccess }) => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const requestUrl = `${config.apiUrl}/api/login`;
    const requestBody = { email, token };
    
    console.log('[LOGIN] Starting request:', {
      url: requestUrl,
      method: 'POST',
      body: requestBody,
      timestamp: new Date().toISOString()
    });

    try {
      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      console.log('[LOGIN] Response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries()),
        timestamp: new Date().toISOString()
      });

      if (response.ok) {
        console.log('[LOGIN] Login successful');
        onLoginSuccess(email, token);
      } else if (response.status === 403) {
        console.warn('[LOGIN] Authentication failed (403)');
        setError('Invalid email or token. Please try again.');
      } else {
        console.error('[LOGIN] Login failed with status:', response.status);
        setError('Login failed. Please try again.');
      }
    } catch (err) {
      console.error('[LOGIN] Network error:', {
        error: err,
        message: err.message,
        name: err.name,
        stack: err.stack,
        timestamp: new Date().toISOString()
      });
      setError('Network error. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card elevation={3} sx={{ width: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <LoginIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            Login
          </Typography>
        </Box>

        <form onSubmit={handleSubmit}>
          <TextField
            fullWidth
            label="Email Address"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            margin="normal"
            variant="outlined"
            autoComplete="email"
          />

          <TextField
            fullWidth
            label="Token"
            type="text"
            value={token}
            onChange={(e) => setToken(e.target.value)}
            required
            margin="normal"
            variant="outlined"
            placeholder="Enter your token"
          />

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, py: 1.5 }}
          >
            {loading ? 'Logging In...' : 'Login'}
          </Button>
        </form>

        <Collapse in={!!error}>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default LoginForm;
