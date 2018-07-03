var ConfigurationDAO            = require('./configurationDAO');
var EventDAO                    = require('./eventDAO');
var AddressDAO                  = require('./addressDAO');
var TransactionDAO              = require('./transactionDAO');

module.exports = {
  getDAO: function(dao) {
    switch (dao) {
      case 'event':
        return new EventDAO();
      case 'transaction':
        return new TransactionDAO();
      case 'address':
        return new AddressDAO();
      case 'configuration':
        return new ConfigurationDAO();
      default:
        return null;
    }
  }
};
