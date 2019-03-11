const config = require('../../config'),
  requireAll = require('require-all'),
  path = require('path'),
  fs = require('fs');


let contracts = {};
let addresses = null;

if (fs.existsSync(config.main.contracts.path) && fs.existsSync(config.main.contracts.pathAddress)) {
  let fullPath = path.isAbsolute(config.main.contracts.path) ? config.main.contracts.path :
    path.join(__dirname, '../../', config.main.contracts.path);

  contracts = requireAll({
    dirname: fullPath
  });
  addresses = require(path.join(__dirname, '../../', config.main.contracts.pathAddress));
}


module.exports = {contracts, addresses};