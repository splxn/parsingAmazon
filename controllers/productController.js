"use strict";

var Product = require('../models/product');

var productController = function(req, res) {

  if (!req.query.title && !req.query.description) {

    res.send('Please specify search params');

  } else {

    let regTitle = new RegExp(req.query.title, 'i');
    let regDescription = new RegExp(req.query.description, 'i');

    if (!req.query.priceFrom) {req.query.priceFrom = 0}
    if (!req.query.priceTo) {req.query.priceTo = 1000000}

    Product
      .find({ $and: [ {'title': regTitle },
                      {'description': regDescription},
                      {'price': { $gte : Number(req.query.priceFrom),
                                  $lte : Number(req.query.priceTo)}}] },
        {'images': 0, '_id': 0, '__v': 0})
      .skip(Number(req.query.page) * Number(req.query.perPage))
      .limit(Number(req.query.perPage))
      .then((data) => {res.end(JSON.stringify(data, null, 2))})
      .catch((err) => {next(err)});
  }
};

module.exports = productController;