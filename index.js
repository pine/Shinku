'use strict'

const co  = require('co')
const log = require('fancy-log')

const GitHub = require('./lib/github')
const Slack  = require('./lib/slack')

// ----------------------------------------------------------------------------

exports.handler = (event, context, callback) => {
  co(function* () {
    const github = new GitHub({
      token: process.env.GITHUB_API_TOKEN,
    })
    const slack  = new Slack({
      team    : process.env.SLACK_TEAM,
      email   : process.env.SLACK_EMAIL,
      password: process.env.SLACK_PASSWORD,
    })
    const username = process.env.GITHUB_USER_NAME
    const service  = process.env.SLACK_SERVICE

    const repos = yield github.repos(username)
    log(`${repos.length} repositories found in GitHub`)

    yield slack.updateService(service, repos)
  })
    .then(
      ()  => callback(null, 'OK'),
      err => {
        log.error(err)
        callback(err)
      }
    )
}
