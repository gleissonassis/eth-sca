var logger              = require('winston');
var model               = require('../models/configuration')();
var Promise             = require('promise');
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
            logger.error('[ConfigurationDAO] An error has occurred while deleting all items', error);
            reject(err);
          } else {
            logger.debug('[ConfigurationDAO] The items have been deleted succesfully');
            resolve();
          }
        });
      });
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        logger.info('[ConfigurationDAO] Getting items from database', filter);

        model.find(filter, projectionCommonFields)
          .lean()
          .exec()
          .then(function(items) {
            logger.info('[ConfigurationDAO] %d items were returned', items.length);
            resolve(items);
          }).catch(function(erro) {
            logger.error('[ConfigurationDAO] An error has ocurred while getting items from database', erro);
            reject(erro);
          });
      });
    },

    getById: function(id) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.debug('Getting a item by id %s', id);

        self.getAll({_id: id, isEnabled: true})
        .then(function(users) {
          if (users.length === 0) {
            resolve(null);
            logger.debug('[ConfigurationDAO] Configuration not found');
          } else {
            resolve(users[0]);
            logger.debug('[ConfigurationDAO] The item was found');
          }
        }).catch(function(erro) {
            logger.error('[ConfigurationDAO] An error has occurred while getting a item by id %s', id, erro);
            reject(erro);
        });
      });
    },

    save: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        logger.debug('[ConfigurationDAO] Creating a new item', JSON.stringify(entity));
        model.create(entity)
        .then(function(item) {
          logger.debug('[ConfigurationDAO] The item has been created succesfully', JSON.stringify(item));
          return self.getById(item._id);
        })
        .then(resolve)
        .catch(function(error) {
          logger.error('[ConfigurationDAO] An error has ocurred while saving a new item', error);
          reject({
            status: 422,
            message: error.message
          });
        });
      });
    },

    update: function(entity) {
      return new Promise(function(resolve, reject) {
        logger.debug('[ConfigurationDAO] Update a item', JSON.stringify(entity));

        model.findByIdAndUpdate(entity._id, $.flatten(entity), {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.debug('[ConfigurationDAO] The item has been updated succesfully');
          logger.debug(JSON.stringify(item.toObject()));
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('[ConfigurationDAO] An error has ocurred while updating a item', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },

    disable: function(id) {
      return new Promise(function(resolve, reject) {
        logger.debug('[ConfigurationDAO] Disabling a item');

        model.findByIdAndUpdate(id, {_id:id, isEnabled: false}, {'new': true, fields: projectionCommonFields})
        .then(function(item) {
          logger.debug('[ConfigurationDAO] The item has been disabled succesfully');
          resolve(item.toObject());
        }).catch(function(error) {
          logger.error('[ConfigurationDAO] An error has ocurred while disabling a item', error);
          reject({
            status: 422,
            message: error
          });
        });
      });
    },
  };
};
