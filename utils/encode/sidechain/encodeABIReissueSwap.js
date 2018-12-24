const config = require('../../../config'),
  Web3 = require('web3'),
  web3 = new Web3(),
  _ = require('lodash'),
  contracts = require('../../../factories/sc/sidechainCotractsFactory');

module.exports = async (swapId, value, nonce) => { //todo use swap_id


  const platformAddress = _.get(contracts.ChronoBankPlatform, `networks.${config.sidechain.web3.networkId}.address`);
  const platform = new web3.eth.Contract(contracts.ChronoBankPlatform.abi, platformAddress);

  let result = platform.methods.reissueAssetAtomicSwap(web3.utils.utf8ToHex(swapId), web3.utils.asciiToHex(config.sidechain.web3.symbol), value).encodeABI();

  let tx = {
    to: platformAddress,
    data : result,
    chainId: web3.utils.numberToHex(config.sidechain.web3.networkId),
    nonce: web3.utils.numberToHex(nonce),
    gas: web3.utils.toHex(config.sidechain.contracts.actions.reissueAsset.gas),
    gasPrice: web3.utils.toHex(config.sidechain.contracts.actions.reissueAsset.gasPrice)
  };

  let signed = await web3.eth.accounts.signTransaction(tx, config.sidechain.web3.privateKey); //todo replace with call to sign service

  return {
    hash: signed.messageHash,
    r: signed.r,
    s: signed.s,
    v: signed.v
  }

};