const BigNumber = require('big.js')
const handleFee = require('./fee')
const ZERO = new BigNumber(0)

const sumAmount = (assets) => {
  // Return
  //   a BigNumber
  //
  return assets.reduce((acc, s) => acc.plus(s.amount), ZERO)
}

module.exports = function (row, accounts, events) {
  // Move assets from an account to another.
  // This does not trigger capital gain but adds to purchase expenses.
  //

  // Find the source account
  const sourceName = row.fromAccount
  const sourceUnit = row.sentUnit
  const sourceAccount = accounts.findAccount(sourceName, sourceUnit)

  if (!sourceAccount) {
    throw new Error('Account not found: ' + sourceName)
  }

  const feeAmount = row.feeAmount
  const feeUnit = row.feeUnit
  const feeUnitPriceEur = row.feeUnitPriceEur

  let feePriceEur = ZERO
  if (feeUnit && feeAmount.gt(0)) {
    feePriceEur = feeAmount.times(feeUnitPriceEur)
  }

  // Handle fee asset consumption and possible capital gain.
  // The fee might be in an unit other than the sent or received unit.
  handleFee(row, accounts, events)

  // Remove or slice the sent asset from the source account
  const sentAmount = row.sentAmount
  const sentAssets = sourceAccount.popAssets(sentAmount)

  if (sentAssets.length < 1) {
    throw new Error('Unexpected empty set of sent assets.')
  }

  // Create or find the target account
  const targetName = row.toAccount
  const targetUnit = row.receivedUnit
  const targetAccount = accounts.findOrCreateAccount(targetName, targetUnit)

  // Add acquisition cost to the asset that matures next.
  sentAssets[0].addExpenseEur(row.date, feePriceEur)

  // Ensure the sent amounts match
  const sentAssetAmount = sumAmount(sentAssets)
  if (!sentAmount.eq(sentAssetAmount)) {
    throw new Error('Sent amount does not match assets.')
  }

  // Ensure the sent assets and the received assets match.
  const receivedAmount = row.receivedAmount
  if (!sentAmount.eq(receivedAmount)) {
    throw new Error('Sent and received amounts do not match.')
  }

  // Add sent assets to the target account
  targetAccount.pushAssets(sentAssets)
}
