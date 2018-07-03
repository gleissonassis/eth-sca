var BOFactory           = require('../business/boFactory');
var SCAWorker           = require('./scaWorker');
var DateHelper          = require('../helpers/dateHelper');
var HelperFactory       = require('../helpers/helperFactory');

module.exports = {
  getWorker: function(woker) {
    switch (woker) {
      case 'sca':
        return new SCAWorker({
          dateHelper: new DateHelper(),
          eventBO: BOFactory.getBO('event'),
          transactionBO: BOFactory.getBO('transaction'),
          configurationBO: BOFactory.getBO('configuration'),
          daemonHelper: HelperFactory.getHelper('daemon')
        });
      default:
        return null;
    }
  }
};
