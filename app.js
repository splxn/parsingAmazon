"use strict";

var express = require('express');
var http = require('http');
var fs = require('fs');
var config = require('./config/config')

var routes = require('./routes/index');

var app = express();

app.set('port', config.port);

app.use('/', routes);

app.use(function(req, res, next) {
  var err = new Error('Your page not found');
  err.status = 404;
  next(err);
});

if (app.get('env') === 'development') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.end('error ' + err);
  });
}

http.createServer(app).listen(app.get('port'), function() {
  console.log('Express server listening on port ' + app.get('port'));
});

