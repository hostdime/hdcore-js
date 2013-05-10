var hdcore  = require('../index'),
    should  = require('chai').should(),
    sinon   = require('sinon'),
    https   = require('https');

describe('ApiClient', function () {
  var client;

  beforeEach(function(){
    client = hdcore.createClient('foobar','fazbaz');
  });

  describe('ApiClient()', function(){
    it('should be a function', function () {
      hdcore.ApiClient.should.be.a('function');
    });

    it('should have a public key', function () {
      should.exist(client.public_key);
    });

    it('should have a private key', function () {
      should.exist(client.private_key);
    });

    it('should let you set the public key', function () {
      client.public_key.should.equal('foobar');
    });

    it('should let you set the private key', function () {
      client.private_key.should.equal('fazbaz');
    });

    it('should accept an options object', function () {
      var opts = {my: 'options', foo: 'bar'};
      var client = new hdcore.ApiClient('foobar','fazbaz',opts);
      client.options.should.contain.keys('my', 'foo');
    });

    it('should have a default end point', function () {
      var client = new hdcore.ApiClient();
      client.options.should.have.a.property('endpoint');
    });

    it('should allow you to set the endpoint', function(){
      var url = require('url');
      var client = new hdcore.ApiClient(null,null,{endpoint:'foobar'});
      client.options.endpoint.should.deep.equal(url.parse('foobar'));
    });

    it('should not default to sandboxed mode', function(){
      client.options.sandbox.should.be.false;
    });

    it('should allow you to enable sandboxed mode', function(){
      var client = new hdcore.ApiClient(null,null,{sandbox:true});
      client.options.sandbox.should.be.true;
    });
  });

  describe('#generateTimestamp()', function () {
    it('should exist', function () {
      hdcore.ApiClient.should.respondTo('generateTimestamp');
    });

    it('should return a number', function () {
      client.generateTimestamp().should.be.a('number');
    });

    it('should be in seconds', function(){
      var clock = sinon.useFakeTimers();
      var start = client.generateTimestamp();
      
      clock.tick(1000);
      
      (client.generateTimestamp() - start).should.be.equal(1);

      clock.restore();
    });

    it('should be the current time', function () {
      var clock = sinon.useFakeTimers();

      var now = Math.round((new Date)/1000);
      client.generateTimestamp().should.be.equal(Math.round((new Date)/1000));

      clock.restore();
    });
  });

  describe('#generateUrl()', function () {
    var url = require('url');
    var querystring = require('querystring');

    it('should exist', function () {
      hdcore.ApiClient.should.respondTo('generateUrl');
    });

    it('should return a string', function () {
      client.generateUrl('utility.echo').should.be.a('string');
    });

    it('should begin with the endpoint url', function(){
      client.generateUrl('utility.echo').should.match(new RegExp('^'+url.format(client.options.endpoint)));
    });

    it('should contain the action in path format', function(){
      var action = 'this.is.a.really.long.action';
      client.generateUrl(action).should.contain(action.split('.').join('/'))
    });

    it('should contain the querystringified parameters', function(){
      var parameters = {foo:'bar',faz:'baz',one:'two',three:4,five:['six','seven','eight']};
      client.generateUrl('utility.echo', parameters).should.contain(querystring.stringify(parameters));
    });

    it('should request json', function(){
      client.generateUrl('utility.echo').should.match(/\.json$/);
    });
  });

  describe('#generateUuid()', function () {
    it('should exist', function () {
      hdcore.ApiClient.should.respondTo('generateUuid');
    });

    it('should return a string', function(){
      client.generateUuid().should.be.a('string');
    });

    it('should return a different string each time', function(){
      client.generateUuid().should.not.equal(client.generateUuid());
    });
  });

  describe('#generateHash()', function(){
    it('should exist', function(){
      hdcore.ApiClient.should.respondTo('generateHash');
    });

    it('should return a string', function(){
      client.generateHash().should.be.a('string');
    });

    it('should return a hexadecimal string', function(){
      client.generateHash().should.match(/^[A-Za-z0-9]+$/g);
    });

    // as "timestamp:uuid:private_key:action:json encoded parameters"
    it('should be formatting the hashed string correctly', function(){
      var crypto = require('crypto');
      
      var stub = sinon.stub(crypto, 'createHash').returns({
        update: function(input) { return {
            digest: function() { return input; }
          }
        }
      });

      client.private_key = "private_key";
      client.generateHash('action', 'parameters', 'timestamp', 'uuid').should.equal(
        'timestamp:uuid:private_key:action:'+JSON.stringify(JSON.stringify('parameters'))
      );

      stub.restore();
    });
  });

  describe('#generateQueryObject()', function(){
    it('should exist', function () {
      hdcore.ApiClient.should.respondTo('generateQueryObject');
    });

    it('should return an object', function(){
      client.generateQueryObject().should.be.an('object');
    });

    it('result should have an `api_key` key', function(){
      client.generateQueryObject().should.contain.keys(['api_key']);
    });

    it('result should have an `api_timestamp` key', function(){
      client.generateQueryObject().should.contain.keys(['api_timestamp']);
    });

    it('result should have an `api_hash` key', function(){
      client.generateQueryObject().should.contain.keys(['api_hash']);
    });

    it('result should have an `api_unique` key', function(){
      client.generateQueryObject().should.contain.keys(['api_hash']);
    });

    it('result\'s `api_key` field should equal the public key', function(){
      client.generateQueryObject().api_key.should.equal(client.public_key);
    });

    it('result\'s `api_timestamp` field should equal the passed parameter', function(){
      client.generateQueryObject(null, 'timestamp', 'uuid', 'hash').api_timestamp.should.equal('timestamp');
    });

    it('result\'s `api_hash` field should equal the passed parameter', function(){
      client.generateQueryObject(null, 'timestamp', 'uuid', 'hash').api_hash.should.equal('hash');
    });

    it('result\'s `api_unique` field should equal the passed parameter', function(){
      client.generateQueryObject(null, 'timestamp', 'uuid', 'hash').api_unique.should.equal('uuid');
    });

    it('result should contain the passed parameter object', function(){
       client.generateQueryObject({foo:'bar',faz:'baz'}).should.contain.keys(['foo','faz']);
    });

    it('result should have `testing` field when sandbox is enabled', function(){
      client = hdcore.createClient('foobar','fazbaz', {sandbox: true});
      client.generateQueryObject().should.contain.keys(['testing']);
      client.generateQueryObject().testing.should.be.true;
    });
  });

  describe('#call()', function () {
    var client, callback, request, response;

    beforeEach(function(){
      client   = hdcore.createClient('foobar','fazbaz');
      callback = sinon.spy();
      
      request  = sinon.stub(https, 'get');
      request.on = sinon.stub();
      request.returns({
        on: request.on
      });

      response = {
        on: sinon.stub()
      };
      response.on.withArgs('end').yields();
    });

    afterEach(function(){
      if (request) request.restore();
    });

    it('should exist', function () {
      hdcore.ApiClient.should.respondTo('call');
    });

    it('should call the callback when the request is complete', function(){
      response.on.withArgs('data').yields("{}");
      request.yields(response);

      client.call('utility.echo', callback);

      callback.called.should.be.true;
    });

    it('should only call the callback once', function(){
      response.on.withArgs('data').yields("{}");
      request.yields(response);

      client.call('utility.echo', callback);

      callback.calledOnce.should.be.true;
    });

    it('should handle network errors gracefully', function(){
      request.on.withArgs('error').yields(new Error('Some error message'));

      client.call('utility.echo', callback);

      should.exist(callback.lastCall.args[0]);
      callback.lastCall.args[0].should.be.instanceOf(Error);
      callback.lastCall.args[0].message.should.equal('Some error message');
    });

    it('should handle invalid API output gracefully', function(){
      response.on.withArgs('data').yields("<strong>this isn't valid json</strong>");
      request.yields(response);

      client.call('utility.echo', callback);

      should.exist(callback.lastCall.args[0]);
      callback.lastCall.args[0].should.be.instanceOf(Error);
    });

    it('should pass a result to a successful request', function(){
      response.on.withArgs('data').yields(JSON.stringify({
        error: null,
        response: {}
      }));
      request.yields(response);

      client.call('utility.echo', callback);

      should.exist(callback.lastCall.args[1]);
    });

    it('should pass an error to an unsuccessful request', function(){
      response.on.withArgs('data').yields(JSON.stringify({
        error: {},
        response: null
      }));
      request.yields(response);

      client.call('utility.echo', callback);

      should.exist(callback.lastCall.args[0]);
    });

    it('should not pass an error to a successful request', function(){
      response.on.withArgs('data').yields(JSON.stringify({
        error: null,
        response: {}
      }));
      request.yields(response);

      client.call('utility.echo', callback);

      should.not.exist(callback.lastCall.args[0]);
    });

    it('should not pass a result to an unsuccessful request', function(){
      response.on.withArgs('data').yields(JSON.stringify({
        error: {},
        response: null
      }));
      request.yields(response);

      client.call('utility.echo', callback);

      should.not.exist(callback.lastCall.args[1]);
    });

    it('should pass an error as an object', function(){
      response.on.withArgs('data').yields(JSON.stringify({error:{}}));
      request.yields(response);

      client.call('utility.echo', callback);

      callback.lastCall.args[0].should.be.an('object');
    });

    it('should pass an error as an error object', function(){
      response.on.withArgs('data').yields(JSON.stringify({error:{}}));
      request.yields(response);

      client.call('utility.echo', callback);

      callback.lastCall.args[0].should.be.instanceOf(Error);
    });

    it('should pass a response as an object', function(){
      response.on.withArgs('data').yields(JSON.stringify({response:{}}));
      request.yields(response);

      client.call('utility.echo', callback);

      callback.lastCall.args[1].should.be.an('object');
    });

    it('should pass back an equivalent object when calling utility.echo', function(){
      var obj = {
        foo: "bar",
        test: {
          faz: "baz",
          numbers: [14,15,51,235,15,626,359]
        }
      };

      response.on.withArgs('data').yields(JSON.stringify({response:obj}));
      request.yields(response);

      client.call('utility.echo', callback);

      callback.lastCall.args[1].should.deep.equal(obj);
    });
  });
});
