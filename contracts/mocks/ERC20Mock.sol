// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ERC20Mock is ERC20 {
	constructor(
		string memory name,
		string memory symbol,
		address initialHolder,
		uint256 initialSupply
	) ERC20(name, symbol) {
		if(initialSupply > 0) {
			_mint(initialHolder, initialSupply);
		}
	}
}

