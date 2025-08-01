/* frontend/src/App.js */
import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Box, CssBaseline, AppBar, Toolbar, Typography, Button, Container } from '@mui/material';
import CertificateManager from './components/CertificateManager';
import AdminPanel from './components/AdminPanel';
import PublicCertificates from './components/PublicCertificates';
import SharedCertificate from './components/SharedCertificate';
import EventAccess from './components/EventAccess';
import About from './components/About';
import ConnectWallet from './components/ConnectWallet';
import ErrorBoundary from './components/ErrorBoundary';
import './App.css';

function App() {
  const [address, setAddress] = useState('');
  const [isConnected, setIsConnected] = useState(false);

  const handleConnect = (newAddress, connected) => {
    setAddress(newAddress || '');
    setIsConnected(connected);
  };

  return (
    <Router>
      <CssBaseline />
      <AppBar
        position="static"
        sx={{
          bgcolor: 'transparent',
          background: 'linear-gradient(90deg, #6f42c1, #3a3a6a)', // Ethereum gradient
          boxShadow: '0 4px 12px rgba(111, 66, 193, 0.5)',
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            component="div"
            sx={{ flexGrow: 1, display: 'flex', alignItems: 'center' }}
          >
            <span className="eth-icon" style={{ marginRight: 8 }} />
            Certificate Verification System
          </Typography>
          <Button color="inherit" component="a" href="/" sx={{ mx: 1, '&:hover': { bgcolor: '#8567d6' } }}>
            Home
          </Button>
          <Button color="inherit" component="a" href="/public" sx={{ mx: 1, '&:hover': { bgcolor: '#8567d6' } }}>
            Public Certificates
          </Button>
          <Button color="inherit" component="a" href="/event-access" sx={{ mx: 1, '&:hover': { bgcolor: '#8567d6' } }}>
            Event Access
          </Button>
          <Button color="inherit" component="a" href="/admin" sx={{ mx: 1, '&:hover': { bgcolor: '#8567d6' } }}>
            Admin
          </Button>
          <Button color="inherit" component="a" href="/about" sx={{ mx: 1, '&:hover': { bgcolor: '#8567d6' } }}>
            About
          </Button>
          <ConnectWallet onConnect={handleConnect} />
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4 }} className="App">
        <Routes>
          <Route
            path="/"
            element={
              <ErrorBoundary>
                <CertificateManager address={address} isConnected={isConnected} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/admin"
            element={
              <ErrorBoundary>
                <AdminPanel address={address} isConnected={isConnected} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/public"
            element={
              <ErrorBoundary>
                <PublicCertificates />
              </ErrorBoundary>
            }
          />
          <Route
            path="/certificate/shared/:token"
            element={
              <ErrorBoundary>
                <SharedCertificate />
              </ErrorBoundary>
            }
          />
          <Route
            path="/event-access"
            element={
              <ErrorBoundary>
                <EventAccess address={address} isConnected={isConnected} />
              </ErrorBoundary>
            }
          />
          <Route
            path="/about"
            element={
              <ErrorBoundary>
                <About />
              </ErrorBoundary>
            }
          />
        </Routes>
      </Container>
    </Router>
  );
}

export default App;