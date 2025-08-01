/* frontend/src/components/About.jsx */
import { motion } from 'framer-motion';
import { Typography, Box, Button } from '@mui/material';
import { NavLink } from 'react-router-dom';

function About() {
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
        About Certificate Verification System
      </Typography>
      <Box sx={{ bgcolor: 'rgba(255, 255, 255, 0.1)', p: 3, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
          What are Gated NFTs?
        </Typography>
        <Typography paragraph sx={{ color: '#d3d3d3' }}>
          Gated NFTs are non-fungible tokens that provide secure, verifiable access to academic certificates. By owning a specific NFT, users can prove the authenticity of their credentials, with metadata stored immutably on IPFS and verified on the Ethereum blockchain.
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
          Our Project
        </Typography>
        <Typography paragraph sx={{ color: '#d3d3d3' }}>
          The Certificate Verification System is a decentralized application (DApp) built on Ethereum that enables universities to issue academic certificates as NFTs. These NFTs gate access to private certificate details stored in MongoDB, while public metadata on IPFS can be shared with employers or institutions for instant verification. The system ensures tamper-proof credentials and streamlines verification processes.
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ color: '#ffffff' }}>
          Key Features
        </Typography>
        <Typography component="ul" sx={{ pl: 4, color: '#d3d3d3' }}>
          <li>Verifiable certificates via NFT ownership on Ethereum.</li>
          <li>Gated access to private certificate details for authorized users.</li>
          <li>Public metadata sharing for employer verification via IPFS.</li>
          <li>Version tracking for updated or additional certificates.</li>
          <li>Event access for credential-based opportunities (e.g., career fairs).</li>
          <li>Referral program for free mints after 3 referrals.</li>
        </Typography>
        <Typography variant="h6" gutterBottom sx={{ mt: 2, color: '#ffffff' }}>
          Why It Matters
        </Typography>
        <Typography paragraph sx={{ color: '#d3d3d3' }}>
          Our project addresses the inefficiencies of traditional certificate verification by providing a secure, transparent, and instant solution on the Ethereum blockchain. It empowers students, universities, and employers by ensuring the authenticity and integrity of academic credentials.
        </Typography>
        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <NavLink to="/">
            <Button
              variant="contained"
              sx={{
                bgcolor: '#6f42c1',
                '&:hover': { bgcolor: '#8567d6' },
                display: 'flex',
                alignItems: 'center',
              }}
            >
              <span className="eth-icon" style={{ marginRight: 8 }} />
              Try It Now
            </Button>
          </NavLink>
        </Box>
      </Box>
    </motion.div>
  );
}

export default About;