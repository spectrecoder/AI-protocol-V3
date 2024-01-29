// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../token/TinyERC721.sol";

// Zeppelin ERC721 tests support
contract TinyERC721Mock is TinyERC721 {
	/**
	 * @inheritdoc TinyERC721
	 */
	uint256 public constant override TOKEN_UID = 0x0250bec6b1a03636668f5072a8f5675e5fbd3e485d8a1213fc8279b78cb6f33d;

	constructor(string memory _name, string memory _symbol) TinyERC721(_name, _symbol) AccessControl(msg.sender) {}
}
