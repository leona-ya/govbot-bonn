var config = {"variables": require('dotenv').config()};

var format = require("string-template");
var rp = require('request-promise');
var when = require('when');
var botName = 'botParkhausBelegungBonn';
var shared = require('../../modules/sharedFunctions');
var xml2json = require('xml2json');
var builder = require('botbuilder');

var botRoute = '/' + botName;

var serviceURL = 'http://www.bcp-bonn.de/stellplatz/bcpinfo.xml';

var botDialog = [
  function (session, args, next) {
    var message = session.message.text;
    if(session.userData.botData[botName] == undefined) {
      session.userData.botData[botName] = {}
    }
    // Wenn Parkhaus Auswahl bereits abgeschickt -> springe zum nächsten Schritt
    if(session.userData.botData[botName].parkhausCard) {
      next();
    } else {
      parkhausbelegungRequest().then(function (parkhausbelegungResult) {
        var parkhausbelegungResultjs = xml2json.toJson(parkhausbelegungResult);
        var parkhausbelegungJSON = JSON.parse(parkhausbelegungResultjs).parkhaeuser;
        var result = {
          "text": "Wähle das Parkhaus",
          "type": "smart_answers",
          "data": [],
          "language": "de"
        };
        parkhausbelegungJSON.parkhaus.forEach(function (parkhaus) {
          var bezeichnung = parkhaus.bezeichnung.replace(".txt", "");
          result.data.push(bezeichnung.initCap())
        });
        session.userData.botData[botName].parkhausCard = result;
        session.userData.botData[botName].parkhausJSON = parkhausbelegungJSON;
        var answerJson = session.toMessage(JSON.stringify(result));
        // session.send("Tet");
        builder.Prompts.text(session, answerJson);
      });
    }
  },
  function (session, args, next) {
    var message = session.message.text;
    var parkhausbelegungJSON = session.userData.botData[botName].parkhausJSON;
    var resultText;
    parkhausbelegungJSON.parkhaus.forEach(function (parkhaus) {
      var bezeichnung = parkhaus.bezeichnung.replace(".txt", "");
      if(message == bezeichnung.initCap()) {
        var gesamt = parkhaus.gesamt;
        var frei = parkhaus.frei;
        resultText = "Derzeit sind im Parkhaus " + bezeichnung.initCap() + " noch " + frei + " von " + gesamt + " Parkplätzen frei."
      }
    });
    if(resultText) {
      var result = session.userData.botData[botName].parkhausCard;
      result.text = resultText;
      result.data = result.data.filter(function (parkhaus) {
        return (parkhaus != message);
      });
      var answerJson = session.toMessage(JSON.stringify(result));
      if(result.data.length) {
        // So lange noch nicht alle Parkhäuser abgefragt wurden -> Dialog offen lassen
        session.send(answerJson);
      } else {
        // wenn alle Parkhäuse abgefragt -> Dialog beenden mit abgefragten Parkhaus Daten
        session.endDialog(resultText);
      }
    } else {
      // Wenn keine gültige Auswahl -> sende Nachricht an den Haupt Dialog
      session.replaceDialog('/');
    }
  }
];

function parkhausbelegungRequest() {
  //requestOverview
  return rp({uri: serviceURL});
}


module.exports = botDialog;
