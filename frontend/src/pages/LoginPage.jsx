import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import LoginForm from '../components/LoginForm';

const LoginPage = ({ onLoginSuccess }) => {
  const navigate = useNavigate();

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
      <Box sx={{ width: '100%', maxWidth: 500, margin: '0 auto' }}>
        <LoginForm onLoginSuccess={onLoginSuccess} />
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
            Don't have an account?
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/signup')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            Create Account
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default LoginPage;
