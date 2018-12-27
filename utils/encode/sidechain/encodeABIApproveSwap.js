const config = require('../../../config'),
  Web3 = require('web3'),
  web3 = new Web3(),
  _ = require('lodash'),
  contracts = require('../../../factories/sc/sidechainCotractsFactory');

module.exports = async (value, nonce) => {

  const swapContractAddress = _.get(contracts.AtomicSwapERC20, `networks.${config.sidechain.web3.networkId}.address`);
  const erc20 = new web3.eth.Contract(contracts.ERC20Interface.abi, config.sidechain.web3.symbolAddress);
  let result = erc20.methods.approve(swapContractAddress, value).encodeABI();

  let tx = {
    to: config.sidechain.web3.symbolAddress,
    data : result,
    chainId: web3.utils.numberToHex(config.sidechain.web3.networkId),
    nonce: web3.utils.numberToHex(nonce),
    gas: web3.utils.toHex(config.sidechain.contracts.actions.approve.gas),
    gasPrice: web3.utils.toHex(config.sidechain.contracts.actions.approve.gasPrice)
  };

  let signed = await web3.eth.accounts.signTransaction(tx, config.sidechain.web3.privateKey); //todo replace with call to sign service

  return {
    hash: signed.messageHash,
    r: signed.r,
    s: signed.s,
    v: signed.v
  }

};