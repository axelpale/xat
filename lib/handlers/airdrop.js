const Income = require('../Income')
const Asset = require('../Asset')

module.exports = function (row, accounts, events) {
  // Airdrops are assets that an organization gives for free
  // to holders of certain assets.
  // Handle airdrop value as ordinary income.
  //

  // Create or find account
  const name = row.toAccount
  const unit = row.receivedUnit
  const account = accounts.findOrCreateAccount(name, unit)

  // Add asset
  const asset = Asset.createFromReceived(row)
  account.pushAsset(asset)

  // Add ordinary income
  const income = new Income(row.date, [asset])
  events.incomeEvents.push(income)
}
