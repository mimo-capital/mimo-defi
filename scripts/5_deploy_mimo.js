/* eslint no-warning-comments: 0 */
const moment = require("moment");

const AddressProvider = artifacts.require("AddressProvider");
const GovernanceAddressProvider = artifacts.require("GovernanceAddressProvider");
const MIMO = artifacts.require("MIMO");
const MIMODistributor = artifacts.require("MIMODistributor");
const SupplyMiner = artifacts.require("SupplyMiner");
const DemandMiner = artifacts.require("DemandMiner");
const DebtNotifier = artifacts.require("DebtNotifier");

const addresses = require("./addresses");

global.web3 = web3;

async function deployUpgrade(callback) {
  try {
    const network = await web3.eth.net.getNetworkType();
    const networkAddresses = addresses[network];

    const addressProvider = await AddressProvider.at(networkAddresses.ADDRESS_PROVIDER);
    console.log("AddressProvider: ", addressProvider.address);

    const governanceAddressProvider = await GovernanceAddressProvider.at(networkAddresses.GOV_ADDRESS_PROVIDER);
    console.log("GovernanceAddressProvider: ", governanceAddressProvider.address);

    const mimo = await MIMO.new(governanceAddressProvider.address);
    console.log("MIMO: ", mimo.address);

    const startTime = moment("2021-03-22T00:00:00").valueOf() / 1000;
    const mimoDistributor = await MIMODistributor.new(governanceAddressProvider.address, startTime);
    console.log("MIMODistributor: ", mimoDistributor.address);

    const supplyMiner = await SupplyMiner.new(governanceAddressProvider.address);
    console.log("SupplyMiner: ", supplyMiner.address);

    const WETHSupplyMiner = await SupplyMiner.new(governanceAddressProvider.address);
    console.log("WETHSupplyMiner: ", WETHSupplyMiner.address);

    const WBTCSupplyMiner = await SupplyMiner.new(governanceAddressProvider.address);
    console.log("WBTCSupplyMiner: ", WBTCSupplyMiner.address);

    const demandMiner = await DemandMiner.new(governanceAddressProvider.address, networkAddresses.BALANCER_POOL);
    console.log("DemandMiner: ", demandMiner.address);

    const debtNotifier = await DebtNotifier.at(await governanceAddressProvider.debtNotifier());
    console.log("DebtNotifier: ", debtNotifier.address);

    if (network !== "mainnet") {
      console.log("Config governanceAddressProvider");
      await governanceAddressProvider.setMIMO(mimo);

      console.log("Config debtNotifier");
      await debtNotifier.setCollateralSupplyMiner(networkAddresses.WBTC, WBTCSupplyMiner.address);
      await debtNotifier.setCollateralSupplyMiner(networkAddresses.WETH, WETHSupplyMiner.address);

      console.log("Config mimoDistributor");
      await mimoDistributor.changePayees(
        [WBTCSupplyMiner.address, WETHSupplyMiner.address, demandMiner.address],
        [25, 25, 50],
      );
    }
  } catch (error) {
    console.log(error);
  }

  callback();
}

module.exports = deployUpgrade;
