// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

/**
 * @title ERC165 Denier Mock
 *
 * @notice ERC165 Denier Mock a contract that always denies ERC165 support, used for testing purposes;
 *
 * @author Komninos Chatzipapas
 */
contract ERC165DenierMock {
  /**
   * @dev always returns false
   */
  function supportsInterface(bytes4) public pure returns (bool) {
    return false;
  }
}
