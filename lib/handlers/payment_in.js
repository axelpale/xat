const Asset = require('../Asset')
const Payment = require('../events/Payment')

module.exports = function (row, accounts, events) {
  // Payments are ordinary income.
  // Assume the sender pays for fees.
  //

  // TODO What if the income tax is already handled elsewhere?

  // Create or find account
  const name = row.toAccount
  const unit = row.receivedUnit
  const account = accounts.findOrCreateAccount(name, unit)

  // Add received asset. Usually fees are paid by the sender.
  const asset = Asset.createFromReceived(row)
  account.pushAsset(asset)

  // Record received assets.
  // Mutability of Asset can bite, thus copy.
  const recordedAssets = [asset.copy()]

  // Add income event for taxation
  const ev = new Payment(row.date, recordedAssets)
  events.pushEvent(ev)
}
