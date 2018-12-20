/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const exchangeStates = require('../../../factories/states/exchangeStatesFactory'),
  swapMessages = require('../../../factories/messages/swapMessages'),
  blockchainTypes = require('../../../factories/states/blockchainTypesFactory'),
  models = require('../../../models'),
  EthCrypto = require('eth-crypto'),
  _ = require('lodash');

/**
 * @function
 * @description add new keys for client
 * @param req - request object
 * @param res - response object
 * @return {Promise<*>}
 */
module.exports = async (req, res) => {

  let swap = await models[blockchainTypes.main].exchangeModel.findOne({
    swapId: req.params.swap_id,
    status: exchangeStates.OPENED
  });

  if (!swap)
    return res.send(swapMessages.swapNotFound);

  if(!req.body.pubKey)
    return res.send(swapMessages.wrongParams);

  const address = EthCrypto.publicKey.toAddress(req.body.pubKey);

  if(swap.address !== address.toLowerCase())
    return res.send(swapMessages.wrongParams);


  const encrypted = await EthCrypto.encryptWithPublicKey(req.body.pubKey, swap.key);

  return res.send(encrypted);

};
