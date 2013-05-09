var hdcore = require('../index'),
    should = require('chai').should();

describe('hdcore', function(){
  it('should be an object', function () {
    hdcore.should.be.an('object');
  });

  it('should have an ApiClient class', function () {
    hdcore.should.have.a.property('ApiClient');
  });

  describe('createClient()', function () {
    it('should exist', function(){
      hdcore.should.respondTo('createClient');
    });

    it('should create an ApiClient object', function () {
      hdcore.createClient().should.be.an.instanceOf(hdcore.ApiClient);
    });

    it('should accept options', function () {
      var opts = {my: 'options', foo: 'bar'};
      var client = hdcore.createClient('foobar','fazbaz',opts);
      client.options.should.contain.keys('my', 'foo');
    });
  });
});
