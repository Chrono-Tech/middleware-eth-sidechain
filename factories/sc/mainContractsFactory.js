const config = require('../../config'),
  requireAll = require('require-all'),
  fs = require('fs');


let contracts = {};

if (fs.existsSync(config.main.contracts.path))
  contracts = requireAll({
    dirname: config.main.contracts.path
  });


module.exports = contracts;