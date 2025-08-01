/* frontend/src/components/CertificateManager.js */
import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import axios from 'axios';
import { motion } from 'framer-motion';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Link,
  CircularProgress,
  Box,
  Divider,
  LinearProgress,
  Alert,
} from '@mui/material';
import ShareIcon from '@mui/icons-material/Share';
import { TwitterShareButton, LinkedinShareButton, TwitterIcon, LinkedinIcon } from 'react-share';
import { QRCodeCanvas as QRCode } from 'qrcode.react';
import Tooltip from '@mui/material/Tooltip';

if (!process.env.REACT_APP_BACKEND_URL) {
  console.warn('REACT_APP_BACKEND_URL not set, defaulting to http://localhost:5000');
}
if (!process.env.REACT_APP_CONTRACT_ADDRESS) {
  console.error('REACT_APP_CONTRACT_ADDRESS not set. Contract interactions will fail.');
}

const api = axios.create({
  baseURL: process.env.REACT_APP_BACKEND_URL || 'http://localhost:5000',
  timeout: 10000,
});
console.log('Axios initialized with baseURL:', api.defaults.baseURL);

function CertificateManager({ address, isConnected }) {
  const [certificate, setCertificate] = useState(null);
  const [tokenData, setTokenData] = useState(null);
  const [versions, setVersions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [minting, setMinting] = useState(false);
  const [studentName, setStudentName] = useState('');
  const [degree, setDegree] = useState('');
  const [institution, setInstitution] = useState('');
  const [issueDate, setIssueDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [referrerAddress, setReferrerAddress] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [shareLink, setShareLink] = useState('');
  const [qrCodeValue, setQrCodeValue] = useState('');
  const [referralData, setReferralData] = useState({ referralCount: 0, freeMintCredit: false });

  const normalizeAddress = (addr) => (addr ? addr.toLowerCase() : '');

  const isValidUrl = (url) => {
    if (!url) return true;
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  };

  const checkAccess = useCallback(async () => {
    if (!isConnected || !address || !ethers.utils.isAddress(address)) {
      setError('Please connect a valid wallet');
      return;
    }
    setLoading(true);
    try {
      const normalizedAddress = normalizeAddress(address);
      console.log('Checking access for:', normalizedAddress);
      const response = await api.get(`/api/certificate/access/${normalizedAddress}`);
      console.log('Access response:', JSON.stringify(response.data, null, 2));
      setTokenData({
        tokenId: String(response.data.tokenId),
        tokenURI: response.data.tokenURI,
      });
      if (response.data.certificate) {
        setCertificate(response.data.certificate);
        setStudentName(response.data.certificate.content.studentName);
        setDegree(response.data.certificate.content.degree);
        setInstitution(response.data.certificate.content.institution);
        setIssueDate(new Date(response.data.certificate.content.issueDate).toISOString().split('T')[0]);
        setImageUrl(response.data.certificate.content.imageUrl || '');
        setVersions(response.data.certificate.versions || []);
      }
    } catch (err) {
      const errorMsg = err.response?.status === 404
        ? 'No certificate found for this address. Please mint a certificate first.'
        : err.response?.data?.error || err.message || 'Error checking access. Please ensure the backend server is running.';
      setError(errorMsg);
      console.error('Check access error:', err.message, err.stack, {
        status: err.response?.status,
        url: err.config?.url,
        responseData: err.response?.data,
      });
    } finally {
      setLoading(false);
    }
  }, [address, isConnected]);

  const fetchReferralStatus = useCallback(async () => {
    if (!isConnected || !address || !ethers.utils.isAddress(address)) {
      return;
    }
    try {
      const normalizedAddress = normalizeAddress(address);
      console.log('Fetching referral status for:', normalizedAddress);
      const response = await api.get(`/api/certificate/referrals/${normalizedAddress}`);
      console.log('Referral response:', JSON.stringify(response.data, null, 2));
      setReferralData({
        referralCount: Number(response.data.referralCount) || 0,
        freeMintCredit: response.data.freeMintCredit,
      });
    } catch (err) {
      const errorMsg = err.response?.data?.error || err.message || 'Failed to fetch referral status. Please ensure the backend server is running.';
      setError(errorMsg);
      console.error('Fetch referral status error:', err.message, err.stack, {
        status: err.response?.status,
        url: err.config?.url,
        responseData: err.response?.data,
      });
    }
  }, [address, isConnected]);

  useEffect(() => {
    if (isConnected && address && ethers.utils.isAddress(address)) {
      checkAccess();
      fetchReferralStatus();
    }
  }, [isConnected, address, checkAccess, fetchReferralStatus]);

  const handleMint = async (isFreeMint = false) => {
    if (!ethers.utils.isAddress(address)) {
      setError('Invalid wallet address. Please connect a valid wallet.');
      return;
    }
    setMinting(true);
    setError('');
    setSuccess('');
    try {
      if (!studentName || !degree || !institution || !issueDate) {
        throw new Error('Student name, degree, institution, and issue date are required');
      }
      if (referrerAddress && !ethers.utils.isAddress(referrerAddress)) {
        throw new Error('Invalid referrer address');
      }
      if (imageUrl && !isValidUrl(imageUrl)) {
        throw new Error('Invalid image URL. Please provide a valid URL or leave it empty.');
      }

      const normalizedAddress = normalizeAddress(address);
      const normalizedReferrer = referrerAddress ? normalizeAddress(referrerAddress) : null;
      console.log('Sending mint request to:', `${api.defaults.baseURL}/api/certificate/mint`);
      const metadataRes = await api.post('/api/certificate/mint', {
        userAddress: normalizedAddress,
        studentName,
        degree,
        institution,
        issueDate,
        imageUrl,
        isFreeMint,
        referrerAddress: normalizedReferrer,
      });

      console.log('Mint metadata response:', JSON.stringify(metadataRes.data, null, 2));

      if (!isFreeMint) {
        if (!window.ethereum) {
          throw new Error('MetaMask not detected. Please install MetaMask.');
        }
        const provider = new ethers.providers.Web3Provider(window.ethereum);
        const signer = provider.getSigner();
        const contract = new ethers.Contract(
          process.env.REACT_APP_CONTRACT_ADDRESS,
          [
            'function mint(string) payable',
            'event CertificateMinted(address indexed to, uint256 indexed tokenId, string cid)',
          ],
          signer
        );

        const tx = await contract.mint(metadataRes.data.cid, { value: ethers.utils.parseEther('0.01') });
        const receipt = await tx.wait();
        const event = receipt.events.find((e) => e.event === 'CertificateMinted');
        const tokenId = event.args.tokenId.toString();
        setTokenData({ tokenId, tokenURI: metadataRes.data.jsonLink });
        setSuccess(`Certificate minted! Token ID: ${tokenId} | View Metadata: ${metadataRes.data.jsonLink}`);
      } else {
        setTokenData({ tokenId: 'Pending', tokenURI: metadataRes.data.jsonLink });
        setSuccess(`Free mint requested! Token ID: Pending | View Metadata: ${metadataRes.data.jsonLink}`);
      }

      await checkAccess();
      await fetchReferralStatus();
    } catch (err) {
      const errorMsg = err.response?.data?.error?.includes('Pinata')
        ? 'Failed to upload certificate metadata to IPFS. Please check your Pinata configuration or internet connection.'
        : err.response?.data?.error || err.reason || err.message || 'Minting failed. Please check if the backend server is running and you have sufficient funds or try again.';
      setError(errorMsg);
      console.error('Mint error:', err.message, err.stack, {
        status: err.response?.status,
        url: err.config?.url,
        responseData: err.response?.data,
      });
    } finally {
      setMinting(false);
    }
  };

  const handleMintVersion = async () => {
    if (!ethers.utils.isAddress(address)) {
      setError('Invalid wallet address. Please connect a valid wallet.');
      return;
    }
    setMinting(true);
    setError('');
    setSuccess('');
    try {
      if (!studentName || !degree || !institution || !issueDate) {
        throw new Error('Student name, degree, institution, and issue date are required');
      }
      if (imageUrl && !isValidUrl(imageUrl)) {
        throw new Error('Invalid image URL. Please provide a valid URL or leave it empty.');
      }

      const normalizedAddress = normalizeAddress(address);
      const metadataRes = await api.post('/api/certificate/mint-version', {
        userAddress: normalizedAddress,
        studentName,
        degree,
        institution,
        issueDate,
        imageUrl,
      });

      if (!window.ethereum) {
        throw new Error('MetaMask not detected. Please install MetaMask.');
      }
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(
        process.env.REACT_APP_CONTRACT_ADDRESS,
        ['function mintVersion(address,string) public'],
        signer
      );

      const tx = await contract.mintVersion(normalizedAddress, metadataRes.data.cid);
      await tx.wait();

      setSuccess(`Version minted! Version ID: ${metadataRes.data.versionId} | View Metadata: ${metadataRes.data.jsonLink}`);
      await checkAccess();
    } catch (err) {
      const errorMsg = err.response?.data?.error?.includes('Pinata')
        ? 'Failed to upload version metadata to IPFS. Please check your Pinata configuration or internet connection.'
        : err.response?.data?.error || err.message || 'Version minting failed. Please ensure the backend server is running.';
      setError(errorMsg);
      console.error('Mint version error:', err.message, err.stack, {
        status: err.response?.status,
        url: err.config?.url,
        responseData: err.response?.data,
      });
    } finally {
      setMinting(false);
    }
  };

  const handleShare = async () => {
    if (!ethers.utils.isAddress(address)) {
      setError('Invalid wallet address. Please connect a valid wallet.');
      return;
    }
    setError('');
    setSuccess('');
    try {
      const normalizedAddress = normalizeAddress(address);
      console.log('Generating share link for:', normalizedAddress);
      const response = await api.post('/api/certificate/share', {
        userAddress: normalizedAddress,
      });

      console.log('Share response:', JSON.stringify(response.data, null, 2));
      setShareLink(response.data.shareLink);
      setQrCodeValue(response.data.shareLink);
      setSuccess('Share link generated! Share this link with employers or institutions.');
    } catch (err) {
      const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message || 'Failed to generate share link. Please ensure the backend server is running.';
      setError(`Share failed: ${errorMsg}`);
      console.error('Share error:', err.message, err.stack, {
        status: err.response?.status,
        url: err.config?.url,
      });
    }
  };

  if (loading) return <CircularProgress sx={{ color: '#6f42c1' }} />;

  const isMintDisabled = minting || !isConnected || !studentName || !degree || !institution || !issueDate;
  const isFreeMintDisabled = isMintDisabled || !referralData.freeMintCredit;
  const isShareDisabled = !tokenData || tokenData.tokenId === 'Pending';

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
      style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}
    >
      <Typography
        variant="h4"
        gutterBottom
        sx={{ fontWeight: 'bold', color: '#6f42c1', display: 'flex', alignItems: 'center' }}
      >
        <span className="eth-icon" style={{ marginRight: 8 }} />
        Certificate Manager
      </Typography>
      {error && (
        <motion.div initial={{ y: -10 }} animate={{ y: 0 }} className="error">
          <Alert severity="error">{error}</Alert>
        </motion.div>
      )}
      {success && (
        <motion.div initial={{ y: -10 }} animate={{ y: 0 }} className="success">
          <Alert severity="success">
            {success.includes('View Metadata') ? (
              <>
                {success.split(' | ')[0]} |{' '}
                <Link href={success.split(' | ')[1].split(': ')[1]} target="_blank" rel="noopener noreferrer">
                  View Metadata
                </Link>
              </>
            ) : (
              success
            )}
          </Alert>
        </motion.div>
      )}
      {isConnected && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          sx={{ mt: 3 }}
        >
          <Card variant="outlined" sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', boxShadow: 3, mb: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
                Referral Program
              </Typography>
              <Typography paragraph sx={{ color: '#d3d3d3' }}>
                Invite friends to mint a Certificate NFT on Ethereum! Earn a <strong>free mint</strong> after 3 successful referrals.
              </Typography>
              <Typography sx={{ color: '#ffffff' }}>
                <strong>Referrals:</strong> {referralData.referralCount}/3
              </Typography>
              <LinearProgress
                variant="determinate"
                value={(referralData.referralCount / 3) * 100}
                sx={{ mt: 1, mb: 2, bgcolor: '#3a3a6a', '& .MuiLinearProgress-bar': { bgcolor: '#6f42c1' } }}
              />
              <Typography sx={{ color: '#ffffff' }}>
                <strong>Free Mint Status:</strong>{' '}
                {referralData.freeMintCredit ? 'Earned!' : 'Not yet earned'}
              </Typography>
              {referralData.freeMintCredit && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 0.5 }}
                >
                  <Alert severity="success" sx={{ mt: 2 }}>
                    Congratulations! You’ve earned a free mint credit. Use the “Request Free Mint” button below.
                  </Alert>
                </motion.div>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
      {!tokenData ? (
        <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} transition={{ duration: 0.3 }}>
          <TextField
            fullWidth
            label="Student Name"
            value={studentName}
            onChange={(e) => setStudentName(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            helperText="Enter your full name"
          />
          <TextField
            fullWidth
            label="Degree"
            value={degree}
            onChange={(e) => setDegree(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            helperText="Enter your degree (e.g., B.Sc. Computer Science)"
          />
          <TextField
            fullWidth
            label="Institution"
            value={institution}
            onChange={(e) => setInstitution(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            helperText="Enter your institution name"
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
            helperText="Select the certificate issue date"
          />
          <TextField
            fullWidth
            label="Image URL (Optional)"
            value={imageUrl}
            onChange={(e) => setImageUrl(e.target.value)}
            margin="normal"
            variant="outlined"
            sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
            helperText="Enter a URL to an image of your certificate (optional)"
          />
          <Tooltip title="Earn a free mint by referring three friends!">
            <TextField
              fullWidth
              label="Referrer Address (optional)"
              value={referrerAddress}
              onChange={(e) => setReferrerAddress(e.target.value)}
              margin="normal"
              variant="outlined"
              sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
              helperText="Enter the address of the person who referred you"
            />
          </Tooltip>
          <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
            <Tooltip title="Mint your certificate as an NFT for 0.01 ETH to prove ownership on Ethereum.">
              <span>
                <Button
                  variant="contained"
                  onClick={() => handleMint(false)}
                  disabled={isMintDisabled}
                  sx={{
                    bgcolor: '#6f42c1',
                    '&:hover': { bgcolor: '#8567d6' },
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <span className="eth-icon" style={{ marginRight: 8 }} />
                  {minting ? 'Minting...' : 'Mint Certificate (0.01 ETH)'}
                </Button>
              </span>
            </Tooltip>
            <Tooltip title={referralData.freeMintCredit ? 'Use your earned free mint credit!' : 'Earn a free mint by referring three friends.'}>
              <span>
                <Button
                  variant="outlined"
                  onClick={() => handleMint(true)}
                  disabled={isFreeMintDisabled}
                  sx={{ borderColor: '#6f42c1', color: '#6f42c1', '&:hover': { borderColor: '#8567d6', color: '#8567d6' } }}
                >
                  {minting ? 'Requesting...' : 'Request Free Mint'}
                </Button>
              </span>
            </Tooltip>
          </Box>
        </motion.div>
      ) : (
        <motion.div
          initial={{ scale: 0.9 }}
          animate={{ scale: 1 }}
          transition={{ duration: 0.3 }}
          className="certificate-card"
        >
          <Card
            variant="outlined"
            sx={{
              bgcolor: 'transparent',
              border: 'none',
              color: '#ffffff',
            }}
          >
            <CardContent>
              <Typography
                variant="h5"
                gutterBottom
                sx={{ color: '#6f42c1', display: 'flex', alignItems: 'center' }}
              >
                <span className="eth-icon" style={{ marginRight: 8 }} />
                Your Certificate NFT
              </Typography>
              <Divider sx={{ mb: 2, bgcolor: '#6f42c1' }} />
              <Typography sx={{ color: '#d3d3d3' }}>
                <strong>Token ID:</strong> {tokenData.tokenId === 'Pending' ? 'Pending' : tokenData.tokenId}
              </Typography>
              <Link href={tokenData.tokenURI} target="_blank" rel="noopener noreferrer" sx={{ display: 'block', my: 1, color: '#6f42c1' }}>
                View Metadata
              </Link>
              <Typography variant="h6" sx={{ mt: 2, color: '#ffffff' }}>
                Certificate Details
              </Typography>
              <Box sx={{ mt: 1, p: 2, bgcolor: 'rgba(255, 255, 255, 0.05)', borderRadius: 1 }}>
                <Typography sx={{ color: '#d3d3d3' }}><strong>Student Name:</strong> {certificate?.content.studentName}</Typography>
                <Typography sx={{ color: '#d3d3d3' }}><strong>Degree:</strong> {certificate?.content.degree}</Typography>
                <Typography sx={{ color: '#d3d3d3' }}><strong>Institution:</strong> {certificate?.content.institution}</Typography>
                <Typography sx={{ color: '#d3d3d3' }}>
                  <strong>Issue Date:</strong>{' '}
                  {certificate?.content.issueDate ? new Date(certificate.content.issueDate).toLocaleDateString() : ''}
                </Typography>
                {certificate?.content.imageUrl && (
                  <Typography sx={{ color: '#d3d3d3' }}>
                    <strong>Image:</strong>{' '}
                    <Link href={certificate.content.imageUrl} target="_blank" rel="noopener noreferrer" sx={{ color: '#6f42c1' }}>
                      View Certificate Image
                    </Link>
                  </Typography>
                )}
              </Box>
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
              <TextField
                fullWidth
                label="Image URL (Optional)"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                margin="normal"
                variant="outlined"
                sx={{ bgcolor: 'rgba(255, 255, 255, 0.05)', input: { color: '#ffffff' }, label: { color: '#d3d3d3' } }}
                helperText="Enter a URL to an image of your certificate (optional)"
              />
              <Box sx={{ mt: 2, display: 'flex', gap: 2 }}>
                <Tooltip title="Mint a new version of your certificate as a separate NFT on Ethereum.">
                  <Button
                    variant="contained"
                    onClick={handleMintVersion}
                    disabled={isMintDisabled}
                    sx={{
                      bgcolor: '#388e3c',
                      '&:hover': { bgcolor: '#2e7d32' },
                      display: 'flex',
                      alignItems: 'center',
                    }}
                  >
                    <span className="eth-icon" style={{ marginRight: 8 }} />
                    Mint Version NFT
                  </Button>
                </Tooltip>
              </Box>
              <Box sx={{ mt: 2, display: 'flex', gap: 2, alignItems: 'center' }} className="share-buttons">
                <TwitterShareButton
                  url={tokenData.tokenURI}
                  title="Check out my Certificate NFT on Ethereum! #CertificateNFT"
                >
                  <TwitterIcon size={32} round />
                </TwitterShareButton>
                <LinkedinShareButton
                  url={tokenData.tokenURI}
                  title="My Certificate NFT"
                  summary="Explore my verified academic certificate on the Ethereum blockchain!"
                >
                  <LinkedinIcon size={32} round />
                </LinkedinShareButton>
                <Tooltip title="Generate a shareable link and QR code for your certificate.">
                  <span>
                    <Button
                      variant="contained"
                      startIcon={<ShareIcon />}
                      onClick={handleShare}
                      disabled={isShareDisabled}
                      sx={{
                        bgcolor: '#0288d1',
                        '&:hover': { bgcolor: '#0277bd' },
                        display: 'flex',
                        alignItems: 'center',
                      }}
                    >
                      <span className="eth-icon" style={{ marginRight: 8 }} />
                      Generate Share Link
                    </Button>
                  </span>
                </Tooltip>
              </Box>
              {shareLink && (
                <Box sx={{ mt: 2 }}>
                  <Typography sx={{ color: '#ffffff' }}>
                    <strong>Share Link:</strong>
                  </Typography>
                  <Link href={shareLink} target="_blank" rel="noopener noreferrer" sx={{ color: '#6f42c1' }}>
                    {shareLink}
                  </Link>
                  <Box sx={{ mt: 2 }}>
                    <Typography sx={{ color: '#ffffff' }}>
                      <strong>QR Code for Verification:</strong>
                    </Typography>
                    <QRCode value={qrCodeValue} size={128} />
                    <Typography variant="caption" sx={{ color: '#d3d3d3' }}>
                      Scan this QR code to verify certificate ownership on Ethereum.
                    </Typography>
                  </Box>
                </Box>
              )}
              {versions.length > 0 && (
                <Box sx={{ mt: 3 }}>
                  <Typography variant="h6" sx={{ color: '#ffffff' }}>Certificate Versions</Typography>
                  {versions.map((version) => (
                    <Box key={version.versionId} sx={{ mt: 1 }}>
                      <Typography sx={{ color: '#d3d3d3' }}>Version ID: {version.versionId}</Typography>
                      <Link
                        href={`https://${process.env.REACT_APP_GATEWAY_URL}/ipfs/${version.cid}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ color: '#6f42c1' }}
                      >
                        View Version Metadata
                      </Link>
                    </Box>
                  ))}
                </Box>
              )}
            </CardContent>
          </Card>
        </motion.div>
      )}
    </motion.div>
  );
}

export default CertificateManager;