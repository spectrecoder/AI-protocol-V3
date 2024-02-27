// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../interfaces/ERC721SpecExt.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721Enumerable.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/ERC721URIStorage.sol";

/**
 * @title Zeppelin ERC721 Mock
 *
 * @notice Zeppelin ERC721 Mock simulates an NFT token, used for testing purposes;
 *      it has unrestricted access to the mint() function and can be used to be bound to an iNFT
 */
contract ZeppelinERC721Mock is ERC721Enumerable, ERC721URIStorage, MintableERC721, BurnableERC721 {
	/**
	 * @dev Creates/deploys an NFT Mock instance
	 *
	 * @param _name asset name (ERC721Metadata)
	 * @param _symbol asset symbol (ERC721Metadata)
	 */
	constructor(string memory _name, string memory _symbol) ERC721(_name, _symbol) {}

	/**
	 * @inheritdoc MintableERC721
	 */
	function exists(uint256 _tokenId) public override view returns(bool) {
		// delegate to `_exists`
		return _exists(_tokenId);
	}

	/**
	 * @inheritdoc MintableERC721
	 */
	function mint(address _to, uint256 _tokenId) public override {
		// mint token - delegate to `_mint`
		_mint(_to, _tokenId);
	}

	/**
	 * @inheritdoc MintableERC721
	 */
	function safeMint(address _to, uint256 _tokenId) public override {
		// mint token safely - delegate to `_safeMint`
		_safeMint(_to, _tokenId);
	}

	/**
	 * @inheritdoc MintableERC721
	 */
	function safeMint(address _to, uint256 _tokenId, bytes memory _data) public override {
		// mint token safely - delegate to `_safeMint`
		_safeMint(_to, _tokenId, _data);
	}

	/**
	 * @inheritdoc BurnableERC721
	 */
	function burn(uint256 _tokenId) public override {
		// burn token - delegate to `_burn`
		_burn(_tokenId);
	}

	/**
	 * @inheritdoc ERC721
	 */
	function _beforeTokenTransfer(address from, address to, uint256 tokenId) internal virtual override(ERC721, ERC721Enumerable) {
		ERC721Enumerable._beforeTokenTransfer(from, to, tokenId);
	}

	/**
	 * @inheritdoc ERC721
	 */
	function _burn(uint256 tokenId) internal virtual override(ERC721, ERC721URIStorage) {
		ERC721URIStorage._burn(tokenId);
	}

	/**
	 * @inheritdoc ERC721
	 */
	function supportsInterface(bytes4 interfaceId) public view virtual override(ERC721, ERC721Enumerable) returns (bool) {
		return ERC721Enumerable.supportsInterface(interfaceId)
			|| interfaceId == type(MintableERC721).interfaceId
			|| interfaceId == type(BurnableERC721).interfaceId;
	}

	/**
	 * @inheritdoc ERC721
	 */
	function tokenURI(uint256 tokenId) public view virtual override(ERC721, ERC721URIStorage) returns (string memory) {
		return ERC721URIStorage.tokenURI(tokenId);
	}

	/**
	 * @inheritdoc MintableERC721
	 */
	function mintBatch(address _to, uint256 _tokenId, uint256 n) public override {
		// straightforward: mint one by one
		for(uint256 i = 0; i < n; i++) {
			// delegate to `mint`
			mint(_to, _tokenId + i);
		}
	}

	/**
	 * @inheritdoc MintableERC721
	 */
	function safeMintBatch(address _to, uint256 _tokenId, uint256 n) public override {
		// delegate to `safeMint` with empty data
		safeMintBatch(_to, _tokenId, n, "");
	}

	/**
	 * @inheritdoc MintableERC721
	 */
	function safeMintBatch(address _to, uint256 _tokenId, uint256 n, bytes memory _data) public override {
		// straightforward: mint one by one
		for(uint256 i = 0; i < n; i++) {
			// delegate to `safeMint`
			safeMint(_to, _tokenId + i, _data);
		}
	}
}
