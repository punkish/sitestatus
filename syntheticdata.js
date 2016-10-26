var Datastore = require('nedb');
var status_codes = require('./lib/http_status_codes.js');
var config = require('./config');
var utils = require('./lib/utils.js');

var codes = Object.keys(status_codes);

// 30 mins in ms
var update_interval = utils.str2t(config.update_interval);

// number of records to be generated
var count = 2;
var starting_ts = Date.now() - (count * update_interval);

for (var i=0; i<config.websites.length; i++) {
    console.log("inserting " + count + " records in " + config.websites[i].name + '.nedb');
    var db = new Datastore({ filename: 'data/' + config.websites[i].name + '.nedb', autoload: true });

    var docs = [];
    for (var j=0; j<count; j++) {
        var idx = Math.floor(Math.random() * codes.length);
        
        docs.push({
            ts: starting_ts + (j * update_interval),

            // a random status code
            sc : codes[idx],

            // A random response time between 100 ms and 1.5 mins
            rt : Math.random() * (90000 - 100) + 100
        })
    }

    db.insert(docs, function(err, docs) {});
    //console.log(docs);
}