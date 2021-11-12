import { run, network } from "hardhat";

const deployAll = async () => {
  await run("deploy", {
    export: `reports/${network.name}/deployment.json`,
  });
};

deployAll();
