const BigNumber = require('big.js')
const Asset = require('../Asset')
const Sale = require('../Sale')

module.exports = function (row, accounts, events) {
  // Receive staking rewards from staked assets.
  // Staking rewards are capital gain.
  //

  // Create received assets.
  const receivedAsset = Asset.createFromReceived(row)
  if (receivedAsset.length < 1) {
    throw new Error('Unexpected empty set of received assets.')
  }

  // Add acquisition cost to the asset. Acquisition cost has already matured.
  const feePriceEur = row.feeValueEur
  receivedAsset.addExpenseEur(feePriceEur)

  // Create or find the target account.
  const targetName = row.toAccount
  const targetUnit = row.receivedUnit
  const targetAccount = accounts.findOrCreateAccount(targetName, targetUnit)

  // Add sent assets to the target account
  targetAccount.pushAsset(receivedAsset)
}
