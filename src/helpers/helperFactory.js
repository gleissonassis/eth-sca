var RequestHelper                 = require('./requestHelper');
var DateHelper                    = require('./dateHelper');
var UserHelper                    = require('./userHelper');
var DaemonHelper                  = require('./daemonHelper');
var settings                      = require('../config/settings');
var request                       = require('request');
var Web3                          = require('web3');
var abiDecoder                    = require('abi-decoder');
var FullTokenInterface            = require('../contracts/interfaces/FullToken.json');

module.exports = {
  getHelper: function(helper) {
    switch (helper) {
      case 'daemon':
        var web3 = new Web3();
        web3.setProvider(new web3.providers.HttpProvider(settings.daemonSettings.baseUrl));

        return new DaemonHelper({
          web3: web3,
          abiDecoder: abiDecoder,
          fullTokenInterface: FullTokenInterface
        });
      case 'request':
        return new RequestHelper({
          request: request
        });
      case 'date':
        return new DateHelper();
      case 'user':
        return new UserHelper();
      default:
        return null;
    }
  }
};
