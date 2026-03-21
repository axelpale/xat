const Asset = require('../Asset')
const Reward = require('../events/Reward')
const Acquisition = require('../events/Acquisition')
const Transaction = require('../events/Transaction')

module.exports = function (row, accounts, events) {
  // Receive staking rewards from staked assets.
  // Staking rewards are considered capital income in Finland.
  // They are not capital gain, therefore acquisition cost assumption
  // cannot be used.
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
  const recordedAssets = [receivedAsset.copy()]

  // Add received assets to the target account
  targetAccount.pushAsset(receivedAsset)

  // Add capital gain event. Record the fee for clarity.
  const expensesEur = row.feeAmount.times(row.feeUnitPriceEur)
  const reward = new Reward(row.id, row.date, recordedAssets, expensesEur)
  events.pushEvent(reward)

  // Record an acquisition event
  const aev = new Acquisition(row.id, row.date, row.type, recordedAssets)
  events.pushEvent(aev)

  // Record a transaction event.
  const tx = new Transaction(row, null, targetAccount.getBalance())
  events.pushEvent(tx)
}
