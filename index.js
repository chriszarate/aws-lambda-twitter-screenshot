var AWS = require('aws-sdk');
var childProcess = require('child_process');
var path = require('path');
var phantomPath = path.join(__dirname, 'phantomjs_linux-x86_64');
var s3 = new AWS.S3();

exports.handler = function(event, context) {
  // https://aws.amazon.com/blogs/compute/running-executables-in-aws-lambda/
  process.env['PATH'] = process.env['PATH'] + ':' + process.env['LAMBDA_TASK_ROOT'];

  function makeScreenshot(error, data) {
    if (error) {
      context.fail(error);
      return;
    }

    var currentDate = new Date().toISOString().slice(0, 10);
    var tweetData = JSON.parse(data.Body.toString());
    var tweetId = tweetData.id_str;
    var username = tweetData.user.screen_name;
    var url = 'https://twitter.com/' + username + '/status/' + tweetId;

    var outputFilename = ['tweet', username, currentDate, tweetId].join('-');
    var processArgs = [path.join(__dirname, 'phantom-script.js'), url];

    var screenshotData = '';
    var screenshot = childProcess.spawn(phantomPath, processArgs);

    screenshot.stderr.on('data', console.log);

    screenshot.stdout.on('data', function(buf) {
      screenshotData += buf;
    });

    screenshot.stdout.on('end', function() {
      var s3Params = {
        ContentEncoding: 'base64',
        ContentType: 'image/png',
        Bucket: process.env.TARGET_BUCKET,
        Body: new Buffer(screenshotData, 'base64'),
        Key: process.env.TARGET_PATH + '/' + username + '/' + outputFilename + '.png',
      };

      s3.upload(s3Params, function(err, data) {
        if (err) {
          context.fail(err);
          return;
        }

        context.succeed(data);
      });
    });

    screenshot.on('exit', function(code) {
      if (code !== 0) {
        context.fail(code);
      }
    });
  }

  event.Records.forEach(function(record) {
    s3.getObject({
      Bucket: record.s3.bucket.name,
      Key: decodeURIComponent(record.s3.object.key.replace(/\+/g, ' '))
    }, makeScreenshot);
  });
};
