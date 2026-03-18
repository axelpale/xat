const Asset = require('../Asset')
const Reward = require('../events/Reward')
const BigNumber = require('big.js')
const ZERO = new BigNumber(0)

module.exports = function (row, accounts, events) {
  // Fee rebates are previously consumed fees that the exchange
  // returns to the trader for miscelanceous reasons.
  // Handle fee rebates like rewards because they are rare,
  // relatively small, and the exact origin is difficult to find,
  // but they contribute to the capital income.
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

  // Record received assets.
  // Mutability of Asset can bite, thus copy.
  const recordedAssets = [receivedAsset.copy()]
  const noExpenses = ZERO

  // Add capital gain event.
  const ev = new Reward(row.id, row.date, recordedAssets, noExpenses)
  events.pushEvent(ev)
}
