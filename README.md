# hdcore-js

![image](https://travis-ci.org/hostdime/hdcore-js.png)

A simple wrapper around [HostDime.com](http://www.hostdime.com/)'s client API.

## Install

    npm install hdcore

## Usage

~~~js
var hdcore = require('hdcore');
var client = hdcore.createClient('public_key', 'private_key');
~~~

~~~js
client.call('server.list', function(err, servers){
  if (err)
    return console.error(err);
  
  servers.forEach(function(server) {
    console.log(server.name);
  });
});
~~~

### hdcore.createClient(public_key, private_key, options)

Creates the API object. `options` is an optional object with the following acceptable properties:

* `endpoint` - The URL to the API endpoint. This defaults to `https://api.hostdime.com/v1`
* `sandbox` - Toggles a sandbox mode that prevents any changes to your account, which is useful for testing and development purposes. This defaults to `false`


### client.call(api_method[, opts], callback)

Calls the API method, with an optional `options` object. `callback` is a function which is invoked with the following two arguments:

* `err` - An error object, if an error occurred, otherwise `null`.
* `result` - The result object, if successful, otherwise `null`.

    
## Reference

For a comprehensive overview of the HostDime API, please see our [API reference](https://api.hostdime.com/docs/).

## License - MIT

Copyright © 2013 HostDime.com, Inc.

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
