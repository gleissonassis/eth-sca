var TransactionBO               = require('./transactionBO');
var AddressBO                   = require('./addressBO');
var ConfigurationBO             = require('./configurationBO');
var EventBO                     = require('./eventBO');
var DAOFactory                  = require('../daos/daoFactory');
var ModelParser                 = require('../models/modelParser');
var HelperFactory               = require('../helpers/helperFactory');

function factory(dao) {
  switch (dao) {
    case 'event':
      return new EventBO({
        eventDAO: DAOFactory.getDAO('event'),
        modelParser: new ModelParser(),
        dateHelper: HelperFactory.getHelper('date')
      });
    case 'configuration':
      return new ConfigurationBO({
        configurationDAO: DAOFactory.getDAO('configuration'),
        modelParser: new ModelParser(),
        dateHelper: HelperFactory.getHelper('date')
      });
    case 'transaction':
      return new TransactionBO({
        transactionDAO: DAOFactory.getDAO('transaction'),
        modelParser: new ModelParser(),
        dateHelper: HelperFactory.getHelper('date'),
      });
    case 'address':
      return new AddressBO({
        addressDAO: DAOFactory.getDAO('address'),
        modelParser: new ModelParser(),
        dateHelper: HelperFactory.getHelper('date'),
        daemonHelper: HelperFactory.getHelper('daemon'),
        configurationBO: factory('configuration'),
        mutexHelper: HelperFactory.getHelper('mutex')
      });
    default:
      return null;
  }
};

module.exports = {getBO: factory};
