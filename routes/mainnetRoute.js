/**
 * Copyright 2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const getSwapsRESTService = require('../services/main/rest/getSwapsRESTService'),
  getSigRESTService = require('../services/main/rest/getSigRESTService'),
  logActionMiddleware = require('../middleware/logActionMiddleware');

module.exports = (router) => {

  router.get('/swaps/:address', logActionMiddleware, getSwapsRESTService);

  router.post('/swaps/:swap_id/signature', logActionMiddleware, getSigRESTService)

};
