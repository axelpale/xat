const BigNumber = require('big.js')
const Asset = require('../Asset')
const Sale = require('../Sale')
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
  const feePriceEur = row.feeValueEur

  let feeUnitPriceEur = ZERO
  if (feeAmount.gt(ZERO)) {
    feeUnitPriceEur = feePriceEur.div(feeAmount)
  }

  // The fee matures first. No need to mature zero fee or EUR fee.
  if (feeUnit === sourceUnit && feeAmount.gt(0) && feeUnit !== 'EUR') {
    const feeAssets = sourceAccount.popAssets(feeAmount)

    if (feeAssets.length < 1) {
      throw new Error('Unexpected empty set of fee assets.')
    }

    const feeExpense = ZERO
    const feeSale = new Sale(row.date, feeAssets, feeUnitPriceEur, feeExpense)
    events.saleEvents.push(feeSale)
  }

  // TODO What if the fee unit is something else, like ETH in
  // ERC-20 token transfers?

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
  sentAssets[0].addExpenseEur(feePriceEur)

  // Ensure the sent amounts match
  const sentAssetAmount = sumAmount(sentAssets)
  if (!sentAmount.eq(sentAssetAmount)) {
    throw new Error('Sent amount does not match assets.')
  }

  // Ensure the sent assets and the received assets match.
  const receivedAsset = Asset.createFromReceived(row)
  if (!sentAmount.eq(receivedAsset.amount)) {
    throw new Error('Sent and received amounts do not match.')
  }

  // Add sent assets to the target account
  targetAccount.pushAssets(sentAssets)
}
