const PAR = artifacts.require("PAR");
const AccessController = artifacts.require("AccessController");
const AddressProvider = artifacts.require("AddressProvider");
const ConfigProvider = artifacts.require("ConfigProvider");
const VaultsCore = artifacts.require("VaultsCore");
const VaultsDataProvider = artifacts.require("VaultsDataProvider");
const RatesManager = artifacts.require("RatesManager");
const LiquidationManager = artifacts.require("LiquidationManager");
const PriceFeed = artifacts.require("PriceFeed");
const FeeDistributor = artifacts.require("FeeDistributor");
const VaultsCoreState = artifacts.require("VaultsCoreState");

const addresses = require("./addresses");
const utils = require("./utils");

global.web3 = web3;

let accessController;
let addressProvider;
let par;
let ratesManager;
let liquidationManager;
let priceFeed;
let coreState;
let core;
let configProvider;
let feeDistributor;
let vaultsData;

async function deploy(callback) {
  try {
    const network = await web3.eth.net.getNetworkType();

    accessController = await AccessController.new();
    console.log("AccessController: ", accessController.address);

    addressProvider = await AddressProvider.new(accessController.address);
    console.log("AddressProvider: ", addressProvider.address);

    configProvider = await ConfigProvider.new(addressProvider.address);
    console.log("ConfigProvider: ", configProvider.address);

    par = await PAR.new(addressProvider.address);
    console.log("PAR: ", par.address);

    priceFeed = await PriceFeed.new(addressProvider.address);
    console.log("PriceFeed: ", priceFeed.address);

    ratesManager = await RatesManager.new(addressProvider.address);
    console.log("RatesManager: ", ratesManager.address);

    liquidationManager = await LiquidationManager.new(addressProvider.address);
    console.log("LiquidationManager: ", liquidationManager.address);

    feeDistributor = await FeeDistributor.new(addressProvider.address);
    console.log("FeeDistributor: ", feeDistributor.address);

    vaultsData = await VaultsDataProvider.new(addressProvider.address);
    console.log("VaultsData:", vaultsData.address);

    coreState = await VaultsCoreState.new(addressProvider.address);
    console.log("VaultsCoreState:", coreState.address);

    core = await VaultsCore.new(addressProvider.address, addresses[network].WETH, coreState.address);
    console.log("VaultsCore:", core.address);

    await addressProvider.setAccessController(accessController.address);
    await addressProvider.setConfigProvider(configProvider.address);
    await addressProvider.setVaultsCore(core.address);
    await addressProvider.setStableX(par.address);
    await addressProvider.setRatesManager(ratesManager.address);
    await addressProvider.setPriceFeed(priceFeed.address);
    await addressProvider.setLiquidationManager(liquidationManager.address);
    await addressProvider.setFeeDistributor(feeDistributor.address);
    await addressProvider.setVaultsDataProvider(vaultsData.address);
    console.log("done setting all addresses in the address provider");

    await priceFeed.setAssetOracle(addresses[network].WETH, addresses[network].ETHUSD);
    console.log("Set ETHUSD oracle done");
    await priceFeed.setEurOracle(addresses[network].EURUSD);
    console.log("Set EURUSD oracle done");

    const minterRole = await accessController.MINTER_ROLE();
    await accessController.grantRole(minterRole, feeDistributor.address);
    await accessController.grantRole(minterRole, core.address);
    console.log("done granting minter role");

    const managerRole = await accessController.MANAGER_ROLE();
    await accessController.grantRole(managerRole, core.address);
    await accessController.grantRole(managerRole, ratesManager.address);
    await accessController.grantRole(managerRole, liquidationManager.address);
    await accessController.grantRole(managerRole, feeDistributor.address);
    await accessController.grantRole(managerRole, vaultsData.address);
    console.log("done granting manager roles");

    await feeDistributor.changePayees([addresses[network].BALANCER_POOL, core.address], [90, 10]);

    await utils.setCollateralConfig(configProvider, addresses[network], "WETH");

    console.log("\nCopy these to your .env file:");
    console.log(`ACCESS_CONTROLLER_ADDRESS=${accessController.address}`);
    console.log(`ADDRESS_PROVIDER_ADDRESS=${addressProvider.address}`);
    console.log(`CONFIG_PROVIDER_ADDRESS=${configProvider.address}`);
    console.log(`PAR_ADDRESS=${par.address}`);
    console.log(`RATES_MANAGER_ADDRESS=${ratesManager.address}`);
    console.log(`LIQUIDATION_MANAGER_ADDRESS=${liquidationManager.address}`);
    console.log(`PRICE_FEED_EUR_ADDRESS=${priceFeed.address}`);
    console.log(`FEE_DISTRIBUTOR_ADDRESS=${feeDistributor.address}`);
    console.log(`VAULTS_CORE_ADDRESS=${core.address}`);
    console.log(`VAULTS_DATA_PROVIDER_ADDRESS=${vaultsData.address}`);

    console.log(
      `truffle run verify AccessController@${accessController.address} AddressProvider@${addressProvider.address} PAR@${par.address} RatesManager@${ratesManager.address} LiquidationManager@${liquidationManager.address} PriceFeed@${priceFeed.address} VaultsCore@${core.address} FeeDistributor@${feeDistributor.address} ConfigProvider@${configProvider.address} VaultsDataProvider@${vaultsData.address} --network ${network} --license MIT`,
    );
  } catch (error) {
    console.log(error);
  }

  callback();
}

module.exports = deploy;
