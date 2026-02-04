const Asset = require('../Asset')
const Gain = require('../Gain')

module.exports = function (row, accounts, events) {
  // Receive staking rewards from staked assets.
  // Staking rewards are capital gain.
  //

  // Create received assets.
  const receivedAsset = Asset.createFromReceived(row)
  if (receivedAsset.length < 1) {
    throw new Error('Unexpected empty set of received assets.')
  }

  // When receiving a reward, the acquisition expenses are already taken
  // from the amount. Therefore we cannot subtract the expense.
  // Only if the receiving amount included the expense it would make sense.
  //   RECEIVED_BEFORE_FEE - EXPENSE = RECEIVED_AFTER_FEE

  // Create or find the target account.
  const targetName = row.toAccount
  const targetUnit = row.receivedUnit
  const targetAccount = accounts.findOrCreateAccount(targetName, targetUnit)

  // Add received assets to the target account
  targetAccount.pushAsset(receivedAsset)

  // Add capital gain event
  const gain = new Gain(row.date, [receivedAsset])
  events.gainEvents.push(gain)
}
