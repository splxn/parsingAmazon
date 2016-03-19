"use strict";

const express = require('express');
const fs = require('fs');
const productModel = require('../models/product');
const request = require('request');
const _ = require('lodash');
const path = require('path');
const mongoose = require('mongoose');

const regParse = /http:\/\/www\.amazon\.com\/(\w|\d|-)*\/dp\/[a-z|0-9]{10}\//gi;
const regPrice = /<span (id="priceblock_(ourprice|saleprice)*")* class="a-size-medium a-color-price">\$\d+\.\d{2}<\/span>/g;
const regTitle = /<span id="productTitle" class="a-size-large">.+<\/span>/g;
const regDesc = /<span class="a-list-item">[^<]*<\/span>/g;
const regImages = /http:\/\/ecx\.images-amazon\.com\/images\/I\/[a-z|0-9]{11}\.*\.jpg/gi;

const memCache = {
  client: require('memjs').Client.create(),

  getData: function (url) {
    return new Promise((resolve, reject) => {
      this.client.get(url, function (err, page) {
        if(err) reject(err);
        resolve(page);
      })
    })
  },

  setData: function (url, page) {
    return new Promise((resolve, reject) => {
      this.client.set(url, page, function (err, val) {
        if(err) reject('Memcache set data error');
        resolve(page);
      }, 600)
    })
  }
};

function Product(file) {

  function getTitle() {
    let title = file.match(regTitle);
    if (title) {
      title.forEach((item, index) => {
        title[index] = item.slice(45, -7);
      });
      return title.toString();
    } else {
      return 'no title';
    }
  }

  function getDescription() {
    var description = file.match(regDesc);
    if (description) {
      description.forEach((item, index) => {
        description[index] = item.slice(27, -7);
      });
      return description.toString().trim();
    } else {
      return 'no description';
    }
  }

  function getImages() {
    let img = file.match(regImages);
    return _.sortedUniq(img);
  }

  function getPrice() {
    let price = file.match(regPrice);
    if (price) {
      price.forEach((item, index) => {
        price[index] = item.slice(68, -7);
      });
      return parseFloat(price).toFixed(2);
    } else {
      return 'no price';
    }
  }

  return {
    title: getTitle(),
    description: getDescription(),
    price: getPrice(),
    images: getImages(),
    createdAt: new Date()
  }
}

function downloadPage(url) {
  return new Promise((resolve, reject) => {
    request({
      method: 'GET',
      uri: url,
      headers: {
        'User-Agent': 'Webkit'
      }
    }, function (error, response, page) {
      if(error) reject('Cannot get page');

      resolve(page);
    })
  })
}

function catalogController(req, res) {

  let product = req.params.product;

  processCatalog('http://www.amazon.com/s?field-keywords=' + product);

  function processCatalog(url) {

    getPage(url)
      .then((page) => getProductURLs(page))
      .then((arrOfURLs) => processProducts(arrOfURLs))
      .then((productsArray) => {
        return productsArray;
      })
      .then((productsArray) => toJSONFile(productsArray))
      .then(() => {
        let file = fs.readFileSync('../products.json');
        res.end(file.toString())
      })
      .catch((error) => {
        console.log(error);
      });

    function getPage(url) {

      return new Promise((resolve, reject) => {

        memCache.getData(url)
          .then((page) => {
              if(page) {
                page.toString();
                resolve(page);
              } else {
                downloadPage(url)
                  .then(memCache.setData(url, page))
              }
            })
          .then((page) => resolve(page))
          .catch((err) => reject(err));
      });
    }

    function getProductURLs(page) {

      let arrOfURLs = page.match(regParse);
      return _.sortedUniq(arrOfURLs);
    }

    function processProducts(arrOfURLs) {

      return new Promise((resolve, reject) => {
        let productsObjects = [];
        let URLs = arrOfURLs.length;
        let counter = 0;

        arrOfURLs.forEach((url) => {
          memCache.getData(url)
            .then((page) => {
              if(!page) {
                downloadPage(url)
              } else {
                try {
                  counter++;
                  pushToMongo(page, resolve, productsObjects, URLs, counter);
                } catch(e) {
                  reject('MongoDB error')
                }
              }
            })
            .then((page) => memCache.setData(url, page))
            .then((page) => pushToMongo(page, resolve, productsObjects, URLs, counter))
            .catch((err) => reject(err));
        });
      })
    }

    function pushToMongo(page, resolve, productsArray, URLs, counter) {
      let htmlPage = page.toString();
      let p = new Product(htmlPage);
      productsArray.push(p);

      let product = new productModel({
        title: p.title,
        description: p.description,
        price: p.price,
        images: p.images,
        created: new Date()
      });

      product.save(function (err) {
        if (err) throw new Error(err.message);
        if (counter == URLs.length) {
          resolve(productsArray)
        }
      })
    }

    function toJSONFile(productsArray) {
      return new Promise((resolve, reject) => {
        fs.writeFile('../products.json', JSON.stringify(productsArray, null, 2), function (err) {
          if (err) reject('Writing file error');
          resolve();
        });
      })
    }
  }
}

module.exports = catalogController;