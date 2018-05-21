var util      = require('util');

module.exports = {
    mongoUrl : util.format('mongodb://%s/%s',
                      process.env.DB_SERVER || 'localhost',
                      process.env.DB_NAME   || 'eth-services'),
    servicePort : process.env.PORT || 4000,
    isMongoDebug : true,
    jwt: {
      secret: 'SECRET_DEV',
      expiresIn: '1h'
    },

    defaultSettings: {
      minimumConfirmations: 6,
      minimumAddressPoolSize: 100,
      currentBlockNumber: 1000,
      transactionNotificationAPI: process.env.NOTIFICATION_API_ADDRESS || 'http://localhost:3000/v1/transactions/notifications'
    },

    mutex: {
    },

    daemonSettings: {
      previousBlocksToCheck: 100,
      baseUrl: process.env.DAEMON_BASE_URL || 'https://ropsten.infura.io',
    }
  };
