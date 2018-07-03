var logger          = require('../config/logger');

module.exports = function(dependencies) {
  var eventDAO = dependencies.eventDAO;
  var modelParser = dependencies.modelParser;
  var dateHelper = dependencies.dateHelper;

  return {
    dependencies: dependencies,

    clear: function() {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.debug('[EventBO] Clearing the database');
            return eventDAO.clear();
          })
          .then(function() {
            logger.debug('[EventBO] The database has been cleared');
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getAll: function(filter) {
      return new Promise(function(resolve, reject) {
        if (!filter) {
          filter = {};
        }

        logger.debug('[EventBO] Listing all events by filter ', filter);
        eventDAO.getAll(filter)
          .then(function(r) {
            logger.debug('[EventBO] Total of events', r.length);
            return r.map(function(item) {
              return modelParser.clear(item);
            });
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getByEventId: function(eventId) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var filter = {
          eventId: eventId
        };

        self.getAll(filter)
          .then(function(items) {
            if (items.length) {
              logger.info('Event found by symbol', JSON.stringify(items[0]));
              return items[0];
            } else {
              return null;
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    save: function(entity) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            logger.debug('[EventBO] Saving the event. Entity: ', JSON.stringify(entity));
            var o = modelParser.prepare(entity, true);
            o.createdAt = dateHelper.getNow();
            logger.debug('[EventBO] Entity  after prepare: ', JSON.stringify(o));
            return eventDAO.save(o);
          })
          .then(function(r) {
            logger.debug('EventBO] Event saved successfully', JSON.stringify(r));
            return modelParser.clear(r);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getById: function(id) {
      return new Promise(function(resolve, reject) {
        eventDAO.getById(id)
          .then(function(user) {
            if (user) {
              return modelParser.clearUser(user);
            } else {
              throw {
                status: 404,
                message: 'Event not found'
              };
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    update: function(entity) {
      var self = this;
      return new Promise(function(resolve, reject) {
        self.getById(entity.id)
          .then(function() {
              var o = modelParser.prepare(entity);
              o.updatedAt = dateHelper.getNow();
              o.value = entity.value;
              logger.debug('[EventBO] Updating event', JSON.stringify(event));
              return eventDAO.update(event);
          })
          .then(function(r) {
            logger.debug('[EventBO] Event was updated successfully',
              JSON.stringify(r));
            return modelParser.clear(r);
          })
          .then(resolve)
          .catch(reject);
      });
    },

    delete: function(id) {
      var self = this;

      return new Promise(function(resolve, reject) {
        logger.debug('[EventBO] Disabling a event', id);

        self.getById(id)
          .then(function(event) {
            return eventDAO.disable(event.id);
          })
          .then(function() {
            logger.debug('[EventBO] Event disabled successfully', key);
            return;
          })
          .then(resolve)
          .catch(reject);
      });
    }
  };
};
