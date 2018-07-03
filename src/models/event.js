var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    address: {
      type: String,
      required: true
    },
    blockHash: {
      type: String,
      required: true
    },
    transactionHash: {
      type: String,
      required: true
    },
    blockNumber: {
      type: Number,
      required: true
    },
    returnValues: {
      type: Object,
      required: true
    },
    eventName: {
      type: String,
      required: true,
    },
    signature: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Number,
      required: true
    },
    date: {
      type: Date,
      required: true
    },
    createdAt: {
      type: Date,
      required: false,
    },
    eventId: {
      type: String,
      required: true
    }
  });

  model = model ? model : mongoose.model('events', schema);

  return model;
};
