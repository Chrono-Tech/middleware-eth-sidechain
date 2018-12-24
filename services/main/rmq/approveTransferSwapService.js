const models = require('../../../models'),
  Web3 = require('web3'),
  web3 = new Web3(),
  config = require('../../../config'),
  txTypes = require('../../../factories/states/txTypeFactory'),
  exchangeStates = require('../../../factories/states/exchangeStatesFactory'),
  blockchainTypes = require('../../../factories/states/blockchainTypesFactory'),
  _ = require('lodash');


module.exports = async (txHash, from, spender, value) => {

  let account = web3.accounts.privateKeyToAccount(config.sidechain.web3.privateKey);

  if(from.toLowerCase() !== account.address.toLowerCase())
    return;

  let record = await models[blockchainTypes.main].exchangeModel.findOne({
    value: value //todo fix - ask to provide swap id or other stuff
  });

  if (!record)
    return;

  let approveAction = _.find(record.actions, {type: txTypes.APPROVE});

  if (_.has(approveAction, 'txHash'))
    return;

  if (reissueAction) {
    reissueAction.txHash = txHash;
  } else {
    record.actions.push({
      txHash: txHash,
      type: txTypes.APPROVE
    });
  }

  record.status = exchangeStates.RESERVED;

  await record.save();
};