const Asset = require('../Asset')
const Reward = require('../events/Reward')

module.exports = function (row, accounts, events) {
  // Receive staking rewards from staked assets.
  // Staking rewards are capital gain in Finland.
  //

  // Create received assets.
  const receivedAsset = Asset.createFromReceived(row)

  // When receiving a reward, the acquisition expenses are already taken
  // from the amount. Therefore we cannot subtract the expense.
  // Only if the receiving amount included the expense it would make sense.
  //   RECEIVED_BEFORE_FEE - EXPENSE = RECEIVED_AFTER_FEE

  // Create or find the target account.
  const targetName = row.toAccount
  const targetUnit = row.receivedUnit
  const targetAccount = accounts.findOrCreateAccount(targetName, targetUnit)

  // Copy for event record in order to avoid later asset modification
  // affecting the asset in record. Asset is mutable.
  const recordedAsset = receivedAsset.copy()

  // Add received assets to the target account
  targetAccount.pushAsset(receivedAsset)

  // Add capital gain event
  const reward = new Reward(row.date, [recordedAsset])
  events.pushEvent('reward', reward)
}
