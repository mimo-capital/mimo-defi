/* eslint no-warning-comments: 0 */
const VotingEscrow = artifacts.require("VotingEscrow");
const Timelock = artifacts.require("Timelock");
const GovernorAlpha = artifacts.require("GovernorAlpha");

global.web3 = web3;

let escrow;
let timelock;
let governance;

const NAME = "MIMO Voting Power";
const SYMBOL = "vMIMO";
const GUARDIAN = "0x0000000000000000000000000000000000000000"; // This should be the Gnosis Safe on mainnet
const DELAY = 172800; // Timelock delay (time.duration.days(2))

async function deployGovernance(callback) {
  try {
    const network = await web3.eth.net.getNetworkType();

    // Deploy voting escrow
    escrow = await VotingEscrow.new(
      process.env.MIMO_TOKEN_ADDRESS,
      process.env.ACCESS_CONTROLLER_ADDRESS,
      NAME,
      SYMBOL,
    );
    console.log("VotingEscrow: ", escrow.address);

    // Deploy timelock
    timelock = await Timelock.new(GUARDIAN, DELAY);
    console.log("Timelock: ", timelock.address);

    // Deploy governance
    governance = await GovernorAlpha.new(timelock.address, escrow.address, GUARDIAN);
    console.log("GovernorAlpha: ", governance.address);

    console.info("Deployment finished.");
    console.log(
      `truffle run verify VotingEscrow@${escrow.address} Timelock@${timelock.address} GovernorAlpha@${governance.address} --network ${network} --license MIT`,
    );

    // TODO: set timelock admin to Safe before going to full governance
    // TODO: Handshake to transfer administrative rights of timelock from guardian to governance.address (eventually)
    // Await governance.__queueSetTimelockPendingAdmin
    // await governance.__executeSetTimelockPendingAdmin
    // assert.equal(timelock.pendingAdmin(), governance.address)
    // await governance.__acceptAdmin({from: guardian})
    // TODO: transfer protocol contract ownership to timelock
  } catch (error) {
    console.log(error);
  }

  callback();
}

module.exports = deployGovernance;
