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

  // Add acquisition cost if any to the asset.
  // Acquisition cost has already matured.
  const feePriceEur = row.feeValueEur
  receivedAsset.addExpenseEur(feePriceEur)

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
