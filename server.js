// start the app in production 
//   $ NODE_ENV=production pm2 start server.js --name sitestatus

var express = require('express')
var request = require('request')
var config = require("./config");
var Datastore = require('nedb')
config.websites.forEach(function(app) {
    app.db = new Datastore({ filename: 'data/' + app.name + '.nedb', autoload: true })
})

var app = express()
app.set('views', __dirname + '/templates')
app.set('view engine', 'hjs')

// Update a given website's status
function get(website, callback) {
    request({
        uri: website.uri,
        time: true,
        timeout: config.timeout.split(/ /)[0] * 1000
    },
    function(error, response, body) {

        var response_time = (response && response.elapsedTime) ? response.elapsedTime : null
        var status_code = (response && response.statusCode) ? response.statusCode : 500
        var msg = website.uri;

        if (error) {
            msg += " caused the error: " + error;
        }
        else if (response.statusCode != 200 || response.headers['content-length'] < 50) {
            msg += " is not up, responding with: " + response.statusCode;
        }
        else if (response.elapsedTime > config.timeout) {
            msg += " is up but responding slowly"
        }
        else {
            msg += " is working normally"
        }

        request({
            uri: 'https://api.telegram.org/' + config.bot + '/sendMessage?chat_id=' + config.chat_id + '&text=' + msg
        })
            
        website.db.insert({
            ts: Date.now(),
            status_code : status_code,
            response_time : response_time
        })
    })
}

// Update all apps
function update() {
    config.websites.forEach(function(website, cb) {
        get(website, cb)
    })
}

setInterval(
    update, 
    (config.update_interval.split(/ /)[1] === 'mins' 
        ? config.update_interval.split(/ /)[0] * 60000
        : config.update_interval.split(/ /)[0] * 1000)
);

app.get('/', function(req, res, next) {
    var apps = []
    config.websites.forEach(function(website, cb) {
        website.db.find({})
            .sort({ts : -1})
            .limit(req.query["limit"] || 10)
            .exec(
                function (err, docs) {

                    app = {}
                    app.name = website.name
                    app.uri = website.uri
                    app.data = []

                    // docs is [doc3, doc1]
                    docs.forEach(function(d) {

                        if (d.response_time < 1000) {
                            d.status = 'OK'
                            d.response_time = Math.floor(d.response_time) + ' ms'
                        }
                        else if (d.response_time >= 1000 && d.response_time < 60000) {
                            d.status = 'SLOW'
                            d.response_time = Math.floor(d.response_time / 1000) + ' secs'
                        }
                        else {
                            d.status = 'BAD'
                            d.response_time = '> ' + Math.floor(d.response_time / 60000) + ' mins'
                        }

                        d.ts = new Date(d.ts).toUTCString()
                        
                        app.data.push(d)
                    })

                    apps.push(app)
                    if (apps.length === config.websites.length) {
                        res.render('main', {apps: apps})
                    }
                }
            );
    })
})

//app.port = config.port;

app.start = function() {
    app.listen(config.port, function() {
        console.log(`Listening on port ${config.port}`);
    });
}

if (!module.parent) {
    app.start();
}

module.exports = app;
