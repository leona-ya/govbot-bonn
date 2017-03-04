var config = {"variables": require('dotenv').config()};

var format = require("string-template");
var rp = require('request-promise');
var when = require('when');
var botName = 'botParkhausBelegungBonn';
var shared = require('../../modules/sharedFunctions');
var xml2json = require('xml2json');
var builder = require('botbuilder');

var botRoute = '/' + botName;

var station = 'Bonn';
var serviceURL = 'http://www.bcp-bonn.de/stellplatz/bcpinfo.xml';

var botDialog = [
  function (session, args, next) {
    if(session.userData.botData[botName] == undefined) {
      session.userData.botData[botName] = {}
    }
    parkhausbelegungRequest().then(function (parkhausbelegungResult) {
      var parkhausbelegungResultjs = xml2json.toJson(parkhausbelegungResult)
      var parkhausbelegungJSON = JSON.parse(parkhausbelegungResultjs).parkhaeuser;
      var result = {
        "text": "Wähle das Parkhaus",
        "type": "buttons_list",
        "data": [],
        "language": "de"
      };
      parkhausbelegungJSON.parkhaus.forEach(function (parkhaus) {
        var bezeichnung = parkhaus.bezeichnung.replace(".txt", "")
        result.data.push({
          "title": bezeichnung.initCap(),
          "response": bezeichnung.initCap()
        })
      })
      session.userData.botData[botName].parkhausJSON = parkhausbelegungJSON;
      var answerJson = session.toMessage(JSON.stringify(result));
      // session.send("Tet");
      builder.Prompts.text(session, answerJson);
    });
  },
  function (session, args, next) {
    var message = session.message.text
    var parkhausbelegungJSON = session.userData.botData[botName].parkhausJSON
    parkhausbelegungJSON.parkhaus.forEach(function (parkhaus) {
      var bezeichnung = parkhaus.bezeichnung.replace(".txt", "")
      if(message == bezeichnung.initCap()) {
        var gesamt = parkhaus.gesamt;
        var frei = parkhaus.frei;
        session.send("Derzeit sind im Parkhaus " + bezeichnung.initCap() + " noch " + frei + " von " + gesamt + " Parkplätzen frei.")
      }
    })
  }
];

function parkhausbelegungRequest() {
  //requestOverview
  var xmlfile = rp({uri: serviceURL});
  return xmlfile;
}

function generateAnswerText(parkhausbelegungResult) {
  var answerTextRaw = resolveAnswers[shared.randomWithRange(0, resolveAnswers.length)];
  var value = parkhausbelegungResult.currentMeasurement.value;
  var unit = parkhausbelegungResult.unit;

  var answerText = format(answerTextRaw, {
    station: station,
    value: value,
    unit: unit
  });

  return answerText;
}

function generateAnswerJson(session, parkhausbelegungResult, answerText) {
  return JSON.stringify({
    "botname": botName,
    "type": "pegelstand",
    "data": parkhausbelegungResult,
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
