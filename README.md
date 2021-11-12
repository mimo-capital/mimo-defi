# titan

## Prerequisites

- Install [`nvm`](https://github.com/nvm-sh/nvm#installing-and-updating) (Node Version Manager)
- Install the project's Node.js version 12.20.1 `nvm install v12.20.1`
- Enable the project's Node.js version with `nvm use`
- Install [Hardhat](https://hardhat.org/getting-started/) `npm install -g hardhat`
- Install [Yarn](https://yarnpkg.com/getting-started/install) `npm install -g yarn`

```bash
> hardhat version
Hardhat v2.6.4
Solidity - 0.7.0 (solc-js)
Node v12.20.1
Ethers v5.4.7
```

## Getting Started

```bash
yarn
yarn test
```

## Running scripts

npx hardhat deploy --network `network-name` --tags `tags`

## Mainnet Deployment

| Contract                  | Etherscan                                                                         |
| ------------------------- | --------------------------------------------------------------------------------- |
| VaultsCore                | https://etherscan.io/address/0x4026bdcd023331d52533e3374983ded99ccbb6d4#contracts |
| AccessController          | https://etherscan.io/address/0x7df19c25971057a54405e041fd479f677038aa75#contracts |
| AddressProvider           | https://etherscan.io/address/0x6fAE125De41C03fa7d917CCfa17Ba54eF4FEb014#contracts |
| PAR                       | https://etherscan.io/address/0x68037790a0229e9ce6eaa8a99ea92964106c4703#contracts |
| RatesManager              | https://etherscan.io/address/0x8d4B22346c4c2F8aA023Af201219dD5AE93E9EcE#contracts |
| LiquidationManager        | https://etherscan.io/address/0x0a1237330268ceb2e1a8565b751c5a84d70df456#contracts |
| PriceFeed                 | https://etherscan.io/address/0xa94140087d835526d5eaedaea8573a02315d5380#contracts |
| FeeDistributor            | https://etherscan.io/address/0x585c9ad00d5dd65f3fee6aa64ffa17aec38c718a#contracts |
| MIMODistributor           | https://etherscan.io/address/0xEdfAa67889DD8D0A5A9241801B53cca3206c5030#contracts |
| ConfigProvider            | https://etherscan.io/address/0xaa4cb7dbb37dba644e0c180291574ef4e6abb187#contracts |
| VaultsDataProvider        | https://etherscan.io/address/0x9c29d8d359255e524702c7a9c95c6e6ae38274dc#contracts |
| VaultsCoreState           | https://etherscan.io/address/0x9A99a3911357F3f1934dc423956713E087eF6F25#contracts |
| DebtNotifier              | https://etherscan.io/address/0xeAaD8e52a15A78a5C8be17D3c2ac538aE04F5fEe#contracts |
| GovernanceAddressProvider | https://etherscan.io/address/0x718b7584d410f364fc16724027c07c617b87f2fc#contracts |

## Polygon Deployment

| Contract                  | Polygonscan                                                                          |
| ------------------------- | ------------------------------------------------------------------------------------ |
| AccessController          | https://polygonscan.com/address/0xe95dc4d81a4707884e7db4a53954763b36cb45ae#contracts |
| AddressProvider           | https://polygonscan.com/address/0xa802ee4bd9f449295adb6d73f65118352420758a#contracts |
| ConfigProvider            | https://polygonscan.com/address/0xcae2cae9a4384b196c0f1bae59724e0eb9a347e0#contracts |
| PAR                       | https://polygonscan.com/address/0xe2aa7db6da1dae97c5f5c6914d285fbfcc32a128#contracts |
| PriceFeed                 | https://polygonscan.com/address/0x1f4d9879327e2ecc488ccc49566286c844af6f2c#contracts |
| RatesManager              | https://polygonscan.com/address/0x74419ec5ed2f745bece0d4e4118db2f33eb88367#contracts |
| LiquidationManager        | https://polygonscan.com/address/0x57896e135f845301c706f643506629493b6660ab#contracts |
| FeeDistributor            | https://polygonscan.com/address/0x313d1d48430721370ecc57262a7664e375a347fb#contracts |
| VaultsDataProvider        | https://polygonscan.com/address/0xde1996189ee1857d79f1f2bebe2a4a2b200bcb44#contracts |
| VaultsCoreState           | https://polygonscan.com/address/0x2d49e60555d0372be23e2b24aeb3e5ea55dcb417#contracts |
| VaultsCore                | https://polygonscan.com/address/0x03175c19cb1d30fa6060331a9ec181e04cac6ab0#contracts |
| GovernanceAddressProvider | https://polygonscan.com/address/0x2489DF1F40BcA6DBa1554AafeCc237BBc6d0453c#contracts |
| DebtNotifier              | https://polygonscan.com/address/0xc7d868954009df558ac5fd54032f2b6fb6ef926c#contracts |
| WMATIC supplyMiner        | https://polygonscan.com/address/0x8B264d48C0887Bc2946eA8995c3afCDBB576f799#contracts |
| WETH supplyMiner          | https://polygonscan.com/address/0x0F307e021a7E7D03b6D753B972D349F48D0B7e2B#contracts |
| WBTC supplyMiner          | https://polygonscan.com/address/0xEac544c12e8EDe461190Bb573e5d56f9198811aC#contracts |
| USDC supplyMiner          | https://polygonscan.com/address/0xdccD52EB99a7395398E4603d21f4932782f5D9EA#contracts |
