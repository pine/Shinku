'use strict'

const cheerio = require('cheerio')
const co = require('co')
const coverup = require('coverup')
const log = require('fancy-log')
const request = require('request-promise')
const _ = require('lodash')

class Slack {
  constructor(options) {
    this.team = options.team
    this.email = options.email
    this.password = options.password
  }

  updateService(serviceId, targetRepos) {
    const _this = this
    return co(function* () {
      const jar = request.jar()

      const signinQuery = yield _this._fetchSigninQuery(jar, serviceId)
      log('Login page loaded')

      log('Try login:', _this.team, _this.email, coverup(_this.password))
      const $ = yield _this._tryLogin(jar, signinQuery)
      log('Login succeeded')

      const channel = _this._parseChannel($)
      const choosableRepos = _this._parseRepos($)
      log(`Target Slack channel ID is ${channel}`)
      log(`${choosableRepos.length} repositories found`)

      const repos = _this._filterRepos(choosableRepos, targetRepos)
      log(`${repos.length} repositories are sync targets`)

      log('Try update configure')
      const registerQuery = _this._makeRegisterQuery($, channel, repos)
      yield _this._registerRepos(jar, serviceId, registerQuery)

      log('Service configure changed')
    })
  }

  _fetchSigninQuery(jar, serviceId) {
    const _this = this
    return co(function* () {
      const $ = yield request({
        url: `https://${_this.team}.slack.com/services/${serviceId}`,
        jar,
        transform(body) { return cheerio.load(body) },
      })

      const signinForm = $('#signin_form')
      return _(signinForm.serializeArray())
        .map(pair => [ pair.name, pair.value ])
        .push([ 'email', _this.email ])
        .push([ 'password', _this.password ])
        .fromPairs()
        .value()
    })
  }

  _tryLogin(jar, query) {
    const _this = this
    return co(function* () {
      const $ = yield request.post({
        url: `https://${_this.team}.slack.com/`,
        form: query,
        followAllRedirects: true,
        jar,
        transform(body) { return cheerio.load(body) },
      })

      const serviceConfig = $('#service_config')
      if (serviceConfig.length == 0) throw 'Login failed'

      return $
    })
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

  _registerRepos(jar, serviceId, query) {
    const _this = this
    return co(function* () {
      const res = yield request.post({
        url: `https://${_this.team}.slack.com/services/${serviceId}`,
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
    })
  }
}

module.exports = Slack
