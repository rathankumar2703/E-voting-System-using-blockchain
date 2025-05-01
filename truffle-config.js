module.exports = {
  networks: {
    ganache: {
      host: "127.0.0.1",
      port: 7545,
      network_id: "1337",
      gas: 6721975,
      mnemonic: "lend memory effort carpet lamp lawsuit chase holiday tired fuel version tribe"
    }
  },
  mocha: {
    timeout: 100000
  },
  compilers: {
    solc: {
      version: "0.5.16",
      settings: {
        optimizer: {
          enabled: true,
          runs: 200
        }
      }
    }
  }
};