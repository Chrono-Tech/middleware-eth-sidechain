const models = require('../../../models'),
  txTypes = require('../../../factories/states/txTypeFactory'),
  exchangeStates = require('../../../factories/states/exchangeStatesFactory'),
  blockchainTypes = require('../../../factories/states/blockchainTypesFactory'),
  _ = require('lodash');


module.exports = async (txHash, swapId) => {

  let record = await models[blockchainTypes.main].exchangeModel.findOne({swapId});

  if (!record || _.find(record.actions, {type: txTypes.REISSUE_ASSET}))
    return;


  record.status = exchangeStates.RESERVED;

  record.actions.push({
    txHash: txHash,
    type: txTypes.REISSUE_ASSET
  });

  await record.save();

};