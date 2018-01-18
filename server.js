// start the app in production 
//   $ NODE_ENV=production pm2 start server.js --name sitestatus

var express = require('express');
var request = require('request');
var Datastore = require('nedb');
var config = require('./config/index.js');
var utils = require('./lib/utils.js');
var status_codes = require('./lib/http_status_codes.js');

var status_cache = {};
config.websites.forEach(function(website) {
    website.db = new Datastore({ filename: 'data/' + website.name + '.nedb', autoload: true });
    status_cache[website.name] = '';
});

var app = express();
app.set('views', __dirname + '/templates');
app.set('view engine', 'hjs');

// Update a given website's status
function get(website, callback) {
    request({
        uri : website.uri,
        time : true,
        timeout : utils.str2t(config.timeout)
    },

    function(error, response, body) {

        var response_time = (response && response.elapsedTime) ? response.elapsedTime : null;

        var status_code;
        if (error) {
            status_code = error;
        }
        else {
            status_code = response.statusCode;
        }
        
        var msg = website.uri;

        var this_status = '';
        if (error) {
            this_status = 'A';
            msg += " caused the error: " + error;
        }
        else if (response.statusCode != 200 || response.headers['content-length'] < 50) {
            this_status = 'B';
            msg += " is not up, responding with: " + response.statusCode;
        }
        else if (response.elapsedTime > config.timeout) {
            this_status = 'C';
            msg += " is up but responding slowly";
        }
        else {
            this_status = 'D';
            msg += " is working normally";
        }

        if (status_cache[website.name] !== this_status) {

            request({
                uri: 'https://api.telegram.org/bot' + config.bot + '/sendMessage?chat_id=' + config.chat_id + '&text=' + msg
            })

            status_cache[website.name] = this_status;
        }
        
        var record = {
            ts : Date.now(),
            sc : status_code,
            rt : response_time
        };

        website.db.insert(record);
    });
}

// Update all apps
function update() {
    config.websites.forEach(function(website, cb) {
        get(website, cb);
    })
}

setInterval(
    update, 
    utils.str2t(config.update_interval)
);

app.get('/', function(req, res, next) {
    var apps = [];
    config.websites.forEach(function(website, cb) {
        website.db.find({})
            .sort({ts : -1})
            .limit(req.query["limit"] || 3)
            .exec(
                function (err, docs) {

                    app = {};
                    app.name = website.name;
                    app.uri = website.uri;
                    app.data = [];

                    // docs is [doc3, doc1];
                    docs.forEach(function(d) {
                        if (typeof(d.rt) === 'object') {
                            d.rt = '--';
                            d.status = 'BAD';
                        }
                        else {
                            if (d.rt < 1000) {
                                d.status = 'OK';
                            }
                            else if (d.rt >= 1000 && d.rt < 60000) {
                                d.status = 'SLOW';
                            }
                            else {
                                d.status = 'BAD';
                            }

                            d.rt = utils.t2str(d.rt);
                        }
                        
                        d.ts = new Date(d.ts).toUTCString();

                        if (d.sc < 300) {
                            d.sc_class = 'OK';
                        }
                        else if (d.sc > 400) {
                            d.sc_class = 'BAD';
                        }
                        
                        if (typeof(d.sc) === "object" && "code" in d.sc) {

                            d.sc_desc = 'no connection';
                            d.sc = d.sc.code;
                            d.sc_class = 'BAD';
                        }
                        else {
                            d.sc_desc = status_codes[d.sc].split(': ')[0];
                        }
                        
                        app.data.push(d);
                    });

                    apps.push(app);
                    if (apps.length === config.websites.length) {
                        res.render('main', {apps: apps});
                    }
                }
            )
    });
});

app.start = function() {
    app.listen(config.port, function() {
        console.log(`Listening on port ${config.port}`);
    });
};

if (!module.parent) {
    app.start();
}

module.exports = app;
