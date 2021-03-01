// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract MockERC20 is ERC20{

  constructor(string memory _name, string memory _symbol, uint8 _decimals) ERC20(_name, _symbol) public {
  	super._setupDecimals(_decimals);
  }

  function mint(address account, uint256 amount) public {
    _mint(account, amount);
  }
}
