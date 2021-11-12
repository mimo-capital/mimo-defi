import { getChainId, ethers, network } from 'hardhat';
import {
  NETWORK_CONFIG,
  NetworkConfig,
  MAINNET_CONTRACTS,
  COLLATERALS,
  VOTING_ESCROW_SYMBOL,
  VOTING_ESCROW_NAME,
} from '../../config/deployment';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { AddressLike } from 'ethereumjs-util';
import { capitalizeFirstLetter } from '../../utils/helper';
import mimoDistributorAbi from '../../utils/abis/MimoDistributor';
import mimoAbi from '../../utils/abis/Mimo';
import { BigNumber } from '@ethersproject/bignumber';
import { existsSync, readFileSync } from 'fs';

let chainId: string;
let networkConfig: NetworkConfig;
let accessController: Contract;
let addressProvider: Contract;
let configProvider: Contract;
let par: Contract;
let ratesManager: Contract;
let priceFeed: Contract;
let liquidationManager: Contract;
let vaultsDataProvider: Contract;
let vaultsCore: Contract;
let vaultsCoreState: Contract;
let governanceAddressProvider: Contract;
let debtNotifier: Contract;
let feeDistributor: Contract;
let mimo: Contract;
// eslint-disable-next-line no-unused-vars
let mimoDistributor: Contract;
let chainDistributor: Contract;
let governorAlpha: Contract;
let timelock: Contract;
let votingEscrow: Contract;
let votingMiner: Contract;
let networkTitle: string;
let deployedContracts: any;

before(async () => {
  chainId = await getChainId();
  networkConfig = NETWORK_CONFIG[Number.parseInt(chainId)];
  deployedContracts = JSON.parse(
    readFileSync(`./reports/${network.name === 'hardhat' ? 'localhost' : network.name}/deployment.json`).toString(),
  ).contracts;
  try {
    [
      accessController,
      addressProvider,
      configProvider,
      par,
      ratesManager,
      priceFeed,
      liquidationManager,
      governanceAddressProvider,
      debtNotifier,
      feeDistributor,
      vaultsCore,
      vaultsDataProvider,
      vaultsCoreState,
      governorAlpha,
      timelock,
      votingEscrow,
      votingMiner,
    ] = await Promise.all([
      ethers.getContractAt(deployedContracts.AccessController.abi, deployedContracts.AccessController.address),
      ethers.getContractAt(deployedContracts.AddressProvider.abi, deployedContracts.AddressProvider.address),
      ethers.getContractAt(deployedContracts.ConfigProvider.abi, deployedContracts.ConfigProvider.address),
      ethers.getContractAt(deployedContracts.PAR.abi, deployedContracts.PAR.address),
      ethers.getContractAt(deployedContracts.RatesManager.abi, deployedContracts.RatesManager.address),
      ethers.getContractAt(deployedContracts.PriceFeed.abi, deployedContracts.PriceFeed.address),
      ethers.getContractAt(deployedContracts.LiquidationManager.abi, deployedContracts.LiquidationManager.address),
      ethers.getContractAt(
        deployedContracts.GovernanceAddressProvider.abi,
        deployedContracts.GovernanceAddressProvider.address,
      ),
      ethers.getContractAt(deployedContracts.DebtNotifier.abi, deployedContracts.DebtNotifier.address),
      ethers.getContractAt(deployedContracts.FeeDistributor.abi, deployedContracts.FeeDistributor.address),
      ethers.getContractAt(deployedContracts.VaultsCore.abi, deployedContracts.VaultsCore.address),
      ethers.getContractAt(deployedContracts.VaultsDataProvider.abi, deployedContracts.VaultsDataProvider.address),
      ethers.getContractAt(deployedContracts.VaultsCoreState.abi, deployedContracts.VaultsCoreState.address),
      ethers.getContractAt(deployedContracts.GovernorAlpha.abi, deployedContracts.GovernorAlpha.address),
      ethers.getContractAt(deployedContracts.Timelock.abi, deployedContracts.Timelock.address),
      ethers.getContractAt(deployedContracts.VotingEscrow.abi, deployedContracts.VotingEscrow.address),
      ethers.getContractAt(deployedContracts.VotingMiner.abi, deployedContracts.VotingMiner.address),
    ]);
  } catch (error) {
    console.log(error);
  }

  mimo = networkConfig.isTestNet
    ? await ethers.getContractAt(deployedContracts.MockMIMO.abi, deployedContracts.MockMIMO.address)
    : await ethers.getContractAt(mimoAbi, networkConfig.mimoToken);
  const ethereumProvider = ethers.getDefaultProvider('mainnet', {
    infura: process.env.INFURA_TOKEN,
  });
  networkTitle = capitalizeFirstLetter(network.name);
  mimoDistributor = new ethers.Contract(MAINNET_CONTRACTS.MIMODistributor, mimoDistributorAbi, ethereumProvider);
  const isChainDistributor = existsSync(`./reports/mainnet/deployment.json`);
  if (isChainDistributor) {
    const mainnetDeployedContracts = JSON.parse(readFileSync(`./reports/mainnet/deployment.json`).toString()).contracts;
    chainDistributor = await ethers.getContractAt(
      mainnetDeployedContracts[`${networkTitle}Distributor`],
      MAINNET_CONTRACTS.MIMODistributor,
    );
  }
});

describe('--- Verify Core Deployment ---', async () => {
  it('Check AccessController', async () => {
    const [MANAGER_ROLE, MINTER_ROLE] = await Promise.all([
      accessController.MANAGER_ROLE(),
      accessController.MINTER_ROLE(),
    ]);
    const [minterRoleCount, managerRoleCount, feeDistributorHasMinterRole, vaultsCoreHasMinterRole] = await Promise.all(
      [
        accessController.getRoleMemberCount(MINTER_ROLE),
        accessController.getRoleMemberCount(MANAGER_ROLE),
        accessController.hasRole(MINTER_ROLE, feeDistributor.address),
        accessController.hasRole(MINTER_ROLE, vaultsCore.address),
      ],
    );
    expect(feeDistributorHasMinterRole).to.be.true;
    expect(vaultsCoreHasMinterRole).to.be.true;
    expect(minterRoleCount.toNumber()).to.be.equal(2);
    expect(managerRoleCount.toNumber()).to.be.equal(1);
    if (!networkConfig.isTestNet) {
      const MIMO_MINTER_ROLE = await mimo.MIMO_MINTER_ROLE();
      const mimoMinterRoleCount: BigNumber = await accessController.getRoleMemberCount(MIMO_MINTER_ROLE);
      const [gnosisSafeHasManagerRole, mimoDistributorHasMimoMinterRole] = await Promise.all([
        accessController.hasRole(MANAGER_ROLE, networkConfig.gnosisSafe),
        accessController.hasRole(MIMO_MINTER_ROLE, MAINNET_CONTRACTS.mimoDistributor),
      ]);
      expect(gnosisSafeHasManagerRole).to.be.true;
      expect(mimoDistributorHasMimoMinterRole).to.be.true;
      expect(mimoMinterRoleCount.toNumber()).to.be.equal(1);
    }
  });
  it('Check AddressProvider', async () => {
    const [
      setController,
      setConfig,
      setCore,
      setStabelx,
      setRatesManager,
      setPriceFeed,
      setLiquidationManager,
      setVaultsData,
      setFeeDistributor,
    ] = await Promise.all([
      addressProvider.controller(),
      addressProvider.config(),
      addressProvider.core(),
      addressProvider.stablex(),
      addressProvider.ratesManager(),
      addressProvider.priceFeed(),
      addressProvider.liquidationManager(),
      addressProvider.vaultsData(),
      addressProvider.feeDistributor(),
    ]);

    expect(setController).to.be.equal(accessController.address);
    expect(setConfig).to.be.equal(configProvider.address);
    expect(setCore).to.be.equal(vaultsCore.address);
    expect(setStabelx).to.be.equal(par.address);
    expect(setRatesManager).to.be.equal(ratesManager.address);
    expect(setPriceFeed).to.be.equal(priceFeed.address);
    expect(setLiquidationManager).to.be.equal(liquidationManager.address);
    expect(setVaultsData).to.be.equal(vaultsDataProvider.address);
    expect(setFeeDistributor).to.be.equal(feeDistributor.address);
  });
  it('Check ConfigProvier', async () => {
    try {
      const [numCollateralConfigs, a] = await Promise.all([configProvider.numCollateralConfigs(), configProvider.a()]);
      const collateralList = Object.keys(networkConfig.collaterals);
      expect(numCollateralConfigs.toNumber()).to.be.equal(collateralList.length);
      expect(a).to.be.equal(addressProvider.address);
      for (const element of collateralList) {
        let collateral = networkConfig.collaterals[element].address;
        if (networkConfig.isTestNet && collateral === '') {
          collateral = deployedContracts[`Mock${element}`].address;
        }

        const collateralId = await configProvider.collateralIds(collateral);
        const collateralConfig = await configProvider.collateralConfigs(collateralId);
        expect(collateralConfig.collateralType.toLowerCase()).to.be.equal(collateral.toLocaleLowerCase());
        expect(collateralConfig.debtLimit.toString()).to.be.equal(COLLATERALS[element].parDebtLimit.toString());
        expect(collateralConfig.liquidationRatio.toString()).to.be.equal(
          COLLATERALS[element].liquidationRatio.toString(),
        );
        expect(collateralConfig.minCollateralRatio.toString()).to.be.equal(
          COLLATERALS[element].minCollateralRatio.toString(),
        );
        expect(collateralConfig.borrowRate.toString()).to.be.equal(COLLATERALS[element].borrowRate.toString());
        expect(collateralConfig.originationFee.toString()).to.be.equal(COLLATERALS[element].originationFee.toString());
        expect(collateralConfig.liquidationBonus.toString()).to.be.equal(
          COLLATERALS[element].liquidationBonus.toString(),
        );
        expect(collateralConfig.liquidationFee.toString()).to.be.equal(COLLATERALS[element].liquidationFee.toString());
      }
    } catch (error) {
      console.log(error);
    }
  });
  it('Check PAR', async () => {
    const a = await par.a();
    expect(a).to.be.equal(addressProvider.address);
  });
  it('Check PriceFeed', async () => {
    const collateralList = Object.keys(networkConfig.collaterals);
    for (const element of collateralList) {
      let collateralUsdAggregator = networkConfig.collaterals[element].usdAggregator;
      let collateral = networkConfig.collaterals[element].address;
      if (collateralUsdAggregator === '') {
        collateralUsdAggregator = deployedContracts[`${element}UsdAggregator`].address;
      }

      if (networkConfig.isTestNet && collateral === '') {
        collateral = deployedContracts[`Mock${element}`].address;
      }

      const assetOracle = await priceFeed.assetOracles(collateral);
      expect(assetOracle).to.be.equal(collateralUsdAggregator);
    }

    let { eurUsdAggregator } = networkConfig;
    if (eurUsdAggregator === '') {
      eurUsdAggregator = deployedContracts.EurUsdAggregator.address;
    }

    const [eurOracle, a] = await Promise.all([priceFeed.eurOracle(), priceFeed.a()]);
    expect(eurOracle).to.be.equal(eurUsdAggregator);
    expect(a).to.be.equal(addressProvider.address);
  });
  it('Check RatesManager', async () => {
    const a = await ratesManager.a();
    expect(a).to.be.equal(addressProvider.address);
  });
  it('Check LiquidationManager', async () => {
    const a = await liquidationManager.a();
    expect(a).to.be.equal(addressProvider.address);
  });
  it('Check FeeDistributor', async () => {
    const [payees, totalShares, vaultsCoreShare, a] = await Promise.all([
      feeDistributor.getPayees(),
      feeDistributor.totalShares(),
      feeDistributor.shares(vaultsCore.address),
      feeDistributor.a(),
    ]);
    expect(a).to.be.equal(addressProvider.address);
    expect(payees).to.include(vaultsCore.address);
    expect(payees.length).to.be.equal(1);
    expect(totalShares.toNumber()).to.be.equal(100);
    expect(vaultsCoreShare.toNumber()).to.be.equal(100);
  });
  it('Check VaultsDataProvider', async () => {
    const a = await vaultsDataProvider.a();
    expect(a).to.be.equal(addressProvider.address);
  });
  it('Check VaultsCoreState', async () => {
    const a = await vaultsCoreState.a();
    expect(a).to.be.equal(addressProvider.address);
  });
  it('Check VaultsCore', async () => {
    let WETH = networkConfig.collaterals[networkConfig.baseToken].address;
    if (networkConfig.isTestNet && WETH === '') {
      WETH = deployedContracts[`Mock${networkConfig.baseToken}`].address;
    }

    const [a, setWETH, state, setDebtNotifier] = await Promise.all([
      vaultsCore.a(),
      vaultsCore.WETH(),
      vaultsCore.state(),
      vaultsCore.debtNotifier(),
    ]);
    expect(a).to.be.equal(addressProvider.address);
    expect(setWETH.toLowerCase()).to.be.equal(WETH.toLowerCase());
    expect(state).to.be.equal(vaultsCoreState.address);
    expect(setDebtNotifier).to.be.equal(debtNotifier.address);
  });
});

describe('--- Verify Governance ---', async () => {
  it('Check GovernanceAddressProvider', async () => {
    const [parallel, setMimo, setDebtNotifier, setGovernorAlpha, setTimelock, setVotingEscrow] = await Promise.all([
      governanceAddressProvider.parallel(),
      governanceAddressProvider.mimo(),
      governanceAddressProvider.debtNotifier(),
      governanceAddressProvider.governorAlpha(),
      governanceAddressProvider.timelock(),
      governanceAddressProvider.votingEscrow(),
    ]);
    expect(parallel).to.be.equal(addressProvider.address);
    expect(setMimo).to.be.equal(mimo.address);
    expect(setDebtNotifier).to.be.equal(debtNotifier.address);
    expect(setGovernorAlpha).to.be.equal(governorAlpha.address);
    expect(setTimelock).to.be.equal(timelock.address);
    expect(setVotingEscrow).to.be.equal(votingEscrow.address);
  });
  it('Check DebtNotifier', async () => {
    const collateralList = Object.keys(networkConfig.collaterals);
    for (const element of collateralList) {
      const supplyMiner = await ethers.getContractAt(
        deployedContracts[`${element}SupplyMiner`].abi,
        deployedContracts[`${element}SupplyMiner`].address,
      );
      let collateral = networkConfig.collaterals[element].address;
      if (networkConfig.isTestNet && collateral === '') {
        collateral = deployedContracts[`Mock${element}`].address;
      }

      const setSupplyMiner = await debtNotifier.collateralSupplyMinerMapping(collateral);
      expect(setSupplyMiner).to.be.equal(supplyMiner.address);
    }

    const a = await debtNotifier.a();
    expect(a).to.be.equal(governanceAddressProvider.address);
  });
  it('Check SupplyMiners', async () => {
    const collateralList = Object.keys(networkConfig.collaterals);
    for (const element of collateralList) {
      const supplyMiner = await ethers.getContractAt(
        deployedContracts[`${element}SupplyMiner`].abi,
        deployedContracts[`${element}SupplyMiner`].address,
      );
      const a = await supplyMiner.a();
      expect(a).to.be.equal(governanceAddressProvider.address);
    }
  });
  it('Check VotingEscrow', async () => {
    const [a, stakingToken, symbol, name, miner] = await Promise.all([
      votingEscrow.a(),
      votingEscrow.stakingToken(),
      votingEscrow.symbol(),
      votingEscrow.name(),
      votingEscrow.miner(),
    ]);
    expect(a).to.be.equal(governanceAddressProvider.address);
    expect(stakingToken).to.be.equal(mimo.address);
    expect(symbol).to.be.equal(VOTING_ESCROW_SYMBOL);
    expect(name).to.be.equal(VOTING_ESCROW_NAME);
    expect(miner).to.be.equal(votingMiner.address);
  });
  it('Check GovernorAlpha', async () => {
    const a = await governorAlpha.a();
    expect(a).to.be.equal(governanceAddressProvider.address);
  });
  it('Check ChainDistributor', async () => {
    if (chainDistributor) {
      const collateralList = Object.keys(networkConfig.collaterals);
      const supplyMiners: AddressLike[] = [];
      const [registeredPayees, setRootChainManager, setErc20Predicate] = await Promise.all([
        chainDistributor.getPayees(),
        chainDistributor.rootChainManager(),
        chainDistributor.erc20Predicate(),
      ]);
      for (const element of collateralList) {
        const supplyMiner = await ethers.getContractAt(
          deployedContracts[`${element}SupplyMiner`].abi,
          deployedContracts[`${element}SupplyMiner`].address,
        );
        supplyMiners.push(supplyMiner.address);
        expect(registeredPayees).to.include(supplyMiner.address);
        // Still need to add demandMiner logic
        const shares = await chainDistributor.shares(supplyMiner.address);
        expect(shares.toNumber()).to.be.equal(networkConfig.collaterals[element].incentiveShare);
      }

      expect(setRootChainManager).to.be.equal(MAINNET_CONTRACTS.RootChainManager);
      expect(setErc20Predicate).to.be.equal(MAINNET_CONTRACTS.ERC20PredicateProxy);
    } else {
      console.log('No ChainDistributor deployed');
    }
  });
});
