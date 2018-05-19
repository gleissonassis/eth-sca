module.exports = function(dependencies) {
  var web3 = dependencies.web3;

  return {
    createAddress: function() {
      return web3.eth.accounts.create();
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

    sendTransaction: function(transaction, from) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        return chain
          .then(function() {
            return web3.eth.accounts.wallet.add(from);
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
    }
  };
};
