var request     = require('request'),
    crypto      = require('crypto'),
    url         = require('url'),
    querystring = require('querystring');

function ApiClient(public_key, private_key, options) {
  this.public_key  = public_key;
  this.private_key = private_key;
  this.options = options || {};

  if (this.options.endpoint === undefined) {
    this.options.endpoint = url.parse('https://api.hostdime.com/v1');
  } else if (typeof this.options.endpoint === 'string') {
    this.options.endpoint = url.parse(this.options.endpoint);
  }

  if (this.options.sandbox === undefined) {
    this.options.sandbox = false;
  }
}

ApiClient.prototype.call = function(action, parameters, callback) {
  if (typeof(parameters) == 'function')
  {
    callback   = parameters;
    parameters = {};
  }

  var timestamp      = this.generateTimestamp();
  var uuid           = this.generateUuid();
  var hash           = this.generateHash(action, parameters, timestamp, uuid);
  var query_object   = this.generateQueryObject(parameters, timestamp, uuid, hash);
  var action_url     = this.generateUrl(action, query_object);

  request.get(action_url, function(err, res, body){
    try {
      var result = JSON.parse(body);
    } catch (e) {
      return callback(new Error('Invalid JSON returned'), null);
    }

    if (err)
      return callback(err, null);
    else if (result.error)
      return callback(new Error(result.error.message), null);
    else
      return callback(null, result.response);
  });
};

ApiClient.prototype.generateUrl = function(action, query_object) {
  var action_url   = Object.create(this.options.endpoint);
  
  action_url.pathname  = action_url.pathname.split('/').join('/')+'/';
  action_url.pathname += action.split('.').join('/');
  action_url.pathname += '.json';
  action_url.search   = querystring.stringify(query_object);

  return url.format(action_url);
}

ApiClient.prototype.generateTimestamp = function() {
  return Math.round(new Date()/1000);
}

ApiClient.prototype.generateQueryObject = function(parameters, timestamp, uuid, hash) {
  var query_object = parameters || {};

  query_object.api_key       = this.public_key;
  query_object.api_timestamp = timestamp;
  query_object.api_hash      = hash;
  query_object.api_unique    = uuid;

  if (this.options.sandbox)
    query_object.testing = true;

  return query_object; 
}

ApiClient.prototype.generateHash = function(action, parameters, timestamp, uuid) {
  var parameters = parameters || {};

  var string = [
    timestamp,
    uuid,
    this.private_key,
    action,
    JSON.stringify(JSON.stringify(parameters))
  ].join(':');

  return crypto.createHash('SHA256').update(string).digest('hex');
};

ApiClient.prototype.generateUuid = function() {
  var delim = "-";

  function S4() {
      return (((1 + Math.random()) * 0x10000) | 0).toString(16).substring(1);
  }

  return (S4() + S4() + delim + S4() + delim + S4() + delim + S4() + delim + S4() + S4() + S4());
}

exports.ApiClient = ApiClient;

// FACTORY

var createClient = function(public_key, private_key, options) {
  return new ApiClient(public_key, private_key, options);
}

exports.createClient = createClient;
