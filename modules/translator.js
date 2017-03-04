var config = {"variables": require('dotenv').config()};

var userSession = false;
var builder = require('botbuilder');
var MsTranslator = require('mstranslator');
var translation_disabled = false;
var detect_disabled = false;
var dynamicUserLanguage = false;

if (typeof config.variables.MICROSOFT_BING_TRANSLATE_KEY_1 != 'undefined') {
  var msTrans = new MsTranslator({
    api_key: config.variables.MICROSOFT_BING_TRANSLATE_KEY_1
  }, true);
} else {
  var msTrans = false;
  translation_disabled = false;
  detect_disabled = false;
  dynamicUserLanguage = false;
}

var init = function (pUserSession) {
  userSession = pUserSession;
  if (['emulator', 'facebook', 'telegram', 'slack'].indexOf(userSession.message.source) >= 0) {
    dynamicUserLanguage = false;
  }
};

var userLanguage = function (pUserSession, language) {
  userSession = pUserSession;
  userSession.userData.language = language;
  userSession.save();
};

var detect = function (message) {
  return new Promise(function (resolve, reject) {
    if (detect_disabled || !dynamicUserLanguage) {
      resolve(((userSession.message.textLocale) ? userSession.message.textLocale : 'de'));
    } else {
      msTrans.detect({text: message}, function (err, data) {
        console.log('Users detect language is "' + data + '"');
        userSession.message.textLocale = data;
        userSession.save();
        resolve(data);
      });
    }
  });
}

var translateIncoming = function (message, options) {
    options = ((options != null ) ? options : false );
    if (options) {
      var from = options.from;
      var to = options.to;
    } else {
      var from = ((message.textLocale) ? message.textLocale : 'de');
      var to = 'de';
    }
    return fallbackTranslation(message.text, from, to);
};

var translate = function (message, options) {
  options = ((options !== undefined)? options : false );
  if (options != false) {
    var from = options.from;
    var to = options.to;
  } else {
    var from = 'de';
    var to = userSession.message.textLocale ? userSession.message.textLocale : 'de';
  }

  return fallbackTranslation(message, from, to);
};

function fallbackTranslation(text, from, to) {
  return new Promise(function (resolve, reject) {
    var params = {
      text: text,
      from: from,
      to: to
    };
    if (translation_disabled || from == to) {
      resolve(text);
    } else {
      msTrans.translate(params, function(err, data) {
        resolve(data);
      });
    }
  });
}

module.exports.init = init;
module.exports.detect = detect;
module.exports.trans = translate;
module.exports.transIn = translateIncoming;
module.exports.setUserLanguage = userLanguage;
