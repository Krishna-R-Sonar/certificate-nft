// backend/routes/admin.js
const express = require('express');
const ethers = require('ethers');
const Certificate = require('../models/Certificate');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const router = express.Router();

// Validate environment variables
if (!process.env.ALCHEMY_API_URL || !process.env.PRIVATE_KEY || !process.env.CONTRACT_ADDRESS) {
  console.error('Missing required environment variables: ALCHEMY_API_URL, PRIVATE_KEY, or CONTRACT_ADDRESS');
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(process.env.ALCHEMY_API_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contractAddress = process.env.CONTRACT_ADDRESS;

// Load ABI
let contractABI;
try {
  const rawABI = JSON.parse(fs.readFileSync(path.join(__dirname, '../abis/CertificateNFT.json')));
  contractABI = Array.isArray(rawABI) ? rawABI : rawABI.abi;
  console.log('ABI loaded successfully:', contractABI.length, 'functions');
} catch (error) {
  console.error('Failed to load ABI:', error.message, error.stack);
  process.exit(1);
}

const contract = new ethers.Contract(contractAddress, contractABI, wallet);

const isAdmin = async (req, res, next) => {
  try {
    const owner = await contract.owner();
    if (wallet.address.toLowerCase() !== owner.toLowerCase()) {
      console.error('Admin check failed: Wallet is not owner', { wallet: wallet.address, owner });
      return res.status(403).json({ error: 'Not authorized' });
    }
    console.log('Admin check passed for:', wallet.address);
    next();
  } catch (error) {
    console.error('Admin check error:', error.message, error.stack);
    res.status(500).json({ error: 'Failed to verify admin', details: error.message });
  }
};

router.post('/set-base-gateway-uri', isAdmin, async (req, res) => {
  try {
    const { baseGatewayURI } = req.body;
    console.log('Set base gateway URI request:', { baseGatewayURI });
    if (!baseGatewayURI) {
      console.error('Base gateway URI missing');
      return res.status(400).json({ error: 'Base gateway URI required' });
    }
    const tx = await contract.setBaseGatewayURI(baseGatewayURI);
    const receipt = await tx.wait();
    console.log('Base gateway URI updated:', { txHash: receipt.transactionHash });
    res.json({ success: true, txHash: receipt.transactionHash });
  } catch (error) {
    console.error('Set base gateway URI error:', {
      message: error.message,
      stack: error.stack,
      baseGatewayURI: req.body.baseGatewayURI,
    });
    res.status(500).json({ error: 'Failed to update base gateway URI', details: error.message });
  }
});

router.post('/pause', isAdmin, async (req, res) => {
  try {
    console.log('Pause contract request received');
    const tx = await contract.pause();
    const receipt = await tx.wait();
    console.log('Contract paused:', { txHash: receipt.transactionHash });
    res.json({ success: true, txHash: receipt.transactionHash });
  } catch (error) {
    console.error('Pause error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to pause contract', details: error.message });
  }
});

router.post('/unpause', isAdmin, async (req, res) => {
  try {
    console.log('Unpause contract request received');
    const tx = await contract.unpause();
    const receipt = await tx.wait();
    console.log('Contract unpaused:', { txHash: receipt.transactionHash });
    res.json({ success: true, txHash: receipt.transactionHash });
  } catch (error) {
    console.error('Unpause error:', {
      message: error.message,
      stack: error.stack,
    });
    res.status(500).json({ error: 'Failed to unpause contract', details: error.message });
  }
});

router.post('/transfer-ownership', isAdmin, async (req, res) => {
  try {
    const { newOwner } = req.body;
    console.log('Transfer ownership request:', { newOwner });
    if (!ethers.utils.isAddress(newOwner)) {
      console.error('Invalid address:', newOwner);
      return res.status(400).json({ error: 'Invalid address' });
    }
    const tx = await contract.transferOwnership(newOwner);
    const receipt = await tx.wait();
    console.log('Ownership transferred:', { newOwner, txHash: receipt.transactionHash });
    res.json({ success: true, txHash: receipt.transactionHash });
  } catch (error) {
    console.error('Transfer ownership error:', {
      message: error.message,
      stack: error.stack,
      newOwner: req.body.newOwner,
    });
    res.status(500).json({ error: 'Failed to transfer ownership', details: error.message });
  }
});

router.post('/mint-free', isAdmin, async (req, res) => {
  try {
    const { userAddress, referrerAddress, studentName, degree, institution, issueDate } = req.body;
    console.log('Free mint request:', { userAddress, referrerAddress, studentName, degree, institution, issueDate });

    if (!userAddress || !ethers.utils.isAddress(userAddress)) {
      console.error('Invalid or missing userAddress:', userAddress);
      return res.status(400).json({ error: 'Valid user address required' });
    }
    if (!studentName || !degree || !institution || !issueDate) {
      console.error('Missing certificate details:', { studentName, degree, institution, issueDate });
      return res.status(400).json({ error: 'Student name, degree, institution, and issue date required' });
    }

    const hasCertificate = await contract.hasCertificate(userAddress);
    if (hasCertificate) {
      console.error('User already has a certificate:', { userAddress });
      return res.status(400).json({ error: 'User already holds an active certificate' });
    }

    let certificate = await Certificate.findOne({ userAddress: userAddress.toLowerCase() });
    if (!certificate) {
      console.log('Creating new certificate for:', userAddress);
      const defaultMetadata = {
        name: 'Certificate NFT',
        description: 'Grants access to a verified academic certificate.',
        image: 'https://via.placeholder.com/150',
      };
      certificate = await Certificate.create({
        userAddress: userAddress.toLowerCase(),
        content: { studentName, degree, institution, issueDate: new Date(issueDate) },
        nftMetadata: { cid: 'QmDefaultCid123', ...defaultMetadata },
      });
    }

    if (!certificate.nftMetadata?.cid) {
      console.error('No CID found in certificate for:', userAddress);
      return res.status(400).json({ error: 'Certificate metadata missing CID' });
    }

    const cid = certificate.nftMetadata.cid;
    console.log('Attempting free mint for:', { userAddress, cid, referrerAddress });

    const gasEstimate = await contract.estimateGas
      .mintFor(userAddress, cid, referrerAddress || ethers.constants.AddressZero)
      .catch((err) => {
        console.error('Gas estimation failed:', err.message, err.stack);
        throw new Error(`Gas estimation failed: ${err.message}`);
      });

    const gasLimit = gasEstimate.mul(120).div(100);
    const tx = await contract.mintFor(userAddress, cid, referrerAddress || ethers.constants.AddressZero, { gasLimit });
    const receipt = await tx.wait();

    console.log('Free mint successful:', {
      userAddress,
      txHash: receipt.transactionHash,
      gasUsed: receipt.gasUsed.toString(),
    });

    res.json({ success: true, txHash: receipt.transactionHash });
  } catch (error) {
    console.error('Free mint error:', {
      userAddress: req.body.userAddress,
      errorMessage: error.message,
      errorStack: error.stack,
    });
    res.status(500).json({
      error: 'Failed to mint free certificate',
      details: error.message,
    });
  }
});

router.post('/revoke', isAdmin, async (req, res) => {
  try {
    const { tokenId } = req.body;
    console.log('Revoke request for token ID:', tokenId);
    if (!tokenId) {
      console.error('Token ID missing');
      return res.status(400).json({ error: 'Token ID required' });
    }
    const tx = await contract.revoke(tokenId);
    const receipt = await tx.wait();
    await Certificate.deleteOne({ 'nftMetadata.tokenId': tokenId });
    console.log('Certificate revoked:', { tokenId, txHash: receipt.transactionHash });
    res.json({ success: true, txHash: receipt.transactionHash });
  } catch (error) {
    console.error('Revoke error:', {
      message: error.message,
      stack: error.stack,
      tokenId: req.body.tokenId,
    });
    res.status(500).json({ error: 'Failed to revoke certificate', details: error.message });
  }
});

module.exports = router;