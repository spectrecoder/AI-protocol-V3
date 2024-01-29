// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../token/TinyERC721.sol";

contract LockableTinyERC721Mock is TinyERC721 {
	/// @dev Used to override isTransferable behaviour
	mapping(uint256 => bool) transferable;

	/**
	 * @inheritdoc TinyERC721
	 */
	uint256 public constant override TOKEN_UID = 0x10ea00872172d27aedaa569f59f69fd6de0bf0b041cca3d8fb52105bf9366c54;

	constructor(string memory _name, string memory _symbol) TinyERC721(_name, _symbol) AccessControl(msg.sender) {}

	/// @dev Used to override isTransferable behaviour
	function setTransferable(uint256 _tokenId, bool _value) public {
		transferable[_tokenId] = _value;
	}

	/**
	 * @inheritdoc TinyERC721
	 */
	function isTransferable(uint256 _tokenId) public view override returns(bool) {
		return transferable[_tokenId];
	}
}
