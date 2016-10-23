module.exports = (function(mode) {
    var config = {
        common : {

            // List websites to be monitored
            websites : [
                {
                    name : 'TreatmentBank',
                    uri : 'http://tb.plazi.org/GgServer/static/newToday.html'
                },
                {
                    name : 'Plazi',
                    uri : 'http://plazi.org'
                }
            ],

            // Monitoring frequency
            update_interval : '30 mins',

            // More than 30 secs is too slow
            timeout : '30 secs',

            // Telegram bot settings
            bot : '253125261:AAGHnpONfoGVLFUT6ZbCSsLrkayN3r4_uis',

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
            //chat_id : '64476661'
            chat_id : '-170396027'
        },
        development: {
            port: 5678
        },
        production: {
            port: 9000,
        }
    };

    var tmp = config[mode || process.env.NODE_ENV || 'development'];
    for (var i in config.common) {
        tmp[i] = config.common[i];
    }
    
    return tmp;
})();