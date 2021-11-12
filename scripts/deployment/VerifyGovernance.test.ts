import { getChainId, ethers, network } from 'hardhat';
import {
  NETWORK_CONFIG,
  NetworkConfig,
  MAINNET_CONTRACTS,
  VOTING_ESCROW_SYMBOL,
  VOTING_ESCROW_NAME,
} from '../../config/deployment';
import { expect } from 'chai';
import { Contract } from 'ethers';
import { AddressLike } from 'ethereumjs-util';
import { capitalizeFirstLetter } from '../../utils/helper';
import mimoDistributorAbi from '../../utils/abis/MimoDistributor';
import mimoAbi from '../../utils/abis/Mimo';
import { existsSync, readFileSync } from 'fs';

let chainId: string;
let networkConfig: NetworkConfig;
let addressProvider: Contract;
let vaultsCore: Contract;
let governanceAddressProvider: Contract;
let debtNotifier: Contract;
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
      addressProvider,
      governanceAddressProvider,
      debtNotifier,
      vaultsCore,
      governorAlpha,
      timelock,
      votingEscrow,
      votingMiner,
    ] = await Promise.all([
      ethers.getContractAt(deployedContracts.AddressProvider.abi, deployedContracts.AddressProvider.address),
      ethers.getContractAt(
        deployedContracts.GovernanceAddressProvider.abi,
        deployedContracts.GovernanceAddressProvider.address,
      ),
      ethers.getContractAt(deployedContracts.DebtNotifier.abi, deployedContracts.DebtNotifier.address),
      ethers.getContractAt(deployedContracts.VaultsCore.abi, deployedContracts.VaultsCore.address),
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
    const setDebtNotifier = await vaultsCore.debtNotifier();
    expect(setDebtNotifier).to.be.equal(debtNotifier.address);
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
