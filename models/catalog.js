"use strict";
var mongoose = require('mongoose');
var config = require('../config/config');

mongoose.connect(config.mongoose.uri, config.mongoose.options);

var prodSchema = mongoose.Schema({
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

var schema = mongoose.Schema({
  "text": {
    type: String,
    required: true
  },

  "catalogURL": {
    type: String,
    required: true
  },

  createdAt: {
    type: Date,
    default: Date.now
  },

  "updatedAt": {
    type: String,
    require: true
  },

  "products": {
    type: [prodSchema]
  }
});

schema.pre('update', function () {
  this.update({}, {$set: {updatedAt: new Date()}});
});

module.exports = mongoose.model('Catalog', schema);
