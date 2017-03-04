var jsonfile = require('jsonfile');
var jsonQuery = require('json-query');
var openGeoDB_file = 'database/openGeoDB.json';
var debugMode = true;
var rp = require('request-promise');

String.prototype.initCap = function () {
  return this.toLowerCase().replace(/(?:^|\s)[a-z]/g, function (m) {
    return m.toUpperCase();
  });
};

String.prototype.toASCII = function () {
  var tr = {"Ä": "AE", "Ü": "UE", "Ö": "OE", "ß": "SS"}
  return this.toUpperCase().replace(/[äöüß]/gi, function ($0) {
    return tr[$0]
  })
};

var shared_functions = {
  randomWithRange: function (min, max) {
    return Math.floor(Math.random() * (max - min));
  },
  getLocatonFromOpenGeoDB: function (toponym) {
    var retVar = {};
    if (typeof toponym != 'undefined') {
      var openGeoDB = jsonfile.readFileSync(openGeoDB_file);
      var result = jsonQuery('[name~/^' + toponym.initCap() + '/i && lon >= 0].{*}', {
        data: openGeoDB,
        allowRegexp: true
      }).value;
      if (result == null) {
        result = jsonQuery('[ascii~/^' + toponym.toASCII() + '/i && lon >= 0].{*}', {
          data: openGeoDB,
          allowRegexp: true
        }).value;
      }
      retVar = result;
    } else {
      retVar = false;
    }
    debugLog('getLocatonFromOpenGeoDB');
    debugLog(retVar);
    return retVar;
  },
  getLocationFromVSM: function (toponym) {
    var url = 'http://vsm.d-nrw.de/index/complete-commune-search?term=' + encodeURI(toponym);
    debugLog('getLocationFromVSM: ' + url);

    return rp({uri: url}).then(function (result) {
      result = JSON.parse(result);
      debugLog(result);
      return (result.length > 0) ? result[0] : false;
    }).catch(function (err) {
      console.log(err);
      return false;
    });
  },
  getLocationByCityName: function (cityName) {
    return shared_functions.getLocationFromVSM(cityName).then(function (vsm) {
      var openGeoDB = shared_functions.getLocatonFromOpenGeoDB(cityName);
      var location = {};

      if (vsm || openGeoDB) {
        location.agsCode = ((vsm && vsm.ags) ? vsm.ags : openGeoDB.ags);
        location.name = ((vsm && vsm.name) ? vsm.name : openGeoDB.name);
        location.commune = ((vsm && vsm.collectionKey) ? vsm.collectionKey : 'bund');
        location.ascii = ((vsm && vsm.ascii) ? vsm.ascii : openGeoDB.ascii);
        location.lat = ((vsm && vsm.lat) ? vsm.lat : openGeoDB.lat);
        location.lon = ((vsm && vsm.lon) ? vsm.lon : openGeoDB.lon);
        debugLog('getLocationByCityName');
        debugLog(location);
        return location;
      }
    });
  },
  addDaysToDate: function (dateString, days) {
    var newDate = new Date(Date.parse(dateString));
    newDate.setDate(myDate.getDate() + days);
    return newDate;
  },
  guid: function () {
    function s4() {
      return Math.floor((1 + Math.random()) * 0x10000)
        .toString(16)
        .substring(1);
    }

    return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
  },
  log: function (logString, force) {
    if (debugMode || force == true) {
      console.log(logString);
    }
  }
};

function debugLog(logString) {
  if (debugMode) {
    console.log(logString);
  }
}

module.exports = shared_functions;
