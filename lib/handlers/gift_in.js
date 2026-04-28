const GiftAsset = require('../GiftAsset')
const GiftIn = require('../events/GiftIn')
const Acquisition = require('../events/Acquisition')
const Transaction = require('../events/Transaction')

module.exports = function (row, accounts, events) {
  // A gift is received and is thus subject to the gift tax.
  // Fees are assumed to be paid by the gift sender.
  //

  // Create or find the target account.
  const name = row.toAccount
  const unit = row.receivedUnit
  const account = accounts.findOrCreateAccount(name, unit)

  // Add asset
  const asset = GiftAsset.createFromReceived(row)

  account.pushAsset(asset)

  // Record received assets.
  // Mutability of Asset can bite, thus copy.
  const recordedAssets = [asset.copy()]

  // Add gift income
  const ev = new GiftIn(row.id, row.date, recordedAssets)
  events.pushEvent(ev)

  // Record an acquisition event
  const aev = new Acquisition(row.id, row.date, row.type, recordedAssets)
  events.pushEvent(aev)

  // Add transaction event.
  const tx = new Transaction(row, null, account.getBalance())
  events.pushEvent(tx)
}
