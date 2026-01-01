import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
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
import EditIcon from '@mui/icons-material/Edit';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const EditDnsRecordPage = ({ token }) => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [hostname, setHostname] = useState('');
  const [ipAddress, setIpAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingRecord, setFetchingRecord] = useState(true);

  useEffect(() => {
    const fetchRecord = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/dns', {
          headers: getAuthHeaders(token)
        });
        
        if (response.ok) {
          const data = await response.json();
          const record = data.find(r => r.id === parseInt(id));
          
          if (record) {
            setHostname(record.hostname);
            setIpAddress(record.ipAddress);
          } else {
            setError('Record not found');
          }
        } else if (response.status === 403) {
          setError('Invalid token. Please log in again.');
        } else {
          setError('Failed to load DNS record.');
        }
      } catch (err) {
        setError('Network error. Please check if the backend is running.');
      } finally {
        setFetchingRecord(false);
      }
    };

    fetchRecord();
  }, [token, id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess(false);
    setLoading(true);

    try {
      const response = await fetch(`http://localhost:5000/api/dns/${id}`, {
        method: 'PATCH',
        headers: getAuthHeaders(token),
        body: JSON.stringify({ hostname, ipAddress }),
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 1500);
      } else if (response.status === 404) {
        setError('DNS record not found');
      } else if (response.status === 403) {
        setError('Invalid token. Please log in again.');
      } else if (response.status === 500) {
        setError('Hostname already exists. Please choose a different hostname.');
      } else {
        setError('Failed to update DNS record. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  if (fetchingRecord) {
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
        <Typography variant="h6" sx={{ color: 'white' }}>
          Loading...
        </Typography>
      </Box>
    );
  }

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
              <EditIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
              <Typography variant="h4" component="h2" fontWeight="bold">
                Edit DNS Record
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
                {loading ? 'Updating Record...' : 'Update DNS Record'}
              </Button>
            </form>

            <Collapse in={!!error}>
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            </Collapse>

            <Collapse in={success}>
              <Alert severity="success" sx={{ mt: 2 }}>
                DNS record updated successfully! Redirecting to dashboard...
              </Alert>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
};

export default EditDnsRecordPage;
