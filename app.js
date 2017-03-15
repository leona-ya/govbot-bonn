var restify = require('restify');
var builder = require('botbuilder');
var config = {"variables": require('dotenv').config()};

//=========================================================
var aktivBot = 'botApothekenNotdienst'; // Bot Name
//=========================================================

//=========================================================
// Bot Setup
//=========================================================
var govBotSdkVersion = "0.1.0";

// Create connector
var connector = new builder.ChatConnector();

// Setup Restify Server
var server = restify.createServer();
server.listen(config.port || config.variables.port || config.variables.PORT || 3978, function () {
  console.log('GovBotSDK (V %s) listening to %s', govBotSdkVersion, server.url);
});
server.post('/msg', connector.listen());

// Load shared functions
var shared = require('./modules/sharedFunctions');
var translator = require('./modules/translator');
var messageConverter = require('./modules/messageConverter');

// Load modules
var userDataManager = require('./modules/userDataManager');

//=========================================================
// Bots interceptor include
//=========================================================
var govBotInterceptor = require('./modules/govBotInterceptor');

// Create chat bot
var bot = new builder.UniversalBot(connector);
bot.use(govBotInterceptor);

// Load botbuilder extensions
var botbuilder_consts = require('botbuilder/lib/consts');
var botbuilder_logger = require('botbuilder/lib/logger');


//=========================================================
// SDK DemoBot include
//=========================================================
var aktiveBotModule = require('./additional_bots/' + aktivBot + '/main');
console.log('Include ' +aktivBot + ' on ' + '/' + aktivBot);
bot.dialog('/' + aktivBot , aktiveBotModule);

//=========================================================
// Bots Dialogs
//=========================================================
bot.dialog('/', function (session, args) {
  shared.log('Route: /');

if (session.message.text == "--reset--") {
    // reset bots userData
    var msg = userDataManager.reset(session);
    session.send(msg);
    session.replaceDialog('/');
  } else {
    var chatMessage = session.message.text;

    askExpert(aktivBot, session)
  }
});


function askExpert(botName, session) {
  shared.log("beginDialog /" + botName);
  session.beginDialog('/' + botName);
}
