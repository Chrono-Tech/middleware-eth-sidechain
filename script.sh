#!/bin/bash

ganache-cli  --networdId="testnet" --port="8545" --account="0xb7616111ee3c709ff907777d25b863d15109494a240d39c4f0b51fdb5245e99b,100000000000000000000"
ganache-cli  --networdId="testnet1" --port="8546" --account="0xb7616111ee3c709ff907777d25b863d15109494a240d39c4f0b51fdb5245e99b,100000000000000000000"

BUILD_DIR=`pwd`


cd $BUILD_DIR/node_modules/chronobank-smart-contracts
rm -rf migrations
mv migrations_dev migrations
npm i 
cp $BUILD_DIR/tests/node/truffle_8545.js truffle.js
node --max_old_space_size=8000 $BUILD_DIR/node_modules/truffle/build/cli.bundled.js migrate
cp $BUILD_DIR/tests/node/truffle_8546.js truffle.js
node --max_old_space_size=8000 $BUILD_DIR/node_modules/truffle/build/cli.bundled.js migrate

cd $BUILD_DIR/node_modules/chronobank-smart-contracts-atomic-swap
npm i 
cp $BUILD_DIR/tests/node/truffle_8545.js truffle.js
node --max_old_space_size=8000 $BUILD_DIR/node_modules/truffle/build/cli.bundled.js migrate
cp $BUILD_DIR/tests/node/truffle_8546.js truffle.js
node --max_old_space_size=8000 $BUILD_DIR/node_modules/truffle/build/cli.bundled.js migrate

cd $BUILD_DIR
git clone  git@github.com:chronobank/middleware-eth-blockprocessor.git
cd $BUILD_DIR/middleware-eth-blockprocessor
git checkout develop
npm i
cd $BUILD_DIR/middleware-eth-blockprocessor
RABBIT_SERVICE_NAME="app_eth_8545" MONGO_DATA_COLLECTION_PREFIX="eth_8545" MONGO_ACCOUNTS_COLLECTION_PREFIX="eth_8545"  WEB3_URI="http://localhost:8545" pm2 start index.js --name="blockprocessor_8545"
RABBIT_SERVICE_NAME="app_eth_8546" MONGO_DATA_COLLECTION_PREFIX="eth_8546" MONGO_ACCOUNTS_COLLECTION_PREFIX="eth_8546"  WEB3_URI="http://localhost:8546" pm2 start index.js --name="blockprocessor_8546"

cd $BUILD_DIR
git clone  git@github.com:cloudkserg/middleware-eth-chrono-sc-processor.git
git checkout develop
cd $BUILD_DIR/middleware-eth-chrono-sc-processor
npm i
cd $BUILD_DIR/middleware-eth-chrono-sc-processor/node_modules/chronobank-smart-contracts
npm i
node --max_old_space_size=8000 $BUILD_DIR/node_modules/truffle/build/cli.bundled.js compile
cd $BUILD_DIR
RABBIT_SERVICE_NAME="app_eth_8545" MONGO_DATA_COLLECTION_PREFIX="eth_8545" MONGO_ACCOUNTS_COLLECTION_PREFIX="eth_8545"  WEB3_URI="http://localhost:8545" pm2 start index.js --name="chrono_sc_processor_8545"
RABBIT_SERVICE_NAME="app_eth_8546" MONGO_DATA_COLLECTION_PREFIX="eth_8546" MONGO_ACCOUNTS_COLLECTION_PREFIX="eth_8546"  WEB3_URI="http://localhost:8546" pm2 start index.js --name="chrono_sc_processor_8546"

