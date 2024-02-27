// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "./RoyalERC721.sol";

/**
 * @title Whitelabel NFT
 *
 * @notice Whitelabel NFT is a non-upgradeable ERC721 standard implementation
 *
 * @dev Whitelabel NFT is a Tiny ERC721, it supports minting and burning,
 *      its token ID space is limited to 32 bits
 *
 * @dev Whitelabel NFT supports EIP-2981 royalties on NFT secondary sales,
 *      and OpenSea royalties
 */
contract WhitelabelNFT is RoyalERC721 {
	/**
	 * @inheritdoc TinyERC721
	 */
	uint256 public constant override TOKEN_UID = 0x50c16d79fc64e49cf554b52a1bdf271f1a30a6999329cb1b4642bb24597f282f;

	/**
	 * @dev Constructs/deploys Whitelabel NFT instance
	 *      with the name and symbol defined during the deployment
	 */
	constructor(string memory _name, string memory _symbol) RoyalERC721(_name, _symbol) AccessControl(msg.sender) {}
}
