// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Royalty.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title ArtSoulNFT
 * @dev ERC-721 NFT contract with lazy minting and royalties
 * NFTs are only minted when artwork is sold for the first time
 */
contract ArtSoulNFT is ERC721, ERC721URIStorage, ERC721Royalty, Ownable {
    uint256 private _tokenIdCounter;

    // Marketplace contract address (only marketplace can mint)
    address public marketplace;

    // Mapping from token ID to creator address
    mapping(uint256 => address) public tokenCreator;

    // Events
    event NFTMinted(uint256 indexed tokenId, address indexed creator, address indexed owner, string tokenURI);

    constructor() ERC721("ArtSoul", "ARTS") Ownable(msg.sender) {}

    /**
     * @dev Set marketplace contract address
     * Only owner can set this
     */
    function setMarketplace(address _marketplace) external onlyOwner {
        require(_marketplace != address(0), "Invalid marketplace address");
        marketplace = _marketplace;
    }

    /**
     * @dev Lazy mint NFT - called by marketplace when artwork is sold
     * @param creator Original creator of the artwork
     * @param owner New owner (buyer)
     * @param uri IPFS URI with metadata
     * @param royaltyBps Royalty percentage in basis points (750 = 7.5%)
     */
    function mintNFT(
        address creator,
        address owner,
        string memory uri,
        uint96 royaltyBps
    ) external returns (uint256) {
        require(msg.sender == marketplace, "Only marketplace can mint");
        require(creator != address(0), "Invalid creator");
        require(owner != address(0), "Invalid owner");

        _tokenIdCounter++;
        uint256 newTokenId = _tokenIdCounter;

        // Mint NFT to owner
        _safeMint(owner, newTokenId);
        _setTokenURI(newTokenId, uri);

        // Set royalty for creator
        _setTokenRoyalty(newTokenId, creator, royaltyBps);

        // Store creator
        tokenCreator[newTokenId] = creator;

        emit NFTMinted(newTokenId, creator, owner, uri);

        return newTokenId;
    }

    /**
     * @dev Get total supply of minted NFTs
     */
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }

    /**
     * @dev Get creator of a token
     */
    function getCreator(uint256 tokenId) external view returns (address) {
        require(_ownerOf(tokenId) != address(0), "Token does not exist");
        return tokenCreator[tokenId];
    }

    // Override required functions
    function tokenURI(uint256 tokenId)
        public
        view
        override(ERC721, ERC721URIStorage)
        returns (string memory)
    {
        return super.tokenURI(tokenId);
    }

    function supportsInterface(bytes4 interfaceId)
        public
        view
        override(ERC721, ERC721URIStorage, ERC721Royalty)
        returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    function _update(address to, uint256 tokenId, address auth)
        internal
        override(ERC721)
        returns (address)
    {
        return super._update(to, tokenId, auth);
    }

    function _increaseBalance(address account, uint128 value)
        internal
        override(ERC721)
    {
        super._increaseBalance(account, value);
    }
}
