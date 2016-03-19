'use strict';

const supertest = require('supertest'),
  should = require('should');

var server = supertest.agent("http://localhost:3000");

describe("API unit test", function () {

  it("should return error 404 page", function (done) {

    server
      .get("/random")
      .expect(404)
      .end(function (err, res) {
        res.status.should.equal(404);
        done();
      });
  });

  it("should return array of objects", function (done) {

    server
      .get("/api/search/acer")
      .expect(200)
      .end(function (err, res) {
        res.status.should.equal(200);
        res.body.error.should.equal(false);
        res.body.should.be.instanceof(Array);
        done();
      });
  });

  it("should return search params warning", function (done) {

    server
      .get("products/search")
      .expect("Content-type", /text\/html/)
      .expect(200)
      .end(function (err, res) {
        res.status.should.equal(200);
        res.body.error.should.equal(false);
        res.body.data.should.equal('Please specify search params');
        done();
      });
  });

  it("should return 2 objects in array", function (done) {

    server
      .get("/routes/search?name=Acer&description=Coverage&priceFrom=300&priceTo=500&page=2&perPage=2")
      .expect(200)
      .end(function (err, res) {
        res.status.should.equal(200);
        res.body.error.should.equal(false);
        res.body.should.be.instanceof(Array).and.have.lengthOf(2);
        done();
      });
  });

  it("should return several objects in array", function (done) {

    server
      .get("/routes/search?name-Acer&priceTo=500")
      .expect(200)
      .end(function (err, res) {
        res.status.should.equal(200);
        res.body.error.should.equal(false);
        res.body.should.be.instanceof(Array);
        done();
      });
  });

  it("should return error 404 page", function (done) {

    server
      .get("/routes/search?name=Acer&description=Coverage&priceFrom=300&priceTo=500&perPage=40")
      .expect(404)
      .end(function (err, res) {
        res.status.should.equal(404);
        done();
      });
  });

});