#!/bin/bash

ganache-cli  --port="8545" --account="0xb7616111ee3c709ff907777d25b863d15109494a240d39c4f0b51fdb5245e99b,100000000000000000000"
ganache-cli  --port="8546" --account="0xb7616111ee3c709ff907777d25b863d15109494a240d39c4f0b51fdb5245e99b,100000000000000000000"

BUILD_DIR=`pwd`


cd $BUILD_DIR
git clone https://github.com/ChronoBank/LXsidechain-sc.git node_modules/chronobank-smart-contracts
git checkout develop
cd $BUILD_DIR/node_modules/chronobank-smart-contracts
npm i 
cp $BUILD_DIR/tests/node/truffle_8545.js truffle.js
node --max_old_space_size=8000 $BUILD_DIR/node_modules/truffle/build/cli.bundled.js migrate

cd $BUILD_DIR/node_modules/chronobank-smart-contracts-atomic-swap
npm i 
cp $BUILD_DIR/tests/node/truffle_8546.js truffle.js
node --max_old_space_size=8000 $BUILD_DIR/node_modules/truffle/build/cli.bundled.js migrate

cd $BUILD_DIR
git clone  git@github.com:chronobank/middleware-eth-blockprocessor.git
cd $BUILD_DIR/middleware-eth-blockprocessor
git checkout develop
npm i
cd $BUILD_DIR/middleware-eth-blockprocessor
RABBIT_SERVICE_NAME="app_eth" MONGO_DATA_COLLECTION_PREFIX="eth" MONGO_ACCOUNTS_COLLECTION_PREFIX="eth"  WEB3_URI="http://localhost:8545" pm2 start index.js --name="blockprocessor_8545"
RABBIT_SERVICE_NAME="app_eth_sidechain" MONGO_DATA_COLLECTION_PREFIX="eth_sidechain" MONGO_ACCOUNTS_COLLECTION_PREFIX="eth_sidechain"  WEB3_URI="http://localhost:8546" pm2 start index.js --name="blockprocessor_8546"

cd $BUILD_DIR
git clone  git@github.com:cloudkserg/middleware-eth-chrono-sc-processor.git
cd $BUILD_DIR/middleware-eth-chrono-sc-processor
git checkout develop
npm i
RABBIT_SERVICE_NAME="app_eth" MONGO_DATA_COLLECTION_PREFIX="eth" MONGO_ACCOUNTS_COLLECTION_PREFIX="eth" MONGO_ACCOUNTS_COLLECTION_PREFIX="eth"  WEB3_URI="http://localhost:8545" SMART_CONTRACTS_PATH="$BUILD_DIR/node_modules/chronobank-smart-contracts/build/contracts" pm2 start index.js --name "chrono_8545"
RABBIT_SERVICE_NAME="app_eth_sidechain" MONGO_DATA_COLLECTION_PREFIX="eth_sidechain" MONGO_ACCOUNTS_COLLECTION_PREFIX="eth_sidechain"  WEB3_URI="http://localhost:8546" SMART_CONTRACTS_PATH="$BUILD_DIR/node_modules/chronobank-smart-contracts/build/contracts" pm2 start index.js --name "chrono_8546"

