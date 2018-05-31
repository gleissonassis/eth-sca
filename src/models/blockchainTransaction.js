var mongoose = require('mongoose');
var mongooseSchema =  mongoose.Schema;

var model = null;

module.exports = function(){
  var schema = mongooseSchema({
    blockHash: {
      type: String,
      required: true
    },
    blockNumber: {
      type: Number,
      required: true
    },
    from: {
      type: String,
      required: true
    },
    to: {
      type: String,
      required: false
    },
    value: {
      type: Number,
      required: true,
    },
    gas: {
      type: Number,
      required: true,
    },
    gasPrice: {
      type: Number,
      required: true,
    },
    hash: {
      type: String,
      required: true
    },
    input: {
      type: String,
      required: false
    },
    nonce: {
      type: Number,
      required: true
    },
    transactionIndex: {
      type: Number,
      required: true
    },
    isConfirmed: {
      type: Boolean,
      required: true
    },
    createdAt: {
      type: Date,
      required: false,
    },
    updatedAt: {
      type: Date,
      required: false,
    }
  });

  model = model ? model : mongoose.model('blockchainTransactions', schema);

  return model;
};
