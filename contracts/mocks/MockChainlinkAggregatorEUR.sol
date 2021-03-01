// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./MockChainlinkAggregatorRaw.sol";

//instantiate EUR / USD oracle with 1.18 USD per EUR price and 8 decimals
contract MockChainlinkAggregatorEUR is MockChainlinkAggregatorRaw(8, 118033500, "EUR / USD") {} 