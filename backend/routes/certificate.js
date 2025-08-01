// backend/routes/certificate.js
const express = require('express');
const router = express.Router();
const Certificate = require('../models/Certificate');
const { ethers } = require('ethers');
const { PinataSDK } = require('pinata-web3');
require('dotenv').config();

// Initialize Pinata with JWT and Gateway URL
const pinata = new PinataSDK({
  pinataJwt: process.env.PINATA_JWT,
  pinataGateway: process.env.GATEWAY_URL, // e.g., mydomain.mypinata.cloud
});

// GET /api/certificate/access/:address
router.get('/access/:address', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    console.log('Access request for address:', address);
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    const certificate = await Certificate.findOne({ owner: address });
    if (!certificate) {
      console.log('No certificate found for address:', address);
      return res.status(404).json({ error: 'No certificate found for this address' });
    }
    res.json({ certificate, tokenId: '1', tokenURI: certificate.metadataUri });
  } catch (err) {
    console.error('Access error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/certificate/referrals/:address
router.get('/referrals/:address', async (req, res) => {
  try {
    const address = req.params.address.toLowerCase();
    console.log('Referral request for address:', address);
    if (!ethers.utils.isAddress(address)) {
      return res.status(400).json({ error: 'Invalid Ethereum address' });
    }
    const certificate = await Certificate.findOne({ owner: address });
    const referralCount = certificate?.referrals?.length || 0;
    const freeMintCredit = referralCount >= 3;
    res.json({ referralCount, freeMintCredit });
  } catch (err) {
    console.error('Referral error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// GET /api/certificate/public
router.get('/public', async (req, res) => {
  try {
    console.log('Fetching public certificates');
    const certificates = await Certificate.find({}, 'owner metadataUri cid content referrals versions');
    if (!certificates.length) {
      console.log('No public certificates found');
      return res.status(200).json({ certificates: [] });
    }
    const formattedCertificates = certificates.map(cert => ({
      userAddress: cert.owner,
      tokenURI: cert.metadataUri,
      userData: { referralCount: cert.referrals?.length || 0 },
      versions: cert.versions.map(v => ({
        versionId: v.versionId,
        tokenURI: `${process.env.GATEWAY_URL}/ipfs/${v.cid}`,
        createdAt: cert.content.issueDate,
      })),
    }));
    console.log('Public certificates fetched:', formattedCertificates.length);
    res.json({ certificates: formattedCertificates });
  } catch (err) {
    console.error('Public certificates error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/certificate/mint
router.post('/mint', async (req, res) => {
  try {
    const { userAddress, studentName, degree, institution, issueDate, imageUrl, isFreeMint, referrerAddress } = req.body;
    console.log('Mint request received:', { userAddress, studentName, degree, institution, issueDate, imageUrl, isFreeMint, referrerAddress });

    // Validate inputs
    if (!ethers.utils.isAddress(userAddress)) {
      return res.status(400).json({ error: 'Invalid user address' });
    }
    if (!studentName || !degree || !institution || !issueDate) {
      return res.status(400).json({ error: 'All fields except image URL are required' });
    }
    if (referrerAddress && !ethers.utils.isAddress(referrerAddress)) {
      return res.status(400).json({ error: 'Invalid referrer address' });
    }
    if (imageUrl) {
      try {
        new URL(imageUrl);
      } catch {
        return res.status(400).json({ error: 'Invalid image URL' });
      }
    }

    // Upload metadata to Pinata
    const metadata = {
      studentName,
      degree,
      institution,
      issueDate: new Date(issueDate).toISOString(),
      owner: userAddress.toLowerCase(),
      imageUrl: imageUrl || null,
    };
    console.log('Uploading metadata to Pinata:', metadata);
    let pinataResponse;
    try {
      pinataResponse = await pinata.upload.json(metadata);
      console.log('Pinata upload response:', pinataResponse);
    } catch (pinataError) {
      console.error('Pinata upload error:', {
        message: pinataError.message,
        stack: pinataError.stack,
        response: pinataError.response ? pinataError.response.data : 'No response data',
        status: pinataError.response ? pinataError.response.status : 'No status',
      });
      throw new Error(`Failed to upload to Pinata: ${pinataError.message}${pinataError.response ? ` (Status: ${pinataError.response.status}, Data: ${JSON.stringify(pinataError.response.data)})` : ''}`);
    }
    const cid = pinataResponse.IpfsHash; // Use IpfsHash as per pinata-web3 SDK
    const jsonLink = `${process.env.GATEWAY_URL}/ipfs/${cid}`; // Use GATEWAY_URL from .env
    console.log('Pinata upload successful:', { cid, jsonLink });

    // Save to MongoDB
    const certificate = new Certificate({
      owner: userAddress.toLowerCase(),
      metadataUri: jsonLink,
      cid,
      content: { ...metadata },
      referrals: referrerAddress ? [referrerAddress.toLowerCase()] : [],
    });
    try {
      await certificate.save();
      console.log('Certificate saved to MongoDB:', certificate);
    } catch (mongoError) {
      console.error('MongoDB save error:', {
        message: mongoError.message,
        stack: mongoError.stack,
      });
      throw new Error(`Failed to save to MongoDB: ${mongoError.message}`);
    }

    // Update referrer's referral count if applicable
    if (referrerAddress) {
      const referrerCert = await Certificate.findOne({ owner: referrerAddress.toLowerCase() });
      if (referrerCert) {
        referrerCert.referrals = referrerCert.referrals || [];
        referrerCert.referrals.push(userAddress.toLowerCase());
        await referrerCert.save();
        console.log('Referrer updated:', referrerAddress);
      }
    }

    res.json({ cid, jsonLink });
  } catch (err) {
    console.error('Mint error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// POST /api/certificate/mint-version
router.post('/mint-version', async (req, res) => {
  try {
    const { userAddress, studentName, degree, institution, issueDate, imageUrl } = req.body;
    console.log('Mint-version request received:', { userAddress, studentName, degree, institution, issueDate, imageUrl });

    // Validate inputs
    if (!ethers.utils.isAddress(userAddress)) {
      return res.status(400).json({ error: 'Invalid user address' });
    }
    if (!studentName || !degree || !institution || !issueDate) {
      return res.status(400).json({ error: 'All fields except image URL are required' });
    }
    if (imageUrl) {
      try {
        new URL(imageUrl);
      } catch {
        return res.status(400).json({ error: 'Invalid image URL' });
      }
    }

    // Upload metadata to Pinata
    const metadata = {
      studentName,
      degree,
      institution,
      issueDate: new Date(issueDate).toISOString(),
      owner: userAddress.toLowerCase(),
      imageUrl: imageUrl || null,
    };
    console.log('Uploading version metadata to Pinata:', metadata);
    let pinataResponse;
    try {
      pinataResponse = await pinata.upload.json(metadata);
      console.log('Pinata upload response:', pinataResponse);
    } catch (pinataError) {
      console.error('Pinata upload error:', {
        message: pinataError.message,
        stack: pinataError.stack,
        response: pinataError.response ? pinataError.response.data : 'No response data',
        status: pinataError.response ? pinataError.response.status : 'No status',
      });
      throw new Error(`Failed to upload to Pinata: ${pinataError.message}${pinataError.response ? ` (Status: ${pinataError.response.status}, Data: ${JSON.stringify(pinataError.response.data)})` : ''}`);
    }
    const cid = pinataResponse.IpfsHash; // Use IpfsHash as per pinata-web3 SDK
    const jsonLink = `${process.env.GATEWAY_URL}/ipfs/${cid}`; // Use GATEWAY_URL from .env
    console.log('Pinata upload successful:', { cid, jsonLink });

    // Update certificate with new version
    const certificate = await Certificate.findOne({ owner: userAddress.toLowerCase() });
    if (!certificate) {
      console.log('No certificate found for version mint:', userAddress);
      return res.status(404).json({ error: 'No certificate found for this address' });
    }
    const versionId = (certificate.versions?.length || 0) + 1;
    certificate.versions = certificate.versions || [];
    certificate.versions.push({ versionId: String(versionId), cid });
    certificate.content = { ...metadata };
    try {
      await certificate.save();
      console.log('Certificate version saved to MongoDB:', certificate);
    } catch (mongoError) {
      console.error('MongoDB save error:', {
        message: mongoError.message,
        stack: mongoError.stack,
      });
      throw new Error(`Failed to save to MongoDB: ${mongoError.message}`);
    }

    res.json({ versionId, cid, jsonLink });
  } catch (err) {
    console.error('Mint version error:', {
      message: err.message,
      stack: err.stack,
    });
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Debug route for Pinata
router.get('/debug/pinata', async (req, res) => {
  try {
    const testData = { test: 'data' };
    const pinataResponse = await pinata.upload.json(testData);
    console.log('Pinata test successful:', pinataResponse);
    res.json({ status: 'OK', cid: pinataResponse.IpfsHash });
  } catch (err) {
    console.error('Pinata debug error:', {
      message: err.message,
      stack: err.stack,
      response: err.response ? err.response.data : 'No response data',
      status: err.response ? err.response.status : 'No status',
    });
    res.status(500).json({ error: 'Pinata debug failed', details: err.message, response: err.response?.data });
  }
});

module.exports = router;