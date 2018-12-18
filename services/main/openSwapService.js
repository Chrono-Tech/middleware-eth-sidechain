const models = require('../../models'),
  exchangeStates = require('../../factories/states/exchangeStatesFactory'),
  txTypes = require('../../factories/states/txTypeFactory'),
  uniqid = require('uniqid'),
  config = require('../../config'),
  Web3 = require('web3'),
  web3 = new Web3(),
  _ = require('lodash'),
  contracts = require('../../factories/sc/sidechainCotractsFactory'),
  crypto = require('crypto');


module.exports = async (txHash, value, address) => {

  let record = await models.exchangeModel.findOne({txHash});

  if (record)
    return;

  if (!record) {

    let key = uniqid(); //todo replace with normal generation function
    let swapId = uniqid();

    record = new models.exchangeModel({
      key: key,
      address: address.toLowerCase(),
      swapId: swapId,
      txHash: txHash,
      status: exchangeStates.OPENED,
      actions: []
    });

    await record.save();
  }


  const keyHash = crypto.createHash('sha256').update(record.key).digest('hex');

  const platform = new web3.eth.Contract(contracts.ChronoBankPlatform.abi, _.get(contracts.ChronoBankPlatform, `networks.${networkId}.address`));
  const swapContract = new web3.eth.Contract(contracts.AtomicSwapERC20.abi, _.get(contracts.AtomicSwapERC20, `networks.${networkId}.address`));

  if (!_.find(record.actions, {type: txTypes.REISSUE_ASSET})) {
    let result = platform.methods.reissueAsset(web3.utils.asciiToHex(config.sidechain.web3.symbol), value).encodeABI();

    record.actions.push({
      type: txTypes.REISSUE_ASSET,
      data: result
    })
  }

  const erc20 = new web3.eth.Contract(contracts.ERC20Interface.abi, config.sidechain.web3.symbolAddress);

  if (!_.find(record.actions, {type: txTypes.APPROVE})) {
    let result = erc20.methods.approve(swapContract.options.address, value).encodeABI();
    record.actions.push({
      type: txTypes.APPROVE,
      result: result
    })
  }


  if (!_.find(record.actions, {type: txTypes.OPEN})) {
    let result = swapContract.methods.open(
      web3.utils.asciiToHex(record.swapId),
      value,
      config.sidechain.web3.symbolAddress,
      address,
      `0x${keyHash}`,
      web3.utils.toHex(parseInt(((new Date()).getTime() + config.sidechain.swap.expiration) / 1000))
    ).encodeABI();

    record.actions.push({
      type: txTypes.OPEN,
      result: result
    })
  }


  await record.save();

};