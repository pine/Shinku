'use strict'

const co           = require('co')
const Octokat      = require('octokat')
const promiseRetry = require('promise-retry')

class GitHub {
  constructor(options) {
    this.octo = Octokat({ token: options.token })
  }

  repos(username) {
    const _this = this
    return co(function* () {
      const repos = []

      let result = yield promiseRetry(() => _this.octo.users(username).repos.fetch())
      Array.prototype.push.apply(repos, result)

      while (result.nextPage) {
        result = yield promiseRetry(() => result.nextPage())
        Array.prototype.push.apply(repos, result)
      }

      return repos
    })
  }
}

module.exports = GitHub
