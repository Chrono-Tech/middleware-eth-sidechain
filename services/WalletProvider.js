const Web3 = require('web3'),
  _ = require('lodash'),
  net = require('net');



class WalletProvider {

  constructor (key, uri, contracts) {
    this._key = key;
    this._started = false;
    this._contracts = contracts;
    this.web3 = new Web3();
    let walletResult = this.web3.eth.accounts.wallet.add(this._key);
    this.address = walletResult.address;

    this.provider = /http:\/\//.test(uri) ?
      new Web3.providers.HttpProvider(uri) :
      new Web3.providers.IpcProvider(`${/^win/.test(process.platform) ? '\\\\.\\pipe\\' : ''}${uri}`, net);
  }


  async getInstance () {
    if (!this._started) {
      await this.start();
      this._started = true;
    }

    return this;
  }

  async start () {
    this.web3.setProvider(this.provider);
    let networkId = await this.web3.eth.net.getId();

    this.contracts = _.chain(this._contracts).values()
      .transform((result, contract)=>{

        result[contract.contractName] = new this.web3.eth.Contract(contract.abi, _.get(contract, `networks.${networkId}.address`))
      }, {})
      .value();


  }

}

module.exports = WalletProvider;
