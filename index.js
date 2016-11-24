var config = require('./config');
var processTweet = require('./process-tweet');
var Twit = require('twit');

var T = new Twit(config.twitter);
var stream = T.stream('statuses/filter', config.filter);

console.log('starting stream....');
stream.on('tweet', processTweet);
