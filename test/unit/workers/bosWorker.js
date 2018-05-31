var HelperFactory     = require('../../../src/helpers/helperFactory');
var TransactionBO     = require('../../../src/business/transactionBO');
var AddressBO         = require('../../../src/business/addressBO');
var ConfigurationBO   = require('../../../src/business/ConfigurationBO');
var BOSWorker         = require('../../../src/workers/bosWorker');
var chai              = require('chai');
var sinon             = require('sinon');
var expect            = chai.expect;

describe('Workers > BOSWorker', function() {
  var daemonHelper = HelperFactory.getHelper('daemon');
  var transactionBO = new TransactionBO({});
  var addressBO = new AddressBO({});
  var configurationBO = new ConfigurationBO({});

  var bosWorker = new BOSWorker({
    daemonHelper: daemonHelper,
    transactionBO: transactionBO,
    addressBO: addressBO,
    configurationBO: configurationBO
  });

  it('should run', function() {
    var getByKeyStub = sinon.stub(configurationBO, 'getByKey');
    getByKeyStub
      .withArgs('currentBlockNumber')
      .returns(Promise.resolve({
        key: 'currentBlockNumber',
        value: 12
      }));

    var updateKeyStub = sinon.stub(configurationBO, 'update');
    updateKeyStub
      .withArgs({key:'currentBlockNumber', value: 24})
      .returns(Promise.resolve());

    var getAllStub = sinon.stub(addressBO, 'getAll');
    getAllStub
      .withArgs()
      .returns(Promise.resolve([
        {address: '0xBA46454801BBFB741FFc6Addf58dc6C2cC061FD7'},
        {address: '0xDE9420370d579724410d82B9f761EC17A5aBC2e6'},
        {address: '0x85d1e34eA327EEF056DB7B73918715d397B1be87'},
      ]));

    var getBlockNumberStub = sinon.stub(daemonHelper, 'getBlockNumber');
    getBlockNumberStub
      .withArgs()
      .returns(Promise.resolve(36));

    var transactions = [{
      blockHash: '0xed163fc4ac12caf03f3613abe94fa3d344562e8467979732d51053a897343563',
      blockNumber: 3239729,
      from: '0x67aCA279c11a37a6Fe8FAf6378280526A2e0616c',
      gas: 44481,
      gasPrice: '1000000000',
      hash: '0xf9762c7db6ea154594eb2628cc7533dc2d710b9bcd3a88d0ec016b56064b6ef1',
      input: '0x',
      nonce: 132,
      to: '0xBA46454801BBFB741FFc6Addf58dc6C2cC061FD7',
      transactionIndex: 13,
      value: '0',
      v: '0x1c',
      r: '0xa2cd903625ef286f5d0b259d2d3c5e9d5a955267a17df407d4884e5e8086546b',
      s: '0x5da846f717fb6f3916d22b314f08e63634b38d43d8ff6e4923c66e454f039d7f'
    }, {
      blockHash: '0xed163fc4ac12caf03f3613abe94fa3d344562e8467979732d51053a897343563',
      blockNumber: 3239729,
      from: '0xf17f52151EbEF6C7334FAD080c5704D77216b732',
      gas: 226915,
      gasPrice: '1000000000',
      hash: '0xaa5551a1dcb999886b49edd858d56e9c1f008c957f03147f6fbf8e37179cffd5',
      input: '0xa9059cbb000000000000000000000000c5fdf4076b8f3a5357c5e395ab970b5b54098fef00000000000000000000000000000000000000000000000000132f94e46327c4',
      nonce: 4094,
      to: '0xDE9420370d579724410d82B9f761EC17A5aBC2e6',
      transactionIndex: 12,
      value: '0',
      v: '0x2a',
      r: '0x4098ba9f5854f30830013e0d2556159468905b17051ced9a6cb71aa8e148bb5f',
      s: '0x42d655f923e2652b46542e9954db9b267db139b39016780be56861ece7274378'
    }, {
      blockHash: '0x62f6b366d59740b82a57bbf842010ea33d125f2db37068bf5d0b404594d9c6fb',
      blockNumber: 3239739,
      from: '0x1f7A3A009DA9C219220147afe04Dd5428Bab623c',
      gas: 280318,
      gasPrice: '1000000000',
      hash: '0x046ea1ba61909248f4a9ebc9b674c7e7542f29996dd8b059467cd0d5321072d5',
      input: '0x82ab890a000000000000000000000000000000000000000000000000000000000007ea48',
      nonce: 33583,
      to: '0x85d1e34eA327EEF056DB7B73918715d397B1be87',
      transactionIndex: 6,
      value: '0',
      v: '0x29',
      r: '0x6091e8e249d34c95a985dc288fd904207f9a71f90444b6da55144204c75e8a6b',
      s: '0x4e112c82d7943497a65b705730260422a058bec915890b5db5c81ec28281795'
    }];

    var getBlockHashStub = sinon.stub(daemonHelper, 'getTransactions');
    getBlockHashStub
      .withArgs(0, 12)
      .returns(Promise.resolve(transactions));

    var parseTransactionStub = sinon.stub(transactionBO, 'parseTransaction');
    parseTransactionStub
      .withArgs(transactions[0])
      .returns(Promise.resolve());

    parseTransactionStub
      .withArgs(transactions[1])
      .returns(Promise.resolve());

    parseTransactionStub
      .withArgs(transactions[2])
      .returns(Promise.resolve());

    return bosWorker.synchronizeToBlockchain()
      .then(function(r) {
        expect(r).to.be.true;
        expect(getByKeyStub.callCount).to.be.equal(1);
        expect(getAllStub.callCount).to.be.equal(1);
        expect(getBlockNumberStub.callCount).to.be.equal(1);
        expect(parseTransactionStub.callCount).to.be.equal(3);

        getAllStub.restore();
        getBlockNumberStub.restore();
        parseTransactionStub.restore();
        getByKeyStub.restore();
      });
  });

  it('should not fail when the daemon returns an error (getBlockCount)', function() {
    var getByKeyStub = sinon.stub(configurationBO, 'getByKey');
    getByKeyStub
      .withArgs('currentBlockNumber')
      .returns(Promise.resolve({
        key: 'currentBlockNumber',
        value: 12
      }));

    var getAllStub = sinon.stub(addressBO, 'getAll');
    getAllStub
      .withArgs()
      .returns(Promise.resolve([
        {address: '0xBA46454801BBFB741FFc6Addf58dc6C2cC061FD7'},
        {address: '0xDE9420370d579724410d82B9f761EC17A5aBC2e6'},
        {address: '0x85d1e34eA327EEF056DB7B73918715d397B1be87'},
      ]));

    var getBlockNumberStub = sinon.stub(daemonHelper, 'getBlockNumber');
    getBlockNumberStub
      .withArgs()
      .returns(Promise.reject());

    return bosWorker.synchronizeToBlockchain()
      .then(function(r) {
        expect(r).to.be.true;
        expect(getBlockNumberStub.callCount).to.be.equal(1);
        expect(getAllStub.callCount).to.be.equal(1);

        getBlockNumberStub.restore();
        getAllStub.restore();
      });
  });
});
