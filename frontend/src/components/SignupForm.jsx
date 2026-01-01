import { useState } from 'react';
import {
  Card,
  CardContent,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  Paper,
  Collapse,
  IconButton,
} from '@mui/material';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';

const SignupForm = () => {
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [copySuccess, setCopySuccess] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setToken('');
    setLoading(true);

    try {
      const response = await fetch(`${config.apiUrl}/api/user`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        const data = await response.json();
        setToken(data.token);
        setEmail('');
      } else if (response.status === 500) {
        setError('User with this email already exists');
      } else {
        setError('Failed to create user. Please try again.');
      }
    } catch (err) {
      setError('Network error. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopyToken = () => {
    navigator.clipboard.writeText(token);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <Card elevation={3} sx={{ width: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <PersonAddIcon sx={{ fontSize: 40, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4" component="h2" fontWeight="bold">
            Sign Up
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

          <Button
            type="submit"
            fullWidth
            variant="contained"
            size="large"
            disabled={loading}
            sx={{ mt: 3, py: 1.5 }}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </Button>
        </form>

        <Collapse in={!!error}>
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        </Collapse>

        <Collapse in={!!token}>
          <Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: 'success.light' }}>
            <Typography variant="h6" gutterBottom color="success.dark">
              Account Created Successfully!
            </Typography>
            <Typography variant="body2" color="text.secondary" gutterBottom>
              Save this token - you'll need it to log in:
            </Typography>
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 1,
                p: 2,
                bgcolor: 'white',
                borderRadius: 1,
                wordBreak: 'break-all',
              }}
            >
              <Typography variant="body1" sx={{ flexGrow: 1, fontFamily: 'monospace' }}>
                {token}
              </Typography>
              <IconButton onClick={handleCopyToken} color="primary">
                <ContentCopyIcon />
              </IconButton>
            </Box>
            <Collapse in={copySuccess}>
              <Alert severity="success" sx={{ mt: 1 }}>
                Token copied to clipboard!
              </Alert>
            </Collapse>
          </Paper>
        </Collapse>
      </CardContent>
    </Card>
  );
};

export default SignupForm;
