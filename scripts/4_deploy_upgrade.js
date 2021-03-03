/* eslint no-warning-comments: 0 */

const AddressProvider = artifacts.require("AddressProvider");
const AccessController = artifacts.require("AccessController");
const VaultsCore = artifacts.require("VaultsCore");
const VaultsCoreState = artifacts.require("VaultsCoreState");
const LiquidationManager = artifacts.require("LiquidationManager");
const ConfigProvider = artifacts.require("ConfigProvider");
const FeeDistributor = artifacts.require("FeeDistributor");
const PriceFeed = artifacts.require("PriceFeed");
const Upgrade = artifacts.require("Upgrade");
const GovernanceAddressProvider = artifacts.require("GovernanceAddressProvider");
const DebtNotifier = artifacts.require("DebtNotifier");

const addresses = require("./addresses");

global.web3 = web3;

let fromAccount;
let gasPrice;

function deployContract(name, contract, args, txOptions) {
  /* eslint-disable promise/prefer-await-to-then */
  if (!txOptions.from) txOptions.from = fromAccount;

  return contract
    .new(...args, txOptions)
    .on("transactionHash", (hash) => {
      console.log("Nonce: %i Contract: %s TXID: %s ", txOptions.nonce, name, hash);
    })
    .then((instance) => {
      console.log("Contract: %s Address: %s ", name, instance.address);
      return instance;
    });
  /* eslint-enable promise/prefer-await-to-then */
}

async function deployUpgrade(callback) {
  try {
    const network = await web3.eth.net.getNetworkType();
    const accounts = await web3.eth.getAccounts();
    gasPrice = web3.utils.toWei("70", "gwei");
    fromAccount = accounts[0];

    const txCount = await web3.eth.getTransactionCount(fromAccount);

    const addressProvider = await AddressProvider.at(addresses[network].ADDRESS_PROVIDER);
    console.log("AddressProvider: ", addressProvider.address);

    /* Deploy new modules */

    console.log("starting nounce", txCount);
    const [
      coreState,
      liquidationManager,
      configProvider,
      feeDistributor,
      priceFeed,
      governanceAddressProvider,
    ] = await Promise.all([
      deployContract("VaultsCoreState", VaultsCoreState, [addressProvider.address], { nonce: txCount }),
      deployContract("LiquidationManager", LiquidationManager, [addressProvider.address], {
        nonce: txCount + 1,
        gasPrice,
      }),
      deployContract("ConfigProvider", ConfigProvider, [addressProvider.address], { nonce: txCount + 2 }),
      deployContract("FeeDistributor", FeeDistributor, [addressProvider.address], { nonce: txCount + 3 }),
      deployContract("PriceFeed", PriceFeed, [addressProvider.address], { nonce: txCount + 4 }),
      deployContract("GovernanceAddressProvider", GovernanceAddressProvider, [addressProvider.address], {
        nonce: txCount + 5,
        gasPrice,
      }),
    ]);

    const [core, debtNotifier] = await Promise.all([
      deployContract("VaultsCore", VaultsCore, [addressProvider.address, addresses[network].WETH, coreState.address], {
        nonce: txCount + 6,
        gasPrice,
      }),
      deployContract("DebtNotifier", DebtNotifier, [governanceAddressProvider.address], {
        nonce: txCount + 7,
        gasPrice,
      }),
    ]);

    /* Deploy Upgrade.sol */
    const upgrade = await deployContract(
      "Upgrade",
      Upgrade,
      [
        addressProvider.address,
        core.address,
        coreState.address,
        liquidationManager.address,
        configProvider.address,
        feeDistributor.address,
        debtNotifier.address,
        priceFeed.address,
        addresses[network].BALANCER_POOL,
      ],
      {
        nonce: txCount + 8,
        gasPrice,
      },
    );

    // Grant MANAGER_ROLE
    if (network !== "mainnet") {
      const controller = await AccessController.at(await addressProvider.controller());
      console.log("AccessController:", controller.address);
      const DEFAULT_ADMIN_ROLE = await controller.DEFAULT_ADMIN_ROLE();

      await controller.grantRole(DEFAULT_ADMIN_ROLE, upgrade.address);
      await upgrade.upgrade();
    }
    /* Verify */
    // const vaultsData = await VaultsDataProvider.at(await addressProvider.vaultsData());
    // const vaultId = await vaultsData.vaultId(addresses[network].WETH, "0x002F042Dc7622cD8426457df28525692B3CaCc5E");
    // await core.borrow(vaultId, 1);
  } catch (error) {
    console.log(error);
  }

  callback();
}

module.exports = deployUpgrade;
