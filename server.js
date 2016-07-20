var express = require('express')
var async = require('async')
var request = require('request')
var pg = require('pg')
var hogan = require('hogan')
var credentials = require('./credentials')

var app = express()
app.set('views', __dirname + '/templates')
app.set('view engine', 'hjs')

var errors = {}

var password = (credentials.password) ? (':' + credentials.password) : ''
// Shortcut for querying postgres
function queryPg(sql, params, callback) {
  pg.connect(`postgres://${credentials.user}${password}@${credentials.host}:${credentials.port}/${credentials.database}`, function(err, client, done) {
    if (err) { return callback(err) }

    client.query(sql, params, function(err, result) {
      done();
      if (err) { return callback(err) }
      callback(null, result);
    })
  })
}

function notifyFailure(app, code) {
  // Ignore if we have already been notified of this error
  if (errors[app.name]) {
    return
  }
  errors[app.name] = true

  var msg = app.name + ' encountered a ' + code + ' status code when making a request to ' + app.uri
  request({
    uri: 'https://api.telegram.org/bot269291694:AAFqndaV1PEGcXPlipPS7ZgbyVnmNjlAO5w/sendMessage?chat_id=-134845112&text=' + msg
  })
}

function notifyFix(app, status) {
  errors[app.name] = false

  var msg = app.name + ' is back online' + ((status === 0) ? ', but is responding slowly' : ' and responding normally')

  request({
    uri: 'https://api.telegram.org/bot269291694:AAFqndaV1PEGcXPlipPS7ZgbyVnmNjlAO5w/sendMessage?chat_id=-134845112&text=' + msg
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
      var statusCode = (response && response.statusCode) ? response.statusCode : 500
      notifyFailure(app, statusCode)
    } else if (response.elapsedTime > (app.timeout || 1500)) {
      status = 0
      if (errors[app.name]) {
        notifyFix(app, status)
      }
    } else {
      status = 1
      if (errors[app.name]) {
        notifyFix(app, status)
      }
    }
    var et = (response && response.elapsedTime) ? response.elapsedTime : null
    queryPg('INSERT INTO application_status (app_id, snap_id, status, response_time) VALUES ($1, $2, $3, $4)', [app.app_id, snap_id, status, et], function(error) {
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
      queryPg('SELECT app_id, name, uri, timeout FROM applications', [], function(error, result) {
        async.each(result.rows, function(app, cb) {
          get(app, snap_id, cb)
        }, function(error, done) {
          callback(null)
        })
      })
    }
  ], function(error) {
  //  console.log('Done updating')
  })
}

setInterval(update, 60000);

app.get('/', function(req, res, next) {
  queryPg(`
    SELECT
     applications.app_id,
     category,
     name,
     uri,
     status,
     rt.mean_response
    FROM applications
    JOIN (
      SELECT app_id, status
      FROM application_status
      WHERE snap_id = (
        SELECT snap_id
        FROM snapshots
        ORDER BY start_time DESC
        LIMIT 1
      )
    ) statuses ON applications.app_id = statuses.app_id
    JOIN (
      SELECT app_id, avg(response_time)::int mean_response
      FROM application_status
      GROUP BY app_id
    ) rt ON rt.app_id = applications.app_id
    ORDER BY applications.app_id ASC
  `, [], function(error, result) {

    var categories = {}
    result.rows.forEach(function(d) {
      d._class = (d.status === 1) ? 'ion-ios-checkmark' : ((d.status === 0) ? 'ion-ios-help' : 'ion-ios-minus')
      if (categories[d.category]) {
        categories[d.category].push(d)
      } else {
        categories[d.category] = [d]
      }
    })

    var formatted = []
    Object.keys(categories).forEach(function(d) {
      formatted.push({
        name: d,
        apps: categories[d]
      })
    })

    res.render('main', {data: formatted})
  })
})


app.port = process.argv[2] || 5678;

app.start = function() {
  app.listen(app.port, function() {
    console.log(`Listening on port ${app.port}`);
  });
}

if (!module.parent) {
  app.start();
}


module.exports = app;
