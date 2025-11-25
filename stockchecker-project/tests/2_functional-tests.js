const chaiHttp = require('chai-http');
const chai = require('chai');
const assert = chai.assert;
const server = require('../server');

chai.use(chaiHttp);

suite('Functional Tests', function() {
  this.timeout(10000);
  
  suite('GET /api/stock-prices => stockData object', function() {
    
    test('1) Viewing one stock', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'goog'})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.property(res.body, 'stockData');
          assert.property(res.body.stockData, 'stock');
          assert.property(res.body.stockData, 'price');
          assert.property(res.body.stockData, 'likes');
          assert.isString(res.body.stockData.stock);
          assert.isNumber(res.body.stockData.price);
          assert.isNumber(res.body.stockData.likes);
          done();
        });
    });
    
    test('2) Viewing one stock and liking it', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'msft', like: 'true'})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isAtLeast(res.body.stockData.likes, 0);
          done();
        });
    });
    
    test('3) Viewing the same stock and liking it again', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: 'msft', like: 'true'})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          // likes should not increase from same IP
          done();
        });
    });
    
    test('4) Viewing two stocks', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['goog', 'amzn']})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.lengthOf(res.body.stockData, 2);
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'rel_likes');
          done();
        });
    });
    
    test('5) Viewing two stocks and liking them', function(done) {
      chai.request(server)
        .get('/api/stock-prices')
        .query({stock: ['aapl', 'tsla'], like: 'true'})
        .end(function(err, res) {
          assert.equal(res.status, 200);
          assert.isArray(res.body.stockData);
          assert.property(res.body.stockData[0], 'rel_likes');
          assert.property(res.body.stockData[1], 'rel_likes');
          done();
        });
    });
    
  });
});
