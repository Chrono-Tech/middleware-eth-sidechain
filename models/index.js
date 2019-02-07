const requireAll = require('require-all'),
  blockchainTypes = require('../factories/states/blockchainTypesFactory'),
  models = requireAll({
    dirname: __dirname,
    filter: /(.+Model)\.js$/
  });

/** @function
 * @description prepare (init) the mongoose models
 *
 */

const init = (mainConnection, sidechainConnection) => {

  ctx[blockchainTypes.main] = {};
  ctx[blockchainTypes.sidechain] = {};

  for (let modelName of Object.keys(models)) {
    ctx.main[modelName] = models[modelName](mainConnection, blockchainTypes.main);
    ctx.sidechain[modelName] = models[modelName](sidechainConnection, blockchainTypes.sidechain);
  }

};

const ctx = {
  init: init
};

/** @factory
 * @return {{init: init, ...Models}}
 */

module.exports = ctx;
