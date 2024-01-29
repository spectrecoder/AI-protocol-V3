// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../token/BurnableShortERC721.sol";

// Zeppelin ERC721 tests support
contract BurnableShortERC721Mock is BurnableShortERC721 {
	/**
	 * @inheritdoc ShortERC721
	 */
	uint256 public constant override TOKEN_UID = 0x8d4fb97da97378ef7d0ad259aec651f42bd22c200159282baa58486bb390286b;

	constructor(string memory _name, string memory _symbol) BurnableShortERC721(_name, _symbol) AccessControl(msg.sender) {}
}
