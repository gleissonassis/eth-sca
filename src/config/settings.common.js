var util      = require('util');

module.exports = {
    mongoUrl : util.format('mongodb://%s/%s',
                      process.env.DB_SERVER || 'localhost',
                      process.env.DB_NAME   || 'eth-sca'),
    servicePort : process.env.PORT || 4000,
    isMongoDebug : true,

    defaultSettings: {
      currentBlockNumber: 1000,
    },

    daemonSettings: {
      blocksToProcess: process.env.DAEMON_BLOCKS_TO_PROCESS || 1000,
      contractAddress: process.env.DAEMON_CONTRACT_ADDRESS || '0x25846a23239700e37b06912ca0b39ed64c7bf1c3',
      baseUrl: process.env.DAEMON_BASE_URL || 'http://localhost:8545',
    }
  };
