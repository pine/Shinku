# Shinku [![CircleCI branch](https://img.shields.io/circleci/project/github/pine/Shinku/master.svg?style=flat-square)](https://circleci.com/gh/pine/Shinku) [![David](https://img.shields.io/david/pine/Shinku.svg?style=flat-square)](https://david-dm.org/pine/Shinku) [![David](https://img.shields.io/david/dev/pine/Shinku.svg?style=flat-square)](https://david-dm.org/pine/Shinku)

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
