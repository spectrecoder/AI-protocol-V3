// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../token/RoyalERC721.sol";

// Zeppelin ERC721 tests support
contract RoyalERC721Mock is RoyalERC721 {
	/**
	 * @inheritdoc TinyERC721
	 */
	uint256 public constant override TOKEN_UID = 0x0250bec6b1a03636668f5072a8f5675e5fbd3e485d8a1213fc8279b78cb6f33d;

	constructor(string memory _name, string memory _symbol) RoyalERC721(_name, _symbol) AccessControl(msg.sender) {}
}
