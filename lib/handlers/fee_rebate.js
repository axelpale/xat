const Asset = require('../Asset')
const Gain = require('../Gain')

module.exports = function (row, accounts, events) {
  // Fee rebates are previously consumed fees that the exchange
  // returns to the trader for miscelanceous reasons.
  // Handle fee rebates as capital gain because they
  // are previously used to reduce capital gain.
  //

  // Create received assets.
  const receivedAsset = Asset.createFromReceived(row)
  if (receivedAsset.length < 1) {
    throw new Error('Unexpected empty set of received assets.')
  }

  // Create or find the target account.
  const targetName = row.toAccount
  const targetUnit = row.receivedUnit
  const targetAccount = accounts.findOrCreateAccount(targetName, targetUnit)

  // Add received assets to the target account
  targetAccount.pushAsset(receivedAsset)

  // Add capital gain event.
  const gain = new Gain(row.date, [receivedAsset])
  events.gainEvents.push(gain)
}
