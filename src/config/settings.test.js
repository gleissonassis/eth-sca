module.exports = {
  mongoUrl : util.format('mongodb://%s/%s',
                    process.env.DB_SERVER || 'localhost',
                    process.env.DB_NAME   || 'eth-sca-test'),
  servicePort : process.env.PORT || 4001,
  isMongoDebug : true,

  defaultSettings: {
    currentBlockNumber: 1000
  },

  daemonSettings: {
    baseUrl: process.env.DAEMON_BASE_URL || 'http://localhost:8545',
  }
};
