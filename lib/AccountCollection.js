const Account = require('./Account')

const AccountCollection = function () {
  // Mapping from account name string to Account.
  this.accounts = {}
}

const proto = AccountCollection.prototype
module.exports = AccountCollection

proto.findAccount = function (name, unit) {
  // Find one account.
  //
  // Parameters:
  //   name
  //     a string, the account name.
  //   unit
  //     a string, the account unit. For safeguard.
  //
  // Return
  //   an Account or null if not found.
  //
  if (!name || typeof name !== 'string') {
    throw new Error('Invalid account name. Must be a string.')
  }
  if (name.length < 1) {
    throw new Error('Unexpected account name. Must be long enough string.')
  }
  if (!unit || typeof unit !== 'string') {
    throw new Error('Invalid account unit. Must be a string.')
  }
  if (unit.length < 2) {
    throw new Error('Unexpected account unit. Must be long enough string.')
  }

  if (this.accounts[name]) {
    const account = this.accounts[name]
    if (account.unit !== unit.toUpperCase()) {
      const msg = 'Account with the same name but different unit was found.'
      throw new Error(msg)
    }
    return account
  }

  return null
}

proto.findOrCreateAccount = function (name, unit) {
  // Find one account or create it.
  //
  // Return
  //   an Account
  //

  // Validate arguments and find the account.
  let account = this.findAccount(name, unit)

  if (account) {
    return account
  }

  account = new Account(name, unit)
  this.accounts[name] = account

  return account
}
