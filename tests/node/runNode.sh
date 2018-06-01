#!/bin/bash

cd ../
BUILD_DIR=`pwd`

PORT=$1
SIDECHAIN=$2

if [[ "$PORT" = "" ]]
then 
    echo "./runNode.sh port [sidechain,mainnet]"
    exit
fi

#init ganache on port with 3 accounts
ganache-cli  --port="$PORT"  \
    --account="0xb7616111ee3c709ff907777d25b863d15109494a240d39c4f0b51fdb5245e99b,100000000000000000000" \
    --account="0x7738bb0816358bd3847f940b95d763d94082c51059ae755b667b9ec9c7a3e28c,0" \
    --account="0x2897c2af6f3e291a89fcef259df0a2192b52b0f68d5bccbbdccada5f14127623,100000000000000000000" 2> /dev/null &

#deploy chronobank smart contracts on mainnet
if [[ "$SIDECHAIN" = "mainnet"]]
then
    cd $BUILD_DIR
    git clone https://github.com/ChronoBank/LXsidechain-sc.git node_modules/chronobank-smart-contracts
    git checkout develop
    cd $BUILD_DIR/node_modules/chronobank-smart-contracts
    npm i 
    cat $BUILD_DIR/tests/node/truffle.js | sed -e "s/port: 8545/port: $PORT/g" > truffle.js
    node --max_old_space_size=8000 $BUILD_DIR/node_modules/truffle/build/cli.bundled.js migrate
#deploy chronobank smart contracts on sidechain    
else
    cd $BUILD_DIR/node_modules/chronobank-smart-contracts-atomic-swap
    npm i 
    cat $BUILD_DIR/tests/node/truffle.js | sed -e "s/port: 8545/port: $PORT/g" > truffle.js
    node --max_old_space_size=8000 $BUILD_DIR/node_modules/truffle/build/cli.bundled.js migrate
fi

#install blockprocessor
cd $BUILD_DIR
git clone  git@github.com:chronobank/middleware-eth-blockprocessor.git
cd $BUILD_DIR/middleware-eth-blockprocessor
git checkout develop
npm i
cd $BUILD_DIR/middleware-eth-blockprocessor

#init blockprocessor
RABBIT_SERVICE_NAME="app_eth_$MAINNET" MONGO_DATA_COLLECTION_PREFIX="eth_$MAINNET" \
    MONGO_ACCOUNTS_COLLECTION_PREFIX="eth_$MAINNET"  WEB3_URI="http://localhost:$PORT" \
    pm2 start index.js --name="blockprocessor_$MAINNET"

#install chrono-sc-processor
cd $BUILD_DIR
git clone  git@github.com:cloudkserg/middleware-eth-chrono-sc-processor.git
cd $BUILD_DIR/middleware-eth-chrono-sc-processor
git checkout develop
npm i

# init chrono-sc-processor
if [[ "$SIDECHAIN" = "mainnet"]]
then
    RABBIT_SERVICE_NAME="app_eth_$MAINNET" MONGO_DATA_COLLECTION_PREFIX="eth_$MAINNET" \
    MONGO_ACCOUNTS_COLLECTION_PREFIX="eth_$MAINNET" MONGO_ACCOUNTS_COLLECTION_PREFIX="eth_$MAINNET" \
    WEB3_URI="http://localhost:$PORT" \
    SMART_CONTRACTS_PATH="$BUILD_DIR/node_modules/chronobank-smart-contracts/build/contracts" \
    pm2 start index.js --name "chrono_$MAINNET"
else 
    RABBIT_SERVICE_NAME="app_eth_$MAINNET" MONGO_DATA_COLLECTION_PREFIX="eth_$MAINNET" \
    MONGO_ACCOUNTS_COLLECTION_PREFIX="eth_$MAINNET" MONGO_ACCOUNTS_COLLECTION_PREFIX="eth_$MAINNET" \
    WEB3_URI="http://localhost:$PORT" \
    SMART_CONTRACTS_PATH="$BUILD_DIR/node_modules/chronobank-smart-contracts-atomic-swap/build/contracts" \
    pm2 start index.js --name "chrono_$MAINNEt"
fi

