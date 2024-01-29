// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "../lib/ArrayUtils.sol";

/**
 * @dev Helper contract to measure sequential array writing gas savings
 * @dev Supports seq_rnd_gas.js tess and ArrayUtils library
 */
contract ArrayBlockMock {
	using ArrayUtils for uint32[];
	uint32[] public array321;
	uint32[] public array322;
	uint256[] public array2561;
	uint256[] public array2562;

	function writeSequential(uint32 m, uint32 n) public {
		for(uint32 i = 0; i < n; i++) {
			array321.push(i + m);
		}
		for(uint32 i = 0; i < n; i++) {
			array322.push(i + m);
		}
	}

	function writeRandomized(uint32 m, uint32 n) public {
		for(uint32 i = 0; i < n; i++) {
			array321.push(i + m);
			array322.push(i + m);
		}
	}

	function writePacked(uint32 m, uint32 n) public {
		for(uint256 i = 0; i < n; i += 8) {
			uint256 e = 0;
			for(uint256 j = 0; j < 8; j++) {
				e |= (i + j + m) << j * 32;
			}
			array2561.push(e);
			array2562.push(e);
		}
	}

	function writeWithAssembly(uint32 m, uint32 n) public {
		array321.push32(m, n);
		array322.push32(m, n);
	}

	function getArray321() public view returns(uint32[] memory) {
		return array321;
	}

	function getArray322() public view returns(uint32[] memory) {
		return array322;
	}

	function getArray2561() public view returns(uint256[] memory) {
		return array2561;
	}

	function getArray2562() public view returns(uint256[] memory) {
		return array2562;
	}

}
