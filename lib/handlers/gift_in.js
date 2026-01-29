const Asset = require('../Asset')
const Income = require('../Income')

module.exports = function (row, accounts, events) {
  // A gift is received and is thus subject to the gift tax.
  //

  // Create or find the target account.
  const name = row.toAccount
  const unit = row.receivedUnit
  const account = accounts.findOrCreateAccount(name, unit)

  // Add asset
  const asset = Asset.createFromReceived(row)
  account.pushAsset(asset)

  // Add gift income
  const income = new Income(row.date, [asset])
  events.giftInEvents.push(income)
}
