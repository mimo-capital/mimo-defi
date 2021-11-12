import { network, getChainId } from 'hardhat';
import { readdirSync, readFileSync } from 'fs';

const explorerLinks: Record<string, string> = {
  250: 'https://ftmscan.com/address/',
};

const getContractLinks = async () => {
  const dir = readdirSync(`deployments/${network.name}`);
  const chainId = await getChainId();
  for (const file of dir) {
    if (file.includes('.json')) {
      const contract = JSON.parse(readFileSync(`deployments/${network.name}/${file}`).toString());
      const { address } = contract;
      const contractName = file.slice(0, -5);
      console.log(`${contractName} : ${explorerLinks[Number.parseInt(chainId)]}${address}#code`);
    }
  }
};

getContractLinks();
