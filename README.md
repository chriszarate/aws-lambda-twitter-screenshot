# AWS Lambda Twitter Screenshot Generator

Using AWS S3, Lambda and PhantomJS, generates screenshots of Twitter statuses
and uploads them to an S3 bucket.

1. [Upload Twitter API output to an S3 bucket.](https://github.com/chriszarate/aws-firehose-twitter).

2. Subscribe this Lambda function to that bucket's events. Don't forget to
   provide the environment variables `TARGET_BUCKET` and `TARGET_PATH`.

Adapted from: [TylerPachal/lambda-node-phantom](https://github.com/TylerPachal/lambda-node-phantom)
