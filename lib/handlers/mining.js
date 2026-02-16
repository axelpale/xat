const Asset = require('../Asset')
const Income = require('../events/Income')

module.exports = function (row, accounts, events) {
  // Mining rewards are handled as ordinary income.
  //

  // Create or find account
  const name = row.toAccount
  const unit = row.receivedUnit
  const account = accounts.findOrCreateAccount(name, unit)

  // Add asset
  const asset = Asset.createFromReceived(row)
  account.pushAsset(asset)

  // TODO add acquisition costs that reduce the income, like electricity.

  // Record received assets.
  // Mutability of Asset can bite, thus copy.
  const recordedAssets = [asset.copy()]

  // Add income
  const income = new Income(row.date, recordedAssets)
  events.pushEvent('income', income)
}
