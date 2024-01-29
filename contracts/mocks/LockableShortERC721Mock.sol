// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../token/ShortERC721.sol";

contract LockableShortERC721Mock is ShortERC721 {
	/// @dev Used to override isTransferable behaviour
	mapping(uint256 => bool) transferable;

	/**
	 * @inheritdoc ShortERC721
	 */
	uint256 public constant override TOKEN_UID = 0xe76696cd154d0436a87c600fb76c141850c0be74a8a5d25d60187407b7383d1f;

	constructor(string memory _name, string memory _symbol) ShortERC721(_name, _symbol) AccessControl(msg.sender) {}

	/// @dev Used to override isTransferable behaviour
	function setTransferable(uint256 _tokenId, bool _value) public {
		transferable[_tokenId] = _value;
	}

	/**
	 * @inheritdoc ShortERC721
	 */
	function isTransferable(uint256 _tokenId) public view override returns(bool) {
		return transferable[_tokenId];
	}
}
