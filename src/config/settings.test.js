module.exports = {
    mongoUrl : 'mongodb://localhost/eth-services-test',
    servicePort : 4100,
    isMongoDebug : true,

    defaultSettings: {
      minimumConfirmations: 3,
      minimumAddressPoolSize: 10,
      transactionNotificationAPI: 'http://localhost:3001/v1/transactions/notifications',
    },

    daemonSettings: {
      previousBlocksToCheck: 12,
      baseUrl: 'http://localhost:7545',
    }
};
