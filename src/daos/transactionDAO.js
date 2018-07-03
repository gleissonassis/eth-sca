var logger              = require('winston');
var model               = require('../models/transaction')();
var $                   = require('mongo-dot-notation');

module.exports = function() {
  var projectionCommonFields = {
    __v: false
  };

  return {
    clear: function() {
      return new Promise(function(resolve, reject) {
        model.remove({}, function(err) {
          if (err) {
            logger.error('[TransactionDAO] An error has occurred while deleting all transactions', error);
            reject(err);
          } else {
            logger.info('[TransactionDAO] The transactions have been deleted succesfully');
            resolve();
          }
        });
      });
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        logger.info('[TransactionDAO] Getting transactions from database', filter);

        model.find(filter, projectionCommonFields)
          .lean()
          .exec()
          .then(function(items) {
            logger.info('[TransactionDAO] %d transactions were returned', items.length);
            resolve(items);
          }).catch(function(erro) {
            logger.error('[TransactionDAO] An error has ocurred while getting transactions from database', erro);
            reject(erro);
          });
      });
    },

    getById: function(id) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[TransactionDAO] Getting a transaction by id %s', id);

        self.getAll({_id: id})
        .then(function(items) {
          if (items.length === 0) {
            resolve(null);
            logger.info('[TransactionDAO] The transaction not found');
          } else {
            resolve(items[0]);
            logger.info('[TransactionDAO] The transaction was found');
          }
        }).catch(function(erro) {
            logger.error('[TransactionDAO] An error has occurred while getting a transaction by id %s', id, erro);
            reject(erro);
        });
      });
    },

    getByTransactionHash: function(hash) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[TransactionDAO] Getting a transaction by transactionHash %s', hash);

        self.getAll({hash: hash})
        .then(function(items) {
          if (items.length === 0) {
            resolve(null);
            logger.info('[TransactionDAO] The transaction not found');
          } else {
            resolve(items[0]);
            logger.info('[TransactionDAO] The transaction was found');
          }
        }).catch(function(erro) {
            logger.error('[TransactionDAO] An error has occurred while getting a transaction by transactionHash %s', hash, erro);
            reject(erro);
        });
      });
    },

    save: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.info('[TransactionDAO] Creating a new transaction', JSON.stringify(entity));
        model.create(entity)
        .then(function(item) {
          logger.info('[TransactionDAO] The transaction has been created succesfully', JSON.stringify(item));
          return self.getById(item._id);
        })
        .then(resolve)
        .catch(function(error) {
          logger.error('[TransactionDAO] An error has ocurred while saving a new transaction', error);
          reject({
            status: 422,
            message: error.message
          });
        });
      });
    },

    update: function(entity) {
      return new Promise(function(resolve, reject) {
        logger.info('[TransactionDAO] Update a transaction', JSON.stringify(entity));

        model.findByIdAndUpdate(entity._id, $.flatten(entity), {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.info('[TransactionDAO] The transaction has been updated succesfully');
          logger.debug(JSON.stringify(item.toObject()));
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('[TransactionDAO] An error has ocurred while updating a transaction', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },
  };
};
