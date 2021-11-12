import { run, network } from 'hardhat';

const deployCore = async () => {
  await run('deploy', {
    tags: 'SetGovernance',
    export: `reports/${network.name}/deployment.json`,
  });
};

deployCore();
