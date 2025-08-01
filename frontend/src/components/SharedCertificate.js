// frontend/src/components/SharedCertificate.js
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { motion } from 'framer-motion';
import { Typography, Box, Card, CardContent, Link, CircularProgress } from '@mui/material';

function SharedCertificate() {
  const { token } = useParams();
  const [certificate, setCertificate] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchCertificate = async () => {
      try {
        const response = await axios.get(`${process.env.REACT_APP_BACKEND_URL}/api/certificate/shared/${token}`);
        setCertificate(response.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Failed to load shared certificate');
      } finally {
        setLoading(false);
      }
    };
    fetchCertificate();
  }, [token]);

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
        Shared Certificate
      </Typography>
      <Card variant="outlined" sx={{ bgcolor: 'white', boxShadow: 3 }}>
        <CardContent>
          <Typography><strong>Address:</strong> {certificate.userAddress}</Typography>
          <Link href={certificate.tokenURI} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', my: 1 }}>
            View Certificate Metadata
          </Link>
          <Typography variant="h6" sx={{ mt: 2 }}>Certificate Details</Typography>
          <Box sx={{ p: 2, bgcolor: '#f5f5f5', borderRadius: 1 }}>
            <Typography><strong>Student Name:</strong> {certificate.certificate.studentName}</Typography>
            <Typography><strong>Degree:</strong> {certificate.certificate.degree}</Typography>
            <Typography><strong>Institution:</strong> {certificate.certificate.institution}</Typography>
            <Typography><strong>Issue Date:</strong> {new Date(certificate.certificate.issueDate).toLocaleDateString()}</Typography>
          </Box>
          {certificate.versions.length > 0 && (
            <Box sx={{ mt: 3 }}>
              <Typography variant="h6">Certificate Versions</Typography>
              {certificate.versions.map((version) => (
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
    </motion.div>
  );
}

export default SharedCertificate;