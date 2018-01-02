'use strict'

const Octokat = require('octokat')
const promiseRetry = require('promise-retry')

class GitHub {
  constructor({ token }) {
    this.octo = Octokat({ token })
  }

  async repos(username) {
    const repos = []

    let result = await promiseRetry(() => this.octo.users(username).repos.fetch())
    repos.push(...result.items)

    while (result.nextPage) {
      result = await promiseRetry(() => result.nextPage.fetch())
      repos.push(...result.items)
    }

    return repos
  }
}

module.exports = GitHub
