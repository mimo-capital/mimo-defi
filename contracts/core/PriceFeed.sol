// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "@openzeppelin/contracts/math/SafeMath.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "../libraries/MathPow.sol";
import "../libraries/WadRayMath.sol";
import "../interfaces/IPriceFeed.sol";
import "../chainlink/AggregatorV3Interface.sol";
import "../interfaces/IAddressProvider.sol";

contract PriceFeed is IPriceFeed {
  using SafeMath for uint256;
  using SafeMath for uint8;
  using WadRayMath for uint256;

  event OracleUpdated(address indexed asset, address oracle, address sender);

  IAccessController public controller;
  mapping(address => AggregatorV3Interface) public override assetOracles;

  IAddressProvider public override a;

  constructor(IAddressProvider _addresses) public {
    a = _addresses;
  }

  modifier onlyManager() {
    require(a.controller().hasRole(a.controller().MANAGER_ROLE(), msg.sender), "Caller is not a Manager");
    _;
  }

  /**
   * Gets the asset price in USD
   * @param _asset address to the collateral asset e.g. WETH
   */
  function getAssetPrice(address _asset) public override view returns (uint256 price) {
    AggregatorV3Interface aggregator = assetOracles[_asset];
    (, int256 answer, , , ) = aggregator.latestRoundData();

    require(answer > 0, "Price data not valid");

    return uint256(answer);
  }

  /**
   * @notice Sets the oracle for the given asset, 
   * @param _asset address to the collateral asset e.g. WETH
   * @param _oracle address to the oracle, this oracle should implement the AggregatorV3Interface
   */
  function setAssetOracle(address _asset, address _oracle) public override onlyManager {
    require(_asset != address(0));
    require(_oracle != address(0));
    _setAssetOracle(_asset, _oracle);
  }

  /**
   * @notice Converts asset balance into stablecoin balance at current price
   * @param _asset address to the collateral asset e.g. WETH
   * @param _amount amount of collateral
   */
  function convertFrom(address _asset, uint256 _amount) public override view returns (uint256) {
    uint256 price = getAssetPrice(_asset);
    uint8 assetDecimals = ERC20(_asset).decimals(); 
    uint8 parDecimals = ERC20(address(a.stablex())).decimals(); // Needs re-casting because ISTABLEX does not expose decimals()
    uint8 oracleDecimals = assetOracles[_asset].decimals();
    uint256 parAccuracy = MathPow.pow(10, parDecimals);
    uint256 assetAccuracy = MathPow.pow(10, oracleDecimals.add(assetDecimals));
    return _amount
      .mul(price)
      .mul(parAccuracy)
      .div(assetAccuracy);
  }

  /**
   * @notice Converts stablecoin balance into collateral balance at current price
   * @param _asset address to the collateral asset e.g. WETH
   * @param _amount amount of stablecoin
   */
  function convertTo(address _asset, uint256 _amount) public override view returns (uint256) {
    uint256 price = getAssetPrice(_asset);
    uint8 assetDecimals = ERC20(_asset).decimals(); 
    uint8 parDecimals = ERC20(address(a.stablex())).decimals(); // Needs re-casting because ISTABLEX does not expose decimals()
    uint8 oracleDecimals = assetOracles[_asset].decimals();
    uint256 parAccuracy = MathPow.pow(10, parDecimals);
    uint256 assetAccuracy = MathPow.pow(10, oracleDecimals.add(assetDecimals));

    return _amount
      .mul(assetAccuracy)
      .div(price)
      .div(parAccuracy);
  }

  function _setAssetOracle(address _asset, address _oracle) internal {
    assetOracles[_asset] = AggregatorV3Interface(_oracle);
    emit OracleUpdated(_asset, _oracle, msg.sender);
  }
}
