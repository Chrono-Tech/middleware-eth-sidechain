/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const getSwapsRESTService = require('../services/sidechain/rest/getSwapsRESTService'),
  getSigUnlockRESTService = require('../services/sidechain/rest/getSigUnlockRESTService'),
  getSigKeyRESTService = require('../services/sidechain/rest/getSigKeyRESTService'),
  logActionMiddleware = require('../middleware/logActionMiddleware');


module.exports = (router) => {

  router.get('/swaps/:address', logActionMiddleware, getSwapsRESTService);

  router.post('/swaps/:swap_id/signature/unlock', logActionMiddleware, getSigUnlockRESTService);

  router.post('/swaps/:swap_id/key', logActionMiddleware, getSigKeyRESTService);

};
