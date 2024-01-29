// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @notice Replaces built-in Solidity address.transfer and address.send functions
 *      with the address.call function
 */
library Transfers {
	/// @dev Mimics address.send forwarding 4,900 gas
	function send(address payable to, uint256 value) internal returns(bool) {
		(bool success, ) = to.call{gas: 4900, value: value}("");
		return success;
	}

	/// @dev Mimics address.transfer forwarding 4,900 gas
	function transfer(address payable to, uint256 value) internal {
		require(send(to, value), "failed to send ether");
	}

	/// @dev Alias for `send`
	function send1(address payable to, uint256 value) internal returns(bool) {
		return send(to, value);
	}

	/// @dev Alias for `transfer`
	function transfer1(address payable to, uint256 value) internal {
		transfer(to, value);
	}
}
