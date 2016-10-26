# sitestatus

a simple dashboard for monitoring websites, forked from one whipped up by [jczaplew](https://github.com/jczaplew)

## Installation

First, download and install the application

    $ git clone https://github.com/punkish/sitestatus.git
    $ cd sitestatus
    $ npm install

Now, create a Telegram Bot. Setting up the connection to Telegram requires creating a bot and getting a chat id.

Create a [Telegram Bot](https://core.telegram.org/bots) and update the bot token value in [config](config/index.js). Go to `https://telegram.me/<botname>` in your browser, which will add the bot to your Telegram App.

Get a Chat ID by starting a chat with with bot. Send a `getUpdates` command to the bot via the web api and look for the chat id in the response. For example, going to `https://api.telegram.org/bot<bot_token>/getUpdates` returns the following
             
    {
        "ok":true,
        "result":{
            "message_id":3,
            "from":{
                "id":123456789,
                "first_name":"WebSiteMonitor",
                "username":"WebSiteMonitorBot"
            },
            "chat":{"
                id":64476661,
                "first_name":"first name",
                "username":"firstname",
                "type":"private"
            },
            "date":1477158841,
            "text":"some text"
        }
    }
             
The chat_id you are looking for is `64476661`, update its value in [config](config/index.js)

***Note:** if you want to set up a group chat, first create a group with the bot as a member and then initiate a chat in that group.*