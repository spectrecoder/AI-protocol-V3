// SPDX-License-Identifier: MIT
pragma solidity ^0.8.4;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

contract ZeppelinERC20Mock is ERC20 {
  constructor() payable ERC20("Mock", "MCK") {}

  function supportsInterface(bytes4 interfaceId) public pure returns (bool) {
    return interfaceId == type(IERC20).interfaceId;
  }

  function mint(address account, uint256 amount) public {
    _mint(account, amount);
  }

  function burn(address account, uint256 amount) public {
    _burn(account, amount);
  }

  function transferInternal(
    address from,
    address to,
    uint256 value
  ) public {
    _transfer(from, to, value);
  }

  function approveInternal(
    address owner,
    address spender,
    uint256 value
  ) public {
    _approve(owner, spender, value);
  }
}
