var express = require('express')
var app = express()
var async = require('async')
var request = require('request')
var pg = require('pg')
var credentials = require('./credentials')

// Shortcut for querying postgres
function queryPg(sql, params, callback) {
  pg.connect(`postgres://${credentials.user}@${credentials.host}/${credentials.database}`, function(err, client, done) {
    if (err) { return callback(err) }

    client.query(sql, params, function(err, result) {
      done();
      if (err) { return callback(err) }
      callback(null, result);
    })
  })
}

// Update a given app's status
function get(app, snap_id, callback) {
  request({
    uri: app.uri,
    time: true,
    timeout: 10000
  }, function(error, response, body) {
    var status = null;

    if (error || response.statusCode != 200 || response.headers['content-length'] < 50) {
      status = -1
    } else if (response.elapsedTime > (app.timeout || 1500)) {
      status = 0
    } else {
      status = 1
    }

    queryPg('INSERT INTO application_status (app_id, snap_id, status) VALUES ($1, $2, $3)', [app.app_id, snap_id, status], function(error) {
      if (error) console.log(error);
      return callback(null)
    })
  })
}

// Update all apps
function update() {
  var snap_id = Math.random().toString(36).substring(7);
  async.series([
    function(callback) {
      queryPg('INSERT INTO snapshots (snap_id) VALUES ($1)', [snap_id], function() {
        callback(null)
      })
    },

    function(callback) {
      queryPg('SELECT app_id, uri, timeout FROM applications', [], function(error, result) {
        async.each(result.rows, function(app, cb) {
          get(app, snap_id, cb)
        }, function(error, done) {
          callback(null)
        })
      })
    }
  ], function(error) {
    console.log('Done updating')
  })
}

setInterval(update, 15000);

app.get('/', function(req, res, next) {
  queryPg('SELECT * FROM application_status', [], function(error, result) {
    res.json(result.rows)
  })
})


app.port = process.argv[2] || 5678;

app.start = function() {
  app.listen(app.port, function() {
    console.log("Listening on port " + app.port);
  });
}

if (!module.parent) {
  app.start();
}


module.exports = app;
