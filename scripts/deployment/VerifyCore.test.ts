import { getChainId, ethers, network } from 'hardhat';
import { NETWORK_CONFIG, NetworkConfig, MAINNET_CONTRACTS, COLLATERALS } from '../../config/deployment';
import { expect } from 'chai';
import { Contract } from 'ethers';
import mimoAbi from '../../utils/abis/Mimo';
import { BigNumber } from '@ethersproject/bignumber';
import { readFileSync } from 'fs';

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
let feeDistributor: Contract;
let mimo: Contract;
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
      feeDistributor,
      vaultsCore,
      vaultsDataProvider,
      vaultsCoreState,
    ] = await Promise.all([
      ethers.getContractAt(deployedContracts.AccessController.abi, deployedContracts.AccessController.address),
      ethers.getContractAt(deployedContracts.AddressProvider.abi, deployedContracts.AddressProvider.address),
      ethers.getContractAt(deployedContracts.ConfigProvider.abi, deployedContracts.ConfigProvider.address),
      ethers.getContractAt(deployedContracts.PAR.abi, deployedContracts.PAR.address),
      ethers.getContractAt(deployedContracts.RatesManager.abi, deployedContracts.RatesManager.address),
      ethers.getContractAt(deployedContracts.PriceFeed.abi, deployedContracts.PriceFeed.address),
      ethers.getContractAt(deployedContracts.LiquidationManager.abi, deployedContracts.LiquidationManager.address),
      ethers.getContractAt(deployedContracts.FeeDistributor.abi, deployedContracts.FeeDistributor.address),
      ethers.getContractAt(deployedContracts.VaultsCore.abi, deployedContracts.VaultsCore.address),
      ethers.getContractAt(deployedContracts.VaultsDataProvider.abi, deployedContracts.VaultsDataProvider.address),
      ethers.getContractAt(deployedContracts.VaultsCoreState.abi, deployedContracts.VaultsCoreState.address),
    ]);
  } catch (error) {
    console.log(error);
  }

  mimo = networkConfig.isTestNet
    ? await ethers.getContractAt(deployedContracts.MockMIMO.abi, deployedContracts.MockMIMO.address)
    : await ethers.getContractAt(mimoAbi, networkConfig.mimoToken);
});

describe('--- Verify Core Deployment ---', async () => {
  it('Check AccessController', async () => {
    try {
      const [MANAGER_ROLE, MINTER_ROLE] = await Promise.all([
        accessController.MANAGER_ROLE(),
        accessController.MINTER_ROLE(),
      ]);
      const [minterRoleCount, managerRoleCount, feeDistributorHasMinterRole, vaultsCoreHasMinterRole] =
        await Promise.all([
          accessController.getRoleMemberCount(MINTER_ROLE),
          accessController.getRoleMemberCount(MANAGER_ROLE),
          accessController.hasRole(MINTER_ROLE, feeDistributor.address),
          accessController.hasRole(MINTER_ROLE, vaultsCore.address),
        ]);
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
    } catch (error) {
      console.log(error);
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

    const [a, setWETH, state] = await Promise.all([vaultsCore.a(), vaultsCore.WETH(), vaultsCore.state()]);
    expect(a).to.be.equal(addressProvider.address);
    expect(setWETH).to.be.equal(WETH);
    expect(state).to.be.equal(vaultsCoreState.address);
  });
});
