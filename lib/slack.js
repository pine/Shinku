'use strict'

const cheerio = require('cheerio')
const coverup = require('coverup')
const log = require('fancy-log')
const request = require('request-promise')
const _ = require('lodash')

class Slack {
  constructor({ team, email, password }) {
    this.team = team
    this.email = email
    this.password = password
  }

  async updateService(serviceId, targetRepos) {
    const jar = request.jar()
    const signinQuery = await this._fetchSigninQuery(jar, serviceId)
    log('Login page loaded')

    log('Try login:', this.team, this.email, coverup(this.password))
    const $ = await this._tryLogin(jar, signinQuery)
    log('Login succeeded')

    const channel = this._parseChannel($)
    const choosableRepos = this._parseRepos($)
    log(`Target Slack channel ID is ${channel}`)
    log(`${choosableRepos.length} repositories found`)

    const repos = this._filterRepos(choosableRepos, targetRepos)
    log(`${repos.length} repositories are sync targets`)

    log('Try update configure')
    const registerQuery = this._makeRegisterQuery($, channel, repos)
    await this._registerRepos(jar, serviceId, registerQuery)

    log('Service configure changed')
  }

  async _fetchSigninQuery(jar, serviceId) {
    const $ = await request({
      url: `https://${this.team}.slack.com/services/${serviceId}`,
      jar,
      transform(body) { return cheerio.load(body) },
    })

    const signinForm = $('#signin_form')
    return _(signinForm.serializeArray())
      .map(pair => [ pair.name, pair.value ])
      .push([ 'email', this.email ])
      .push([ 'password', this.password ])
      .fromPairs()
      .value()
  }

  async _tryLogin(jar, query) {
    const $ = await request.post({
      url: `https://${this.team}.slack.com/`,
      form: query,
      followAllRedirects: true,
      jar,
      transform(body) { return cheerio.load(body) },
    })

    const serviceConfig = $('#service_config')
    if (serviceConfig.length == 0) throw 'Login failed'

    return $
  }

  _parseRepos($) {
    const result = []
    const optgroups = $('.repo_select_template optgroup').toArray()

    optgroups.forEach(optgroup => {
      const options = $('option', optgroup).toArray()
      return options.forEach(option => {
        result.push({
          owner: $(optgroup).attr('label'),
          name: $(option).text(),
          value: $(option).val(),
        })
      })
    })

    return result
  }

  _parseChannel($) {
    const options = $('#channel option').toArray()
    const selected = _.find(options, option => $(option).attr('selected'))
    return $(selected).attr('value')
  }

  _filterRepos(choosableRepos, targetRepos) {
    const result = []

    targetRepos.forEach(targetRepo => {
      choosableRepos.forEach(choosableRepo => {
        const sameName  = targetRepo.name === choosableRepo.name
        const sameOwner = targetRepo.owner.login === choosableRepo.owner

        if (sameName && sameOwner) {
          result.push(choosableRepo)
        }
      })
    })

    return result
  }

  _makeRegisterQuery($, channel, repos) {
    const query = $('#service_config').serializeArray()
      .filter(pair => pair.name !== 'repo_ids[]' && pair.name !== 'branches[]')

    repos.forEach(repo => {
      query.push({ name: 'repo_ids[]', value: repo.value })
      query.push({ name: 'branches[]', value: '' })
    })

    for (let pair of query) {
      if (pair.name == 'channel') {
        pair.value = channel
      }
    }

    return query.map(pair => pair.name + '=' + encodeURIComponent(pair.value)).join('&')
  }

  async _registerRepos(jar, serviceId, query) {
    const res = await request.post({
      url: `https://${this.team}.slack.com/services/${serviceId}`,
      body: query,
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      jar,
      simple: false,
      resolveWithFullResponse: true,
    })

    if (!res.headers['location'] && res.statusCode !== 504) { // workaround
      throw 'Form data transmission failed'
    }
  }
}

module.exports = Slack
