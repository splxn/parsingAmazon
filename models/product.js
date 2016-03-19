"use strict";

var mongoose = require('mongoose');
var config = require('../config/config');

//mongoose.connect(config.mongoose.uri, config.mongoose.options);

var schema = mongoose.Schema({
  "title": {
    type: String,
    required: true
  },

  "description": {
    type: String,
    required: true
  },

  "price": {
    type: Number,
    validate: {
      validator: function (price) {
        return /\d+(\.\d{2})?/.test(price);
      },
      message: 'Price is not valid'
    }
  },

  "images": {
    type: []
  },

  "createdAt": {
    type: Date,
    required: true
  }
});

module.exports = mongoose.model('Product', schema);