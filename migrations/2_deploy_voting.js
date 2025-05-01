const Voting = artifacts.require("Voting");

module.exports = function(deployer, network, accounts) {
  const fixedAdminAddress = "0x43900eF395311e18083bC1f7bfe43B584157Af3e"; // Match Ganache account
  deployer.deploy(Voting, fixedAdminAddress, { from: accounts[0] });
};