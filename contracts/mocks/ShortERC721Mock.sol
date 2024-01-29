// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../token/ShortERC721.sol";

// Zeppelin ERC721 tests support
contract ShortERC721Mock is ShortERC721 {
	/**
	 * @inheritdoc ShortERC721
	 */
	uint256 public constant override TOKEN_UID = 0x77a854386ba78c1ee8a3be2be18b485dd7f2f85e899d7dfe143cd3e1d5e4e877;

	constructor(string memory _name, string memory _symbol) ShortERC721(_name, _symbol) AccessControl(msg.sender) {}
}
