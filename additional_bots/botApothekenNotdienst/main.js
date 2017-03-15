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
    // ToDo: provide several city locations for selection -> Bot will be availabile only for Bonn
  },
  function (session, args, next) {
    var message = session.message.text
    rp({uri: "http://nominatim.openstreetmap.org/search?format=json&q=" + message}).then(function (response) {
      response = JSON.parse(response)
      var lat = response[0].lat;
      var lng = response[0].lon;

      apothekenNotdienstRequest(lat, lng).then(function (apothekenNotdienstResult) {
        var apothekenNotdienstResultjs = xml2json.toJson(apothekenNotdienstResult)
        var apothekenNotdienstJSON = JSON.parse(apothekenNotdienstResultjs);

        var dataArray = [];
        apothekenNotdienstJSON.notdienstplan.notdienste.notdienst.forEach(function (apotheke) {
          console.log(apotheke);
          dataArray.push({
            "contact": {
              "name": apotheke.apotheke,
              "phone": apotheke.telefon
            },
            "address": {
              "zip": apotheke.plz ,
              "city": apotheke.ort + (apotheke.ortsteil != '' ? " - " + apotheke.ortsteil : ''),
              "street": apotheke.strasse
            }
          });
        });
        var answerJson = {
          "text": "Dies sind die nächsten 2 Apotheken (Alle Angaben sind ohne Gewähr)",
          "type": "addresses",
          "data": dataArray,
          "language": "de"
        };
        answerJson = session.toMessage(answerJson);
        session.endDialog(JSON.stringify(answerJson));
      })
    })
  }
];

function apothekenNotdienstRequest(lat, lng) {
  //requestOverview
  var currentDay = date.getDate()
  var currentMonth = date.getMonth()
  var currentYear = date.getFullYear()
  var xmlfile = rp({uri: serviceURL + "?m=koord&w=" + Number(lat).toFixed(5) + ";" + Number(lng).toFixed(5) + "&z=" + currentYear + "-" + currentMonth + "-" + currentDay + ";" + currentYear + "-" + currentMonth + "-" + currentDay + "&c=utf8&a=2"});
  return xmlfile;
}

module.exports = botDialog;
