const Airdrop = require('../events/Airdrop')
const Transaction = require('../events/Transaction')
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

  // Record received assets.
  // Mutability of Asset can bite, thus copy.
  const recordedAssets = [asset.copy()]

  // Record an income event
  const tev = new Airdrop(row.date, recordedAssets)
  events.pushEvent(tev)

  // Record a transaction event.
  const tx = new Transaction(row, null, account.getBalance())
  events.pushEvent(tx)
}
