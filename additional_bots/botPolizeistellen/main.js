var config = {"variables": require('dotenv').config()};

var format = require("string-template");
var rp = require('request-promise');
var when = require('when');
var botName = 'botPolizeistellenBonn';
var shared = require('../../modules/sharedFunctions');
var builder = require('botbuilder');

var botRoute = '/' + botName;

var station = 'Bonn';
var serviceURL = 'http://stadtplan.bonn.de/geojson?Thema=20806&koordsys=25832';

var botDialog = [
  function (session, args, next) {
    if(session.userData.botData[botName] == undefined) {
      session.userData.botData[botName] = {}
    }
    polizeistellenRequest().then(function (polizeistellenResult) {
      console.log(polizeistellenResult)
      var polizeistellenJSON = JSON.parse(polizeistellenResult).features;
      var result = {
        "text": "Wähle die Polizeistelle",
        "type": "buttons_list",
        "data": [],
        "language": "de"
      };
      polizeistellenJSON.forEach(function (polizeistelle) {
        var bezeichnung = polizeistelle.properties.name.toString("utf8");
        result.data.push({
          "title": bezeichnung,
          "response": bezeichnung
        })
      })
      session.userData.botData[botName].polizeistellenJSON = polizeistellenJSON;
      var answerJson = session.toMessage(JSON.stringify(result));
      builder.Prompts.text(session, answerJson);
    });
  },
  function (session, args, next) {
    var message = session.message.text;
    var polizeistellenJSON = session.userData.botData[botName].polizeistellenJSON;
    polizeistellenJSON.forEach(function (polizeistelle) {
      polizeistelle = polizeistelle.properties;
      var bezeichnung = polizeistelle.name;
      if(message == bezeichnung) {
        var name = polizeistelle.name;
        var adresse = polizeistelle.adresse;
        var plzort = polizeistelle.plzort;
        var telefon = polizeistelle.telefon;
        var email = polizeistelle.email;
        console.log(polizeistelle)
        session.send("Die Daten der Polizeistelle " + name + " sind:");
        session.send("Adresse: " + adresse);
        session.send(plzort);
        if(telefon !== null && email !== null) {
          session.send("Kontakt:");
          if(telefon !== null) {
            session.send("Tel: " + telefon);
          } else if (email !== null) {
            session.send("Email: " + email);
          }
        }
      }
    })
  }
];

function polizeistellenRequest() {
  //requestOverview
  var file = rp({uri: serviceURL, encoding: 'latin1'});
  return file;
}

module.exports = botDialog;
