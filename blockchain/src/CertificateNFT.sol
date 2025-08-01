// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract CertificateNFT is ERC721, ERC721URIStorage, Pausable, Ownable {
    uint256 private _tokenIdCounter;

    string private _baseGatewayURI;
    mapping(address => bool) public hasCertificate;
    mapping(address => uint256) public tokenIds;
    mapping(address => uint256[]) public versionIds;
    mapping(address => uint256) public referralCount;
    mapping(address => bool) public freeMintCredit;
    mapping(address => address) public referrers;
    uint256 public constant MINT_FEE = 0.01 ether;

    event CertificateMinted(address indexed to, uint256 indexed tokenId, string cid);
    event CertificateVersionMinted(address indexed to, uint256 indexed tokenId, string cid);
    event CertificateRevoked(address indexed user, uint256 indexed tokenId);
    event Referred(address indexed referrer, address indexed referee);

    constructor(string memory baseGatewayURI_) ERC721("CertificateNFT", "CNFT") Ownable(msg.sender) {
        _baseGatewayURI = baseGatewayURI_;
        _tokenIdCounter = 1; // Start token IDs at 1
    }

    function pause() public onlyOwner {
        _pause();
    }

    function unpause() public onlyOwner {
        _unpause();
    }

    function setBaseGatewayURI(string memory newBaseGatewayURI) public onlyOwner {
        _baseGatewayURI = newBaseGatewayURI;
    }

    function mint(string memory cid) public payable whenNotPaused {
        require(!hasCertificate[msg.sender], "Already has certificate");
        require(bytes(cid).length > 0, "CID required");
        require(msg.value >= MINT_FEE || freeMintCredit[msg.sender], "Insufficient mint fee");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        hasCertificate[msg.sender] = true;
        tokenIds[msg.sender] = tokenId;
        _safeMint(msg.sender, tokenId);
        _setTokenURI(tokenId, cid);

        if (freeMintCredit[msg.sender]) {
            freeMintCredit[msg.sender] = false;
        }

        emit CertificateMinted(msg.sender, tokenId, cid);
    }

    function mintFor(address user, string memory cid, address referrer) public onlyOwner {
        require(!hasCertificate[user], "Already has certificate");
        require(bytes(cid).length > 0, "CID required");

        uint256 tokenId = _tokenIdCounter;
        _tokenIdCounter++;
        hasCertificate[user] = true;
        tokenIds[user] = tokenId;
        _safeMint(user, tokenId);
        _setTokenURI(tokenId, cid);

        if (referrer != address(0) && referrer != user) {
            referralCount[referrer]++;
            referrers[user] = referrer;
            if (referralCount[referrer] >= 3 && !freeMintCredit[referrer]) {
                freeMintCredit[referrer] = true;
            }
            emit Referred(referrer, user);
        }

        emit CertificateMinted(user, tokenId, cid);
    }

    function mintVersion(address user, string memory newCid) public whenNotPaused {
        require(hasCertificate[user], "No certificate found");
        require(msg.sender == user || msg.sender == owner(), "Not authorized");
        require(bytes(newCid).length > 0, "CID required");

        uint256 newTokenId = _tokenIdCounter;
        _tokenIdCounter++;
        _safeMint(user, newTokenId);
        _setTokenURI(newTokenId, newCid);
        versionIds[user].push(newTokenId);

        emit CertificateVersionMinted(user, newTokenId, newCid);
    }

    function revoke(uint256 tokenId) public onlyOwner {
        address user = ownerOf(tokenId);
        _customBurn(tokenId);
        if (tokenIds[user] == tokenId) {
            hasCertificate[user] = false;
            tokenIds[user] = 0;
        }
        emit CertificateRevoked(user, tokenId);
    }

    function _customBurn(uint256 tokenId) internal {
        super._burn(tokenId);
        _setTokenURI(tokenId, "");
    }

    function withdrawFees() public onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No fees to withdraw");
        (bool success, ) = payable(owner()).call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    function verifyCertificate(address user, uint256 tokenId) public view returns (bool isValid, string memory cid) {
        if (!hasCertificate[user] || tokenIds[user] != tokenId || _ownerOf(tokenId) == address(0)) {
            return (false, "");
        }
        return (true, tokenURI(tokenId));
    }

    function getCertificateData(address user) public view returns (
        uint256 _referralCount,
        bool _freeMintCredit,
        uint256 tokenId,
        uint256[] memory _versionIds
    ) {
        return (
            referralCount[user],
            freeMintCredit[user],
            tokenIds[user],
            versionIds[user]
        );
    }

    function getTokenId(address user) public view returns (uint256) {
        return tokenIds[user];
    }

    function getVersionIds(address user) public view returns (uint256[] memory) {
        return versionIds[user];
    }

    function _baseURI() internal view override returns (string memory) {
        return _baseGatewayURI;
    }

    function tokenURI(uint256 tokenId) public view override(ERC721, ERC721URIStorage) returns (string memory) {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId) public view override(ERC721, ERC721URIStorage) returns (bool) {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth) internal override returns (address) {
        require(to == address(0) || _ownerOf(tokenId) == address(0), "Transfers disabled");
        return super._update(to, tokenId, auth);
    }
}