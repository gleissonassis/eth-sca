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
    address: '0x6025961e3F43AeB967f28A0aD88E46860b85def4',
    privateKey: '5f5229964393af1dfe8d595054976ded32a1f9d936c34c2be97dd815b582d286'
  };

  var secondAddress = {
    address: '0xDCbE45343ef103162c1Aa4AACEf80B4D57D0FC40',
    privateKey: 'fb36840407d43d5f13507b0a200c12b5423c0593352a1931dad73ae945b9cb02'
  };

  var contractAddress = '0xc62ca8e3d621f6235f8a5b985b3d6f3169f75f29';

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
      })
      .then(function() {
        var p = [];

        p.push(addressBO.registerAddressFromDaemon('ownerId', firstAddress));
        p.push(addressBO.registerAddressFromDaemon('ownerId', secondAddress));

        return Promise.all(p);
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

  it('01 - should create a new address for a ownerId', function() {
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

  it('02 - should sinchronize blockchain', function() {
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

    it('03 - should create a transaction', function() {
      this.timeout(500000);
      var chain = Promise.resolve();

      return chain
        .then(function() {
          return transactionBO.save({
            from: firstAddress.address,
            to: secondAddress.address,
            amount: 10000
          });
        })
        .then(function(r) {
          expect(r.transactionHash).to.not.be.undefined;
          expect(r.from).to.be.equal(firstAddress.address);
          expect(r.to).to.be.equal(secondAddress.address);
          expect(r.amount).to.be.equal(10000);
        });
    });

    it('04 - should create a new addres for token and mint new tokens', function() {
      this.timeout(500000);
      var chain = Promise.resolve();
      var newAddress = null;

      return chain
        .then(function() {
          return addressBO.createAddressFromDaemon('ownerId', contractAddress);
        })
        .then(function(r) {
          newAddress = r;
          expect(r.token.contractAddress).to.be.equal(contractAddress);
          return transactionBO.save({
            from: firstAddress.address,
            to: newAddress.address,
            amount: 0,
            token: {
              contractAddress: contractAddress,
              method: {
                name: 'mint',
                params: {
                  to: newAddress.address,
                  amount: 10000
                }
              }
            }
          })
          .then(function(r) {
            expect(r.transactionHash).to.not.be.undefined;
            expect(r.from).to.be.equal(firstAddress.address);
            expect(r.to).to.be.equal(newAddress.address);
            expect(r.amount).to.be.equal(0);

            return addressBO.getByAddress(null, newAddress.address);
          })
          .then(function(r) {
            expect(r.token.balance.available).to.be.equal(10000);
          });
        });
    });

    it('04 - should create a new addres for token and transfer tokens', function() {
      this.timeout(500000);
      var chain = Promise.resolve();
      var newAddress = null;

      return chain
        .then(function() {
          return addressBO.createAddressFromDaemon('ownerId', contractAddress);
        })
        .then(function(r) {
          newAddress = r;
          expect(r.token.contractAddress).to.be.equal(contractAddress);

          return transactionBO.save({
            from: firstAddress.address,
            to: newAddress.address,
            amount: 0,
            token: {
              contractAddress: contractAddress,
              method: {
                name: 'transfer',
                params: {
                  to: newAddress.address,
                  amount: 1
                }
              }
            }
          })
          .then(function(r) {
            expect(r.transactionHash).to.not.be.undefined;
            expect(r.from).to.be.equal(firstAddress.address);
            expect(r.to).to.be.equal(newAddress.address);
            expect(r.amount).to.be.equal(0);

            return addressBO.getByAddress(null, newAddress.address);
          })
          .then(function(r) {
            expect(r.token.balance.available).to.be.equal(1);
          });
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
