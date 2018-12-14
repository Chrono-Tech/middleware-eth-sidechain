const config = require('../../config'),
  requireAll = require('require-all'),
  fs = require('fs');


let contracts = {};

if (fs.existsSync(config.sidechain.contracts.path))
  contracts = requireAll({
    dirname: config.sidechain.contracts.path
  });


module.exports = contracts;