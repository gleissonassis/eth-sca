var Decimal         = require('decimal.js');

module.exports = function(dependencies) {
  var web3 = dependencies.web3;
  var abiDecoder = dependencies.abiDecoder;
  var erc20Interface = dependencies.erc20Interface;
  var erc865Interface = dependencies.erc865Interface;
  var mintableTokenInterface = dependencies.mintableTokenInterface;

  abiDecoder.addABI(erc20Interface.abi);
  abiDecoder.addABI(erc865Interface.abi);
  abiDecoder.addABI(mintableTokenInterface.abi);

  return {
    setDependencies: function(dependencies) {
      if (dependencies.web3) {
        web3 = dependencies.web3;
      }
      if (dependencies.abiDecoder) {
        abiDecoder = dependencies.abiDecoder;
      }
      if (dependencies.erc20Interface) {
        erc20Interface = dependencies.erc20Interface;
      }
      if (dependencies.mintableTokenInterface) {
        mintableTokenInterface = dependencies.mintableTokenInterface;
      }
    },

    createAddress: function() {
      return new Promise(function(resolve) {
        var newAddress = web3.eth.accounts.create();
        resolve(newAddress);
      });
    },

    getBalance: function(address) {
      return web3.eth.getBalance(address);
    },

    estimateGas: function(transaction) {
      return web3.eth.estimateGas(transaction);
    },

    getGasPrice: function() {
      return web3.eth.getGasPrice();
    },

    getBlockNumber: function() {
      return web3.eth.getBlockNumber();
    },

    getTransactions: function(from, to) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();
        var transactions = [];

        return chain
          .then(function() {
            var p = [];

            for (var i = from; i <= to; i++) {
              p.push(web3.eth.getBlock(i, true));
            }

            return Promise.all(p);
          })
          .then(function(r) {
            r.forEach(function(block) {
              if (block && block.transactions) {
                transactions = transactions.concat(block.transactions);
              }
            });
            return transactions;
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getTransaction: function(hash) {
      return web3.eth.getTransaction(hash);
    },

    sendTransaction: function(transaction, privateKey) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        return chain
          .then(function() {
            return web3.eth.accounts.wallet.add(privateKey);
          })
          .then(function(r) {
            if (r) {
              return web3.eth.sendTransaction(transaction);
            } else {
              return false;
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    parseTokenTransferPreSignedMethod: function(decoded) {
      var r = {
        method: 'transferPreSigned',
        params: {
          signature: '',
          to: '',
          amount: 0,
          fee: 0,
          nonce: 0
        }
      };

      decoded.params.forEach(function(item) {
        switch (item.name) {
          case '_signature':
            r.params.signature = item.value;
            break;
          case '_fee':
            r.params.fee = new Decimal(item.value).toNumber();
            break;
          case '_nonce':
            r.params.nonce = new Decimal(item.value).toNumber();
            break;
          case '_to':
            r.params.to = item.value;
            break;
          case '_value':
            r.params.amount = new Decimal(item.value).toNumber();
            break;
        }
      });

      return r;
    },

    parseTokenTransferMethod: function(decoded) {
      var r = {
        method: 'mint',
        params: {
          to: '',
          amount: 0
        }
      };

      decoded.params.forEach(function(item) {
        switch (item.name) {
          case '_to':
            r.params.to = item.value;
            break;
          case '_value':
            r.params.amount = new Decimal(item.value).toNumber();
            break;
        }
      });

      return r;
    },

    parseTokenMintMethod: function(decoded) {
      var r = {
        method: 'mint',
        params: {
          to: '',
          amount: 0
        }
      };

      decoded.params.forEach(function(item) {
        switch (item.name) {
          case '_to':
            r.params.to = item.value;
            break;
          case '_amount':
            r.params.amount = new Decimal(item.value).toNumber();
            break;

        }
      });

      return r;
    },

    parseTokenInputData: function(input) {
      var self = this;

      return new Promise(function(resolve, reject) {
        var decoded = abiDecoder.decodeMethod(input);

        try {
          switch (decoded.name) {
            case 'mint':
              resolve(self.parseTokenMintMethod(decoded));
              break;
            case 'transfer':
              resolve(self.parseTokenTransferMethod(decoded));
              break;
            case 'transferPreSigned':
              resolve(self.parseTokenTransferPreSignedMethod(decoded));
              break;
            default:
              reject('method not found ' + decoded.name);
          }
        } catch (e) {
          reject(e);
        }
      });
    }
  };
};
