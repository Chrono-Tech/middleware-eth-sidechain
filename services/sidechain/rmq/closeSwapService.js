const models = require('../../../models'),
  Web3 = require('web3'),
  web3 = new Web3(),
  _ = require('lodash'),
  exchangeStates = require('../../../factories/states/exchangeStatesFactory'),
  txTypes = require('../../../factories/states/txTypeFactory'),
  blockchainTypes = require('../../../factories/states/blockchainTypesFactory');


module.exports = async (txHash, swapId) => {

  let decodedSwapId = web3.utils.hexToAscii(swapId).replace(/\0.*$/g,'');

  let record = await models[blockchainTypes.main].exchangeModel.findOne({swapId: decodedSwapId});

  if (!record)
    return;

  let closeAction = _.find(record.actions, {type: txTypes.CLOSE});

  if (_.has(closeAction, 'txHash'))
    return;

  if (closeAction) {
    closeAction.txHash = txHash;
  } else {
    record.actions.push({
      txHash: txHash,
      type: txTypes.CLOSE
    });
  }

  record.status = exchangeStates.CLOSED;

  await record.save();

};