var Datastore = require('nedb')

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

// See https://en.wikipedia.org/wiki/List_of_HTTP_status_codes
var status_codes = {
    "200" : "OKs",
    "301" : "Moved Permanently",
    "303" : "See Other",
    "304" : "Not Modified",
    "307" : "Temporary Redirect",
    "400" : "Bad Request",
    "401" : "Unauthorized",
    "403" : "Forbidden",
    "404" : "Not Found",
    "405" : "Method Not Allowed",
    "408" : "Request Timeout",
    "500" : "Internal Server Error",
    "502" : "Bad Gateway",
    "503" : "Service Unavailable"
}
var codes = Object.keys(status_codes)
var update_interval = '30 mins'
var update_interval_ms = update_interval.split(/ /)[0] * 60000
var count = 100
var starting_ts = Date.now() - (count * update_interval.split(/ /)[0] * 60000)

for (var i=0; i<websites.length; i++) {
    console.log("inserting " + count + " records in " + websites[i].name + '.nedb')
    var db = new Datastore({ filename: 'data/' + websites[i].name + '.nedb', autoload: true })

    var docs = []
    for (var j=0; j<count; j++) {
        var idx = Math.floor(Math.random() * codes.length)
        
        docs.push({
            ts: starting_ts + (j * update_interval_ms),
            status_code : codes[idx],

            // A random response time between 100 ms and 1.5 mins
            response_time : Math.random() * (90000 - 100) + 100
        })
    }

    db.insert(docs, function(err, docs) {})
}