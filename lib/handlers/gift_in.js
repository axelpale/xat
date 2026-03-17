const Asset = require('../Asset')
const Payment = require('../events/Payment')

module.exports = function (row, accounts, events) {
  // A gift is received and is thus subject to the gift tax.
  // Fees are assumed to be paid by the gift sender.
  //

  // Create or find the target account.
  const name = row.toAccount
  const unit = row.receivedUnit
  const account = accounts.findOrCreateAccount(name, unit)

  // Add asset
  const asset = Asset.createFromReceived(row)
  account.pushAsset(asset)

  // Record received assets.
  // Mutability of Asset can bite, thus copy.
  const recordedAssets = [asset.copy()]

  // Add gift income TODO implement Gift event
  const income = new Payment(row.date, recordedAssets)
  events.pushEvent('giftIn', income)
}
