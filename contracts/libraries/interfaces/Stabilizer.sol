// SPDX-License-Identifier: MIT
pragma solidity 0.6.12;
pragma experimental ABIEncoderV2;

interface Stabilizer {
  function refreshAndRelease() external;

  function withdraw(
    address tokenAddress,
    uint256 amount,
    address destination
  ) external;

  function WETH() external view returns (address);

  function EURX() external view returns (address);

  function pool() external view returns (address);

  function AUTOMATOR_ADDRESS() external view returns (address);

  function owner() external view returns (address);
}
