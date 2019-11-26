'use strict';

var async = require('async');
var redis = require('ioredis');

module.exports = function(redisAddress, pattern, callback) {
  redisAddress = redisAddress || {};
  redisAddress.hostname = redisAddress.hostname || '127.0.0.1';
  redisAddress.auth = redisAddress.auth || '';
  redisAddress.port = redisAddress.port || 6379;
  redisAddress.db = redisAddress.db || 0;

  pattern = pattern || '*';

  // Connect to the Redis instance
  var db = redis.createClient(redisAddress.port, redisAddress.hostname, {
    auth_pass: redisAddress.auth
  });
  db.select(redisAddress.db);

  // Get the keys that match the specified pattern
  db.keys(pattern, function(keysErr, keys) {
    if (keysErr) {
      return callback(keysErr);
    } else {
      console.log('Found %d keys matching the specified pattern.', keys.length);

      if (keys.length === 0) {
        return callback(null, 0);
      } else {
        // Delete each key found
        return async.eachSeries(keys, function(key, eachCallback) {
          return db.del(key, function(delKeyErr, delKeyReply) {
            if (delKeyErr) {
              return eachCallback(delKeyErr);
            } else {
              return eachCallback(null, delKeyReply);
            }
          });
        },
        function(err) {
          // Close the Redis connection
          db.end();

          if (err) {
            return callback(err);
          } else {
            return callback(null, keys.length);
          }
        });
      }
    }
  });
};
