var express = require('express')
var request = require('request')

var websites = [
    {
        name : 'TreatmentBank',
        uri : 'http://tb.plazi.org/GgServer/static/newToday.html'
    },
    {
        name : 'Plazi',
        uri : 'http://plazi.org'
    }
]
var bot = '253125261:AAGHnpONfoGVLFUT6ZbCSsLrkayN3r4_uis'
var chat_id = '64476661'

/*
 * The only way to get a chat_id for the message seems to be to send a `getUpdates` 
 * command to the bot via the api and look for the chat id in the response. For example
 * 
 * https://api.telegram.org/bot253125261:AAGHnpONfoGVLFUT6ZbCSsLrkayN3r4_uis/getUpdates
 * 
 * returns the following
 * 
 * {
 *      "ok":true,
 *      "result":{
 *          "message_id":3,
 *          "from":{
 *              "id":253125261,
 *              "first_name":"PlaziStatus",
 *              "username":"PlaziStatusBot"
 *          },
 *          "chat":{"
 *              id":64476661,
 *              "first_name":"punkish",
 *              "username":"punkish",
 *              "type":"private"
 *          },
 *          "date":1477158841,
 *          "text":"hello from Puneet"
 *      }
 * }
 * 
 * The chat_id I am looking for is 64476661
 * 
 */

var update_interval = '30 mins'
var timeout = '30 secs'

var Datastore = require('nedb')
websites.forEach(function(app) {
    app.db = new Datastore({ filename: 'data/' + app.name + '.nedb', autoload: true })
})

var app = express()
app.set('views', __dirname + '/templates')
app.set('view engine', 'hjs')

function notifyFailure(app, code) {
    var msg = app.name + ' encountered a ' + code + ' status code when making a request to ' + app.uri
    request({
        uri: 'https://api.telegram.org/' + bot + '/sendMessage?chat_id=' + chat_id + '&text=' + msg
    })
}

function notifyFix(app, status) {
    errors[app.name] = false

    var msg = app.name + ' is online' + ((status === 0) ? ', but is responding slowly' : ' and responding normally')

    request({
        uri: 'https://api.telegram.org/' + bot + '/sendMessage?chat_id=' + chat_id + '&text=' + msg
    })
}

// Update a given website's status
function get(website, callback) {
    request({
        uri: website.uri,
        time: true,
        timeout: timeout.split(/ /)[0] * 1000
    },
    function(error, response, body) {
        var status = null;

        if (error || response.statusCode != 200 || response.headers['content-length'] < 50) {
            status = -1
            var statusCode = (response && response.statusCode) ? response.statusCode : 500
            notifyFailure(website, statusCode)
        } 
        else if (response.elapsedTime > timeout) {
            status = 0
            if (errors[website.name]) {
                notifyFix(website, status)
            }
        } 
        else {
            status = 1
            if (errors[website.name]) {
                notifyFix(website, status)
            }
        }
        var response_time = (response && response.elapsedTime) ? response.elapsedTime : null

        website.db.insert({
            ts: new Date(),
            status : status,
            response_time : response_time
        })
    })
}

// Update all apps
function update() {
    websites.forEach(function(website) {
        get(website, cb)
    })
}

setInterval(
    update, 
    update_interval.split(/ /)[0] * 60000
);

app.get('/', function(req, res, next) {
    var apps = []
    websites.forEach(function(website, cb) {
        website.db.find({})
            .limit(req.query["limit"] || 10)
            .exec(
                function (err, docs) {

                    app = {}
                    app.name = website.name
                    app.uri = website.uri
                    app.data = []

                    // docs is [doc3, doc1]
                    docs.forEach(function(d) {
                        d._class = d.status.toLowerCase()
                        if (d.response_time < 1000) {
                            d.response_time = Math.floor(d.response_time) + ' ms'
                        }
                        else if (d.response_time >= 1000 && d.response_time < 60000) {
                            d.response_time = Math.floor(d.response_time / 1000) + ' secs'
                        }
                        else {
                            d.response_time = 'more than a minute'
                        }
                        
                        app.data.push(d)
                    })

                    apps.push(app)
                    if (apps.length === websites.length) {
                        res.render('main', {apps: apps})
                    }
                }
            );
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
