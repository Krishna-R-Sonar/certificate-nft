// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Test.sol";
import "../src/CertificateNFT.sol";

contract CertificateNFTTest is Test {
    CertificateNFT cert;
    address user = address(0x123);
    address owner;
    address newOwner = address(0x456);
    address referrer = address(0x789);
    string constant baseGatewayURI = "https://gateway.pinata.cloud/ipfs/";
    string constant testCid = "QmTestCid123";

    function setUp() public {
        cert = new CertificateNFT(baseGatewayURI);
        owner = address(this);
        vm.deal(user, 1 ether);
        vm.deal(referrer, 1 ether);
    }

    receive() external payable {}

    function onERC721Received(address, address, uint256, bytes calldata) external pure returns (bytes4) {
        return this.onERC721Received.selector;
    }

    function testMint() public {
        vm.prank(user);
        cert.mint{value: 0.01 ether}(testCid);
        assertEq(cert.balanceOf(user), 1);
        assertTrue(cert.hasCertificate(user));
        assertEq(cert.getTokenId(user), 1);
        assertEq(cert.tokenURI(1), string(abi.encodePacked(baseGatewayURI, testCid)));
        (bool isValid, string memory cid) = cert.verifyCertificate(user, 1);
        assertTrue(isValid);
        assertEq(cid, string(abi.encodePacked(baseGatewayURI, testCid)));
    }

    function testMintWithFreeCredit() public {
        cert.mintFor(user, testCid, referrer);
        cert.mintFor(newOwner, testCid, referrer);
        cert.mintFor(address(0xabc), testCid, referrer);
        (uint256 referralCount, bool freeMintCredit,,) = cert.getCertificateData(referrer);
        assertEq(referralCount, 3);
        assertTrue(freeMintCredit);

        vm.prank(referrer);
        cert.mint{value: 0 ether}(testCid);
        assertEq(cert.balanceOf(referrer), 1);
        assertTrue(cert.hasCertificate(referrer));
        assertEq(cert.getTokenId(referrer), 4);
        assertEq(cert.tokenURI(4), string(abi.encodePacked(baseGatewayURI, testCid)));
        (, freeMintCredit,,) = cert.getCertificateData(referrer);
        assertFalse(freeMintCredit);
    }

    function testMintFor() public {
        cert.mintFor(user, testCid, address(0));
        assertEq(cert.balanceOf(user), 1);
        assertTrue(cert.hasCertificate(user));
        assertEq(cert.getTokenId(user), 1);
        assertEq(cert.tokenURI(1), string(abi.encodePacked(baseGatewayURI, testCid)));
    }

    function testMintVersion() public {
        cert.mintFor(user, testCid, address(0));
        vm.prank(user);
        cert.mintVersion(user, testCid);
        assertEq(cert.balanceOf(user), 2);
        assertTrue(cert.hasCertificate(user));
        assertEq(cert.getVersionIds(user).length, 1);
        assertEq(cert.tokenURI(2), string(abi.encodePacked(baseGatewayURI, testCid)));
    }

    function testReferral() public {
        cert.mintFor(user, testCid, referrer);
        cert.mintFor(newOwner, testCid, referrer);
        cert.mintFor(address(0xabc), testCid, referrer);
        (uint256 referralCount, bool freeMintCredit,,) = cert.getCertificateData(referrer);
        assertEq(referralCount, 3);
        assertTrue(freeMintCredit);
    }

    function testRevoke() public {
        cert.mintFor(user, testCid, address(0));
        assertTrue(cert.hasCertificate(user));
        cert.revoke(1);
        assertFalse(cert.hasCertificate(user));
        assertEq(cert.balanceOf(user), 0);
    }

    function test_RevertIf_InsufficientMintFee() public {
        vm.prank(user);
        vm.expectRevert("Insufficient mint fee");
        cert.mint{value: 0.005 ether}(testCid);
    }

    function test_RevertIf_MintDuplicate() public {
        vm.prank(user);
        cert.mint{value: 0.01 ether}(testCid);
        vm.prank(user);
        vm.expectRevert("Already has certificate");
        cert.mint{value: 0.01 ether}(testCid);
    }

    function test_RevertIf_MintEmptyCid() public {
        vm.prank(user);
        vm.expectRevert("CID required");
        cert.mint{value: 0.01 ether}("");
    }

    function test_RevertIf_RevokeNonOwner() public {
        cert.mintFor(user, testCid, address(0));
        vm.prank(newOwner);
        vm.expectRevert(abi.encodeWithSignature("OwnableUnauthorizedAccount(address)", newOwner));
        cert.revoke(1);
    }

    function test_RevertIf_Transfer() public {
        vm.prank(user);
        cert.mint{value: 0.01 ether}(testCid);
        vm.prank(user);
        vm.expectRevert("Transfers disabled");
        cert.transferFrom(user, newOwner, 1);
    }

    function test_RevertIf_Paused() public {
        cert.pause();
        vm.prank(user);
        vm.expectRevert(abi.encodeWithSignature("EnforcedPause()"));
        cert.mint{value: 0.01 ether}(testCid);
    }

    function testSetBaseGatewayURI() public {
        vm.prank(user);
        cert.mint{value: 0.01 ether}(testCid);
        string memory newBaseGatewayURI = "https://ipfs.io/ipfs/";
        cert.setBaseGatewayURI(newBaseGatewayURI);
        assertEq(cert.tokenURI(1), string(abi.encodePacked(newBaseGatewayURI, testCid)));
    }

    function testWithdrawFees() public {
        vm.prank(user);
        cert.mint{value: 0.01 ether}(testCid);
        uint256 initialBalance = address(owner).balance;
        cert.withdrawFees();
        assertEq(address(owner).balance, initialBalance + 0.01 ether);
    }

    function test_UpdateAllowsMintAndBurn() public {
        // Test minting
        vm.prank(user);
        cert.mint{value: 0.01 ether}(testCid);
        assertEq(cert.ownerOf(1), user);

        // Test burning
        cert.revoke(1);
        assertEq(cert.balanceOf(user), 0);
    }
}