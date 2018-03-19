var Promise         = require('promise');
var logger          = require('../config/logger');

module.exports = function(dependencies, autoRun) {
  var transactionBO = dependencies.transactionBO;
  var configurationBO = dependencies.configurationBO;
  var daemonHelper = dependencies.daemonHelper;
  var addressBO = dependencies.addressBO;

  return {
    dependencies: dependencies,
    autoRun: autoRun,

    run: function() {
      return this.synchronizeToBlockChain();
    },

    _parseTransactionsFromDaemon: function(r) {
      if (r.error) {
        logger.error('An error has occurred getting transactions. This verification will be skiped',
          JSON.stringify(r.error));

        if (r.error.code === -32000) { //Requested object not found
          flagObjectNotFound = true;
        }

        return Promise.resolve(false);
      } else {
        logger.info('Total of blockchain transactions', r.result.items.length);

        var p = [];
        for (var i = 0; i < r.result.items.length; i++) {
          logger.info('Parsing the transaction block ', r.result.items[i].blockHash);
          p.push(this._parseBlockHash(r.result.items[i]));
        }

        logger.info('Returning promises', p.length);
        return Promise.all(p);
      }
    },

    _getConfigurations: function() {
      var p = [];

      logger.info('Getting configurations from database');
      p.push(configurationBO.getByKey('currentBlockIndex'));
      p.push(configurationBO.getByKey('defaultTransactionsBlockCount'));

      return Promise.all(p);
    },

    _parseBlockHash: function(blockHash) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        return chain
          .then(function() {
            var p = [];
            logger.info('Block hash transactions ', blockHash.transactions.length);
            for (var i = 0; i < blockHash.transactions.length; i++) {
              logger.info('Parsing transaction ', JSON.stringify(blockHash.transactions[i]));
              p.push(transactionBO.parseTransaction(blockHash.transactions[i]));
            }

            logger.info('Returning promises ', p.length);
            return Promise.all(p);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    _parseUnconfirmedTransactions: function() {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.info('Getting unconfirmed transactions from daemon');
            return daemonHelper.getUnconfirmedTransactionHashes();
          })
          .then(function(r) {
            var p = [];
            var transactionHashes = r.result.transactionHashes;

            logger.info('Unconfirmed transaction hashes returned', JSON.stringify(transactionHashes));

            for (var i = 0; i < transactionHashes.length; i++) {
              p.push(daemonHelper.getTransaction(transactionHashes[i]));
            }

            return Promise.all(p);
          })
          .then(function(r) {
            var p = [];
            var transaction = null;

            logger.info('Parsing unconfirmed transaction and storing at database', r.length);

            for (var i = 0; i < r.length; i++) {
              transaction = r[i].result.transaction;

              logger.info('Parsing transaction ', JSON.stringify(transaction));
              p.push(transactionBO.parseTransaction(transaction));
            }

            return Promise.all(p);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    _confirmTransactions: function(currentBlockIndex) {
      var minimumConfirmations = 0;

      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.info('Getting minimumConfirmations configuration from database', currentBlockIndex);
            return configurationBO.getByKey('minimumConfirmations');
          })
          .then(function(r) {
            minimumConfirmations = r.value;
            return;
          })
          .then(function() {
            logger.info('Getting status from daemon to verify if the currentBlockIndex is valid', currentBlockIndex);
            return daemonHelper.getTransactions(currentBlockIndex, 1);
          })
          .then(function(r) {
            if (r.error) {
              logger.info('The currentBlockIndex is not valid yet, so its value will be decremented',
                currentBlockIndex - 1);
              return currentBlockIndex - 1;
            } else {
              logger.info('The currentBlockIndex value is valid', currentBlockIndex);
              return currentBlockIndex;
            }
          })
          .then(function() {
            logger.info('Updating all transactions above than the specified blockIndex to confirmed',
            JSON.stringify({
              currentBlockIndex: currentBlockIndex,
              minimumConfirmations: minimumConfirmations,
              confirmedBlockIndex: currentBlockIndex - minimumConfirmations
            }));
            return transactionBO.updateIsConfirmedFlag(currentBlockIndex - minimumConfirmations);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    synchronizeToBlockChain: function() {
      var self = this;
      var chain = Promise.resolve();
      var currentBlockIndex = null;
      var defaultTransactionsBlockCount = null;
      var nextBlockIndex = 0;
      var blockCount = 0;
      var flagUpdateBalance = false;
      var flagObjectNotFound = false;

      return new Promise(function(resolve) {
        logger.info('Starting Blockchain Observer Service');

        return chain
          .then(function() {
            return self._getConfigurations();
          })
          .then(function(r) {
            logger.info(JSON.stringify(r));

            currentBlockIndex = parseInt(r[0].value);
            defaultTransactionsBlockCount = parseInt(r[1].value);

            return r;
          })
          .then(function() {
            logger.info('Parsing unconfirmed transactions from daemon');
            return self._parseUnconfirmedTransactions();
          })
          .then(function(r) {
            if (r.length) {
              logger.info('There is unconfirmed transactions hases. The wallet balance must be updated');
              flagUpdateBalance = true;
            }

            logger.info('Getting status from daemon');
            return daemonHelper.getStatus();
          })
          .then(function(r) {
            if (r.error) {
              logger.error('An error has occurred while trying to get status from daemon', JSON.stringify(r));

              throw {
                status: 500,
                error: r.error,
                message: 'Daemon is not availabe'
              };
            } else {
              logger.info('Current blockCount', r.result.blockCount);
              blockCount = r.result.blockCount;

              logger.info('Getting block chain transactions', currentBlockIndex, defaultTransactionsBlockCount);
              return daemonHelper.getTransactions(currentBlockIndex, defaultTransactionsBlockCount);
            }
          })
          .then(function(r) {
            return self._parseTransactionsFromDaemon(r);
          })
          .then(function(r) {
            if (!r) {
              flagObjectNotFound = true;
            }

            nextBlockIndex = currentBlockIndex + defaultTransactionsBlockCount - 1;

            if (nextBlockIndex > blockCount) {
              nextBlockIndex = blockCount;
            }

            logger.debug('currentBlockIndex ', currentBlockIndex);
            logger.debug('nextBlockIndex ', nextBlockIndex);

            if (nextBlockIndex > currentBlockIndex) {
              flagUpdateBalance = true;
              return configurationBO.update({
                key: 'currentBlockIndex',
                value: nextBlockIndex
              });
            } else {
              return;
            }
          })
          .then(function() {
            if (flagUpdateBalance) {
              logger.info('Updating wallet balance');
              return addressBO.updateWalletBalance();
            } else {
              logger.info('It is unnecessary update the addresses balance');
              return Promise.resolve();
            }
          })
          .then(function() {
            logger.info('Performing confirmating transaction process');
            return self._confirmTransactions(currentBlockIndex);
          })
          .then(function() {
            if (self.autoRun) {
              if (nextBlockIndex < blockCount && !flagObjectNotFound) {
                logger.info('There is more block hases...');
                return self.synchronizeToBlockChain();
              } else {
                logger.info('There is no more block hases. A new verification will occurr in 10s');
                setTimeout(function() {
                  self.synchronizeToBlockChain();
                }, 10 * 1000);
              }
            }

            logger.info('Blockchain Observer Service has finished this execution');

            return true;
          })
          .then(resolve)
          .catch(function(r) {
            logger.error('An error has occurred whiling synchronizing to daemon', JSON.stringify(r));

            if (self.autoRun) {
              logger.info('A new verification will occurr in 10s');
              setTimeout(function() {
                self.synchronizeToBlockChain();
              }, 10 * 1000);
            }

            //even if a error has occurred the process must continue
            resolve(true);
          });
      });
    }
  };
};