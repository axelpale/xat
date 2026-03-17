const Airdrop = require('../events/Airdrop')
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

  // Add tax event
  const tev = new Airdrop(row.date, recordedAssets)
  events.pushEvent('airdrop', tev)
}
