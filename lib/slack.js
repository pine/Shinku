'use strict'

const co          = require('co')
const log         = require('fancy-log')
const driver      = require('promise-phantom')
const phantomPath = require('phantomjs-prebuilt').path
const sleep       = require('promise.sleep')

class Slack {
  constructor(options) {
    this.team     = options.team
    this.email    = options.email
    this.password = options.password
  }

  updateService(service, repos) {
    const _this = this
    return co(function* () {
      const phantom = yield driver.create({ path: phantomPath })

      try {
        const page = yield phantom.createPage()
        page.onConfirm(log)
        page.onConsoleMessage(log)
        page.onError(log.error)

        // clear caches
        page.clearLocalResources()
        yield page.clearCookies()
        yield page.clearMemoryCache()

        // load login page
        yield page.open(`https://prismrhythm.slack.com/services/${service}`)
        yield page.waitForSelector('#signin_form')
        log('Login page loaded:', yield page.get('url'))

        // login
        log('Try login:', _this.email, _this.password)
        yield page.evaluate(function (email, password) {
          document.getElementById('email').value    = email
          document.getElementById('password').value = password
          document.getElementById('signin_form').submit()
        }, _this.email, _this.password)
        log('Login form submitted')

        yield page.waitForLoad()
        yield page.waitForSelector('#service_config')
        yield page.waitForSelector('.repo_select')
        log('Login succeeded:', yield page.get('url'))

        // fetch repos
        const options = yield page.evaluate(function () {
          const result    = []
          const select    = document.querySelector('.repo_select')
          const optgroups = Array.prototype.slice.call(select.querySelectorAll('optgroup'))

          optgroups.forEach(function (optgroup) {
            const options = Array.prototype.slice.call(optgroup.querySelectorAll('option'))
            return options.forEach(function (option) {
              result.push({
                owner: optgroup.label,
                name: option.textContent,
                value: option.value,
              })
            })
          })

          return result
        })
        log(`${options.length} repositories found:`, yield page.get('url'))

        // sync
        const filteredOptions = _this._filterOptions(repos, options)
        log(`${filteredOptions.length} repositories are sync targets`)

        const oldUrl = yield page.get('url')
        yield page.evaluate(function (options) {
          const oldRepoIds  = Array.prototype.slice.call(document.getElementsByName('repo_ids[]'))
          const oldBranches = Array.prototype.slice.call(document.getElementsByName('branches[]'))
          oldRepoIds.forEach(function (elem) {
            elem.parentNode.remove(elem)
          })
          oldBranches.forEach(function (elem) {
            elem.parentNode.remove(elem)
          })

          const form = document.getElementById('service_config')
          options.forEach(function (option) {
            const repo = document.createElement('input')
            repo.type  = 'hidden'
            repo.name  = 'repo_ids[]'
            repo.value = option.value
            form.appendChild(repo)

            const branch = document.createElement('input')
            branch.type  = 'hidden'
            branch.name  = 'branches[]'
            form.appendChild(branch)
          })

          form.submit()
        }, filteredOptions)
        log('Service configure submitted')

        yield sleep(10 * 1000)
        yield page.waitForLoad()
        yield page.waitForSelector('#service_config')
        yield page.waitForSelector('.repo_select')

        const newUrl = yield page.get('url')
        if (oldUrl !== newUrl) {
          log('Service configure changed:', newUrl)
        } else {
          throw 'Form data transmission failed';
        }
      } finally {
        yield phantom.exit()
      }
    })
  }

  _filterOptions(repos, options) {
    const result = []

    repos.forEach(repo => {
      options.forEach(option => {
        const sameName  = repo.name === option.name
        const sameOwner = repo.owner.login === option.owner

        if (sameName && sameOwner) {
          result.push(option)
        }
      })
    })

    return result
  }
}

module.exports = Slack
