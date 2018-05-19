var DaemonHelper      = require('../../../src/helpers/daemonHelper');
var chai              = require('chai');
var expect            = chai.expect;

describe('business > DaemonHelper', function() {
  var daemonHelper = new DaemonHelper({
    web3: {
      eth: {
        getBlock: function() {
          return Promise.resolve(Promise.resolve({transactions: [{}, {}, {}]}));
        }
      }
    }
  });

  it('should get transactions', function() {
    return daemonHelper.getTransactions(10, 20)
      .then(function(r) {
        expect(r.length).to.be.equal(33);
      });
  });
});
