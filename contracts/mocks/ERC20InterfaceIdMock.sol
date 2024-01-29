// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../interfaces/ERC20Spec.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

// A mock to support erc20_interface_id.js checking ERC20 interfaceId correctness
contract ERC20InterfaceIdMock {
	// Alethea ERC20 interfaceId
	function aletheaId() public pure returns(bytes4) {
		return type(ERC20).interfaceId;
	}

	// Zeppelin ERC20 interfaceId
	function zeppelinId() public pure returns(bytes4) {
		return type(IERC20).interfaceId;
	}
}
