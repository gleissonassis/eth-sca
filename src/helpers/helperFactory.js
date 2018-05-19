var RequestHelper           = require('./requestHelper');
var DateHelper              = require('./dateHelper');
var SendMailHelper          = require('./sendMailHelper');
var DynamicTextHelper       = require('./dynamicTextHelper');
var StringReplacerHelper    = require('./stringReplacerHelper');
var UserHelper              = require('./userHelper');
var JWTHelper               = require('./jwtHelper');
var MutexHelper             = require('./mutexHelper');
var DaemonHelper            = require('./daemonHelper');
var settings                = require('../config/settings');
var request                 = require('request');
var nodemailer              = require('nodemailer');
var mutex                   = require( 'node-mutex' );
var Web3                    = require('web3');

var web3 = new Web3();
web3.setProvider(new web3.providers.HttpProvider(settings.daemonSettings.baseUrl));

module.exports = {
  getHelper: function(helper) {
    switch (helper) {
      case 'daemon':
        return new DaemonHelper({
          web3: web3
        });
      case 'mutex':
        return new MutexHelper({
          mutex: mutex(settings.mutex)
        });
      case 'request':
        return new RequestHelper({
          request: request
        });
      case 'date':
        return new DateHelper();
      case 'sendMail':
        return new SendMailHelper({
          nodemailer: nodemailer
        });
      case 'stringReplacer':
        return new StringReplacerHelper();
      case 'user':
        return new UserHelper();
      case 'jwt':
        return new JWTHelper();
      case 'dynamicText':
        return new DynamicTextHelper({
          stringReplacerHelper: this.getHelper('stringReplacer')
        });
      default:
        return null;
    }
  }
};
