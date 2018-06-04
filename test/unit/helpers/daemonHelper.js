var HelperFactory     = require('../../../src/helpers/helperFactory');
var chai              = require('chai');
var Web3              = require('web3');
var expect            = chai.expect;

describe('business > DaemonHelper', function() {
  var daemonHelper = HelperFactory.getHelper('daemon');

  var web3 = new Web3();
  web3.eth.getBlock = function() {
    return Promise.resolve(Promise.resolve({transactions: [{}, {}, {}]}));
  };

  daemonHelper.setDependencies({
    web3: web3
  });

  it('should get transactions', function() {
    return daemonHelper.getTransactions(10, 20)
      .then(function(r) {
        expect(r.length).to.be.equal(33);
      });
  });

  it('should parse mint input data', function() {
    return daemonHelper.parseTokenInputData('0x40c10f19000000000000000000000000a933582bd31552b04790131dd885c2c7bee0f0e500000000000000000000000000000000000000000000000000000000000003e8')
      .then(function(r) {
        expect(r).to.be.deep.equal({
          method: 'mint',
          params: {
            to: '0xa933582bd31552b04790131dd885c2c7bee0f0e5',
            amount: 1000
          }
        });
      });
  });

  it('should parse transfer input data', function() {
    return daemonHelper.parseTokenInputData('0xa9059cbb000000000000000000000000f370872b4baee32a73205b133d9ad974f3ad437e0000000000000000000000000000000000000000000000000000000000000001')
      .then(function(r) {
        expect(r).to.be.deep.equal({
          method: 'mint',
          params: {
            to: '0xf370872b4baee32a73205b133d9ad974f3ad437e',
            amount: 1
          }
        });
      });
  });

  it('should parse transferPreSigned input data', function() {
    var inputData = '0x1296830d00000000000000000000000000000000000000000000000000000000000000a0000000000000000000000000' +
                    'f370872b4baee32a73205b133d9ad974f3ad437e000000000000000000000000000000000000000000000000000000000000000' +
                    '1000000000000000000000000000000000000000000000000000000000000000a000000000000000000000000000000000000000' +
                    '000000000000000000000000900000000000000000000000000000000000000000000000000000000000000' +
                    '41e20cb961c814f5eca2b66ab82e37a6e5b3cb9d71b913dcf4a28f108fdee52ef06e5381d25d1ecbb9ce6ad7584decef5e42aa716967e04a21d29b08e436b2a7f41c' +
                    '00000000000000000000000000000000000000000000000000000000000000';
    return daemonHelper.parseTokenInputData(inputData)
      .then(function(r) {
        expect(r).to.be.deep.equal({
          method: 'transferPreSigned',
          params: {
            signature: '0xe20cb961c814f5eca2b66ab82e37a6e5b3cb9d71b913dcf4a28f108fdee52ef06e5381d25d1ecbb9ce6ad7584decef5e42aa716967e04a21d29b08e436b2a7f41c',
            to: '0xf370872b4baee32a73205b133d9ad974f3ad437e',
            amount: 1,
            fee: 10,
            nonce: 9
          }
        });
      });
  });
});
