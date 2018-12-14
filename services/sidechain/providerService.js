/**
 * Copyright 2017–2018, LaborX PTY
 * Licensed under the AGPL Version 3 license.
 * @author Egor Zuev <zyev.egor@gmail.com>
 */

const config = require('../../config'),
  Web3 = require('web3'),
  net = require('net'),
  _ = require('lodash'),
  providerServiceInterface = require('middleware-common-components/interfaces/blockProcessor/providerServiceInterface'),
  AbstractProvider = require('middleware-common-components/abstract/universal/AbstractProvider');

/**
 * @service
 * @description the service for handling connection to node
 * @returns Object<ProviderService>
 */

class ProviderService extends AbstractProvider {

  constructor () {
    super();
  }


  makeWeb3FromProviderURI (providerURI) {

    if (/^http/.test(providerURI) || /^ws/.test(providerURI))
      return new Web3(providerURI);

    providerURI = `${/^win/.test(process.platform) ? '\\\\.\\pipe\\' : ''}${providerURI}`;
    return new Web3(providerURI, net);
  }

  /** @function
   * @description reset the current connection
   */
  async resetConnector () {
    if (_.has(this.connector, 'currentProvider.connection.close'))
      this.connector.currentProvider.connection.close();
    this.switchConnector();
  }


  /**
   * @function
   * @description start listen for provider updates from block processor
   * @private
   */
  _startListenProviderUpdates () {

    this.rabbitmqChannel.consume(`${config.sidechain.rabbit.serviceName}_provider.${this.id}`, async (message) => {
      message = JSON.parse(message.content.toString());
      const providerURI = config.sidechain.web3.providers[message.index];


      const fullProviderURI = !/^http/.test(providerURI) ? `${/^win/.test(process.platform) ? '\\\\.\\pipe\\' : ''}${providerURI}` : providerURI;
      const currentProviderURI = this.connector ? this.connector.currentProvider.path || this.connector.currentProvider.host : '';

      if (currentProviderURI === fullProviderURI)
        return this.events.emit('provider_set');

      this.connector = this.makeWeb3FromProviderURI(providerURI);

      if (_.get(this.connector.currentProvider, 'connection')) {

        if (_.has(this.connector.currentProvider.connection, 'onerror')) {
          this.connector.currentProvider.connection.onerror(() => this.resetConnector());
          this.connector.currentProvider.connection.onclose(() => this.resetConnector());
        } else if (_.has(this.connector.currentProvider.connection, 'on')) {
          this.connector.currentProvider.connection.on('end', () => this.resetConnector());
          this.connector.currentProvider.connection.on('error', () => this.resetConnector());
        }


      } else
        this.pingIntervalId = setInterval(async () => {

          const isConnected = await this.connector.eth.getProtocolVersion().catch(() => null);

          if (!isConnected) {
            clearInterval(this.pingIntervalId);
            this.resetConnector();
          }
        }, 5000);

      this.events.emit('provider_set');
    }, {noAck: true});

  }

}

module.exports = providerServiceInterface(new ProviderService());
