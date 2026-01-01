import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import { getAuthHeaders } from '../utils/api';
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
import AddIcon from '@mui/icons-material/Add';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const AddDnsRecordPage = ({ token }) => {
  const navigate = useNavigate();
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/api/dns`, {
        method: 'POST',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ hostname, ipAddress }),
      });

      if (response.ok) {
        setSuccess(true);
        setHostname('');
        setIpAddress('');
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else if (response.status === 500) {
        setError('DNS record with this hostname already exists for your account');
      } else if (response.status === 403) {
        setError('Invalid token. Please log in again.');
      } else {
        setError('Failed to add DNS record. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: 4,
        px: 2,
      }}
    >
      <Box sx={{ width: '100%', maxWidth: 600, margin: '0 auto' }}>
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/dashboard')}
          sx={{
            color: 'white',
            mb: 2,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Back to Dashboard
        </Button>

        <Card elevation={3} sx={{ width: '100%' }}>
          <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
              <AddIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Typography variant="h4" component="h2" fontWeight="bold">
                Add DNS Record
              </Typography>
            </Box>

            <form onSubmit={handleSubmit}>
              <TextField
                fullWidth
                label="Hostname"
                type="text"
                value={hostname}
                onChange={(e) => setHostname(e.target.value)}
                required
                margin="normal"
                variant="outlined"
                placeholder="example.com"
                helperText="Enter the hostname (FQDN)"
              />

              <TextField
                fullWidth
                label="IP Address"
                type="text"
                value={ipAddress}
                onChange={(e) => setIpAddress(e.target.value)}
                required
                margin="normal"
                variant="outlined"
                placeholder="192.168.1.1"
                helperText="Enter the IP address"
              />

              <Button
                type="submit"
                fullWidth
                variant="contained"
                size="large"
                disabled={loading}
                sx={{ mt: 3, py: 1.5 }}
              >
                {loading ? 'Adding Record...' : 'Add DNS Record'}
              </Button>
            </form>

            <Collapse in={!!error}>
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            </Collapse>

            <Collapse in={success}>
              <Alert severity="success" sx={{ mt: 2 }}>
                DNS record added successfully! Redirecting to dashboard...
              </Alert>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default AddDnsRecordPage;
