var config = {"variables": require('dotenv').config()};

var format = require("string-template");
var rp = require('request-promise');
var when = require('when');
var botName = 'botApothekenNotdienst';
var shared = require('../../modules/sharedFunctions');
var xml2json = require('xml2json');
var builder = require('botbuilder');
var date = new Date();


var botRoute = '/' + botName;
// Doku: http://www.aknr.de/notdienst/notdienst_xml.php?id=161
var serviceURL = 'http://www.aknr.de/notdienst/exporte/xml.php';

var botDialog = [
  function (session, args, next) {
    builder.Prompts.text(session, "Wo bist du zurzeit?")
  },
  function (session, args, next) {
    var message = session.message.text
  rp({uri: "https://maps.googleapis.com/maps/api/geocode/json?key=" + config.variables.GOOGLEMAPS_GEOCODING_APIKEY + "&address=" + message}).then(function (response) {
    response = JSON.parse(response)
    var lat = response.results[0].geometry.location.lat;
    var lng = response.results[0].geometry.location.lng;
    apothekenNotdienstRequest(lat, lng).then(function (apothekenNotdienstResult) {
      var apothekenNotdienstResultjs = xml2json.toJson(apothekenNotdienstResult)
      var apothekenNotdienstJSON = JSON.parse(apothekenNotdienstResultjs);
      session.send("Dies sind die nächsten 2 Apotheken")
      apothekenNotdienstJSON.notdienstplan.notdienste.notdienst.forEach(function (apotheke) {
        session.send("Name: " + apotheke.apotheke)
        session.send("Adresse: " + apotheke.strasse)
        session.send(apotheke.plz + " " + apotheke.ort + " - " + apotheke.ortsteil)
      })
      session.send("Alle Angaben sind ohne Gewähr")
    })
  })
}
];

function apothekenNotdienstRequest(lat, lng) {
  //requestOverview
  var currentDay = date.getDate()
  var currentMonth = date.getMonth()
  var currentYear = date.getFullYear()
  var xmlfile = rp({uri: serviceURL + "?m=koord&w=" + Number((lat).toFixed(5)) + ";" + Number((lng).toFixed(5)) + "&z=" + currentYear + "-" + currentMonth + "-" + currentDay + ";" + currentYear + "-" + currentMonth + "-" + currentDay + "&c=utf8&a=2"});
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
