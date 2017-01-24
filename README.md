# Shinku [![CircleCI](https://circleci.com/gh/pine/Shinku/tree/master.svg?style=shield)](https://circleci.com/gh/pine/Shinku/tree/master) [![Dependency Status](https://gemnasium.com/badges/github.com/pine/Shinku.svg)](https://gemnasium.com/github.com/pine/Shinku)

> The auto-sync tool from GitHub repositories to Slack integrations

## Why ?
- I want to receive GitHub notifications by Slack
- I have many repositories (> 200)
- I want to synchronize from GitHub repositories to my Slack integration automatically

## Requirements
- Node v4.3.2
- yarn
- AWS account
  - This is a AWS Lambda function

## Getting started

```
$ yarn
$ yarn start      # run in local as debug
$ yarn run deploy # deploy for production
```

## Note
Please set memory > 256 MB for Lambda function, because Shinku uses PhantomJS  needed many memory.

## License
MIT
