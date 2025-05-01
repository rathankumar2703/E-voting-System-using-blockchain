const Voting = artifacts.require("Voting");

module.exports = function(deployer, network, accounts) {
  deployer.deploy(Voting, accounts[0]); // Pass accounts[0] as admin
};