module.exports = function(dependencies) {
  var web3 = dependencies.web3;
  var abiDecoder = dependencies.abiDecoder;
  var fullTokenInterface = dependencies.fullTokenInterface;

  abiDecoder.addABI(fullTokenInterface.abi);

  return {
    setDependencies: function(dependencies) {
      if (dependencies.web3) {
        web3 = dependencies.web3;
      }
      if (dependencies.abiDecoder) {
        abiDecoder = dependencies.abiDecoder;
      }

      if (dependencies.fullTokenInterface) {
        fullTokenInterface = dependencies.fullTokenInterface;
      }
    },

    getBalance: function(address) {
      return web3.eth.getBalance(address);
    },

    getTokenBalance: function(address, contractAddress) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();

        chain
          .then(function() {
            try {
              var token = new web3.eth.Contract(fullTokenInterface.abi, contractAddress);
              return token.methods.balanceOf(address).call();
            } catch (e) {
              throw e;
            }
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getAllEvents: function(contractAddress, fromBlock, toBlock) {
      return new Promise(function(resolve, reject) {
        var chain = Promise.resolve();
        var token = new web3.eth.Contract(fullTokenInterface.abi, contractAddress);

        chain
          .then(function() {
            return token.getPastEvents('allEvents', {
              fromBlock: fromBlock,
              toBlock: toBlock
            });
          })
          .then(resolve)
          .catch(reject);
      });
    },

    getBlockNumber: function() {
      return web3.eth.getBlockNumber();
    },

    getTransaction: function(hash) {
      return web3.eth.getTransaction(hash);
    },

    getBlock: function(hash) {
      return web3.eth.getBlock(hash);
    },
  };
};
