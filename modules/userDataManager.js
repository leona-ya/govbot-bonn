var shared = require('./sharedFunctions');
var userData = {
  reset: function (session) {
    console.log("-- Reset Bot --");
    var resolve_answers = [
      'Ok, ich habe nun vergessen, was wir besprochen haben.',
      'Ups, ich glaube, ich habe gerade alles vergessen.',
      'Ok, fangen wir noch einmal von vorne an.'
    ];
    session.userData = {};
    return resolve_answers[shared.randomWithRange(0,resolve_answers.length)];
  },
  data: {}
};

module.exports = userData;
