# async-helpers [![NPM version](https://badge.fury.io/js/async-helpers.svg)](http://badge.fury.io/js/async-helpers)  [![Build Status](https://travis-ci.org/doowb/async-helpers.svg)](https://travis-ci.org/doowb/async-helpers)

> Use async helpers in templates with engines that typically only handle sync helpers. Handlebars and Lodash have been tested.

## Install with [npm](npmjs.org)

```bash
npm i async-helpers --save
```

## Usage

```js
var asyncHelpers = require('async-helpers');
```

## API
### [AsyncHelpers](index.js#L25)

Create a new instance of AsyncHelpers

* `returns` **{Object}**: new AsyncHelpers instance  

```js
var asyncHelpers = new AsyncHelpers();
```

### [.set](index.js#L61)

Add a helper to the cache.

* `name` **{String}**: Name of the helper    
* `fn` **{Function}**: Helper function    
* `returns` **{Object}**: Returns `this` for chaining  

```js
asyncHelpers.set('upper', function (str, cb) {
  cb(null, str.toUpperCase());
});
```

### [.get](index.js#L84)

Get all helpers or a helper with the given name.

* `name` **{String}**: Optionally pass in a name of a helper to get.    
* `options` **{Object}**: Additional options to use.    
* `returns` **{Function|Object}**: Single helper function when `name` is provided, otherwise object of all helpers  

```js
var helpers = asyncHelpers.get();
var wrappedHelpers = helperAync.get({wrap: true});
```

### [.wrap](index.js#L178)

Wrap a helper with async handling capibilities.

* `name` **{String}**: Optionally pass the name of the helper to wrap    
* `returns` **{Function|Object}**: Single wrapped helper function when `name` is provided, otherwise object of all wrapped helpers.  

```js
var wrappedHelper = asyncHelpers.wrap('upper');
var wrappedHelpers = asyncHelpers.wrap();
```

### [.reset](index.js#L199)

Reset all the stashed helpers.

* `returns` **{Object}**: Returns `this` to enable chaining  

```js
asyncHelpers.reset();
```

### [.resolve](index.js#L222)

Resolve a stashed helper by the generated id.

* `key` **{String}**: ID generated when from executing a wrapped helper.    
* `cb` **{Function}**: Callback function with the results of executing the async helper.    

```js
var upper = asyncHelpers.get('upper', {wrap: true});
var id = upper('doowb');
asyncHelpers.resolve(id, function (err, result) {
  console.log(result);
  //=> DOOWB
});
```

## Run tests
Install dev dependencies:

```bash
npm i -d && npm test
```

## Contributing
Pull requests and stars are always welcome. For bugs and feature requests, [please create an issue](https://github.com/doowb/async-helpers/issues)

## Author

**Brian Woodward**

+ [github/doowb](https://github.com/doowb)
+ [twitter/doowb](http://twitter.com/doowb)

## License
Copyright (c) 2015 Brian Woodward  
Released under the MIT license

***

_This file was generated by [verb-cli](https://github.com/assemble/verb-cli) on April 22, 2015._
