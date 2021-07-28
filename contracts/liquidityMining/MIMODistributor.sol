// SPDX-License-Identifier: MIT

pragma experimental ABIEncoderV2;
pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "../libraries/WadRayMath.sol";
import "./interfaces/IMIMO.sol";
import "../governance/interfaces/IGovernanceAddressProvider.sol";
import "./interfaces/IMIMODistributor.sol";

/*
  	Distribution Formula:
  	50k MIMO in first month
  	-10% redution per month

  	total(timestamp) = _SECONDS_PER_MONTH * ( (1-_MONTHLY_R^(timestamp/_SECONDS_PER_MONTH)) / (1-_MONTHLY_R) )
  		+ timestamp % _SECONDS_PER_MONTH * (1-_MONTHLY_R^(timestamp/_SECONDS_PER_MONTH)
  */

contract MIMODistributor is IMIMODistributor {
  using SafeMath for uint256;
  using WadRayMath for uint256;

  event PayeeAdded(address account, uint256 shares);
  event TokensReleased(uint256 newTokens, uint256 releasedAt);

  uint256 private constant _SECONDS_PER_YEAR = 365 days;
  uint256 private constant _SECONDS_PER_MONTH = _SECONDS_PER_YEAR / 12;
  uint256 private constant _MONTHLY_R = 9e26; //90%
  uint256 private constant _FIRST_MONTH_TOKENS = 50000 ether; //50k

  uint256 public override totalShares;
  mapping(address => uint256) public override shares;
  address[] public payees;

  uint256 public override startTime;

  IGovernanceAddressProvider public override a;

  modifier onlyManager() {
    require(a.controller().hasRole(a.controller().MANAGER_ROLE(), msg.sender), "Caller is not Manager");
    _;
  }

  constructor(IGovernanceAddressProvider _a, uint256 _startTime) public {
    require(address(_a) != address(0));

    a = _a;
    startTime = _startTime;
  }

  /**
    Public function to release the accumulated new MIMO tokens to the payees.
    @dev anyone can call this.
  */
  function release() public override {
    uint256 newTokens = mintableTokens();
    require(newTokens > 0, "newTokens is 0");
    require(payees.length > 0, "Payees not configured yet");
    // Mint MIMO to all receivers
    for (uint256 i = 0; i < payees.length; i++) {
      address payee = payees[i];
      _release(newTokens, payee);
    }
    emit TokensReleased(newTokens, now);
  }

  /**
    Updates the payee configuration to a new one.
    @dev will release existing fees before the update.
    @param _payees Array of payees
    @param _shares Array of shares for each payee
  */
  function changePayees(address[] memory _payees, uint256[] memory _shares) public override onlyManager {
    require(_payees.length == _shares.length, "Payees and shares mismatched");
    require(_payees.length > 0, "No payees");

    if (mintableTokens() > 0 && payees.length > 0) {
      release();
    }

    for (uint256 i = 0; i < payees.length; i++) {
      delete shares[payees[i]];
    }
    delete payees;
    totalShares = 0;

    for (uint256 i = 0; i < _payees.length; i++) {
      _addPayee(_payees[i], _shares[i]);
    }
  }

  /**
    Get current configured payees.
    @return array of current payees.
  */
  function getPayees() public view override returns (address[] memory) {
    return payees;
  }

  /**
    Get current monthly issuance of new MIMO tokens.
    @return number of monthly issued tokens currently`.
  */
  function currentIssuance() public view override returns (uint256) {
    return monthlyIssuanceAt(now);
  }

  /**
    Get monthly issuance of new MIMO tokens at `timestamp`.
    @dev invalid for timestamps before deployment
    @param timestamp for which to calculate the monthly issuance
    @return number of monthly issued tokens at `timestamp`.
  */
  function monthlyIssuanceAt(uint256 timestamp) public view override returns (uint256) {
    uint256 elapsedSeconds = timestamp.sub(startTime);
    uint256 elapsedMonths = elapsedSeconds.div(_SECONDS_PER_MONTH);
    return _MONTHLY_R.rayPow(elapsedMonths).rayMul(_FIRST_MONTH_TOKENS);
  }

  /**
    Calculates how many MIMO tokens can be minted since the last time tokens were minted
    @return number of mintable tokens available right now.
  */
  function mintableTokens() public view override returns (uint256) {
    return totalSupplyAt(now).sub(a.mimo().totalSupply());
  }

  /**
    Calculates the totalSupply for any point after `startTime`
    @param timestamp for which to calculate the totalSupply
    @return totalSupply at timestamp.
  */
  function totalSupplyAt(uint256 timestamp) public view override returns (uint256) {
    uint256 elapsedSeconds = timestamp.sub(startTime);
    uint256 elapsedMonths = elapsedSeconds.div(_SECONDS_PER_MONTH);
    uint256 lastMonthSeconds = elapsedSeconds % _SECONDS_PER_MONTH;
    uint256 one = WadRayMath.ray();
    uint256 fullMonths = one.sub(_MONTHLY_R.rayPow(elapsedMonths)).rayMul(_FIRST_MONTH_TOKENS).rayDiv(
      one.sub(_MONTHLY_R)
    );
    uint256 currentMonthIssuance = monthlyIssuanceAt(timestamp);
    uint256 partialMonth = currentMonthIssuance.mul(lastMonthSeconds).div(_SECONDS_PER_MONTH);
    return fullMonths.add(partialMonth);
  }

  /**
    Internal function to release a percentage of newTokens to a specific payee
    @dev uses totalShares to calculate correct share
    @param _totalnewTokensReceived Total newTokens for all payees, will be split according to shares
    @param _payee The address of the payee to whom to distribute the fees.
  */
  function _release(uint256 _totalnewTokensReceived, address _payee) internal {
    uint256 payment = _totalnewTokensReceived.mul(shares[_payee]).div(totalShares);
    a.mimo().mint(_payee, payment);
  }

  /**
    Internal function to add a new payee.
    @dev will update totalShares and therefore reduce the relative share of all other payees.
    @param _payee The address of the payee to add.
    @param _shares The number of shares owned by the payee.
  */
  function _addPayee(address _payee, uint256 _shares) internal {
    require(_payee != address(0), "payee is the zero address");
    require(_shares > 0, "shares are 0");
    require(shares[_payee] == 0, "payee already has shares");

    payees.push(_payee);
    shares[_payee] = _shares;
    totalShares = totalShares.add(_shares);
    emit PayeeAdded(_payee, _shares);
  }
}
