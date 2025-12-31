import { Box } from '@mui/material';
import ManagementPage from '../components/ManagementPage';

const DashboardPage = ({ userEmail, token, onLogout }) => {
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
      <Box sx={{ width: '100%', maxWidth: 1200, margin: '0 auto' }}>
        <ManagementPage userEmail={userEmail} token={token} onLogout={onLogout} />
      </Box>
    </Box>
  );
};

export default DashboardPage;
