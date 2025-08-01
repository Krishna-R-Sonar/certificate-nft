// frontend/src/components/ConnectWallet.js
import { useState, useEffect } from 'react';
import { ethers } from 'ethers'; // ethers v5
import { Button, Typography, Box, Tooltip, Alert } from '@mui/material';
import { motion } from 'framer-motion';

function ConnectWallet({ onConnect }) {
  const [address, setAddress] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState('');

  const connectWallet = async () => {
    try {
      if (!window.ethereum) {
        setError('MetaMask is not installed. Please install MetaMask to continue.');
        return;
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum); // Use Web3Provider for ethers v5
      await provider.send('eth_requestAccounts', []);
      const signer = provider.getSigner();
      const userAddress = await signer.getAddress();
      setAddress(userAddress);
      setIsConnected(true);
      setError('');
      if (onConnect) onConnect(userAddress, true);
    } catch (err) {
      setError(`Failed to connect wallet: ${err.message}`);
      setIsConnected(false);
      setAddress(null);
    }
  };

  const disconnectWallet = () => {
    setAddress(null);
    setIsConnected(false);
    setError('');
    if (onConnect) onConnect(null, false);
  };

  useEffect(() => {
    const checkConnection = async () => {
      if (window.ethereum) {
        try {
          const provider = new ethers.providers.Web3Provider(window.ethereum); // Use Web3Provider for ethers v5
          const accounts = await provider.send('eth_accounts', []);
          if (accounts.length > 0) {
            const signer = provider.getSigner();
            const userAddress = await signer.getAddress();
            setAddress(userAddress);
            setIsConnected(true);
            if (onConnect) onConnect(userAddress, true);
          }
        } catch (err) {
          console.error('Error checking connection:', err);
        }
      } else {
        console.warn('MetaMask not detected');
      }
    };
    checkConnection();

    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts) => {
        if (accounts.length === 0) {
          disconnectWallet();
        } else {
          setAddress(accounts[0]);
          setIsConnected(true);
          if (onConnect) onConnect(accounts[0], true);
        }
      });
      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });
    }

    return () => {
      if (window.ethereum) {
        window.ethereum.removeAllListeners('accountsChanged');
        window.ethereum.removeAllListeners('chainChanged');
      }
    };
  }, [onConnect]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Box sx={{ textAlign: 'center', mt: 2 }}>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        {isConnected ? (
          <Box>
            <Typography sx={{ mb: 1 }}>
              Connected: {address.slice(0, 6)}...{address.slice(-4)}
            </Typography>
            <Button
              variant="outlined"
              color="error"
              onClick={disconnectWallet}
              sx={{ borderRadius: 20 }}
            >
              Disconnect
            </Button>
          </Box>
        ) : (
          <Tooltip title="Connect your MetaMask wallet to mint and manage your portfolio NFT.">
            <Button
              variant="contained"
              onClick={connectWallet}
              sx={{ bgcolor: '#1976d2', '&:hover': { bgcolor: '#1565c0' }, borderRadius: 20 }}
            >
              Connect with MetaMask
            </Button>
          </Tooltip>
        )}
      </Box>
    </motion.div>
  );
}

export default ConnectWallet;