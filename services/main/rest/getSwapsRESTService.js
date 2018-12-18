/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const exchangeModel = require('../../../models/exchangeModel'),
  _ = require('lodash');

/**
 * @function
 * @description add new keys for client
 * @param req - request object
 * @param res - response object
 * @return {Promise<*>}
 */
module.exports = async (req, res) => {

  let swaps = await exchangeModel.find({ //todo implement skip and limit
    address: req.params.address.toLowerCase()
  });


  swaps = swaps.map(swap => _.pick(swap, ['swapId', 'txHash', 'status', 'created']));

  res.send(swaps);

};
