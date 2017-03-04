var shared = require('./sharedFunctions');
var translator = require('../modules/translator');
var messageConverter = require('../modules/messageConverter');

var govBotInterceptor = {
  botbuilder: function (session, next) {
    //initUserData
    initUserData(session);

    // set origin to "unknownOrigin" if origin is unknown
    setDefaults(session);

    //Save the user's chats for the session
    saveUserChatForSession(session);

    // append messageConverter to Session
    appendMessageConverter(session);

    //override conversation and dialog methods
    overrideConversationMethods(session);

    // append translator to Session
    appendTranslator(session);

    // log user language
    shared.log('User language is "' + session.userData.language + '"');

    // interpret configObject
    var configObject = getConfigObject(session.message.text);
    if (configObject && configObject.type == '__end_dialog') {
      session.endDialog('');
    } else if (configObject && ['init', 'change_language'].indexOf(configObject.type) >= 0) {
      botInitParams(session, configObject);
      changeLanguage(session, configObject);
      shared.log('Origin: "' + session.userData.origin + '"');
      shared.log(session.userData.location);
    } else {
      translateIncomingMessage(session).then(function (response) {
        injectTranslatedMessage(session, response);
        next();
      });
    }
  }
};

function initUserData(session) {
  //set userData for user in session
  if (!("userData" in session)) {
    session.userData = {};
  }

  //generated sessionId for user
  if (!("sessionId" in session.userData)) {
    session.userData.sessionId = shared.guid();
    shared.log("generated guid: " + session.userData.sessionId);
  }

  //create botData storage for user
  if (!("botData" in session.userData)) {
    session.userData.botData = {};
  }
}

function setDefaults(session) {
  setDefaultLocale(session);
  setDefaultOrigin(session);
}

function setDefaultLocale(session) {
  // set default language german, if it´ not already setted
  if (!("userLanguage" in session.userData)) {
    var locale = ((session.message.textLocale) ? session.message.textLocale : 'de');
    session.userData.locale = locale;
    session.userData.language = locale;
    session.preferredLocale(locale, function (err) {
      if (!err) {
      } else {
        session.error(err);
      }
    });
  }
}

function setDefaultOrigin(session) {
  // set origin to "unknownOrigin" if origin is unknown
  if (!("origin" in session.userData)) {
    session.userData.origin = 'unknownOrigin';
  }

  if (['facebook', 'telegram', 'slack'].indexOf(session.message.source) >= 0) {
    session.userData.origin = 'D';
  }

}

function getConfigObject(messageText) {
  var configObject = false;

  try {
    configObject = JSON.parse(messageText);
  } catch (e) {
    configObject = false;
  }

  return configObject;
}

function botInitParams(session, configObject) {
  if (configObject && configObject.type == 'init') {
    session.userData.language = configObject.language;

    for (var i = 0; accessibleBotsForOrigin.length > i; i++) {
      var originData = accessibleBotsForOrigin[i];
      // Origin is only set if it´ availible
      if (originData.origin == configObject.origin) {
        session.userData.origin = configObject.origin;
        if (originData.location) {
          session.userData.location = originData.location;
        } else {
          delete session.userData.location;
        }
      }
    }
    session.save();
  }

}

function changeLanguage(session, configObject) {
  // deprecated! use 'session.userData.message.textLocale' instead
  if (configObject && configObject.type == 'change_language') {
    session.userData.language = configObject.language;
    translator.setUserLanguage(session, configObject.language);
    console.log('new UserLanguage is ' + configObject.language);

    session.preferredLocale(configObject.language, function (err) {
      if (!err) {
        // successCase
      } else {
        // errorCase
      }
    });
  }
}

function appendMessageConverter(session) {
  if (!("toMessage" in session)) {
    messageConverter.init(session);
    session.toMessage = messageConverter.toMessage;
  }
}

function overrideConversationMethods(session) {
  if (!("originalEndDialog" in session)) {
    session.notifyDirectlineDialogEnd = function () {
      if (this.message.source == 'directline' && session.sessionState.callstack[session.sessionState.callstack.length - 1]) {
        var curBotName = session.sessionState.callstack[session.sessionState.callstack.length - 1].id.substr(3);
        if ((curBotName in this.userData.botData) && ('state' in this.userData.botData[curBotName])) {
          var botState = this.userData.botData[curBotName].state;
          if (botState && botState.active == true) {
            this.userData.botData[curBotName].state.active = false;
            this.sendDialogCardAction("end", curBotName);
          }
        }
      }
    };
    session.sendDialogCardAction = function (action, botName) {
      if (this.message.source == 'directline') {
        if (action && botName) {
          this.send(JSON.stringify({
            "type": "dialog_card_action",
            "action": action,
            "dialog": botName,
            "state": this.userData.botData[botName].state
          }));
        }
      }
    };
    session.originalEndDialog = session.endDialog;
    session.endDialog = function (message) {
      this.notifyDirectlineDialogEnd();
      return this.originalEndDialog(message);
    };

    session.originalEndConversation = session.endConversation;
    session.endConversation = function (message) {
      this.notifyDirectlineDialogEnd();
      return this.originalEndConversation(message);
    };
  }
}

function saveUserChatForSession(session) {
  if (!("chats" in session.userData)) {
    var chat = {};
    chat[(new Date()).getTime()] = session.message.text;
    session.userData.chats = chat;
  } else {
    session.userData.chats[(new Date()).getTime()] = session.message.text;
  }
}

function appendTranslator(session) {
  if (!("trans" in session)) {
    translator.init(session);
    session.trans = translator.trans;
  }
}

function translateIncomingMessage(session) {
  var promise = translator.detect(session.message.text)
    .then(
      function () {
        return translator.transIn(session.message);
      }
    );
  return promise;
}

function injectTranslatedMessage(session, response) {
  // translate incoming message
  session.message.text_orig = session.message.text;
  session.message.text_trans = response;
  session.message.text = session.message.text_trans;
  if (session.message.text_orig != session.message.text_trans) {
    shared.log('-- Incoming original message: "' + session.message.text_orig + '"');
    shared.log('-- Incoming translated message: "' + session.message.text_trans + '"');
  }
}

module.exports = govBotInterceptor;
