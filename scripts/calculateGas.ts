import { readFileSync, readdirSync } from "fs";
import { DeploymentReport } from "../config/deployment";
import { network } from "hardhat";

const calculateGas = () => {
  const report: DeploymentReport = JSON.parse(
    readFileSync(`./reports/${network.name === "hardhat" ? "localhost" : network.name}/setters.json`).toString(),
  );
  let totalGas = 0;
  const txList: string[] = Object.keys(report);

  for (const tx of txList) {
    const txCost = report[tx].gasUsed ? Number.parseInt(report[tx].gasUsed!) : 0;
    totalGas += txCost;
  }

  const dir = readdirSync(`deployments/${network.name === "hardhat" ? "localgost" : network.name}`);
  for (const file of dir) {
    if (file.includes(".json")) {
      const contract = JSON.parse(
        readFileSync(`deployments/${network.name === "hardhat" ? "localgost" : network.name}/${file}`).toString(),
      );
      const deployCost = Number.parseInt(contract.receipt.gasUsed);
      totalGas += deployCost;
    }
  }

  console.log(totalGas);
};

calculateGas();
