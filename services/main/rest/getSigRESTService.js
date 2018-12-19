/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const exchangeModel = require('../../../models/exchangeModel'),
  txTypes = require('../../../factories/states/txTypeFactory'),
  swapMessages = require('../../../factories/messages/swapMessages'),
  blockchainTypes = require('../../../factories/states/blockchainTypesFactory'),
  EthCrypto = require('eth-crypto'),
  models = require('../../../models'),
  encodeABIOpenSwap = require('../../../utils/encode/sidechain/encodeABIOpenSwap'),
  _ = require('lodash');

/**
 * @function
 * @description add new keys for client
 * @param req - request object
 * @param res - response object
 * @return {Promise<*>}
 */
module.exports = async (req, res) => {

  if (!Object.values(txTypes).includes(req.body.txType))
    res.send(swapMessages.wrongTxType);


  let swap = await models[blockchainTypes.main].exchangeModel.findOne({
    swapId: req.params.swap_id
  });

  if (!swap)
    return res.send(swapMessages.swapNotFound);

  if (req.body.txType === txTypes.OPEN) {

    let openAction = _.find(swap.actions, {type: txTypes.OPEN});
    let lastTx = await models[blockchainTypes.sidechain].txModel.find().sort({blockNumber: -1, index: -1}).limit(1);
    lastTx = lastTx[0];

    if (openAction) {
      let executedTx = await models[blockchainTypes.sidechain].txModel.count({_id: openAction.hash});

      if (executedTx)
        return res.send(swapMessages.txOpenExecuted);//todo

      if (lastTx && openAction.nonce > lastTx.nonce)
        return res.send({
          signature: openAction.signature
        })
    }

    let nonce = lastTx ? lastTx.nonce + 1 : 0;
    let result = await encodeABIOpenSwap(swap.swapId, swap.key, nonce, swap.value, swap.address);

    if (openAction)
      swap.actions = _.reject(swap.actions, {type: txTypes.OPEN});

    let action = {
      type: txTypes.OPEN,
      signature: {
        r: result.r,
        s: result.s,
        v: result.v
      },
      hash: result.hash
    };

    swap.actions.push(action);

    return res.send({signature: action.signature});
  }


  res.send(payload);

};
