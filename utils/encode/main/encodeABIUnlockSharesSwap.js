const config = require('../../../config'),
  Web3 = require('web3'),
  web3 = new Web3(),
  _ = require('lodash'),
  contracts = require('../../../factories/sc/mainContractsFactory');

module.exports = async (swapId, key, address, value, nonce) => {

/*  const replyTx = await mainnetProviderInstance.contracts.TimeHolder.methods
    .registerUnlockShares(
      web3.utils.asciiToHex(msg.payload.swapId),
      tokenAddress,
      msg.value,
      msg.address,
      keyHash)
    .send({from: mainnetProviderInstance.address, gas: 5700000});*/


  const timeHolderAddress = _.get(contracts.TimeHolder, `networks.${config.main.web3.networkId}.address`);
  const timeHolder = new web3.eth.Contract(contracts.TimeHolder.abi, timeHolderAddress);


  const keyHash = web3.utils.soliditySha3({t: 'bytes32', v: web3.utils.asciiToHex(key)}); //todo try with sha3

  let result = timeHolder.methods.registerUnlockShares(web3.utils.asciiToHex(swapId),
    config.main.web3.symbolAddress,
    value,
    address,
    keyHash).encodeABI();

  let tx = {
    to: timeHolderAddress,
    data : result,
    chainId: web3.utils.numberToHex(config.main.web3.networkId),
    nonce: web3.utils.numberToHex(nonce),
    gas: web3.utils.toHex(config.main.contracts.actions.unlock.gas),
    gasPrice: web3.utils.toHex(config.main.contracts.actions.unlock.gasPrice)
  };

  let signed = await web3.eth.accounts.signTransaction(tx, config.main.web3.privateKey); //todo replace with call to sign service

  return {
    hash: signed.messageHash,
    r: signed.r,
    s: signed.s,
    v: signed.v
  }

};