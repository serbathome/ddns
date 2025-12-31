import { Box, Container, Typography, Button } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import SignupForm from '../components/SignupForm';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';

const SignupPage = () => {
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
        <Button
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/login')}
          sx={{
            color: 'white',
            mb: 2,
            '&:hover': {
              backgroundColor: 'rgba(255, 255, 255, 0.1)',
            },
          }}
        >
          Back to Login
        </Button>
        <SignupForm />
        <Box sx={{ textAlign: 'center', mt: 3 }}>
          <Typography variant="body1" sx={{ color: 'white', mb: 1 }}>
            Already have an account?
          </Typography>
          <Button
            variant="contained"
            onClick={() => navigate('/login')}
            sx={{
              bgcolor: 'white',
              color: 'primary.main',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.9)',
              },
            }}
          >
            Go to Login
          </Button>
        </Box>
      </Box>
    </Box>
  );
};

export default SignupPage;
