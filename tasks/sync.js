'use strict'

const config = require('config')
const log = require('fancy-log')

const GitHub = require('../lib/github')
const Slack = require('../lib/slack')

// ----------------------------------------------------------------------------

const { GITHUB_API_TOKEN, SLACK_PASSWORD } = process.env

const GITHUB_USER_NAME = config.get('github.username')
const SLACK_DOMAIN = config.get('slack.domain')
const SLACK_EMAIL = config.get('slack.email')
const SLACK_SERVICE_ID = config.get('slack.serviceId')

// ----------------------------------------------------------------------------

if (!SLACK_PASSWORD) {
  log.error('`SLACK_PASSWORD` not found')
  process.exit(1)
}

if (!GITHUB_API_TOKEN) {
  log.error('`GITHUB_API_TOKEN` not found')
  process.exit(1)
}

if (!SLACK_DOMAIN) {
  log.error('`slack.domain` not found')
  process.exit(1)
}

if (!SLACK_EMAIL) {
  log.error('`slack.email` not found')
  process.exit(1)
}

if (!SLACK_SERVICE_ID) {
  log.error('`slack.serviceId` not found')
  process.exit(1)
}
if (!GITHUB_USER_NAME) {
  log.error('`github.username` not found')
  process.exit(1)
}

// ----------------------------------------------------------------------------

module.exports = async () => {
  const github = new GitHub({ token: GITHUB_API_TOKEN })
  const slack = new Slack({
    team: SLACK_DOMAIN,
    email: SLACK_EMAIL,
    password: SLACK_PASSWORD,
  })

  const repos = await github.repos(GITHUB_USER_NAME)
  log(`${repos.length} repositories found in GitHub`)

  await slack.updateService(SLACK_SERVICE_ID, repos)
}
