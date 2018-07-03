var express         = require('express');
var load            = require('express-load');
var bodyParser      = require('body-parser');
var morgan          = require('morgan');
var methodOverride  = require('method-override');
var cors            = require('cors');
var settings        = require('./settings');

module.exports = function() {
  var app = express();
  app.set('port', settings.servicePort);

  app.use(bodyParser.urlencoded({extended:true}));
  app.use(bodyParser.json());
  app.use(methodOverride());
  app.use(morgan('dev'));
  app.use(cors());

  load('controllers', {cwd:'src/api', verbose:true})
  .then('routes')
  .into(app);

  return app;
};
