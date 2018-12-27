const models = require('../../../models'),
  exchangeStates = require('../../../factories/states/exchangeStatesFactory'),
  txTypes = require('../../../factories/states/txTypeFactory'),
  blockchainTypes = require('../../../factories/states/blockchainTypesFactory'),
  uniqid = require('uniqid');


module.exports = async (txHash, symbol, address, value) => {

  let record = await models[blockchainTypes.sidechain].exchangeModel.findOne({'actions.txHash': txHash});

  if (record)
    return;

  if (!record) {

    let key = uniqid(); //todo replace with normal generation function
    let swapId = uniqid();

    record = new models[blockchainTypes.sidechain].exchangeModel({
      key: key,
      address: address.toLowerCase(),
      value: value,
      swapId: swapId,
      status: exchangeStates.OPENED,
      actions: [{
        txHash: txHash,
        type: txTypes.REVOKE
      }]
    });

    await record.save();
  }

};