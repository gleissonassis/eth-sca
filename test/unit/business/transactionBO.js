var TransactionBO     = require('../../../src/business/transactionBO');
var AddressBO         = require('../../../src/business/addressBO');
var ConfiguratonBO    = require('../../../src/business/configurationBO');
var ModelParser       = require('../../../src/models/modelParser');
var DAOFactory        = require('../../../src/daos/daoFactory');
var HelperFactory     = require('../../../src/helpers/helperFactory');
var chai              = require('chai');
var sinon             = require('sinon');
var expect            = chai.expect;

describe('Business > TransactionBO > ', function() {
  var transactionDAO = DAOFactory.getDAO('transaction');
  var transactionRequestDAO = DAOFactory.getDAO('transactionRequest');
  var blockchainTransactionDAO = DAOFactory.getDAO('blockchainTransaction');
  var addressDAO = DAOFactory.getDAO('address');
  var dateHelper = HelperFactory.getHelper('date');
  var modelParser = new ModelParser();
  var addressBO = new AddressBO({});
  var configurationBO = new ConfiguratonBO({});
  var daemonHelper = HelperFactory.getHelper('daemon');
  var mutexHelper = HelperFactory.getHelper('mutex');

  var transactionBO = new TransactionBO({
    transactionRequestDAO: transactionRequestDAO,
    blockchainTransactionDAO: blockchainTransactionDAO,
    transactionDAO: transactionDAO,
    configurationBO: configurationBO,
    addressBO: addressBO,
    addressDAO: addressDAO,
    modelParser: modelParser,
    dateHelper: dateHelper,
    daemonHelper: daemonHelper,
    mutexHelper: mutexHelper
  });

  var getByKeyStub = sinon.stub(configurationBO, 'getByKey');
  getByKeyStub
    .withArgs('minimumConfirmations')
    .returns(Promise.resolve({key: 'minimumConfirmations', value: '6'}));

  describe('Methods > ', function() {
    it('getAll', function() {
      var getAllStub = sinon.stub(transactionDAO, 'getAll');
      getAllStub
        .withArgs({})
        .returns(Promise.resolve([{_id: 'ID'}]));

      return transactionBO.getAll()
        .then(function(r){
          expect(r[0].id).to.be.equal('ID');
          expect(getAllStub.callCount).to.be.equal(1);

          getAllStub.restore();
        });
    });

    it('save', function() {
      var now = new Date();
      dateHelper.setNow(now);

      var estimateGasStub = sinon.stub(daemonHelper, 'estimateGas');
      estimateGasStub
        .withArgs({
            from: 'from',
            to: 'to',
            value: 100000,
        })
        .returns(Promise.resolve(31660));

      var getGasPriceStub = sinon.stub(daemonHelper, 'getGasPrice');
      getGasPriceStub
        .withArgs()
        .returns(Promise.resolve(1000000000));

      var checkHasFundsStub = sinon.stub(addressBO, 'checkHasFunds');
      checkHasFundsStub
        .withArgs('from', 100000 + (31660 * 1000000000))
        .returns(Promise.resolve(true));
      var transactionRequestSaveStub = sinon.stub(transactionRequestDAO, 'save');
      transactionRequestSaveStub
        .withArgs({
            ownerId: 'ownerId',
            ownerTransactionId: 'ownerTransactionId',
            from: 'from',
            to: 'to',
            status: 0,
            amount: 100000,
            gas: 31660,
            createdAt: now
        })
        .returns(Promise.resolve({
          _id: 'ID',
          ownerId: 'ownerId',
          ownerTransactionId: 'ownerTransactionId',
          from: 'from',
          to: 't0',
          amount: 100000,
          status: 0,
          createdAt: now
        }));

      var getByAddressStub = sinon.stub(addressBO, 'getByAddress');
      getByAddressStub
        .withArgs(null, 'from')
        .returns(Promise.resolve({
          address: 'from',
          privateKey: 'privateKey'
        }));

      var sendTransactionStub = sinon.stub(daemonHelper, 'sendTransaction');
      sendTransactionStub
        .withArgs({
            from: 'from',
            to: 'to',
            value: 100000,
            gas: 31660
        }, 'privateKey')
        .returns(Promise.resolve({
          blockHash: 'blockHash',
          blockNumber: 3236377,
          contractAddress: null,
          cumulativeGasUsed: 456415,
          from: 'from',
          gasUsed: 46660,
          logs: [],
          status: true,
          to: 'to',
          transactionHash: 'transactionHash',
          transactionIndex: 16
        }));

        var getTransactionStub = sinon.stub(daemonHelper, 'getTransaction');
        getTransactionStub
          .withArgs('transactionHash')
          .returns(Promise.resolve({
            gasPrice: 1000000000,
            gas: 100000
          }));

      var transactionRequestUpdateStub = sinon.stub(transactionRequestDAO, 'update');
      transactionRequestUpdateStub
        .withArgs({
          _id: 'ID',
          ownerId: 'ownerId',
          ownerTransactionId: 'ownerTransactionId',
          to: 'to',
          from: 'from',
          amount: 100000,
          status: 1,
          createdAt: now,
          updatedAt: now,
          transactionHash: 'transactionHash',
          fee: 100000 * 1000000000
        })
        .returns(Promise.resolve({
          _id: 'ID',
          ownerId: 'ownerId',
          ownerTransactionId: 'ownerTransactionId',
          to: 'to',
          from: 'from',
          amount: 100000,
          status: 1,
          createdAt: now,
          updatedAt: now,
          transactionHash: 'transactionHash',
          fee: 100000 * 1000000000
        }));

      var updateBalance = sinon.stub(addressBO, 'updateBalance');

      return transactionBO.save({
        ownerId: 'ownerId',
        ownerTransactionId: 'ownerTransactionId',
        from: 'from',
        to: 'to',
        amount: 100000
      })
        .then(function(r){
          expect(r).to.be.deep.equal({
            id: 'ID',
            ownerId: 'ownerId',
            ownerTransactionId: 'ownerTransactionId',
            to: 'to',
            from: 'from',
            gas: 31660,
            amount: 100000,
            status: 1,
            createdAt: now,
            updatedAt: now,
            transactionHash: 'transactionHash',
            fee: 100000 * 1000000000
          });

          expect(estimateGasStub.callCount).to.be.equal(1);
          expect(getGasPriceStub.callCount).to.be.equal(1);
          expect(checkHasFundsStub.callCount).to.be.equal(1);
          expect(getByAddressStub.callCount).to.be.equal(2);

          expect(sendTransactionStub.callCount).to.be.equal(1);
          expect(getTransactionStub.callCount).to.be.equal(1);
          expect(transactionRequestUpdateStub.callCount).to.be.equal(2);
          expect(updateBalance.callCount).to.be.equal(1);

          estimateGasStub.restore();
          getGasPriceStub.restore();
          checkHasFundsStub.restore();
          transactionRequestSaveStub.restore();
          getByAddressStub.restore();
          sendTransactionStub.restore();
          getTransactionStub.restore();
          transactionRequestUpdateStub.restore();
          updateBalance.restore();
          getByAddressStub.restore();
        });
    });

    it('parseTransaction - transaction not found but with request', function() {
      var now = new Date();

      var getContractAddressesStub = sinon.stub(addressBO, 'getContractAddresses');
      getContractAddressesStub
        .withArgs()
        .returns(Promise.resolve([]));

      var getNowStub = sinon.stub(dateHelper, 'getNow');
      getNowStub
        .withArgs()
        .returns(now);

      var getAll = sinon.stub(blockchainTransactionDAO, 'getAll');
      getAll
        .withArgs({
          hash: 'hash'
        })
        .returns(Promise.resolve([]));

      var transactionRequestGetAllStub = sinon.stub(transactionRequestDAO, 'getAll');
      transactionRequestGetAllStub
        .withArgs({
          transactionHash: 'hash'
        })
        .returns(Promise.resolve([{
          ownerTransactionId: 'ownerTransactionId'
        }]));

      var saveStub = sinon.stub(blockchainTransactionDAO, 'save');
      saveStub
        .withArgs({
          blockHash: 'blockHash',
          blockNumber: 3236377,
          from: 'from',
          gas: 51505,
          gasPrice: 1000000000,
          hash: 'hash',
          input: '0x',
          nonce: 3,
          to: 'to',
          transactionIndex: 16,
          value: 10000000000,
          createdAt: now,
          isConfirmed: false
        })
        .returns(Promise.resolve({
          _id: 'ID',
          blockHash: 'blockHash',
          blockNumber: 3236377,
          from: 'from',
          gas: 51505,
          gasPrice: 1000000000,
          hash: 'hash',
          input: '0x',
          nonce: 3,
          to: 'to',
          transactionIndex: 16,
          value: 10000000000,
          isConfirmed: false,
          createdAt: now,
        }));

      var getByAddressStub = sinon.stub(addressBO, 'getByAddress');
      getByAddressStub
        .withArgs(null, 'to')
        .returns(Promise.resolve({
          ownerId: 'ownerId',
          address:'to'
        }));

      var updateBalanceStub = sinon.stub(addressBO, 'updateBalance');

      var transactionSaveStub = sinon.stub(transactionDAO, 'save');
      transactionSaveStub
        .withArgs({
          ownerId: 'ownerId',
          ownerTransactionId: null,
          amount: 10000000000,
          gas: 51505,
          gasPrice: 1000000000,
          isConfirmed: false,
          notifications: {
            creation: {
              isNotified: false
            },
            confirmation: {
              isNotified: false
            }
          },
          transactionHash: 'hash',
          to: 'to',
          from: 'from',
          timestamp: 1525944061,
          createdAt: now
        })
        .returns(Promise.resolve({
          _id: 'ID',
          ownerId: 'ownerId',
          ownerTransactionId: null,
          amount: 10000000000,
          gas: 51505,
          gasPrice: 1000000000,
          isConfirmed: false,
          notifications: {
            creation: {
              isNotified: false
            },
            confirmation: {
              isNotified: false
            }
          },
          transactionHash: 'hash',
          to: 'to',
          from: 'from',
          createdAt: now
        }));

      return transactionBO.parseTransaction({
        blockHash: 'blockHash',
        blockNumber: 3236377,
        from: 'from',
        gas: 51505,
        gasPrice: 1000000000,
        hash: 'hash',
        input: '0x',
        nonce: 3,
        to: 'to',
        transactionIndex: 16,
        value: 10000000000
      }, 3236378)
        .then(function(r){
          expect(r).to.be.deep.equal({
            id: 'ID',
            blockHash: 'blockHash',
            blockNumber: 3236377,
            from: 'from',
            gas: 51505,
            gasPrice: 1000000000,
            hash: 'hash',
            input: '0x',
            nonce: 3,
            to: 'to',
            transactionIndex: 16,
            value: 10000000000,
            createdAt: now,
            isConfirmed: false
          });

          expect(getNowStub.callCount).to.be.equal(2);
          expect(getAll.callCount).to.be.equal(1);
          expect(getContractAddressesStub.callCount).to.be.equal(1);
          expect(transactionRequestGetAllStub.callCount).to.be.equal(1);
          expect(saveStub.callCount).to.be.equal(1);
          expect(transactionSaveStub.callCount).to.be.equal(1);
          expect(updateBalanceStub.callCount).to.be.equal(0);
          expect(getByAddressStub.callCount).to.be.equal(1);

          getNowStub.restore();
          getAll.restore();
          transactionRequestGetAllStub.restore();
          saveStub.restore();
          transactionSaveStub.restore();
          getByAddressStub.restore();
          updateBalanceStub.restore();
          getContractAddressesStub.restore();
        });
    });

    it('parseTransaction - transaction not found and without request', function() {
      var now = new Date();

      var getContractAddressesStub = sinon.stub(addressBO, 'getContractAddresses');
      getContractAddressesStub
        .withArgs()
        .returns(Promise.resolve([]));

      var getNowStub = sinon.stub(dateHelper, 'getNow');
      getNowStub
        .withArgs()
        .returns(now);

      var getAll = sinon.stub(blockchainTransactionDAO, 'getAll');
      getAll
        .withArgs({
          hash: 'hash'
        })
        .returns(Promise.resolve([]));

      var transactionRequestGetAllStub = sinon.stub(transactionRequestDAO, 'getAll');
      transactionRequestGetAllStub
        .withArgs({
          transactionHash: 'hash'
        })
        .returns(Promise.resolve([]));

      var saveStub = sinon.stub(blockchainTransactionDAO, 'save');
      saveStub
        .withArgs({
          blockHash: 'blockHash',
          blockNumber: 3236377,
          from: 'from',
          gas: 51505,
          gasPrice: 1000000000,
          hash: 'hash',
          input: '0x',
          nonce: 3,
          to: 'to',
          transactionIndex: 16,
          value: 10000000000,
          createdAt: now,
          isConfirmed: false
        })
        .returns(Promise.resolve({
          _id: 'ID',
          blockHash: 'blockHash',
          blockNumber: 3236377,
          from: 'from',
          gas: 51505,
          gasPrice: 1000000000,
          hash: 'hash',
          input: '0x',
          nonce: 3,
          to: 'to',
          transactionIndex: 16,
          value: 10000000000,
          isConfirmed: false,
          createdAt: now,
        }));

      var getByAddressStub = sinon.stub(addressBO, 'getByAddress');
      getByAddressStub
        .withArgs(null, 'to')
        .returns(Promise.resolve({
          ownerId: 'ownerId',
          address:'to'
        }));
      var updateBalanceStub = sinon.stub(addressBO, 'updateBalance');


      var transactionSaveStub = sinon.stub(transactionDAO, 'save');
      transactionSaveStub
        .withArgs({
          ownerId: 'ownerId',
          ownerTransactionId: null,
          amount: 10000000000,
          gas: 51505,
          gasPrice: 1000000000,
          isConfirmed: false,
          notifications: {
            creation: {
              isNotified: false
            },
            confirmation: {
              isNotified: false
            }
          },
          transactionHash: 'hash',
          to: 'to',
          from: 'from',
          timestamp: 1525944061,
          createdAt: now
        })
        .returns(Promise.resolve({
          _id: 'ID',
          ownerId: 'ownerId',
          ownerTransactionId: null,
          amount: 10000000000,
          gas: 51505,
          gasPrice: 1000000000,
          isConfirmed: false,
          notifications: {
            creation: {
              isNotified: false
            },
            confirmation: {
              isNotified: false
            }
          },
          transactionHash: 'hash',
          to: 'to',
          from: 'from',
          createdAt: now
        }));

      return transactionBO.parseTransaction({
        blockHash: 'blockHash',
        blockNumber: 3236377,
        from: 'from',
        gas: 51505,
        gasPrice: 1000000000,
        hash: 'hash',
        input: '0x',
        nonce: 3,
        to: 'to',
        transactionIndex: 16,
        value: 10000000000
      }, 3236378)
        .then(function(r){
          expect(r).to.be.deep.equal({
            id: 'ID',
            blockHash: 'blockHash',
            blockNumber: 3236377,
            from: 'from',
            gas: 51505,
            gasPrice: 1000000000,
            hash: 'hash',
            input: '0x',
            nonce: 3,
            to: 'to',
            transactionIndex: 16,
            value: 10000000000,
            createdAt: now,
            isConfirmed: false
          });

          expect(getNowStub.callCount).to.be.equal(2);
          expect(getAll.callCount).to.be.equal(1);
          expect(getContractAddressesStub.callCount).to.be.equal(1);
          expect(transactionRequestGetAllStub.callCount).to.be.equal(1);
          expect(saveStub.callCount).to.be.equal(1);
          expect(transactionSaveStub.callCount).to.be.equal(1);
          expect(getByAddressStub.callCount).to.be.equal(1);
          expect(updateBalanceStub.callCount).to.be.equal(0);

          getNowStub.restore();
          getAll.restore();
          transactionRequestGetAllStub.restore();
          saveStub.restore();
          transactionSaveStub.restore();
          getByAddressStub.restore();
          updateBalanceStub.restore();
          getContractAddressesStub.restore();
        });
    });

    it('parseTransaction - should parse a new token mint transaction', function() {
      var now = new Date();

      var parseInputDataStub = sinon.stub(daemonHelper, 'parseTokenInputData');
      parseInputDataStub
        .withArgs('0x40c10f19000000000000000000000000a933582bd31552b04790131dd885c2c7bee0f0e500000000000000000000000000000000000000000000000000000000000003e8')
        .returns(Promise.resolve({
          method: 'mint',
          params: {
            to: '0xa933582bd31552b04790131dd885c2c7bee0f0e5',
            amount: 1000
          }
        }));

      var getContractAddressesStub = sinon.stub(addressBO, 'getContractAddresses');
      getContractAddressesStub
        .withArgs()
        .returns(Promise.resolve(['contractAddress']));

      var getNowStub = sinon.stub(dateHelper, 'getNow');
      getNowStub
        .withArgs()
        .returns(now);

      var getAll = sinon.stub(blockchainTransactionDAO, 'getAll');
      getAll
        .withArgs({
          hash: 'hash'
        })
        .returns(Promise.resolve([]));

      var transactionRequestGetAllStub = sinon.stub(transactionRequestDAO, 'getAll');
      transactionRequestGetAllStub
        .withArgs({
          transactionHash: 'hash'
        })
        .returns(Promise.resolve([]));

      var saveStub = sinon.stub(blockchainTransactionDAO, 'save');
      saveStub
        .withArgs({
          blockHash: 'blockHash',
          blockNumber: 3236377,
          from: 'from',
          gas: 51505,
          gasPrice: 1000000000,
          hash: 'hash',
          input: '0x40c10f19000000000000000000000000a933582bd31552b04790131dd885c2c7bee0f0e500000000000000000000000000000000000000000000000000000000000003e8',
          nonce: 3,
          to: 'contractAddress',
          transactionIndex: 16,
          value: 0,
          createdAt: now,
          isConfirmed: true
        })
        .returns(Promise.resolve({
          _id: 'ID',
          blockHash: 'blockHash',
          blockNumber: 3236377,
          from: 'from',
          gas: 51505,
          gasPrice: 1000000000,
          hash: 'hash',
          input: '0x40c10f19000000000000000000000000a933582bd31552b04790131dd885c2c7bee0f0e500000000000000000000000000000000000000000000000000000000000003e8',
          nonce: 3,
          to: 'contractAddress',
          transactionIndex: 16,
          value: 0,
          isConfirmed: true,
          createdAt: now,
        }));

      var getByAddressStub = sinon.stub(addressBO, 'getByAddress');

      getByAddressStub
        .withArgs(null, '0xa933582bd31552b04790131dd885c2c7bee0f0e5')
        .returns(Promise.resolve({
          address: '0xa933582bd31552b04790131dd885c2c7bee0f0e5',
          ownerId: 'ownerId',
          privateKey: 'privateKeyToMint'
        }));

      getByAddressStub
        .withArgs(null, 'from')
        .returns(Promise.resolve(null));

      var updateBalance = sinon.stub(addressBO, 'updateBalance');
      updateBalance
        .withArgs({
          address: '0xa933582bd31552b04790131dd885c2c7bee0f0e5',
          privateKey: 'privateKeyToMin'
        }, 'contractAddress');

      var transactionSaveStub = sinon.stub(transactionDAO, 'save');
      transactionSaveStub
        .withArgs({
          ownerId: 'ownerId',
          ownerTransactionId: null,
          amount: 0,
          gas: 51505,
          gasPrice: 1000000000,
          isConfirmed: true,
          notifications: {
            creation: {
              isNotified: false
            },
            confirmation: {
              isNotified: false
            }
          },
          transactionHash: 'hash',
          to: 'contractAddress',
          from: 'from',
          input: '0x40c10f19000000000000000000000000a933582bd31552b04790131dd885c2c7bee0f0e500000000000000000000000000000000000000000000000000000000000003e8',
          parsedInput: {
            method: 'mint',
            params: {
              to: '0xa933582bd31552b04790131dd885c2c7bee0f0e5',
              amount: 1000
            }
          },
          createdAt: now
        })
        .returns(Promise.resolve({
          _id: 'ID',
          ownerId: 'ownerId',
          ownerTransactionId: null,
          amount: 0,
          gas: 51505,
          gasPrice: 1000000000,
          isConfirmed: true,
          notifications: {
            creation: {
              isNotified: false
            },
            confirmation: {
              isNotified: false
            }
          },
          transactionHash: 'hash',
          to: 'contractAddress',
          from: 'from',
          input: '0x40c10f19000000000000000000000000a933582bd31552b04790131dd885c2c7bee0f0e500000000000000000000000000000000000000000000000000000000000003e8',
          parsedInput: {
            method: 'mint',
            params: {
              to: '0xa933582bd31552b04790131dd885c2c7bee0f0e5',
              amount: 1000
            }
          },
          createdAt: now
        }));

      return transactionBO.parseTransaction({
        blockHash: 'blockHash',
        blockNumber: 3236377,
        from: 'from',
        gas: 51505,
        gasPrice: 1000000000,
        hash: 'hash',
        input: '0x40c10f19000000000000000000000000a933582bd31552b04790131dd885c2c7bee0f0e500000000000000000000000000000000000000000000000000000000000003e8',
        nonce: 3,
        to: 'contractAddress',
        transactionIndex: 16,
        value: '0'
      }, 3237378)
        .then(function(r){
          expect(r).to.be.deep.equal({
            id: 'ID',
            blockHash: 'blockHash',
            blockNumber: 3236377,
            from: 'from',
            gas: 51505,
            gasPrice: 1000000000,
            hash: 'hash',
            nonce: 3,
            to: 'contractAddress',
            input: '0x40c10f19000000000000000000000000a933582bd31552b04790131dd885c2c7bee0f0e500000000000000000000000000000000000000000000000000000000000003e8',
            transactionIndex: 16,
            value: 0,
            createdAt: now,
            isConfirmed: true
          });

          expect(getNowStub.callCount).to.be.equal(2);
          expect(getAll.callCount).to.be.equal(1);
          expect(transactionRequestGetAllStub.callCount).to.be.equal(1);
          expect(saveStub.callCount).to.be.equal(1);
          expect(transactionSaveStub.callCount).to.be.equal(1);
          expect(getByAddressStub.callCount).to.be.equal(3);
          expect(updateBalance.callCount).to.be.equal(1);

          getNowStub.restore();
          getAll.restore();
          transactionRequestGetAllStub.restore();
          saveStub.restore();
          updateBalance.restore();
          transactionSaveStub.restore();
          getByAddressStub.restore();
        });
    });
  });
});
