const URL = require('url').URL;

const mainUrl = new URL(process.env.WEB3_URI || 'http://localhost:8545');
const sidechainUrl = new URL(process.env.SIDEHCAIN_WEB3_URI || 'http://localhost:8546');

console.log(process.env.TYPE === '1' ? mainUrl.port : sidechainUrl.port)


module.exports = {
  networks: {
    development: {
      host: 'localhost',
      port: process.env.TYPE === '1' ? mainUrl.port : sidechainUrl.port,
      network_id: 86, // Match any network id
      gas: 5700000
    }
  },
  solc: {
    optimizer: {
      enabled: true,
      runs: 200
    }
  }
};
