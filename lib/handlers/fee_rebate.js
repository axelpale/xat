const Asset = require('../Asset')
const Income = require('../events/Income')

module.exports = function (row, accounts, events) {
  // Fee rebates are previously consumed fees that the exchange
  // returns to the trader for miscelanceous reasons.
  // Handle fee rebates as ordinary income because they are rare,
  // relatively small, and the exact origin is difficult to find out.
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
  const income = new Income(row.date, [receivedAsset])
  events.pushEvent('income', income)
}
