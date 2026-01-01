import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { config } from '../config';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Paper,
  Avatar,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  CircularProgress,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import LogoutIcon from '@mui/icons-material/Logout';
import AddIcon from '@mui/icons-material/Add';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

const ManagementPage = ({ userEmail, token, onLogout }) => {
  const navigate = useNavigate();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [recordToDelete, setRecordToDelete] = useState(null);
  const [deleting, setDeleting] = useState(false);

  const fetchRecords = async () => {
    try {
      const response = await fetch(`http://localhost:5000/api/dns?token=${token}`);
      
      if (response.ok) {
        const data = await response.json();
        setRecords(data);
      } else if (response.status === 403) {
        setError('Invalid token. Please log in again.');
      } else {
        setError('Failed to load DNS records.');
      }
    } catch (err) {
      setError('Network error. Please check if the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, [token]);

  const handleDeleteClick = (record) => {
    setRecordToDelete(record);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!recordToDelete) return;

    setDeleting(true);
    try {
      const response = await fetch(`http://localhost:5000/api/dns/${recordToDelete.id}?token=${token}`, {
        method: 'DELETE',
      });

      if (response.ok) {
        // Remove the deleted record from the list
        setRecords(records.filter(r => r.id !== recordToDelete.id));
        setDeleteDialogOpen(false);
        setRecordToDelete(null);
      } else if (response.status === 403) {
        setError('Invalid token. Please log in again.');
      } else if (response.status === 404) {
        setError('Record not found.');
      } else {
        setError('Failed to delete record.');
      }
    } catch (err) {
      setError('Network error. Please check if the backend is running.');
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setRecordToDelete(null);
  };

  return (
    <Card elevation={3} sx={{ width: '100%' }}>
      <CardContent sx={{ p: { xs: 2, sm: 3, md: 4 } }}>
        <Box sx={{ 
          display: 'flex', 
          flexDirection: { xs: 'column', sm: 'row' },
          alignItems: { xs: 'stretch', sm: 'center' }, 
          justifyContent: 'space-between', 
          gap: 2,
          mb: 4 
        }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <DashboardIcon sx={{ fontSize: { xs: 32, sm: 40 }, mr: 2, color: 'primary.main' }} />
            <Typography variant="h4" component="h2" fontWeight="bold" sx={{ fontSize: { xs: '1.5rem', sm: '2rem' } }}>
              DynDNS Dashboard
            </Typography>
          </Box>
          <Button
            variant="outlined"
            color="secondary"
            startIcon={<LogoutIcon />}
            onClick={onLogout}
          >
            Logout
          </Button>
        </Box>

        <Paper
          elevation={0}
          sx={{
            p: 3,
            bgcolor: 'primary.light',
            borderRadius: 2,
            mb: 3,
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Avatar sx={{ bgcolor: 'primary.dark', mr: 2 }}>
              {userEmail.charAt(0).toUpperCase()}
            </Avatar>
            <Box>
              <Typography variant="h6" color="primary.dark">
                Welcome back!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                {userEmail}
              </Typography>
            </Box>
          </Box>
        </Paper>

        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h5" fontWeight="bold">
            DNS Records
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => navigate('/add-dns-record')}
          >
            Add Record
          </Button>
        </Box>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Paper sx={{ p: 3, bgcolor: 'error.light', color: 'error.dark' }}>
            <Typography>{error}</Typography>
          </Paper>
        ) : records.length === 0 ? (
          <Paper sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="body1" color="text.secondary">
              No DNS records found. Click "Add Record" to create your first DNS record.
            </Typography>
          </Paper>
        ) : (
          <TableContainer component={Paper}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell><strong>Hostname</strong></TableCell>
                  <TableCell><strong>IP Address</strong></TableCell>
                  <TableCell><strong>Status</strong></TableCell>
                  <TableCell><strong>Last Updated</strong></TableCell>
                  <TableCell align="right"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {records.map((record) => (
                  <TableRow key={record.id}>
                    <TableCell>{record.hostname}.{config.domainName}</TableCell>
                    <TableCell>{record.ipAddress}</TableCell>
                    <TableCell>
                      <Chip
                        label={record.status}
                        color={(record.status === 'active' || record.status === 'refreshed') ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      {record.lastUpdatedAt 
                        ? new Date(record.lastUpdatedAt).toLocaleString()
                        : 'N/A'}
                    </TableCell>
                    <TableCell align="right">
                      <IconButton
                        color="primary"
                        onClick={() => navigate(`/edit-dns-record/${record.id}`)}
                        size="small"
                        sx={{ mr: 1 }}
                      >
                        <EditIcon />
                      </IconButton>
                      <IconButton
                        color="error"
                        onClick={() => handleDeleteClick(record)}
                        size="small"
                      >
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}

        <Dialog
          open={deleteDialogOpen}
          onClose={handleDeleteCancel}
        >
          <DialogTitle>Delete DNS Record</DialogTitle>
          <DialogContent>
            <DialogContentText>
              Are you sure you want to delete the DNS record for <strong>{recordToDelete?.hostname}</strong>?
              This action cannot be undone.
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleDeleteCancel} disabled={deleting}>
              Cancel
            </Button>
            <Button onClick={handleDeleteConfirm} color="error" disabled={deleting}>
              {deleting ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogActions>
        </Dialog>
      </CardContent>
    </Card>
  );
};

export default ManagementPage;
