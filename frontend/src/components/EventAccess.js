// frontend/src/components/EventAccess.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Typography, Box, Card, CardContent, CircularProgress, Button } from '@mui/material';

function EventAccess({ address, isConnected }) {
  const [eventData, setEventData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const checkEventAccess = async () => {
    setLoading(true);
    try {
      const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/certificate/access/${address}`);
      if (response.data.certificate) {
        setEventData({
          name: 'University Career Fair 2025',
          date: 'May 10, 2025',
          location: 'Eastern Michigan University',
          accessGranted: true,
        });
      } else {
        setError('No certificate found for this address');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to check event access');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isConnected && address) {
      checkEventAccess();
    }
  }, [isConnected, address]);

  if (!isConnected) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.5 }}
        style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}
      >
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
          Event Access
        </Typography>
        <Typography>Please connect your wallet to check event access.</Typography>
      </motion.div>
    );
  }

  if (loading) return <CircularProgress />;
  if (error) return <Typography color="error">{error}</Typography>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}
    >
      <Typography variant="h4" gutterBottom sx={{ fontWeight: 'bold', color: '#1976d2' }}>
        Event Access
      </Typography>
      {eventData ? (
        <Card variant="outlined" sx={{ bgcolor: 'white', boxShadow: 3 }}>
          <CardContent>
            <Typography variant="h6">{eventData.name}</Typography>
            <Typography><strong>Date:</strong> {eventData.date}</Typography>
            <Typography><strong>Location:</strong> {eventData.location}</Typography>
            <Typography color="success" sx={{ mt: 2 }}>
              Access Granted! Your Certificate NFT qualifies you for this event.
            </Typography>
            <Button
              variant="contained"
              sx={{ mt: 2, bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' } }}
              onClick={checkEventAccess}
            >
              Refresh Access
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Typography>No event access available. Mint a Certificate NFT to participate in career events.</Typography>
      )}
    </motion.div>
  );
}

export default EventAccess;