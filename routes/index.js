'use strict';

const express = require('express');
const router = express.Router();

const productController = require('../controllers/productController');
const catalogController = require('../controllers/catalogController');

router.get('/api/search/:product', catalogController);

router.get('/products/search', productController);

module.exports = router;