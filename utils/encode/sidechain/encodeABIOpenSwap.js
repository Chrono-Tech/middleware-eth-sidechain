const config = require('../../../config'),
  Web3 = require('web3'),
  web3 = new Web3(),
  _ = require('lodash'),
  crypto = require('crypto'),
  contracts = require('../../../factories/sc/sidechainCotractsFactory');

module.exports = async (swapId, key, nonce, value, address) => {

  const keyHash = crypto.createHash('sha256').update(key).digest('hex');

  const swapContract = new web3.eth.Contract(contracts.AtomicSwapERC20.abi, _.get(contracts.AtomicSwapERC20, `networks.${config.sidechain.web3.networkId}.address`));
  let result = swapContract.methods.open(
    web3.utils.asciiToHex(swapId),
    value,
    config.sidechain.web3.symbolAddress,
    address,
    `0x${keyHash}`,
    web3.utils.toHex(parseInt(((new Date()).getTime() + config.sidechain.swap.expiration) / 1000))
  ).encodeABI();


  let tx = {
    data : result,
    chainId: config.sidechain.web3.networkId,
    nonce: nonce,
    gas: web3.utils.toHex(config.sidechain.contracts.actions.open.gas),
    gasPrice: web3.utils.toHex(config.sidechain.contracts.actions.open.gasPrice)
  };

  console.log(tx)

  let signed = await web3.eth.accounts.signTransaction(tx, config.sidechain.web3.privateKey); //todo replace with call to sign service


  return {
    hash: signed.messageHash,
    r: signed.r,
    s: signed.s,
    v: signed.v
  }

};