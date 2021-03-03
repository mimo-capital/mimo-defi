const _ = require("underscore");
import {
  AccessControllerInstance,
  MimoInstance,
  MimoDistributorInstance,
  GovernanceAddressProviderInstance,
} from "../../types/truffle-contracts";
import { setupMIMO } from "../utils/helpers";

const { BN, expectRevert, time } = require("@openzeppelin/test-helpers");

const MIMODistributor = artifacts.require("MIMODistributor");

const AccessController = artifacts.require("AccessController");
const AddressProvider = artifacts.require("AddressProvider");
const GovernanceAddressProvider = artifacts.require("GovernanceAddressProvider");

const WAD = new BN("1000000000000000000"); // 1e18
const MONTH_SECONDS = new BN("2628000");

let a: GovernanceAddressProviderInstance;
let controller: AccessControllerInstance;
let mimoDistributor: MimoDistributorInstance;
let mimo: MimoInstance;

contract("MIMODistributor", (accounts) => {
  const [owner, A, B, , other] = accounts;
  const PAYEES = [A, B];
  const SHARES = [20, 80];

  beforeEach(async () => {
    controller = await AccessController.new();
    const addresses = await AddressProvider.new(controller.address);
    a = await GovernanceAddressProvider.new(addresses.address);

    const deploymentTime = await time.latest();
    mimoDistributor = await MIMODistributor.new(a.address, deploymentTime);

    mimo = await setupMIMO(a.address, controller, owner, [mimoDistributor.address]);
    await a.setMIMO(mimo.address);

    await mimoDistributor.changePayees(PAYEES, SHARES);
  });

  it("initialized Liquidity mining start correctly", async () => {
    const deploymentTime = await time.latest();
    const start = await mimoDistributor.startTime();
    const elapsed = deploymentTime.sub(start).abs();
    assert.isBelow(elapsed.toNumber(), 5, "start = deployment time; not more than 5 sec should have elapsed");

    const addressProviderAddress = await mimoDistributor.a();
    assert.equal(addressProviderAddress.toString(), a.address, "addressProvider correctly configured");
  });

  it("should initialize with total shares", async () => {
    const totalShares = await mimoDistributor.totalShares();
    assert.equal(totalShares.toString(), "100");
  });

  it("should initialize with payees and shares", async () => {
    const payees: string[] = await mimoDistributor.getPayees();
    await Promise.all(
      payees.map(async (_: string, index: number) => {
        const payee = await mimoDistributor.payees(index);
        assert.equal(payee, PAYEES[index]);
      }),
    );

    await Promise.all(
      payees.map(async (payee: string, index: number) => {
        const share = await mimoDistributor.shares(payee);
        assert.equal(share.toString(), SHARES[index].toString());
      }),
    );
  });

  it("calculate total supply correctly", async () => {
    const start = await mimoDistributor.startTime();

    const supply1 = await mimoDistributor.totalSupplyAt(start);
    assert.equal(supply1.toString(), "0", "supplyAt(0) = 0");

    const supply2 = await mimoDistributor.totalSupplyAt(start.add(MONTH_SECONDS).sub(new BN(1)));
    const supply2_expected = WAD.mul(new BN("50000"))
      .mul(MONTH_SECONDS.sub(new BN(1)))
      .div(MONTH_SECONDS);
    assert.equal(supply2.toString(), supply2_expected.toString(), "supplyAt(1 month minus 1 sec) = ~50k");

    const supply3 = await mimoDistributor.totalSupplyAt(start.add(MONTH_SECONDS));
    const supply3_expected = WAD.mul(new BN("50000"));
    assert.equal(supply3.toString(), supply3_expected.toString(), "supplyAt(1 month) = 50k");

    const supply4 = await mimoDistributor.totalSupplyAt(start.add(MONTH_SECONDS.mul(new BN(2))));
    const supply4_expected = WAD.mul(new BN("95000"));
    assert.equal(supply4.toString(), supply4_expected.toString(), "supplyAt(2 month) = 95k");

    const supply5 = await mimoDistributor.totalSupplyAt(start.add(MONTH_SECONDS.mul(new BN(3)).div(new BN(2))));
    const supply5_expected = WAD.mul(new BN("72500"));
    assert.equal(supply5.toString(), supply5_expected.toString(), "supplyAt(1.5 month) = 72.5k");
  });

  it("calculate current & future issuance correctly", async () => {
    const start = await mimoDistributor.startTime();

    const currentIssuance = await mimoDistributor.currentIssuance();
    const currentIssuance_expected = WAD.mul(new BN("50000"));
    assert.equal(currentIssuance.toString(), currentIssuance_expected.toString(), "initial issuance is 50k");

    const issuance2 = await mimoDistributor.monthlyIssuanceAt(start.add(MONTH_SECONDS.mul(new BN(3)).div(new BN(2))));
    const issuance2_expected = WAD.mul(new BN("45000"));
    assert.equal(issuance2.toString(), issuance2_expected.toString(), "month 2 issuance is 45k");

    const issuance3 = await mimoDistributor.monthlyIssuanceAt(start.add(MONTH_SECONDS));
    const issuance3_expected = WAD.mul(new BN("45000"));
    assert.equal(issuance3.toString(), issuance3_expected.toString(), "month 2 issuance is 45k");

    const issuance4 = await mimoDistributor.monthlyIssuanceAt(start.add(MONTH_SECONDS.mul(new BN(2))));
    const issuance4_expected = WAD.mul(new BN("40500"));
    assert.equal(issuance4.toString(), issuance4_expected.toString(), "month 3 start issuance is 40.5k");

    const issuance5 = await mimoDistributor.monthlyIssuanceAt(start.add(MONTH_SECONDS).sub(new BN(1)));
    const issuance5_expected = WAD.mul(new BN("50000"));
    assert.equal(issuance5.toString(), issuance5_expected.toString(), "month 1 end issuance is 50k");
  });

  it("available tokens should be 0 after initialize", async () => {
    const PER_SEC_ISSUANCE = WAD.mul(new BN("50000")).div(MONTH_SECONDS);
    const deploymentTime = await time.latest();
    mimoDistributor = await MIMODistributor.new(a.address, deploymentTime);
    const availableTokens = await mimoDistributor.mintableTokens();
    const elapsed = availableTokens.div(PER_SEC_ISSUANCE);
    assert.isBelow(elapsed.toNumber(), 5, "not more than 5 seconds worth of tokens should be available");
  });

  it("should be able to initialize start on deployment", async () => {
    const now = await time.latest();
    const future = now.add(MONTH_SECONDS);
    mimoDistributor = await MIMODistributor.new(mimo.address, future);
    const start = await mimoDistributor.startTime();
    assert.equal(start.toString(), future.toString());
  });

  it("should allow updating payees", async () => {
    await mimoDistributor.changePayees([owner], [1]);
    const payees: string[] = await mimoDistributor.getPayees();
    assert.deepEqual(payees, [owner]);

    const totalShares = await mimoDistributor.totalShares();
    assert.equal(totalShares.toString(), "1");
  });

  it("should be able to release accrued tokens to payees", async () => {
    const start = await mimoDistributor.startTime();
    // 0.5 month passes
    await time.increaseTo(start.add(MONTH_SECONDS.div(new BN(2))));

    const txReceipt1 = await mimoDistributor.release({ from: other });
    const newTokensEvent = _.findWhere(txReceipt1.logs, {
      event: "TokensReleased",
    });
    const elapsedTime = new BN(newTokensEvent.args.releasedAt).sub(start);

    const newTokens = WAD.mul(new BN("50000")).mul(elapsedTime).div(MONTH_SECONDS);
    // Console.log("Expected new tokens:", newTokens.toString(), MONTH_SECONDS.toString(), elapsedTime.toString());
    const totalShares = await mimoDistributor.totalShares();
    await Promise.all(
      PAYEES.map(async (payee) => {
        const payeeShare = await mimoDistributor.shares(payee);
        const newPayeeIncome = newTokens.mul(payeeShare).div(totalShares);
        const payeeBalanceAfter = await mimo.balanceOf(payee);
        assert.equal(payeeBalanceAfter.toString(), newPayeeIncome.toString());
      }),
    );
  });

  it("should NOT allow updating payees without manager rights", async () => {
    await expectRevert(mimoDistributor.changePayees([other], [1], { from: other }), "Caller is not Manager");

    const payees: string[] = await mimoDistributor.getPayees();
    assert.deepEqual(payees, PAYEES);

    const totalShares = await mimoDistributor.totalShares();
    assert.equal(totalShares.toString(), "100");
  });
});
