// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../interfaces/ERC1363Spec.sol";

/// @dev Mock for ERC1363Receiver/ERC1363Spender interfaces
contract ERC1363Mock is ERC1363Receiver, ERC1363Spender {
	// an event to be fired in `onTransferReceived`
	event OnTransferReceived(address indexed operator, address indexed from, uint256 value, bytes data);
	// an event to be fired in `onApprovalReceived`
	event OnApprovalReceived(address indexed owner, uint256 value, bytes data);

	/// @inheritdoc ERC1363Receiver
	function onTransferReceived(address operator, address from, uint256 value, bytes memory data) public override returns (bytes4) {
		// emit an event
		emit OnTransferReceived(operator, from, value, data);

		// always return "success"
		return ERC1363Receiver(this).onTransferReceived.selector;
	}

	/// @inheritdoc ERC1363Spender
	function onApprovalReceived(address owner, uint256 value, bytes memory data) external override returns (bytes4) {
		// emit an event
		emit OnApprovalReceived(owner, value, data);

		// always return "success"
		return ERC1363Spender(this).onApprovalReceived.selector;
	}
}

// mock class using IERC1363Receiver
contract ERC1363ReceiverMock is ERC1363Receiver {
	bytes4 private _retval;
	bool private _reverts;

	event Received(
		address operator,
		address sender,
		uint256 amount,
		bytes data,
		uint256 gas
	);

	constructor(bytes4 retval, bool reverts) {
		_retval = retval;
		_reverts = reverts;
	}

	function onTransferReceived(address operator, address sender, uint256 amount, bytes memory data) public override returns (bytes4) {
		require(!_reverts, "ERC1363ReceiverMock: throwing");
		emit Received(operator, sender, amount, data, gasleft());
		return _retval;
	}
}

// mock class using IERC1363Spender
contract ERC1363SpenderMock is ERC1363Spender {
	bytes4 private _retval;
	bool private _reverts;

	event Approved(
		address sender,
		uint256 amount,
		bytes data,
		uint256 gas
	);

	constructor(bytes4 retval, bool reverts) {
		_retval = retval;
		_reverts = reverts;
	}

	function onApprovalReceived(address sender, uint256 amount, bytes memory data) public override returns (bytes4) {
		require(!_reverts, "ERC1363SpenderMock: throwing");
		emit Approved(sender, amount, data, gasleft());
		return _retval;
	}
}
