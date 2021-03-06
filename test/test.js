'use strict';

require('mocha');
var assert = require('assert');
var co = require('co');
var AsyncHelpers = require('../');
var asyncHelpers = null;

describe('async-helpers', function() {
  beforeEach(function() {
    AsyncHelpers.globalCounter = 0;
    asyncHelpers = new AsyncHelpers();
  });

  describe('set', function() {
    it('should set a sync helper', function() {
      var upper = function(str) {
        return str.toUpperCase();
      };
      asyncHelpers.set('upper', upper);
      assert(typeof asyncHelpers.helpers.upper !== 'undefined', 'upper should be defined on `helpers`');
      assert.deepEqual(asyncHelpers.helpers.upper.toString(), upper.toString());
    });

    it('should set an async helper', function() {
      var upper = function(str, cb) {
        cb(null, str.toUpperCase());
      };
      upper.async = true;
      asyncHelpers.set('upper', upper);
      assert(typeof asyncHelpers.helpers.upper !== 'undefined', 'upper should be defined on `helpers`');
      assert(asyncHelpers.helpers.upper.async);
    });
  });

  describe('get', function() {
    it('should get the helper as is', function() {
      var upper = function(str) {
        return str.toUpperCase();
      };
      asyncHelpers.set('upper', upper);
      assert.deepEqual(asyncHelpers.get('upper').toString(), upper.toString());
    });

    it('should get a wrapped helper', function() {
      var upper = function(str) {
        return str.toUpperCase();
      };
      asyncHelpers.set('upper', upper);
      assert.notEqual(asyncHelpers.get('upper', { wrap: true }).toString(), upper.toString());
    });
  });

  describe('helpers', function() {
    it('should return actual value when not wrapped', function() {
      var upper = function(str) {
        return str.toUpperCase();
      };
      asyncHelpers.set('upper', upper);
      assert.deepEqual(asyncHelpers.get('upper')('doowb'), 'DOOWB');
    });

    it('should return an async id when wrapped', function() {
      var upper = function(str) {
        return str.toUpperCase();
      };
      asyncHelpers.set('upper', upper);
      assert.deepEqual(asyncHelpers.get('upper', { wrap: true })('doowb'), '{$ASYNCID$0$0$}');
    });

    it('should increment globalCounter for multiple instances of AsyncHelpers', function() {
      var asyncHelpers2 = new AsyncHelpers();
      assert.notEqual(asyncHelpers.globalCounter, asyncHelpers2.globalCounter);
      assert.equal(asyncHelpers.globalCounter, 0);
      assert.equal(asyncHelpers2.globalCounter, 1);
    });

    it('should return an async id with a custom prefix', function() {
      var asyncHelpers2 = new AsyncHelpers({prefix: '{$custom$prefix$$'});
      var upper = function(str) {
        return str.toUpperCase();
      };
      asyncHelpers2.set('upper', upper);
      assert.deepEqual(asyncHelpers2.get('upper', { wrap: true })('doowb'), '{$custom$prefix$$1$0$}');
    });

    it('should support helpers that take arrays as an argument', function() {
      var async = require('async');
      // function to use as an iterator
      var upper = function(str, next) {
        next(null, str.toUpperCase());
      };
      // use the async mapSeries function for the helper
      var map = async.mapSeries;
      // make sure asyncHelpers knows this is an async function
      map.async = true;
      asyncHelpers.set('map', map);
      var helper = asyncHelpers.get('map', {wrap: true});

      // call the helper to get the id
      var id = helper(['doowb', 'jonschlinkert'], upper);
      assert.equal(id, '{$ASYNCID$0$0$}');

      // resolveId the id
      return co(asyncHelpers.resolveId(id))
        .then(function(val) {
          assert.deepEqual(val, ['DOOWB', 'JONSCHLINKERT']);
        });
    });

    it('should support helpers used as arguments that return objects', function(done) {
      var profile = function(user, next) {
        if (typeof user !== 'object') {
          return next(new Error('Expected user to be an object but got ' + (typeof user)));
        }
        next(null, user.name);
      };
      profile.async = true;

      var user = function(name, next) {
        var res = {
          id: name,
          name: name
        };
        next(null, res);
      };
      user.async = true;
      asyncHelpers.set('user', user);
      asyncHelpers.set('profile', profile);
      var userHelper = asyncHelpers.get('user', {wrap: true});
      var userId = userHelper('doowb');
      assert.equal(userId, '{$ASYNCID$0$0$}');

      var profileHelper = asyncHelpers.get('profile', {wrap: true});
      var profileId = profileHelper(userId);

      asyncHelpers.resolveIds(profileId, function(err, val) {
        if (err) return done(err);
        assert.deepEqual(val, 'doowb');
        done();
      });
    });
  });

  describe('errors', function() {
    it('should handle errors in sync helpers', function() {
      var asyncHelpers3 = new AsyncHelpers();
      var upper = function(str) {
        throw new Error('UPPER Error');
      };
      asyncHelpers3.set('upper', upper);
      var helper = asyncHelpers3.get('upper', {wrap: true});
      var id = helper('doowb');
      return co(asyncHelpers3.resolveId(id))
        .then(function(val) {
          throw new Error('expected an error');
        })
        .catch(function(err) {
          assert(err.hasOwnProperty('helper'), 'Expected a `helper` property on `err`');
        });
    });

    it('should handle errors in async helpers', function() {
      var asyncHelpers3 = new AsyncHelpers();
      var upper = function(str, next) {
        throw new Error('UPPER Error');
      };
      upper.async = true;
      asyncHelpers3.set('upper', upper);
      var helper = asyncHelpers3.get('upper', {wrap: true});
      var id = helper('doowb');
      return co(asyncHelpers3.resolveId(id))
        .then(function(val) {
          throw new Error('expected an error');
        })
        .catch(function(err) {
          assert(err.hasOwnProperty('helper'), 'Expected a `helper` property on `err`');
        });
    });

    it('should handle returned errors in async helpers', function() {
      var asyncHelpers3 = new AsyncHelpers();
      var upper = function(str, next) {
        next(new Error('UPPER Error'));
      };
      upper.async = true;
      asyncHelpers3.set('upper', upper);
      var helper = asyncHelpers3.get('upper', {wrap: true});
      var id = helper('doowb');
      return co(asyncHelpers3.resolveId(id))
        .then(function(val) {
          throw new Error('expected an error');
        })
        .catch(function(err) {
          assert(err.hasOwnProperty('helper'), 'Expected a `helper` property on `err`');
        });
    });

    it('should handle errors with arguments with circular references', function() {
      var asyncHelpers3 = new AsyncHelpers();
      var upper = function(str, next) {
        throw new Error('UPPER Error');
      };
      upper.async = true;
      asyncHelpers3.set('upper', upper);
      var helper = asyncHelpers3.get('upper', {wrap: true});
      var obj = {username: 'doowb'};
      obj.profile = obj;
      var id = helper(obj);
      return co(asyncHelpers3.resolveId(id))
        .then(function(val) {
          throw new Error('Expected an error');
        })
        .catch(function(err) {
          assert(err.hasOwnProperty('helper'), 'Expected a `helper` property on `err`');
        });
    });
  });

  describe('wrapHelper', function() {
    it('should return the helper when given the helper name', function() {
      var upper = function(str) {
        return str.toUpperCase();
      };
      asyncHelpers.set('upper', upper);
      var fn = asyncHelpers.wrapHelper('upper');
      assert.equal(fn, upper);
      assert.deepEqual(fn('doowb'), 'DOOWB');
    });

    it('should return the wrapped helper when given the helper name and wrap option is true', function() {
      var upper = function(str) {
        return str.toUpperCase();
      };
      asyncHelpers.set('upper', upper);
      var fn = asyncHelpers.wrapHelper('upper', {wrap: true});
      assert.notEqual(fn, upper);
      assert.notEqual(fn.toString(), upper.toString());
      assert.deepEqual(fn('doowb'), '{$ASYNCID$0$0$}');
    });

    it('should return a function when given a function', function() {
      var upper = function(str) {
        return str.toUpperCase();
      };
      var fn = asyncHelpers.wrapHelper(upper);
      assert.equal(fn, upper);
      assert.deepEqual(fn('doowb'), 'DOOWB');
    });

    it('should return a wrapped function when given a function and wrap option is true', function() {
      var upper = function(str) {
        return str.toUpperCase();
      };
      var fn = asyncHelpers.wrapHelper(upper, {wrap: true});
      assert.notEqual(fn, upper);
      assert.deepEqual(fn('doowb'), '{$ASYNCID$0$0$}');
    });

    it.skip('should return an object of helpers when given an object of helpers', function() {
      var helpers = {
        upper: function(str) { return str.toUpperCase(); },
        lower: function(str) { return str.toLowerCase(); }
      };
      asyncHelpers.set(helpers);
      var obj = asyncHelpers.wrapHelper();
      assert.deepEqual(obj, helpers);
      assert.equal(obj.upper('doowb'), 'DOOWB');
      assert.equal(obj.lower('DOOWB'), 'doowb');
    });

    it.skip('should return an object of wrapped helpers when given an object of helpers and wrap option is true', function() {
      var helpers = {
        upper: function(str) { return str.toUpperCase(); },
        lower: function(str) { return str.toLowerCase(); }
      };
      asyncHelpers.set(helpers);
      var obj = asyncHelpers.wrapHelper({wrap: true});
      assert.notDeepEqual(obj, helpers);
      assert.equal(obj.upper('doowb'), '{$ASYNCID$0$0$}');
      assert.equal(obj.lower('DOOWB'), '{$ASYNCID$0$1$}');
    });

    it.skip('should return an object of helpers from a helper group', function() {
      var helpers = function() {};
      helpers.isGroup = true;
      helpers.upper = function(str) { return str.toUpperCase(); };
      helpers.lower = function(str) { return str.toLowerCase(); };
      asyncHelpers.set('my-group', helpers);
      var res = asyncHelpers.wrapHelper('my-group');
      console.log(res);
      assert.deepEqual(res, helpers);
      assert.equal(res.upper('doowb'), 'DOOWB');
      assert.equal(res.lower('DOOWB'), 'doowb');
    });
  });

  describe('wrapHelpers', function() {

  });

  describe('wrapper', function() {

  });

  describe('reset', function() {

  });

  describe('matches', function() {

  });

  describe('hasAsyncId', function() {

  });

  describe('resolveId', function() {

  });

  describe('resolveArgs', function() {

  });

  describe('resolveObject', function() {

  });

  describe('resolveIds', function() {

  });
});
