import '@typechain/hardhat';
import '@nomiclabs/hardhat-waffle';
import '@nomiclabs/hardhat-etherscan';
import '@nomiclabs/hardhat-truffle5';
import '@nomiclabs/hardhat-web3';
import 'hardhat-deploy';
import 'dotenv/config';
import { HardhatUserConfig } from 'hardhat/types';
// Import { task } from 'hardhat/config';

const RINKEBY_ENDPOINT = `https://rinkeby.infura.io/v3/${process.env.INFURA_TOKEN}`;
const KOVAN_ENDPOINT = `https://kovan.infura.io/v3/${process.env.INFURA_TOKEN}`;
const GOERLI_ENDPOINT = `https://goerli.infura.io/v3/${process.env.INFURA_TOKEN}`;
const MAINNET_ENDPOINT = `https://mainnet.infura.io/v3/${process.env.INFURA_TOKEN}`;
const POLYGON_ENDPOINT = `https://polygon-mainnet.infura.io/v3/${process.env.INFURA_TOKEN}`;
const MUMBAI_ENDPOINT = `https://polygon-mumbai.infura.io/v3/${process.env.INFURA_TOKEN}`;
const FANTOM_TESTNET_ENDPOINT = `https://rpc.testnet.fantom.network/`;
const FANTOM_MAINNET_ENDPOINT = `https://rpc.ftm.tools/`;

const PRIVATE_KEY_1 = process.env.PRIVATE_KEY_1
  ? `0x${process.env.PRIVATE_KEY_1}`
  : '0x64fba59162e4f093b7503016a580a24c5f46b68a72939c65daeb211241936cc8';
const PRIVATE_KEY_2 = process.env.PRIVATE_KEY_1
  ? `0x${process.env.PRIVATE_KEY_1}`
  : '0x70c38fa4602b382fba09695786aad0a4c554a1c22835dbae3190a1509e358254';

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
const config: HardhatUserConfig = {
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
      saveDeployments: true,
      loggingEnabled: true,
      deploy: ['deploy_sidechain'],
      companionNetworks: { ethereum: 'mainnet' },
    },
    hardhat: {
      mining: {
        auto: true,
      },
      deploy: ['deploy_sidechain'],
      saveDeployments: true,
    },
    ganache: {
      url: 'http://127.0.0.1:7545',
      chainId: 1337,
      loggingEnabled: true,
    },
    mainnet: {
      url: MAINNET_ENDPOINT,
      chainId: 1,
      accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2],
      companionNetworks: { polygon: 'polygon', fantom: 'fantom' },
      deploy: ['deploy_rootchain'],
    },
    rinkeby: {
      url: RINKEBY_ENDPOINT,
      chainId: 4,
      accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2],
      deploy: ['deploy_sidechain'],
      gasMultiplier: 1.2,
      loggingEnabled: true,
    },
    goerli: {
      url: GOERLI_ENDPOINT,
      chainId: 5,
      accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2],
    },
    kovan: {
      url: KOVAN_ENDPOINT,
      chainId: 42,
      accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2],
    },
    polygon: {
      url: POLYGON_ENDPOINT,
      chainId: 137,
      gasPrice: 50000000000, // 50 gwei
      accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2],
    },
    mumbai: {
      url: MUMBAI_ENDPOINT,
      chainId: 80001,
      gasPrice: 5000000000, // 50 gwei
      accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2],
    },
    fantommainnet: {
      url: FANTOM_MAINNET_ENDPOINT,
      chainId: 250,
      gasPrice: 300000000000,
      accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2],
      deploy: ['deploy_sidechain'],
      loggingEnabled: true,
    },
    fantomtestnet: {
      url: FANTOM_TESTNET_ENDPOINT,
      chainId: 4002,
      gasPrice: 150000000000,
      accounts: [PRIVATE_KEY_1, PRIVATE_KEY_2],
      deploy: ['deploy_sidechain'],
      loggingEnabled: true,
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.6.12',
        settings: {
          optimizer: {
            enabled: true,
          },
        },
      },
    ],
  },
  namedAccounts: {
    deployer: {
      default: 0, // Here this will by default take the first account as deployer
      4: 0,
      250: 0,
    },
    testA: {
      default: 11,
      4: 1,
      250: 1,
    },
    testB: {
      default: 12,
      4: 2,
      250: 2,
    },
    testC: {
      default: 13,
      4: 3,
      250: 3,
    },
    testD: {
      default: 14,
      4: 4,
      250: 4,
    },
    testE: {
      default: 15,
      4: 5,
      250: 5,
    },
    // GnosisSafe
    guardian: {
      default: '0x0000000000000000000000000000000000000001',
    },
  },
  etherscan: {
    apiKey: process.env.FTMSCAN_API_KEY,
    // ApiKey: process.env.POLYSCAN_API_KEY,
  },
  paths: {
    sources: './contracts',
    tests: './test',
    cache: './cache',
    artifacts: './artifacts',
    deploy: './deploy',
  },
  mocha: {
    timeout: 2000000000,
  },
};

export default config;
