const Asset = require('../Asset')

module.exports = function (row, accounts, events) {
  // Register an account in its initial state.

  // create or find account
  const name = row.toAccount
  const unit = row.receivedUnit
  const account = accounts.findOrCreateAccount(name, unit)
  // add asset
  const asset = Asset.createFromReceived(row)
  account.pushAsset(asset)
  // no income events
}
