/* frontend/src/components/AdminPanel.js */
import { useState } from 'react';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Typography,
  TextField,
  Button,
  Box,
  CircularProgress,
  Alert,
} from '@mui/material';
import { ethers } from 'ethers';

function AdminPanel({ address, isConnected }) {
  const [baseGatewayURI, setBaseGatewayURI] = useState('');
  const [newOwner, setNewOwner] = useState('');
  const [freeMintAddress, setFreeMintAddress] = useState('');
  const [referrerAddress, setReferrerAddress] = useState('');
  const [studentName, setStudentName] = useState('');
  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [revokeTokenId, setRevokeTokenId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const updateBaseGatewayURI = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/set-base-gateway-uri`, { baseGatewayURI });
      setSuccess(`Base gateway URI updated! Tx: ${response.data.txHash}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error updating base gateway URI');
    } finally {
      setLoading(false);
    }
  };

  const pauseContract = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/pause`);
      setSuccess(`Contract paused! Tx: ${response.data.txHash}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error pausing contract');
    } finally {
      setLoading(false);
    }
  };

  const unpauseContract = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/unpause`);
      setSuccess(`Contract unpaused! Tx: ${response.data.txHash}`);
    } catch (err) {
      setError(err.response?.data?.error || 'Error unpausing contract');
    } finally {
      setLoading(false);
    }
  };

  const transferOwnership = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!ethers.utils.isAddress(newOwner)) {
        throw new Error('Invalid new owner address');
      }
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/transfer-ownership`, { newOwner });
      setSuccess(`Ownership transferred! Tx: ${response.data.txHash}`);
      setNewOwner('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error transferring ownership');
    } finally {
      setLoading(false);
    }
  };

  const mintFree = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!ethers.utils.isAddress(freeMintAddress)) {
        throw new Error('Invalid user address');
      }
      if (!studentName || !degree || !institution || !issueDate) {
        throw new Error('Student name, degree, institution, and issue date required');
      }
      const payload = { userAddress: freeMintAddress, studentName, degree, institution, issueDate };
      if (referrerAddress && ethers.utils.isAddress(referrerAddress)) {
        payload.referrerAddress = referrerAddress;
      }
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/mint-free`, payload);
      setSuccess(`Free certificate minted! Tx: ${response.data.txHash}`);
      setFreeMintAddress('');
      setReferrerAddress('');
      setStudentName('');
      setDegree('');
      setInstitution('');
      setIssueDate('');
    } catch (err) {
      const errorMessage = err.response?.data?.error || err.response?.data?.details || err.message || 'Error minting free certificate';
      setError(errorMessage);
      console.error('Mint free error:', err.response?.data || err);
    } finally {
      setLoading(false);
    }
  };

  const revokeCertificate = async () => {
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      if (!revokeTokenId) {
        throw new Error('Token ID required');
      }
      const response = await axios.post(`${process.env.REACT_APP_BACKEND_URL}/api/admin/revoke`, { tokenId: revokeTokenId });
      setSuccess(`Certificate revoked! Tx: ${response.data.txHash}`);
      setRevokeTokenId('');
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Error revoking certificate');
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{
        padding: '20px',
        maxWidth: '800px',
        margin: '0 auto',
        background: 'linear-gradient(45deg, #2a2a4a, #3a3a6a)',
        borderRadius: '15px',
        boxShadow: '0 8px 24px rgba(111, 66, 193, 0.5)',
      }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#6f42c1', display: 'flex', alignItems: 'center' }}
      >
        <span className="eth-icon" style={{ marginRight: 8 }} />
        Admin Panel
      </Typography>
      {!isConnected ? (
        <Typography sx={{ color: '#d3d3d3' }}>Please connect your wallet to access admin functions.</Typography>
      ) : (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {error && <Alert severity="error">{error}</Alert>}
          {success && <Alert severity="success">{success}</Alert>}
          {loading && <CircularProgress sx={{ color: '#6f42c1' }} />}
          <Box>
            <Typography variant="h6" sx={{ color: '#ffffff' }}>Update Base Gateway URI</Typography>
            <TextField
              fullWidth
              label="Base Gateway URI"
              value={baseGatewayURI}
              onChange={(e) => setBaseGatewayURI(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            />
            <Button
              variant="contained"
              onClick={updateBaseGatewayURI}
              disabled={loading || !baseGatewayURI}
              sx={{
                mt: 2,
                bgcolor: '#6f42c1',
                '&:hover': { bgcolor: '#8567d6' },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span className="eth-icon" style={{ marginRight: 8 }} />
              Update URI
            </Button>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#ffffff' }}>Contract Controls</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 2 }}>
              <Button
                variant="contained"
                onClick={pauseContract}
                disabled={loading}
                sx={{
                  bgcolor: '#ff4d4f',
                  '&:hover': { bgcolor: '#d9363e' },
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span className="eth-icon" style={{ marginRight: 8 }} />
                Pause Contract
              </Button>
              <Button
                variant="contained"
                onClick={unpauseContract}
                disabled={loading}
                sx={{
                  bgcolor: '#52c41a',
                  '&:hover': { bgcolor: '#389e0d' },
                  display: 'flex',
                  alignItems: 'center',
                }}
              >
                <span className="eth-icon" style={{ marginRight: 8 }} />
                Unpause Contract
              </Button>
            </Box>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#ffffff' }}>Transfer Ownership</Typography>
            <TextField
              fullWidth
              label="New Owner Address"
              value={newOwner}
              onChange={(e) => setNewOwner(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            />
            <Button
              variant="contained"
              onClick={transferOwnership}
              disabled={loading || !ethers.utils.isAddress(newOwner)}
              sx={{
                mt: 2,
                bgcolor: '#6f42c1',
                '&:hover': { bgcolor: '#8567d6' },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span className="eth-icon" style={{ marginRight: 8 }} />
              Transfer Ownership
            </Button>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#ffffff' }}>Mint Free Certificate</Typography>
            <TextField
              fullWidth
              label="User Address"
              value={freeMintAddress}
              onChange={(e) => setFreeMintAddress(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            />
            <TextField
              fullWidth
              label="Referrer Address (optional)"
              value={referrerAddress}
              onChange={(e) => setReferrerAddress(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            />
            <TextField
              fullWidth
              label="Student Name"
              value={studentName}
              onChange={(e) => setStudentName(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            />
            <TextField
              fullWidth
              label="Degree"
              value={degree}
              onChange={(e) => setDegree(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            />
            <TextField
              fullWidth
              label="Institution"
              value={institution}
              onChange={(e) => setInstitution(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            />
            <TextField
              fullWidth
              label="Issue Date"
              type="date"
              value={issueDate}
              onChange={(e) => setIssueDate(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
              InputLabelProps={{ shrink: true }}
            />
            <Button
              variant="contained"
              onClick={mintFree}
              disabled={loading || !ethers.utils.isAddress(freeMintAddress) || !studentName || !degree || !institution || !issueDate}
              sx={{
                mt: 2,
                bgcolor: '#6f42c1',
                '&:hover': { bgcolor: '#8567d6' },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span className="eth-icon" style={{ marginRight: 8 }} />
              Mint Free Certificate
            </Button>
          </Box>
          <Box>
            <Typography variant="h6" sx={{ color: '#ffffff' }}>Revoke Certificate</Typography>
            <TextField
              fullWidth
              label="Token ID"
              value={revokeTokenId}
              onChange={(e) => setRevokeTokenId(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            />
            <Button
              variant="contained"
              color="error"
              onClick={revokeCertificate}
              disabled={loading || !revokeTokenId}
              sx={{
                mt: 2,
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span className="eth-icon" style={{ marginRight: 8 }} />
              Revoke Certificate
            </Button>
          </Box>
        </Box>
      )}
    </motion.div>
  );
}

export default AdminPanel;