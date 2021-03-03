const config = require("./config");

async function getSignedDeploymentTransaction(contractInstance, bytecode, args, from, nonce, gasPrice) {
  const deployTx = contractInstance.deploy({
    data: bytecode,
    arguments: args,
  });

  const tx = await web3.eth.signTransaction({
    nonce,
    gasPrice,
    gas: Number.parseInt((await deployTx.estimateGas()) * 1.1, 10),
    data: deployTx.encodeABI(),
    from,
  });

  return tx;
}

async function setCollateralConfig(configProvider, addresses, collateralType) {
  const collateralConfig = config.collateralConfig[collateralType];
  try {
    const setCollateralConfigTx = await configProvider.setCollateralConfig(
      addresses[collateralType],
      collateralConfig.parDebtLimit,
      collateralConfig.liquidationRatio,
      collateralConfig.minCollateralRatio,
      collateralConfig.borrowRate,
      collateralConfig.originationFee,
      collateralConfig.liquidationBonus,
      collateralConfig.liquidationFee,
    );
    console.log("set collateral config", setCollateralConfigTx);
  } catch (error) {
    console.log(error);
  }
}

async function getSignedTransaction(contractInstance, method, args, from, nonce, gasPrice) {
  const data = contractInstance.methods[method](...args).encodeABI();
  const gas = await contractInstance.methods[method](...args).estimateGas({
    from,
  });

  const tx = await web3.eth.signTransaction({
    nonce,
    gasPrice,
    gas: Number.parseInt(gas * 1.1, 10),
    data,
    from,
    to: contractInstance._address,
    value: "0x00",
  });

  return tx;
}

async function sendSignedTransactions(txs) {
  const receipts = [];
  for (const [i, tx] of txs.entries()) {
    const receipt = await web3.eth.sendSignedTransaction(tx);
    receipts.push(receipt);
    console.log(`tx ${i}`, receipt.transactionHash);
  }

  return receipts;
}

module.exports = {
  getSignedDeploymentTransaction,
  setCollateralConfig,
  getSignedTransaction,
  sendSignedTransactions,
};
