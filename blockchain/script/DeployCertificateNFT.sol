// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/CertificateNFT.sol";

contract DeployCertificateNFT is Script {
    function run() external {
        // Start broadcasting transactions
        vm.startBroadcast();

        // Set the base gateway URI for IPFS metadata (using Pinata)
        string memory baseGatewayURI = "https://gateway.pinata.cloud/ipfs/";

        // Deploy the CertificateNFT contract
        CertificateNFT cert = new CertificateNFT(baseGatewayURI);

        // Stop broadcasting
        vm.stopBroadcast();

        // Log the deployed contract address
        console.log("CertificateNFT deployed at:", address(cert));
    }
}