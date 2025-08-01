// frontend/src/components/PublicCertificates.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Typography, Box, Card, CardContent, Link, CircularProgress } from '@mui/material';

function PublicCertificates() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificates = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/certificate/public`);
        setCertificates(response.data.certificates);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load public certificates');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificates();
  }, []);

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
        Public Certificates
      </Typography>
      {certificates.length === 0 ? (
        <Typography>No public certificates available.</Typography>
      ) : (
        certificates.map((cert) => (
          <Card key={cert.userAddress} variant="outlined" sx={{ bgcolor: 'white', boxShadow: 3, mb: 2 }}>
            <CardContent>
              <Typography><strong>Address:</strong> {cert.userAddress}</Typography>
              <Link href={cert.tokenURI} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', my: 1 }}>
                View Certificate Metadata
              </Link>
              <Typography><strong>Referrals:</strong> {cert.userData.referralCount}</Typography>
              {cert.versions.length > 0 && (
                <Box sx={{ mt: 2 }}>
                  <Typography variant="h6">Versions</Typography>
                  {cert.versions.map((version) => (
                    <Box key={version.versionId} sx={{ mt: 1 }}>
                      <Typography>Version ID: {version.versionId}</Typography>
                      <Link href={version.tokenURI} target="_blank" rel="noopener noreferrer">
                        View Version Metadata
                      </Link>
                      <Typography>Created: {new Date(version.createdAt).toLocaleDateString()}</Typography>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        ))
      )}
    </motion.div>
  );
}

export default PublicCertificates;