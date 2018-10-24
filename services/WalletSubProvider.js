const HookedWalletEthTxSubprovider = require('web3-provider-engine/subproviders/hooked-wallet-ethtx');

class WalletSubProvider extends HookedWalletEthTxSubprovider{

  constructor (wallet, opts = {}) {

    opts.getAccounts = function (cb) {

      cb(null, [wallet.getAddressString()]);
    };

    opts.getPrivateKey = function (address, cb) {
      address !== wallet.getAddressString() ?
        cb(new Error('Account not found')) :
        cb(null, wallet.getPrivateKey());
    };

    super(opts);

  }
}


module.exports = WalletSubProvider;
