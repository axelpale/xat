const Asset = require('../Asset')

module.exports = function (row, accounts, events) {
  // Register an account in its initial state.
  //

  // Create or find account
  const name = row.toAccount
  const unit = row.receivedUnit
  const account = accounts.findOrCreateAccount(name, unit)

  // Add initial asset
  const asset = Asset.createFromReceived(row)
  account.pushAsset(asset)

  // Does not create income events.
}
