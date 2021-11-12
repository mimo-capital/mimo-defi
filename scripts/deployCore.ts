import { run, network } from 'hardhat';

const deployCore = async () => {
  await run('deploy', {
    tags: 'SetCore',
    export: `reports/${network.name}/deployment.json`,
  });
};

deployCore();
