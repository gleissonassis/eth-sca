var BOFactory             = require('../../src/business/boFactory');
var WorkerFactory         = require('../../src/workers/workerFactory');
var Starter               = require('../../src/starter.js');
var chai                  = require('chai');
var expect                = chai.expect;
                            require('../../src/config/database.js')();

describe('integration > base operations', function(){
  var configurationBO = BOFactory.getBO('configuration');
  var addressBO = BOFactory.getBO('address');
  var transactionBO = BOFactory.getBO('transaction');
  var bosWorker = WorkerFactory.getWorker('bos');
  var aapmsWorker = WorkerFactory.getWorker('aapms');
  var starter = new Starter();

  var firstAddress = {
    address: '0xbD524F668C929efefBfCff269D70effF87E05332',
    privateKey: '0xaa32f19d2d330e4f6a87ea7b34feca3735fc313db075cdc12bf61743f68076ff'
  };

  var secondAddress = {
    address: '0xbD524F668C929efefBfCff269D70effF87E05332',
    privateKey: '0xaa32f19d2d330e4f6a87ea7b34feca3735fc313db075cdc12bf61743f68076ff'
  };

  var clearDatabase = function() {
    var chain = Promise.resolve();

    return chain
      .then(function() {
        return configurationBO.clear();
      })
      .then(function() {
        return addressBO.clear();
      })
      .then(function() {
        return transactionBO.clear();
      })
      .then(function() {
        var p = [];

        p.push(addressBO.registerAddressFromDaemon('ownerId', firstAddress));
        p.push(addressBO.registerAddressFromDaemon('ownerId', secondAddress));

        return Promise.all(p);
      });
  };

  before(function(){
    var chain = Promise.resolve();

    return chain
      .then(function() {
        return server = require('../../src/server');
      })
      .then(function() {
        return clearDatabase();
      })
      .then(function() {
        return starter.configureDefaultSettings();
      });
  });

  after(function(){
    return clearDatabase();
  });

  it('01 - should sinchronize existing addresses from daemon and maintain the pool', function() {
    this.timeout(50000);

    var chain = Promise.resolve();

    return chain
      .then(function() {
        return aapmsWorker.run();
      })
      .then(function() {
        return addressBO.getFreeAddresses();
      })
      .then(function(r) {
        addresses = r;
        expect(r.length).to.be.at.least(10);
      });
  });

  it('01 - should sinchronize blockchain', function() {
    this.timeout(50000);

    var chain = Promise.resolve();

    return chain
      .then(function() {
        return aapmsWorker.run();
      })
      .then(function() {
        return addressBO.getFreeAddresses();
      })
      .then(function(r) {
        addresses = r;
        expect(r.length).to.be.at.least(10);
      });
  });

  it('02 - should create a new address for a ownerId', function() {
    this.timeout(500000);
    var chain = Promise.resolve();

    return chain
      .then(function() {
        return bosWorker.synchronizeToBlockchain();
      })
      .then(function(r) {
        expect(r).to.be.true;
      });
    });

    /*
    it('03 - should create a transaction and update the addresses balance', function() {
      this.timeout(2000000);
      var chain = Promise.resolve();

      return chain
          .then(function() {
            return request(server)
              .post('/v1/ownerId/transactions')
              .send({
                ownerTransactionId: 'ownerTransactionId',
                amount: 1,
                to: secondAddress.address,
                from: firstAddress.address,
              })
              .set('Accept', 'application/json')
              .expect('Content-Type', /json/)
              .expect(201);
        })
        .then(function(res) {
          transactionHash = res.body.transactionHash;

          expect(res.body.createdAt).to.not.be.null;
          expect(res.body.updatedAt).to.not.be.null;
          expect(res.body.transactionHash).to.not.be.null;
          expect(res.body.status).to.be.equal(1);
          expect(res.body.amount).to.be.equal(1);
          expect(res.body.from).to.be.equal(firstAddress.address);
          expect(res.body.to).to.be.equal(secondAddress.address);
          expect(res.body.ownerTransactionId).to.be.equal('ownerTransactionId');
        });
    });
    */
});
