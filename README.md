# Parallel Protocol

## Prerequisites

- Install [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating) (Node Version Manager)
- Install the project's Node.js version 12.20.1 `nvm install v12.20.1`
- Enable the project's Node.js version with `nvm use`
- Install [Truffle](https://github.com/trufflesuite/truffle) `npm install -g truffle`
- Install [Yarn](https://yarnpkg.com/getting-started/install) `npm install -g yarn`

```bash
> truffle version
Truffle v5.1.29 (core: 5.1.29)
Solidity - 0.7.0 (solc-js)
Node v12.20.1
Web3.js v1.2.1
```

## Getting Started

```bash
yarn
yarn test
```

## Running scripts
truffle exec scripts/script.js --network kovan

## Mainnet Deployment

| Contract | Etherscan |
| ------------- | ------------- |
| VaultsCore | https://etherscan.io/address/0x4026bdcd023331d52533e3374983ded99ccbb6d4#contracts |
| AccessController | https://etherscan.io/address/0x7df19c25971057a54405e041fd479f677038aa75#contracts |
| AddressProvider | https://etherscan.io/address/0x6fAE125De41C03fa7d917CCfa17Ba54eF4FEb014#contracts |
| PAR | https://etherscan.io/address/0x68037790a0229e9ce6eaa8a99ea92964106c4703#contracts |
| RatesManager | https://etherscan.io/address/0x8d4B22346c4c2F8aA023Af201219dD5AE93E9EcE#contracts |
| LiquidationManager | https://etherscan.io/address/0x0a1237330268ceb2e1a8565b751c5a84d70df456#contracts |
| PriceFeed | https://etherscan.io/address/0xa94140087d835526d5eaedaea8573a02315d5380#contracts |
| FeeDistributor | https://etherscan.io/address/0x585c9ad00d5dd65f3fee6aa64ffa17aec38c718a#contracts |
| ConfigProvider | https://etherscan.io/address/0xaa4cb7dbb37dba644e0c180291574ef4e6abb187#contracts |
| VaultsDataProvider | https://etherscan.io/address/0x9c29d8d359255e524702c7a9c95c6e6ae38274dc#contracts |
| VaultsCoreState | https://etherscan.io/address/0x9A99a3911357F3f1934dc423956713E087eF6F25#contracts |
| DebtNotifier | https://etherscan.io/address/0xeAaD8e52a15A78a5C8be17D3c2ac538aE04F5fEe#contracts |

## Kovan Deployment

| Contract | Etherscan |
| ------------- | ------------- |
| VaultsCore | https://kovan.etherscan.io/address/0xcc303b063088880487fc168bab3655376801c9e3#contracts |
| AccessController | https://kovan.etherscan.io/address/0x49da15ef2de18268ca13652acc638e288afaccd9#contracts |
| AddressProvider | https://kovan.etherscan.io/address/0xa53cddAc09fA3e97a7231E38E4A5fA5B688BcD87#contracts |
| PAR | https://kovan.etherscan.io/address/0x071af828464def6979fadaa34703deaacd3ac71d#contracts |
| RatesManager | https://kovan.etherscan.io/address/0x56fa32b2e8544ce18ac07e78178a6c7daa72d4b3#contracts |
| LiquidationManager | https://kovan.etherscan.io/address/0x2bf37def7147fa11e000195c77a587bb8b7e8e32#contracts |
| PriceFeed | https://kovan.etherscan.io/address/0x1ae386f42e0350058c755d7c0ce78278c987fa11#contracts |
| FeeDistributor | https://kovan.etherscan.io/address/0x9b7a8e428fed3877c39df3932ac0809dd90296e2#contracts |
| ConfigProvider | https://kovan.etherscan.io/address/0x0f319a9c4251eec9b4c3278354ff1d27576f4625#contracts |
| VaultsDataProvider | https://kovan.etherscan.io/address/0x45a6dbc24f0100e680058ade73aac8496b6daecf#contracts |
| VaultsCoreState | https://kovan.etherscan.io/address/0x233614f3ff9fcab5759dbacbb58676d31a9f4c1e#contracts |
| DebtNotifier | https://kovan.etherscan.io/address/0xcefff225fb0453ec30f131fcc084316c03f308aa#contracts |
