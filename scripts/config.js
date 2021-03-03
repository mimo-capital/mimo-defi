const { BN } = require("@openzeppelin/test-helpers");

module.exports = {
  collateralConfig: {
    WBTC: {
      borrowRate: new BN("1000000000627937192491029811").toString(), // 2% per year
      parDebtLimit: new BN(String(1e18)).mul(new BN("1000000")).toString(), // 1 millon EUR
      liquidationRatio: new BN(String(13e17)).toString(), // 130%
      minCollateralRatio: new BN(String(String(15e17))).toString(), // 150%
      originationFee: "0",
      liquidationBonus: new BN(String(5e16)).toString(), // 5%
      liquidationFee: "0",
    },
    WETH: {
      borrowRate: new BN("1000000000627937192491029811"), // 2% per year
      parDebtLimit: new BN(String(1e18)).mul(new BN("1000000")), // 1 millon EUR
      liquidationRatio: new BN(String(13e17)), // 130%
      minCollateralRatio: new BN(String(String(15e17))).toString(), // 150%
      originationFee: "0",
      liquidationBonus: new BN(String(5e16)).toString(), // 5%
      liquidationFee: "0",
    },
  },
};
