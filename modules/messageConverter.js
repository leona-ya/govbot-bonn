var session = false;
var builder = require('botbuilder');
var striptags = require('striptags');
var guiEmulator = true;
var newLine = "  \n";

var init = function (userSession) {
  session = userSession;
};

var toMessage = function (message) {
  try {
    var messageObject = JSON.parse(message);
  } catch (e) {
    var messageObject = false;
  }
  if (!messageObject) {
    return message;
  }

  if (session.message.source == 'directline') {
    // Return 'directline' JSON
    return message;
  }
  var messageConverted = '';
  if (session.message.source == 'emulator') {
    if (guiEmulator) {
      messageConverted = convertTo(messageObject, 'ChatConnector');
    } else {
      // Return Text only
      messageConverted = convertTo(messageObject, 'emulator');
    }
    return messageConverted;
  } else if (['facebook', 'telegram', 'slack'].indexOf(session.message.source) >= 0) {
    // convert from 'directline' JSON to 'MS builder.Message'
    messageConverted = convertTo(messageObject, 'ChatConnector');

    return messageConverted;
  }

  return message;
};

function convertTo(messageObject, source) {
  var message = '';
  if (messageObject.type == 'forecast') {
    message = convert_forecast(messageObject, source);
  } else if (messageObject.type == 'buttons_grid') {
    message = convert_buttons(messageObject, source);
  } else if (messageObject.type == 'buttons_list') {
    message = convert_buttons(messageObject, source);
  } else if (messageObject.type == 'smart_answers') {
    message = convert_smart_answers(messageObject, source);
  } else if (messageObject.type == 'link_list') {
    message = convert_links(messageObject, source);
  } else if (messageObject.type == 'plate_choose') {
    message = convert_plate_choose(messageObject, source);
  } else if (messageObject.type == 'pegelstand') {
    message = convert_pegelstand(messageObject, source);
  } else if (messageObject.type == 'addresses') {
    message = convert_addresses(messageObject, source);
  } else {
    console.log('no convertRule found for type "' + messageObject.type + '" in messageConverter');
    message = JSON.stringify(messageObject);
  }
  return message;
}

function convert_forecast(messageObject, source) {
  var message = '';
  if (source == 'emulator') {
    message = striptags(messageObject.text);
  } else if (source == 'ChatConnector') {
    message = striptags(messageObject.text);
  }
  return message;
}

function convert_pegelstand(messageObject, source) {
  var message = '';
  if (source == 'emulator') {
    message = striptags(messageObject.text);
  } else if (source == 'ChatConnector') {
    message = striptags(messageObject.text);
  }
  return message;
}

function convert_buttons(messageObject, source) {
  var message = '';
  if (source == 'emulator') {
    message = striptags(messageObject.text);
    message += "\n(";
    for (var i = 0; i < messageObject.data.length; i++) {
      message += striptags(messageObject.data[i].response) + ((i < (messageObject.data.length -1)) ? (', ') : (''));
    }
    message += ")";
  } else if (source == 'ChatConnector') {
    var builderButtons = [];
    for (var i = 0; i < messageObject.data.length; i++) {
      builderButtons.push(
        builder.CardAction.imBack(session, striptags(messageObject.data[i].response), striptags(messageObject.data[i].title))
      );
    }
    var platesList = new builder.ThumbnailCard(session)
      .text(striptags(messageObject.text))
      .buttons(builderButtons);
    message = new builder.Message(session)
      .addAttachment(platesList);
  }
  return message;
}

function convert_smart_answers(messageObject, source) {
  var message = '';
  if (source == 'emulator') {
    message = messageObject.text;
    message += "\n(";
    for (var i = 0; i < messageObject.data.length; i++) {
      message += striptags(messageObject.data[i].response) + ((i < (messageObject.data.length -1)) ? (', ') : (''));
    }
    message += ")";
  } else if (source == 'ChatConnector') {
    var builderButtons = [];
    for (var i = 0; i < messageObject.data.length; i++) {
      builderButtons.push(
        builder.CardAction.imBack(session, striptags(messageObject.data[i]), striptags(messageObject.data[i]))
      );
    }
    var platesList = new builder.ThumbnailCard(session)
      .text(messageObject.text)
      .buttons(builderButtons);
    message = new builder.Message(session)
      .addAttachment(platesList);
  }
  return message;
}



function convert_links(messageObject, source) {
  var message = '';
  if (source == 'emulator') {
    message = messageObject.text;
    message += "\n";
    for (var i = 0; i < messageObject.data.length; i++) {
      message += striptags(messageObject.data[i].title) + ': ';
      message += striptags(messageObject.data[i].href) + "\n";
    }
  } else if (source == 'ChatConnector') {
    var builderButtons = [];
    for (var i = 0; i < messageObject.data.length; i++) {
      builderButtons.push(
        builder.CardAction.openUrl(session, striptags(messageObject.data[i].href), striptags(messageObject.data[i].title))
      );
    }
    var linkList = new builder.ThumbnailCard(session).text(striptags(messageObject.text)).buttons(builderButtons);
    message = new builder.Message(session).addAttachment(linkList);
  }
  return message;
}

function convert_plate_choose(messageObject, source) {
  var message = '';
  if (source == 'emulator') {
    message = messageObject.text;
    message += "\n";
    for (var i = 0; i < messageObject.data.length; i++) {
      message += messageObject.data[i].plates + ': ';
      message += messageObject.data[i].href + "\n";
    }
  } else if (source == 'ChatConnector') {

  }
  return striptags(message);
}

function convert_addresses(messageObject, source) {
  var message = '';
  if (source == 'emulator') {
    message = messageObject.text;
    for (var i = 0; i < messageObject.data.length; i++) {
      message += newLine;
      message += messageObject.data[i].contact.name + newLine;
      message += messageObject.data[i].contact.phone + newLine;
      message += messageObject.data[i].contact.fax + newLine;
      message += messageObject.data[i].contact.email + newLine;
      message += newLine;
      message += messageObject.data[i].address.description + newLine;
      message += messageObject.data[i].address.zip + newLine;
      message += messageObject.data[i].address.city + newLine;
      message += messageObject.data[i].address.street + newLine;
      message = striptags(message);
    }
  } else if (source == 'ChatConnector') {
    //Anpassen für ChatConnector korrigieren
    var answerText = striptags(messageObject.text);
    var message = new builder.Message(session);
    message.text(answerText);
      for (var i = 0; i < messageObject.data.length; i++) {
        var builderButtons = [];
        var addressText = "";
        addressText += messageObject.data[i].contact.name + newLine;
        addressText += messageObject.data[i].contact.phone + newLine;
        addressText += messageObject.data[i].contact.fax + newLine;
        var emailAddress = messageObject.data[i].contact.email;
        addressText += emailAddress + "\n";
        addressText += newLine;
        addressText += messageObject.data[i].address.description + newLine;
        addressText += messageObject.data[i].address.zip + newLine;
        addressText += messageObject.data[i].address.city + newLine;
        addressText += messageObject.data[i].address.street + newLine;
        addressText = striptags(addressText);
        if (emailAddress != '') {
          builderButtons.push(
            builder.CardAction.openUrl(session, emailAddress, emailAddress)
          );
          var linkList = new builder.ThumbnailCard(session).text(addressText).buttons(builderButtons);
        } else {
          var linkList = new builder.ThumbnailCard(session).text(addressText);
        }
        message = message.addAttachment(linkList);
    }
  }
  return message;
}

module.exports.init = init;
module.exports.toMessage = toMessage;
