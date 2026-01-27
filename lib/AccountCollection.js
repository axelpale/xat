const Account = require('./Account')

const AccountCollection = function () {
  this.accounts = {}
}

const proto = AccountCollection.prototype
module.exports = AccountCollection

proto.findAccount = function (name) {
  if (this.accounts[name]) {
    return this.accounts[name]
  }
  return null
}

proto.findOrCreateAccount = function (name) {
  if (this.accounts[name]) {
    return this.accounts[name]
  }

  this.accounts[name] = new Account(name)
}
