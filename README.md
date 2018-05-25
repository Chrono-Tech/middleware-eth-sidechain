# middleware-eth-sidechain [![Build Status](https://travis-ci.org/ChronoBank/middleware-eth-sidechain.svg?branch=master)](https://travis-ci.org/ChronoBank/middleware-eth-sidehcain)

Middleware service for which transfer token from mainnet to sidechain and revert

### Installation

This module is a part of middleware services. You can install it in 2 ways:

1) through core middleware installer  [middleware installer](https://www.npmjs.com/package/chronobank-middleware)
2) by hands: just clone the repo, do 'npm install', set your .env - and you are ready to go

#### About
This module is used for interaction with middleware. This happens through the layer, which is built on node-red.
So, you don't need to write any code - you can create your own flow with UI tool supplied by node-red itself. Access by this route:
```
/admin
````


#### Predefined Routes with node-red flows


The available routes are listed below:

| route | methods | params | description |
| ------ | ------ | ------ | ------ |
| /mainnet/swaps/:address  | GET | ``` {address: <string>} ``` | get list swaps in mainnet(transfer from mainnet to sidechain) for selected address, select only open by field isActive, Output: [    swap_id: {Number}, isActive: {Boolean}, created: {UnixTimestamp} ]
| /mainnet/swap/obtain/:id | GET | ``` {id: <Number>} ``` | get secret key by id swap in mainnet, get in encypt form by public key user, Output [ encrypt secret key by pubkey user]
| /sidechain/swaps/:address  | GET | ``` {address: <string>} ``` | get list swaps in sidechain for selected address, select only open by field isActive, Output: [    swap_id: {Number}, isActive: {Boolean}, created: {UnixTimestamp} ]
| /sidehcain/swap/obtain/:id | GET | ``` {id: <Number>} ``` | get secret key by id swap in sidechain, get in encypt form by public key user, Output [ encrypt secret key by pubkey user]

##### сonfigure your .env

To apply your configuration, create a .env file in root folder of repo (in case it's not present already).
Below is the expamle configuration:

```
MONGO_ACCOUNTS_URI=mongodb://localhost:27017/data
MONGO_ACCOUNTS_COLLECTION_PREFIX=eth_mainnet

MONGO_DATA_URI=mongodb://localhost:27017/data
MONGO_DATA_COLLECTION_PREFIX=eth_mainnet

SIDECHAIN_MONGO_ACCOUNTS_URI=mongodb://localhost:27017/data
SIDECHAIN_MONGO_ACCOUNTS_COLLECTION_PREFIX=eth_sidechain

SIDECHAIN_MONGO_DATA_URI=mongodb://localhost:27017/data
SIDECHAIN_MONGO_DATA_COLLECTION_PREFIX=eth_sidechain

RABBIT_URI=amqp://localhost:5672
RABBIT_SERVICE_NAME=app_eth_mainnet
SIDECHAIN_RABBIT_URI=amqp://localhost:5672
SIDECHAIN_RABBIT_SERVICE_NAME=app_eth_sidechain

WEB3_URI=http://localhost:8545
WEB3_SIDECHAIN_URI=http://localhost:8546

REST_PORT=8081
USE_HTTP_SERVER=1
NODERED_AUTO_SYNC_MIGRATIONS=true
```

The options are presented below:
| name | description|
| ------ | ------ |
| MONGO_URI   | the URI string for mongo connection(mainnet)
| MONGO_COLLECTION_PREFIX   | the default prefix for all mongo collections(mainnet). The default value is 'eth'
| MONGO_ACCOUNTS_URI   | the URI string for mongo connection(mainnet), which holds users accounts (if not specified, then default MONGO_URI connection will be used)
| MONGO_ACCOUNTS_COLLECTION_PREFIX   | the collection prefix(mainnet) for accounts collection in mongo (If not specified, then the default MONGO_COLLECTION_PREFIX will be used)
| MONGO_DATA_URI   | the URI string for mongo connection(mainnet), which holds data collections (for instance, processed block's height). In case, it's not specified, then default MONGO_URI connection will be used)
| MONGO_DATA_COLLECTION_PREFIX   | the collection prefix(mainnet)  for data collections in mongo (If not specified, then the default MONGO_COLLECTION_PREFIX will be used)
| SIDECHAIN_MONGO_URI   | the URI string for mongo connection(sidechain) 
| SIDECHAIN_MONGO_COLLECTION_PREFIX   | the default prefix(sidechain)  for all mongo collections. The default value is 'eth'
| SIDECHAIN_MONGO_ACCOUNTS_URI   | the URI string for mongo connection(sidechain) , which holds users accounts (if not specified, then default MONGO_URI connection will be used)
| SIDECHAIN_MONGO_ACCOUNTS_COLLECTION_PREFIX   | the collection prefix(sidechain)  for accounts collection in mongo (If not specified, then the default MONGO_COLLECTION_PREFIX will be used)
| SIDECHAIN_MONGO_DATA_URI   | the URI string for mongo connection(sidechain) , which holds data collections (for instance, processed block's height). In case, it's not specified, then default MONGO_URI connection will be used)
| SIDECHAIN_MONGO_DATA_COLLECTION_PREFIX   | the collection prefix for data collections in mongo (sidechain) (If not specified, then the default MONGO_COLLECTION_PREFIX will be used)
| NODERED_MONGO_URI   | the URI string for mongo connection, which holds data collections (for instance, processed block's height). In case, it's not specified, then default MONGO_URI connection will be used)
| NODE_RED_MONGO_COLLECTION_PREFIX   | the collection prefix for node-red collections in mongo (If not specified, then the collections will be created without prefix)
| DOMAIN | rest plugin domain
| REST_PORT   | rest plugin port
| USE_HTTP_SERVER | use http or https server
| WEB3_SIDECHAIN_URI | uri for sidechain web3
| WEB3_URI | uri for mainnet web3
| RABBIT_URI |  uri for rabbit mq messages in mainnet
| RABBIT_SERVICE_NAME | prefix for rabbit mq messages in mainnet
| SIDEHCAIN_RABBIT_URI |  uri for rabbit mq messages in sidechain
| SIDECHAIN_RABBIT_SERVICE_NAME | prefix for rabbit mq messages in sidechain
| NETWORK   | network name (alias)- is used for connecting via ipc (see block processor section)
| SIDECHAIN_NETWORK   | network name (alias)- is used for connecting via ipc (see block processor section)
| NODERED_MONGO_URI   | the URI string for mongo collection for keeping node-red users and flows (optional, if omitted - then default MONGO_URI will be used)
| SMART_CONTRACTS_PATH   | the path to compiled smart contracts (optional, if omitted - then the default dir from node_modules will be used)
| SMART_ATOMIC_CONTRACTS_PATH | the path to compiled smart contracts atomic swap (optional, i omitted - the default dir from node_modules will be used)
| NODERED_AUTO_SYNC_MIGRATIONS   | autosync migrations on start (default = yes)


License
----
 [GNU AGPLv3](LICENSE)

Copyright
----
LaborX PTY