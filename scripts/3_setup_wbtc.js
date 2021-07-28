const yargs = require("yargs/yargs");

const ConfigProvider = artifacts.require("ConfigProvider");
const PriceFeed = artifacts.require("PriceFeed");
const AddressProvider = artifacts.require("AddressProvider");

const addresses = require("./addresses");
const utils = require("./utils");
const config = require("./config");

global.web3 = web3;

let addressProvider;

async function deploy(callback) {
  const { argv } = yargs(process.argv.slice(2));
  try {
    const network = await web3.eth.net.getNetworkType();
    const accounts = await web3.eth.getAccounts();
    const gasPrice = await web3.eth.getGasPrice();
    const txCount = await web3.eth.getTransactionCount(accounts[0]);
    const account = accounts[0];
    let nonce = txCount;

    console.log("Using network: ", network);
    console.log("account", account);
    console.log("gasPrice", gasPrice);
    console.log("txCount", txCount);

    addressProvider = await AddressProvider.at(addresses[network].ADDRESS_PROVIDER);
    console.log("AddressProvider: ", addressProvider.address);

    const configProvider = new web3.eth.Contract(ConfigProvider._json.abi, await addressProvider.config());
    const priceFeed = new web3.eth.Contract(PriceFeed._json.abi, await addressProvider.priceFeed());

    const collateralConfig = config.collateralConfig.WBTC;
    const setCollateralConfigArgs = [
      addresses[network].WBTC,
      collateralConfig.parDebtLimit,
      collateralConfig.liquidationRatio,
      collateralConfig.borrowRate,
      collateralConfig.originationFee,
    ];
    const setCollateralConfigTx = await utils.getSignedTransaction(
      configProvider,
      "setCollateralConfig",
      setCollateralConfigArgs,
      account,
      nonce,
      gasPrice,
    );
    console.log("setCollateralConfig WBTC", setCollateralConfigTx);

    nonce++;
    const setAssetOracleArgs = [addresses[network].WBTC, addresses[network].BTCUSD];
    const setAssetOracleTx = await utils.getSignedTransaction(
      priceFeed,
      "setAssetOracle",
      setAssetOracleArgs,
      account,
      nonce,
      gasPrice,
    );
    console.log("setAssetOracle BTCUSD", setAssetOracleTx);

    if (argv.send) {
      utils.sendSignedTransactions([setCollateralConfigTx.raw, setAssetOracleTx.raw]);
    }

    await verifyDeployment(network);
  } catch (error) {
    console.log(error);
  }

  callback();
}

async function verifyDeployment(network) {
  console.log("verifiy deployment");
  const configProvider = await ConfigProvider.at(await addressProvider.config());
  const priceFeed = await PriceFeed.at(await addressProvider.priceFeed());

  const numberCollateralConfigs = await configProvider.numCollateralConfigs();
  if (numberCollateralConfigs.toString() !== "2") {
    throw new Error("numCollateralConfigs is wrong");
  }

  const collatereralConfig1 = await configProvider.collateralConfigs(2);
  console.log("collatereralConfig 2", collatereralConfig1);
  if (collatereralConfig1.collateralType !== addresses[network].WBTC) {
    throw new Error("collatereralConfig 2 has wrong collateralType");
  }

  const wBtcPrice = await priceFeed.getAssetPrice(addresses[network].WBTC);
  console.log("wBtcPrice", wBtcPrice.toString());
}

module.exports = deploy;
