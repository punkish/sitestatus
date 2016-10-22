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

var Datastore = require('nedb')
websites.forEach(function(app) {
    var app = new Datastore({ filename: 'data/' + app.name + '.nedb', autoload: true })

    for (var i=0, j=100; i<j; i++) {
        var rand = Math.random() * (60000 - 100) + 100

        var status;
        var perf = {
            ok : 5000,
            slow : 40000
        }
        if (rand < perf.ok) {
            status = 'OK'
        }
        else if (rand >= perf.ok && rand < perf.slow) {
            status = 'SLOW'
        }
        else {
            status = 'BAD'
        }

        app.insert({
            ts: new Date(),
            status : status,
            response_time : rand
        })
    }
})