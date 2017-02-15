var AWS = require('aws-sdk');
var childProcess = require('child_process');
var config = require('./config');
var path = require('path');

var phantomjs = require('phantomjs-prebuilt');
var binPath = phantomjs.path;

var s3 = new AWS.S3();

module.exports = function(url) {
  var currentDate = new Date().toISOString().slice(0, 19);
  var outputFilename = ['tweet', currentDate].join('-');

  // Make screenshot and upload to S3.
  var screenshotData = '';
  var processArgs = [path.join(__dirname, 'screenshot-phantom.js'), url];
   
  var screenshot = childProcess.spawn(binPath, processArgs);

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
      Key: 'screenshots/' + outputFilename + '.png'
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
};
