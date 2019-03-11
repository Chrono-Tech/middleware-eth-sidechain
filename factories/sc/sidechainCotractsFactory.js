const config = require('../../config'),
  requireAll = require('require-all'),
  path = require('path'),
  fs = require('fs');


let contracts = {};
let addresses = null;

if (fs.existsSync(config.sidechain.contracts.path) && fs.existsSync(config.sidechain.contracts.pathAddress)) {
  let fullPath = path.isAbsolute(config.sidechain.contracts.path) ? config.sidechain.contracts.path :
    path.join(__dirname, '../../', config.sidechain.contracts.path);

  contracts = requireAll({
    dirname: fullPath
  });
  addresses = require(path.join(__dirname, '../../', config.sidechain.contracts.pathAddress));
}


module.exports = {contracts, addresses};