const ProviderEngine = require('web3-provider-engine'),
  FiltersSubprovider = require('web3-provider-engine/subproviders/filters.js'),
  WalletSubProvider = require('./WalletSubProvider'),
  Web3SubProvider = require('web3-provider-engine/subproviders/web3.js'),
  Web3 = require('web3'),
  net = require('net');



class WalletProvider {

  constructor (wallet, uri) {
    this.wallet = wallet;
    this._started = false;
    this.address = `0x${this.wallet.getAddress().toString('hex')}`;

    this.engine = new ProviderEngine();

    this.engine.addProvider(new WalletSubProvider(this.wallet));
    this.engine.addProvider(new FiltersSubprovider());

    const provider = /http:\/\//.test(uri) ?
      new Web3.providers.HttpProvider(uri) :
      new Web3.providers.IpcProvider(`${/^win/.test(process.platform) ? '\\\\.\\pipe\\' : ''}${uri}`, net);

    this.engine.addProvider(new Web3SubProvider(provider));


  }


  getInstance(){
    if(!this._started){
      this.engine.start();
      this._started = true;
    }

      return this;
  }


  sendAsync () {
    return this.engine.sendAsync(...arguments);
  }

  send () {
    return this.engine.send(...arguments);
  }


  getAddress () {
    return this.address;
  }

}


module.exports = WalletProvider;
