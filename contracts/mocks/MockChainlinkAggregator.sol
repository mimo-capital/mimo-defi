// SPDX-License-Identifier: MIT

pragma solidity 0.6.12;

import "./MockChainlinkAggregatorRaw.sol";

//instantiate EUR / USD oracle with 440 USD per USD price and 8 decimals
contract MockChainlinkAggregator is MockChainlinkAggregatorRaw(8, 44067433087, "ETH / USD") {}
