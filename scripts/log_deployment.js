const Web3 = require("web3");
const _ = require("underscore");
const moment = require("moment");
const ethers = require("ethers");

const { BN } = require("@openzeppelin/test-helpers");
const addresses = require("./addresses");

const AccessController = artifacts.require("AccessController");
const AddressProvider = artifacts.require("AddressProvider");
const GovernanceAddressProvider = artifacts.require("GovernanceAddressProvider");
const PAR = artifacts.require("PAR");
const ERC20 = artifacts.require("ERC20");
const RatesManager = artifacts.require("RatesManager");
const LiquidationManager = artifacts.require("ILiquidationManager");
const VaultsCore = artifacts.require("IVaultsCore");
const VaultsCoreState = artifacts.require("IVaultsCoreState");
const PriceFeed = artifacts.require("PriceFeed");
const FeeDistributor = artifacts.require("FeeDistributor");
const VaultsDataProvider = artifacts.require("VaultsDataProvider");
const ConfigProvider = artifacts.require("IConfigProvider");
const BPool = artifacts.require("BPool");
const Stabilizer = artifacts.require("Stabilizer");
const DebtNotifier = artifacts.require("DebtNotifier");

const ONE_YEAR = new BN("31536000");
const RAY = new BN("1000000000000000000000000000"); // 1e27
const WAD = new BN("1000000000000000000"); // 1e18

let addressProviderAddr;
let balancerAddr;
let stabilizerAddr;
let wethAddr;
let wbtcAddr;
let usdcAddr;
const knownContracts = {};

function setupAddresses(network) {
  console.log("Loading Addresses for Network:", network);
  addressProviderAddr = addresses[network].ADDRESS_PROVIDER;
  balancerAddr = addresses[network].BALANCER_POOL;
  stabilizerAddr = addresses[network].STABILIZER;
  wethAddr = addresses[network].WETH;
  wbtcAddr = addresses[network].WBTC;
  usdcAddr = addresses[network].USDC;

  if (network === "main") {
    knownContracts["0xD8A4411C623aD361E98bC9D98cA33eE1cF308Bca"] = "Toby1";
    knownContracts["0x16573dd990Ff42547b22662E7bb1263c8F051EA9"] = "Toby2 BPool";
    knownContracts["0xDeD9F901D40A96C3Ee558E6885bcc7eFC51ad078"] = "Martijn Deployer";
    knownContracts["0x2F4534EF430D857b2953Bd8a130f92681d9998aa"] = "Serverless automation key";
    knownContracts["0xcc8793d5eB95fAa707ea4155e09b2D3F44F33D1E"] = "Multisig";
  }

  if (network === "kovan") {
    knownContracts["0x002F042Dc7622cD8426457df28525692B3CaCc5E"] = "Toby1";
    knownContracts["0x71fE6c4abAfEF47CF23C4b9fB45f7fcBc238d624"] = "Martijn Deployer";
  }
}

function cumulativeRateHelper(baseRate, elapsedTime) {
  let n = elapsedTime;
  let result;
  result = elapsedTime.isOdd() ? baseRate : RAY;
  n = n.div(new BN(2));
  let x = baseRate;
  while (!n.isZero()) {
    // Console.log("result: %s; x: %s; n: %s", result, x, n);
    x = x.mul(x).divRound(RAY);
    if (n.isOdd()) {
      result = result.mul(x).divRound(RAY);
    }

    n = n.div(new BN(2));
  }

  return result;
}

const c = {
  configs: [],
};

async function initInstances(a) {
  [
    c.AccessController,
    c.ConfigProvider,
    c.VaultsCore,
    c.RatesManager,
    c.PriceFeed,
    c.LiquidationManager,
    c.VaultsDataProvider,
    c.FeeDistributor,
    c.PAR,
    c.WETH,
    c.BPool,
    c.Stabilizer,
  ] = await Promise.all([
    a.controller().then((address) => AccessController.at(address)),
    a.config().then((address) => ConfigProvider.at(address)),
    a.core().then((address) => VaultsCore.at(address)),

    a.ratesManager().then((address) => RatesManager.at(address)),
    a.priceFeed().then((address) => PriceFeed.at(address)),
    a.liquidationManager().then((address) => LiquidationManager.at(address)),
    a.vaultsData().then((address) => VaultsDataProvider.at(address)),
    a.feeDistributor().then((address) => FeeDistributor.at(address)),
    a.stablex().then((address) => PAR.at(address)),
    ERC20.at(wethAddr),
    BPool.at(balancerAddr),
    Stabilizer.at(stabilizerAddr),
  ]);
  c.VaultsCoreState = await VaultsCoreState.at(await c.VaultsCore.state());
  c.DebtNotifier = await DebtNotifier.at(await c.VaultsCore.debtNotifier());
  c.GovAddressProvider = await GovernanceAddressProvider.at(await c.DebtNotifier.a());
  knownContracts[c.a.address] = "AddressProvider";
  knownContracts[c.AccessController.address] = "AccessController";
  knownContracts[c.ConfigProvider.address] = "ConfigProvider";
  knownContracts[c.VaultsCore.address] = "VaultsCore";
  knownContracts[c.VaultsCoreState.address] = "VaultsCoreState";
  knownContracts[c.RatesManager.address] = "RatesManager";
  knownContracts[c.PriceFeed.address] = "PriceFeed";
  knownContracts[c.LiquidationManager.address] = "LiquidationManager";
  knownContracts[c.VaultsDataProvider.address] = "VaultsDataProvider";
  knownContracts[c.FeeDistributor.address] = "FeeDistributor";
  knownContracts[c.PAR.address] = "PAR";
  knownContracts[c.BPool.address] = "BPool";
  knownContracts[c.WETH.address] = "WETH";
  knownContracts[c.Stabilizer.address] = "Stabilizer";
  knownContracts[c.DebtNotifier.address] = "DebtNotifier";
  knownContracts[c.GovAddressProvider.address] = "GovAddressProvider";
  knownContracts[wbtcAddr] = "WBTC";
  knownContracts[usdcAddr] = "USDC";
}

async function logAddresses() {
  console.log("AddressProvider:", c.a.address);
  console.log("GovAddressProvider:", c.GovAddressProvider.address);
  console.log("AccessController:", c.AccessController.address);
  console.log("ConfigProvider:", c.ConfigProvider.address);
  console.log("VaultsCore:", c.VaultsCore.address);
  console.log("VaultsCoreState:", c.VaultsCoreState.address);
  console.log("RatesManager:", c.RatesManager.address);
  console.log("PriceFeed:", c.PriceFeed.address);
  console.log("LiquidationManager:", c.LiquidationManager.address);
  console.log("VaultsDataProvider:", c.VaultsDataProvider.address);
  console.log("FeeDistributor:", c.FeeDistributor.address);
  console.log("PAR:", c.PAR.address);
  console.log("Stabilizer:", c.Stabilizer.address);
  console.log("Core.DebtNotifier:", c.DebtNotifier.address);

  const [debtNotifier, parallel, mimo, governorAlpha, timelock, votingEscrow] = await Promise.all([
    c.GovAddressProvider.debtNotifier(),
    c.GovAddressProvider.parallel(),
    c.GovAddressProvider.mimo(),
    c.GovAddressProvider.governorAlpha(),
    c.GovAddressProvider.timelock(),
    c.GovAddressProvider.votingEscrow(),
  ]);
  console.log("GovAddressProvider.debtNotifier:", debtNotifier);
  console.log("GovAddressProvider.parallel:", parallel);
  console.log("GovAddressProvider.mimo:", mimo);
  console.log("GovAddressProvider.governorAlpha:", governorAlpha);
  console.log("GovAddressProvider.timelock:", timelock);
  console.log("GovAddressProvider.votingEscrow:", votingEscrow);
}

async function loadConfig(id) {
  const configResult = await c.ConfigProvider.collateralConfigs(id);
  const config = {
    id,
    collateralType: configResult.collateralType,
    debtLimit: new BN(configResult.debtLimit),
    liquidationRatio: new BN(configResult.minCollateralRatio),
    borrowRate: new BN(configResult.borrowRate),
    originationFee: new BN(configResult.originationFee),
  };
  c.configs.push(config);
  return config;
}

function mapAddressToContractName(address) {
  return knownContracts[address] || "?";
}

function formatAddress(address) {
  return address.toString() + " (" + mapAddressToContractName(address.toString()) + ")";
}

function formatAmount(amount, symbol, decimals = new BN(18)) {
  const ethersAmount = ethers.BigNumber.from(amount.toString());
  const ethersdecimals = ethers.BigNumber.from(decimals.toString());
  const formatted = ethers.utils.commify(ethers.utils.formatUnits(ethersAmount, ethersdecimals)) + " " + symbol;
  return formatted.replace(/(\.?0+ )/gm, " ");
}

async function logConfig(config) {
  console.log("-".repeat(80));
  console.log("Titan Config");
  console.log("-".repeat(80));
  console.log("Config: #", config.id);
  console.log("Collateral Address:", await formatAddress(config.collateralType));
  const collateral = await ERC20.at(config.collateralType);

  await Promise.all([
    collateral.name(),
    collateral.decimals(),
    collateral.symbol(),
    collateral.balanceOf(c.VaultsCore.address),
  ]).then(([name, decimals, symbol, totalCollateral]) => {
    console.log("Collateral Type:", symbol, "-", name);
    console.log("Total Collateral:", formatAmount(totalCollateral, symbol, decimals));
  });

  console.log("Debt Limit:", formatAmount(config.debtLimit, "PAR"));
  console.log("Min Collateral Ratio:", Web3.utils.fromWei(config.liquidationRatio.mul(new BN("100")), "ether"), "%");
  console.log("Origination Fee:", Web3.utils.fromWei(config.originationFee.mul(new BN("100")), "ether"), "%");
  const rateAnnualized = cumulativeRateHelper(config.borrowRate, ONE_YEAR).sub(RAY);
  console.log("Borrow Fee:", Web3.utils.fromWei(rateAnnualized.mul(new BN("100")), "gether"), "%");
}

async function logConfigs(configs) {
  for (const config of configs) {
    await logConfig(config);
  }
}

async function loadConfigs() {
  const numberConfigs = await c.ConfigProvider.numCollateralConfigs();
  console.log("Number of configs: ", numberConfigs.toString());
  const configIDs = _.range(1, numberConfigs.toNumber() + 1);
  await Promise.all(configIDs.map((id) => loadConfig(id)));

  c.configs = _.sortBy(c.configs, "id");
}

async function logState() {
  console.log("-".repeat(80));
  console.log("Titan Protocol State");
  console.log("-".repeat(80));
  const lastRefreshs = await Promise.all(
    c.configs.map((config) => c.VaultsCoreState.lastRefresh(config.collateralType)),
  );

  const debts = await Promise.all(
    c.configs.map((config) => c.VaultsDataProvider.collateralDebt(config.collateralType)),
  );
  lastRefreshs.forEach((refresh) => {
    const timestamp = moment(refresh * 1000);
    console.log("Last Refresh: ", timestamp.format(), "-", timestamp.fromNow());
  });
  debts.forEach((debt) => {
    console.log("Debt issued against collateral:", formatAmount(debt, "PAR"));
  });

  const [availableIncome, insuranceBalance, totalPARsupply, vaultCount, totalDebt] = await Promise.all([
    c.VaultsCoreState.availableIncome(),
    c.PAR.balanceOf(c.VaultsCore.address),
    c.PAR.totalSupply(),
    c.VaultsDataProvider.vaultCount(),
    c.VaultsDataProvider.debt(),
  ]);
  console.log("Available Income: ", formatAmount(availableIncome, "PAR"));
  console.log("Insurance Fund: ", formatAmount(insuranceBalance, "PAR"));
  console.log("Total PAR Issued: ", formatAmount(totalPARsupply, "PAR"));
  console.log("Total Debt: ", formatAmount(totalDebt, "PAR"));
  console.log("Vault Count: ", vaultCount.toString());
}

async function logFeeDistributor() {
  console.log("-".repeat(80));
  console.log("FeeDistributor");
  console.log("-".repeat(80));
  await Promise.all([
    c.FeeDistributor.lastReleasedAt(),
    c.FeeDistributor.getPayees(),
    c.FeeDistributor.totalShares(),
  ]).then(async ([lastReleasedAt, payees, totalShares]) => {
    const timestamp = moment(lastReleasedAt * 1000);
    console.log("Fees last released:", timestamp.format(), "-", timestamp.fromNow());
    console.log("Total Shares:", totalShares.toNumber());

    await Promise.all(
      payees.map(async (payee) => {
        const address = await formatAddress(payee.toString());
        const shares = (await c.FeeDistributor.shares(payee)).toNumber();
        const total = totalShares.toNumber();
        const percentage = (shares / total) * 100;
        console.log("Payee: %s - shares: %i/%i (%f%)", address, shares, totalShares, percentage);
      }),
    );
  });
}

async function logBalancerConfig() {
  console.log("-".repeat(80));
  console.log("Balancer AMM Config");
  console.log("-".repeat(80));
  const [publicSwap, isFinalized, swapFee, spotPrice, parBalance, wEthBalance] = await Promise.all([
    c.BPool.isPublicSwap(),
    c.BPool.isFinalized(),
    c.BPool.getSwapFee(),
    c.BPool.getSpotPriceSansFee(c.PAR.address, wethAddr),
    c.PAR.balanceOf(c.BPool.address),
    c.WETH.balanceOf(c.BPool.address),
  ]);
  console.log("isPublicSwap:", publicSwap);
  console.log("isFinalized:", isFinalized);
  console.log("swapFee:", Web3.utils.fromWei(swapFee.mul(new BN("100")), "ether"), "%");
  console.log("spotPrice:", formatAmount(spotPrice, "PAR"));
  console.log("PAR Balance:", formatAmount(parBalance, "PAR"));
  console.log("WETH Balance:", formatAmount(wEthBalance, "WETH"));
}

async function logAccessController() {
  console.log("-".repeat(80));
  console.log("AccessController");
  console.log("-".repeat(80));

  const [ADMIN_ROLE, MANAGER_ROLE, MINTER_ROLE] = await Promise.all([
    c.AccessController.DEFAULT_ADMIN_ROLE(),
    c.AccessController.MANAGER_ROLE(),
    c.AccessController.MINTER_ROLE(),
  ]);
  const [adminNumber, managerNumber, minterNumber, adminAdmin, managerAdmin, minterAdmin] = await Promise.all([
    c.AccessController.getRoleMemberCount(ADMIN_ROLE),
    c.AccessController.getRoleMemberCount(MANAGER_ROLE),
    c.AccessController.getRoleMemberCount(MINTER_ROLE),
    c.AccessController.getRoleAdmin(ADMIN_ROLE),
    c.AccessController.getRoleAdmin(MANAGER_ROLE),
    c.AccessController.getRoleAdmin(MINTER_ROLE),
  ]);
  const adminIDs = _.range(adminNumber.toNumber());
  const managerIDs = _.range(managerNumber.toNumber());
  const minterIDs = _.range(minterNumber.toNumber());
  console.log("ADMIN_ROLE:", ADMIN_ROLE.toString());
  console.log("MANAGER_ROLE:", MANAGER_ROLE.toString());
  console.log("MINTER_ROLE:", MINTER_ROLE.toString());
  const [admins, managers, minters] = await Promise.all([
    Promise.all(adminIDs.map((adminID) => c.AccessController.getRoleMember(ADMIN_ROLE, adminID))),
    Promise.all(managerIDs.map((managerID) => c.AccessController.getRoleMember(MANAGER_ROLE, managerID))),
    Promise.all(minterIDs.map((minterID) => c.AccessController.getRoleMember(MINTER_ROLE, minterID))),
  ]);
  console.log("Admins (AdminRole: %s)", adminAdmin);
  for (const admin of admins) {
    console.log(" * %s", formatAddress(admin));
  }

  console.log("Managers (AdminRole: %s)", managerAdmin);
  for (const manager of managers) {
    console.log(" * %s", formatAddress(manager));
  }

  console.log("Minters (AdminRole: %s)", minterAdmin);
  for (const minter of minters) {
    console.log(" * %s", formatAddress(minter));
  }
}

async function logStabilizerStats() {
  console.log("-".repeat(80));
  console.log("Stabilizer");
  console.log("-".repeat(80));

  const [
    wethAddr,
    parAddr,
    poolAddr,
    automator,
    owner,
    bpoolBalance,
    bpooltotalSupply,
    wethBalance,
    parBalance,
  ] = await Promise.all([
    c.Stabilizer.WETH(),
    c.Stabilizer.EURX(),
    c.Stabilizer.pool(),
    c.Stabilizer.AUTOMATOR_ADDRESS(),
    c.Stabilizer.owner(),
    c.BPool.balanceOf(c.Stabilizer.address),
    c.BPool.totalSupply(),
    c.WETH.balanceOf(c.Stabilizer.address),
    c.PAR.balanceOf(c.Stabilizer.address),
  ]);
  console.log("WETH token address:", formatAddress(wethAddr));
  console.log("PAR token address:", formatAddress(parAddr));
  console.log("WETH balance: %s", formatAmount(wethBalance, "WETH"));
  console.log("PAR balance: %s", formatAmount(parBalance, "PAR"));
  console.log("Pool AMM address:", formatAddress(poolAddr));
  console.log("Automator address:", formatAddress(automator));
  console.log("Owner address:", formatAddress(owner));
  const bpoolPercent = bpoolBalance.mul(WAD).div(bpooltotalSupply);
  const bpoolPercentString = Number.parseFloat(Web3.utils.fromWei(bpoolPercent.mul(new BN("100")), "ether")).toFixed(2);

  console.log(
    "BPool tokens: %s / %s (%s%)",
    formatAmount(bpoolBalance, "BPT"),
    formatAmount(bpooltotalSupply, "BPT"),
    bpoolPercentString,
  );
}

async function loadVault(id) {
  const vaultData = await c.VaultsDataProvider.vaults(id);
  const vault = {
    id,
    collateralType: vaultData.collateralType,
    owner: vaultData.owner,
    collateralBalance: new BN(vaultData.collateralBalance),
    baseDebt: new BN(vaultData.baseDebt),
  };
  vault.debt = await c.VaultsDataProvider.vaultDebt(id);
  vault.collateralInfo = await loadCollateral(vault.collateralType);
  vault.collateralValue = await c.PriceFeed.convertFrom(vault.collateralType, vault.collateralBalance);
  vault.health = await c.LiquidationManager.calculateHealthFactor(
    vault.collateralValue,
    vault.debt,
    vault.collateralInfo.ratio,
  );

  return vault;
}

async function loadCollateral(address) {
  const collateral = await ERC20.at(address);

  const [name, decimals, symbol, ratio] = await Promise.all([
    collateral.name(),
    collateral.decimals(),
    collateral.symbol(),
    c.ConfigProvider.collateralLiquidationRatio(address),
  ]);
  return { name, decimals, symbol, ratio };
}

function logVault(vault) {
  console.log("Vault: #%s", vault.id);
  console.log("Owner:", formatAddress(vault.owner));
  console.log("Collateral:", formatAddress(vault.collateralType));
  console.log(
    "Collateral Balance:",
    formatAmount(vault.collateralBalance, vault.collateralInfo.symbol, vault.collateralInfo.decimals),
  );
  console.log("Collateral Value:", formatAmount(vault.collateralValue, "PAR"));
  console.log("Debt:", formatAmount(vault.debt, "PAR"));
  console.log("Health Factor:", formatAmount(vault.health, ""));
  console.log("-".repeat(80));
}

async function logVaults() {
  console.log("-".repeat(80));
  console.log("Vaults");
  console.log("-".repeat(80));

  const numVaults = await c.VaultsDataProvider.vaultCount();

  let vaultIDs = _.range(1, numVaults.toNumber() + 1);

  const network = await web3.eth.net.getNetworkType();
  if (network === "kovan") {
    const brokenVaults = [28, 29, 30, 31, 32, 33, 35]; // OLD WBTC vaults
    vaultIDs = _.without(vaultIDs, ...brokenVaults);
  }

  const vaults = await Promise.all(vaultIDs.map((id) => loadVault(id)));
  c.vaults = vaults;
  const sortedVaults = vaults.sort((a, b) => {
    return a.health.cmp(b.health);
  });

  for (const vault of sortedVaults) {
    logVault(vault);
  }
}

async function verify(callback) {
  try {
    let network = await web3.eth.net.getNetworkType();
    if (network === "mainnet") {
      network = "main";
    }

    setupAddresses(network);

    c.a = await AddressProvider.at(addressProviderAddr);
    await initInstances(c.a);

    await logAddresses();

    await logAccessController();
    await loadConfigs();
    await logConfigs(c.configs);
    await logState();
    await logFeeDistributor();
    await logBalancerConfig();
    await logStabilizerStats();
    await logVaults();
    // TODO: validate deployed contracts
  } catch (error) {
    console.log("Error:", error);
  }

  callback();
}

module.exports = verify;
