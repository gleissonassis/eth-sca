var BOFactory             = require('../../business/boFactory');
var HTTPResponseHelper    = require('../../helpers/httpResponseHelper');

module.exports = function() {
  var business = BOFactory.getBO('address');

  return {
    getAll: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.getAll({})
        .then(rh.ok)
        .catch(rh.error);
    },

    getAllByOwnerId: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.getAll({ownerId: req.params.ownerId})
        .then(rh.ok)
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

    createAddress: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);
      business.createAddress(req.params.ownerId, req.body.contractAddress)
        .then(function(r) {
          rh.created(r);
        })
        .catch(rh.error);
    },

    getByAddress: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);

      business.getByAddress(req.params.ownerId, req.params.address)
        .then(rh.ok)
        .catch(rh.error);
    },

    getAddressBalance: function(req, res) {
      var rh = new HTTPResponseHelper(req, res);

      business.getByAddress(req.params.ownerId, req.params.address)
        .then(function(address) {
          return business.updateBalance(address);
        })
        .then(function() {
          return business.getAddressBalance(req.params.address);
        })
        .then(rh.ok)
        .catch(rh.error);
    }
  };
};
