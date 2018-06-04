var HelperFactory     = require('../../../src/helpers/helperFactory');
var chai              = require('chai');
var expect            = chai.expect;

describe('business > DaemonHelper', function() {
  var daemonHelper = HelperFactory.getHelper('daemon');

  it('should create a transferPreSigned signature', function() {
    var from = {
      address: '0x6025961e3F43AeB967f28A0aD88E46860b85def4',
      privateKey: '5f5229964393af1dfe8d595054976ded32a1f9d936c34c2be97dd815b582d286'
    };

    var contractAddress = '0xc62ca8e3d621f6235f8a5b985b3d6f3169f75f29';

    return daemonHelper.createTransferSignature(contractAddress, from, '0x6025961e3F43AeB967f28A0aD88E46860b85def4', 100, 10, 1)
      .then(function(r) {
        expect(r).to.be.deep.equal({
            contractAddress: '0xc62ca8e3d621f6235f8a5b985b3d6f3169f75f29',
            to: '0x6025961e3F43AeB967f28A0aD88E46860b85def4',
            amount: 100,
            fee: 10,
            nonce: 1,
            signature: '0xdf4934ee5b620fe03ab4184cec2636bce168f0fe066ac0c4d0d8a616bbc17c650f87ceebf319d257c994e5f044027c69183340ca26ff3d8d0caad0d602954f401b'
          }
        );
      });
  });
});
