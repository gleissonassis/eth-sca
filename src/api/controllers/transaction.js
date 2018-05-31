var BOFactory             = require('../../business/boFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');

module.exports = function() {
  var business = BOFactory.getBO('transaction');

  return {
    getAllByOwnerId: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.getAll({ownerId: req.params.ownerId})
        .then(rh.ok)
        .catch(rh.error);
    },

    getAll: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);

      var filter = {};

      if (req.params.ownerId) {
        filter.ownerId = req.params.ownerId;
      }

      if (req.params.address) {
        filter.from = {$regex : new RegExp(req.params.from, 'i')};
      }

      if (req.params.transactionHash) {
        filter.transactionHash = req.params.transactionHash;
      }

      business.getAll(filter)
        .then(function(r) {
          if (req.params.transactionHash) {
            if (r.length > 0) {
              rh.ok(r[0]);
            } else {
              rh.ok(null);
            }
          } else {
            rh.ok(r);
          }
        })
        .catch(rh.error);
    },

    update: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      req.body.key = req.params.key;

      if (req.params.ownerId) {
        req.body.ownerId = req.params.ownerId;
      }

      business.update(req.body)
        .then(rh.ok)
        .catch(rh.error);
    },

    save: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      req.body.ownerId = req.params.ownerId;

      if (req.params.address) {
        req.body.from = req.params.address;
      }
      business.save(req.body)
        .then(function(r) {
          rh.created(r);
        })
        .catch(rh.error);
    },

    getBlockchainTransactionByTransaction: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);

      var filter = {};

      if (req.params.address) {
        filter.address = {$regex : new RegExp(req.params.address, 'i')};
      }

      if (req.params.transactionHash) {
        filter.txid = req.params.transactionHash;
      }

      business.getBlockchainTransactionByTransaction(filter)
        .then(rh.ok)
        .catch(rh.error);
    },

    getBlockchainTransaction: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.getBlockchainTransactionByTransactionHash(req.params.transactionHash)
        .then(rh.ok)
        .catch(rh.error);
    },
  };
};
