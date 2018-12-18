/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const exchangeModel = require('../../../models/exchangeModel'),
  swapMessages = require('../../../factories/messages/swapMessages'),
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

  let swap = await exchangeModel.findOne({
    swapId: req.params.swap_id
  });

  if (!swap)
    return res.send(swapMessages.swapNotFound);

  const address = EthCrypto.publicKey.toAddress(req.body.pubkey).toLowerCase();


  if (swap.address !== address)
    return res.send(swapMessages.wrongAddress);


  const payload = await EthCrypto.encryptWithPublicKey(req.body.pubkey, swap.key);

  res.send(payload);

};
