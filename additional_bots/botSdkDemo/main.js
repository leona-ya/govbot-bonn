var config = {"variables": require('dotenv').config()};

var format = require("string-template");
var rp = require('request-promise');
var when = require('when');
var botName = 'botPegelstandBonn';
var shared = require('../../modules/sharedFunctions');

var botRoute = '/' + botName;

var station = 'Bonn';
var serviceURL = 'http://www.pegelonline.wsv.de/webservices/rest-api/v2/';
var overviewQuery = 'stations/' + station + '/W.json?includeCurrentMeasurement=true&includeCharacteristicValues=true';
var historyQuery = 'stations/' + station + '/W/measurements.json?start=P1DT1H';

var botDialog = [
  function (session, args, next) {
    pegelonlineRequest().then(function (pegelonlineResult) {
      var answerText = generateAnswerText(pegelonlineResult);
      session.trans(answerText).then(function (responseTranslated) {
        var answerJson = generateAnswerJson(session, pegelonlineResult, responseTranslated);
        answerJson = session.toMessage(answerJson);
        session.endDialog(answerJson);
      });
    });
  }
];

function pegelonlineRequest() {
  //requestOverview
  var overviewPromise = rp({uri: serviceURL + overviewQuery, json: true});

  //requestHistory
  var historyPromise = rp({uri: serviceURL + historyQuery, json: true});

  return when.join(overviewPromise, historyPromise).then(function (values) {
    var result = values[0];
    var history = values[1];

    result.history = [];
    for (var i = 0; history.length > i; i++) {
      if (i % 24 == 0) {
        result.history.push(history[i]);
      }
    }
    return result;
  });
}

function generateAnswerText(pegelonlineResult) {
  var answerTextRaw = resolveAnswers[shared.randomWithRange(0, resolveAnswers.length)];
  var value = pegelonlineResult.currentMeasurement.value;
  var unit = pegelonlineResult.unit;

  var answerText = format(answerTextRaw, {
    station: station,
    value: value,
    unit: unit
  });

  return answerText;
}

function generateAnswerJson(session, pegelonlineResult, answerText) {
  return JSON.stringify({
    "botname": botName,
    "type": "pegelstand",
    "data": pegelonlineResult,
    "text": answerText,
    "language": session.userData.language,
    "location": station
  });
}

var resolveAnswers = [
  'Der aktuelle Pegelstand beträgt für {station} beträgt {value}{unit}.',
  'Für {station} liegt der aktuelle Pegelstand bei {value}{unit}.',
  'Aktuell liegt der Pegelstand für {station} bei {value}{unit}.'
];

module.exports = botDialog;
