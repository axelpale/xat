const Income = require('../Income')
const Asset = require('../Asset')

module.exports = function (row, accounts, events) {
  // create or find account
  const name = row.toAccount
  const unit = row.receivedUnit
  const account = accounts.findOrCreateAccount(name, unit)
  // add asset
  const asset = Asset.createFromReceived(row)
  account.pushAsset(asset)
  // add income
  const income = new Income(row.date, [asset])
  events.incomeEvents.push(income)
}
