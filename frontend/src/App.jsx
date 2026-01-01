import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import SignupPage from './pages/SignupPage';
import LoginPage from './pages/LoginPage';
import DashboardPage from './pages/DashboardPage';
import AddDnsRecordPage from './pages/AddDnsRecordPage';
import EditDnsRecordPage from './pages/EditDnsRecordPage';
import DocumentationPage from './pages/DocumentationPage';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
  },
});

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    return localStorage.getItem('userToken') !== null;
  });
  const [userEmail, setUserEmail] = useState(() => {
    return localStorage.getItem('userEmail') || '';
  });
  const [userToken, setUserToken] = useState(() => {
    return localStorage.getItem('userToken') || '';
  });

  useEffect(() => {
    // Check if token exists in localStorage on mount
    const token = localStorage.getItem('userToken');
    const email = localStorage.getItem('userEmail');
    if (token && email) {
      setIsLoggedIn(true);
      setUserEmail(email);
      setUserToken(token);
    }
  }, []);

  const handleLoginSuccess = (email, token) => {
    setIsLoggedIn(true);
    setUserEmail(email);
    setUserToken(token);
    // Save to localStorage
    localStorage.setItem('userEmail', email);
    localStorage.setItem('userToken', token);
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setUserEmail('');
    setUserToken('');
    // Clear localStorage
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userToken');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Router>
        <Routes>
          <Route
            path="/login"
            element={
              isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <LoginPage onLoginSuccess={handleLoginSuccess} />
              )
            }
          />
          <Route
            path="/signup"
            element={
              isLoggedIn ? (
                <Navigate to="/dashboard" replace />
              ) : (
                <SignupPage />
              )
            }
          />
          <Route
            path="/dashboard"
            element={
              isLoggedIn ? (
                <DashboardPage userEmail={userEmail} token={userToken} onLogout={handleLogout} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/add-dns-record"
            element={
              isLoggedIn ? (
                <AddDnsRecordPage token={userToken} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/edit-dns-record/:id"
            element={
              isLoggedIn ? (
                <EditDnsRecordPage token={userToken} />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route
            path="/documentation"
            element={
              isLoggedIn ? (
                <DocumentationPage />
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}

export default App;
