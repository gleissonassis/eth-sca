var Promise         = require('promise');
var settings        = require('../config/settings');
var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var transactionBO = dependencies.transactionBO;
  //var addressBO = dependencies.addressBO;
  var eventBO = dependencies.eventBO;
  var configurationBO = dependencies.configurationBO;
  var daemonHelper = dependencies.daemonHelper;

  return {
    dependencies: dependencies,
    isRunning: false,
    addresses: {},

    run: function() {
      var self = this;

      if (!this.isRunning) {
        self.isRunning = true;

        return this.synchronizeToBlockchain()
          .then(function() {
              self.isRunning = false;

              logger.info('[SCAWorker] A new verification will occurr in 10s');
              setTimeout(function() {
                self.run();
              }, 10 * 1000);
          });
      } else {
        logger.info('[SCAWorker] The process still running... this execution will be skiped');
      }
    },

    parseEvents: function(events) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            var p = [];

            events.forEach(function(event) {
              var newEvent = {
                address: event.address,
                blockHash: event.blockHash,
                transactionHash: event.transactionHash,
                blockNumber: event.blockNumber,
                returnValues: {},
                eventName: event.event,
                signature: event.signature,
                eventId: event.id
              };

              switch (event.event) {
                case 'Mint':
                  newEvent.returnValues.to = event.returnValues.to;
                  newEvent.returnValues.amount = event.returnValues.amount;
                  break;
                case 'Burn':
                  newEvent.returnValues.burner = event.returnValues.burner;
                  newEvent.returnValues.value = event.returnValues.value;
                  break;
                case 'Transfer':
                  newEvent.returnValues.from = event.returnValues.from;
                  newEvent.returnValues.to = event.returnValues.to;
                  newEvent.returnValues.amount = event.returnValues.amount;
                  break;
                case 'TransferPreSigned':
                  newEvent.returnValues.from = event.returnValues.from;
                  newEvent.returnValues.to = event.returnValues.to;
                  newEvent.returnValues.delegate = event.returnValues.delegate;
                  newEvent.returnValues.amount = event.returnValues.amount;
                  newEvent.returnValues.fee = event.returnValues.fee;
                  break;
                case 'BurnPreSigned':
                  newEvent.returnValues.from = event.returnValues.from;
                  newEvent.returnValues.delegate = event.returnValues.delegate;
                  newEvent.returnValues.amount = event.returnValues.amount;
                  newEvent.returnValues.fee = event.returnValues.fee;
                  break;
                default:

              }

              p.push(new Promise(function(res, rej) {
                var chain = Promise.resolve();
                var transaction = null;

                eventBO.getByEventId(event.id)
                  .then(function(r) {
                    if (!r) {
                      return chain
                        .then(function() {
                          return daemonHelper.getBlock(event.blockNumber);
                        })
                        .then(function(r) {
                          newEvent.timestamp = r.timestamp;
                          newEvent.date = new Date(r.timestamp * 1000);
                          return eventBO.save(newEvent);
                        })
                        .then(function() {
                          return daemonHelper.getTransaction(event.transactionHash);
                        })
                        .then(function(r) {
                          transaction = r;
                          return transactionBO.getByTransactionHash(transaction.hash);
                        })
                        .then(function(r) {
                          if (!r) {
                            return transactionBO.save({
                              blockHash: transaction.blockHash,
                              blockNumber: transaction.blockNumber,
                              from: transaction.from,
                              to: transaction.to,
                              value: transaction.value,
                              gas: transaction.gas,
                              gasPrice: transaction.gasPrice,
                              hash: transaction.hash,
                              input: transaction.input,
                              nonce: transaction.nonce,
                              transactionIndex: transaction.transactionIndex,
                              timestamp: newEvent.timestamp,
                              date: new Date(newEvent.timestamp * 1000)
                            });
                          }
                        });
                    } else {
                      return Promise.resolve();
                    }
                  })
                  .then(res)
                  .catch(function(e) {
                    logger.error('[SCAWorker] An error has occurred while trying to save the event', e);
                    rej(e);
                  });
                }));
            });

            return Promise.all(p);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    synchronizeToBlockchain: function() {
      var self = this;
      var chain = Promise.resolve();
      var currentBlockNumber = 0;
      var blockCount = 0;

      return new Promise(function(resolve) {
        logger.info('[SCAWorker] Starting Smart Contract Analyzer');

        return chain
          .then(function() {
            logger.info('[SCAWorker] Getting current block number');
            return configurationBO.getByKey('currentBlockNumber');
          })
          .then(function(r) {
            currentBlockNumber = parseInt(r.value);

            return daemonHelper.getBlockNumber();
          })
          .then(function(r) {
            blockCount = r;
            logger.info('[SCAWorker] The current block number is', currentBlockNumber);
            logger.info('[SCAWorker] The current block count is', blockCount);

            toBlock = currentBlockNumber + settings.daemonSettings.blocksToProcess;

            if (toBlock > blockCount) {
              toBlock = blockCount;
            }

            logger.info('[SCAWorker] Getting contracts events', currentBlockNumber, toBlock);
            return daemonHelper.getAllEvents(settings.daemonSettings.contractAddress, currentBlockNumber, toBlock);
            //logger.info('[SCAWorker] Getting contracts events', 2320527, 2327527);
            //return daemonHelper.getAllEvents(settings.daemonSettings.contractAddress, 2320527, 2327527);
          })
          .then(function(r) {
            logger.info('[SCAWorker] Parsing blockchain events', r.length);
            return self.parseEvents(r);
          })
          .then(function() {
            currentBlockNumber += settings.daemonSettings.previousBlocksToCheck;

            if (toBlock < blockCount) {
              currentBlockNumber = toBlock;
            } else {
              currentBlockNumber = blockCount;
            }

            logger.info('[SCAWorker] Updating currentBlockNumber to ', currentBlockNumber);

            return configurationBO.update({key:'currentBlockNumber', value: currentBlockNumber});
          })
          .then(function() {
            logger.info('[SCAWorker] Smart Contract Analyzer has finished this execution');
            return true;
          })
          .then(resolve)
          .catch(function(r) {
            logger.error('[SCAWorker] An error has occurred whiling synchronizing to daemon', JSON.stringify(r));
            //even if a error has occurred the process must continue
            resolve(true);
          });
      });
    }
  };
};
