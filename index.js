var AWS = require('aws-sdk');
var childProcess = require('child_process');
var config = require('./config');
var path = require('path');
var Twit = require('twit');

var s3 = new AWS.S3();
var T = new Twit(config.twitter);
var stream = T.stream('statuses/filter', config.filter);

stream.on('tweet', function (tweetData) {
  if (tweetData.user.screen_name !== 'realDonaldTrump') {
    return;
  }

  var currentDate = new Date().toISOString().slice(0, 10);
  var tweetId = tweetData.id_str;
  var username = tweetData.user.screen_name;
  var url = 'https://twitter.com/' + username + '/status/' + tweetId;
  var outputFilename = ['tweet', username, currentDate, tweetId].join('-');

  var jsonS3Params = {
    Bucket: config.s3.bucket,
    Body: JSON.stringify(tweetData),
    ContentType: 'application/json',
    Key: 'tweets/' + username + '/' + outputFilename + '.json'
  };

  console.log(jsonS3Params.Body);

  // Upload tweet JSON to S3.
  s3.upload(jsonS3Params, function(err, data) {
    if (err) {
      console.error(err);
      return;
    }

    console.log(data);
  });

  // Make screenshot and upload to S3.
  var screenshotData = '';
  var processArgs = [path.join(__dirname, 'screenshot-phantom.js'), url];
  var screenshot = childProcess.spawn('/usr/bin/phantomjs', processArgs);

  screenshot.stderr.on('data', console.error);

  screenshot.stdout.on('data', function(buf) {
    screenshotData += buf;
  });

  screenshot.stdout.on('end', function() {
    var screenshotS3Params = {
      Bucket: config.s3.bucket,
      Body: new Buffer(screenshotData, 'base64'),
      ContentEncoding: 'base64',
      ContentType: 'image/png',
      Key: 'screenshots/' + username + '/' + outputFilename + '.png'
    };

    s3.upload(screenshotS3Params, function(err, data) {
      if (err) {
        console.error(err);
        return;
      }

      console.log(data);
    });
  });

  screenshot.on('exit', function(code) {
    if (code !== 0) {
      console.error('Exited with code: ' + code);
    }
  });

});
