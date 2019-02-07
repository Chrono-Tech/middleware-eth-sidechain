const models = require('../../../models'),
  Web3 = require('web3'),
  web3 = new Web3(),
  txTypes = require('../../../factories/states/txTypeFactory'),
  exchangeStates = require('../../../factories/states/exchangeStatesFactory'),
  blockchainTypes = require('../../../factories/states/blockchainTypesFactory'),
  _ = require('lodash');


module.exports = async (txHash, swapId) => {

  let decodedSwapId = web3.utils.hexToAscii(swapId).replace(/\0.*$/g,'');

  let record = await models[blockchainTypes.main].exchangeModel.findOne({swapId: decodedSwapId});

  if (!record)
    return;

  let reissueAction = _.find(record.actions, {type: txTypes.REISSUE_ASSET});

  if (_.has(reissueAction, 'txHash'))
    return;

  if (reissueAction) {
    reissueAction.txHash = txHash;
  } else {
    record.actions.push({
      txHash: txHash,
      type: txTypes.REISSUE_ASSET
    });
  }

  record.status = exchangeStates.RESERVED;

  await record.save();
};