const BigNumber = require('big.js')
const Asset = require('../Asset')
const Sale = require('../Sale')
const ZERO = new BigNumber(0)

module.exports = function (row, accounts, events) {
  // Trade assets between accounts in a manner that triggers capital gain.
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

    const feeExpenses = ZERO
    const feeSale = new Sale(row.date, feeAssets, feeUnitPriceEur, feeExpenses)
    events.saleEvents.push(feeSale)
  }

  // TODO What if the fee unit is something else, like ETH in
  // ERC-20 token transfers?

  // Create or find the target account
  const targetName = row.toAccount
  const targetUnit = row.receivedUnit
  const targetAccount = accounts.findOrCreateAccount(targetName, targetUnit)

  // Remove sent assets from the source account
  const sentAmount = row.sentAmount
  const sentAssets = sourceAccount.popAssets(sentAmount)

  // Create the received assets.
  const receivedAsset = Asset.createFromReceived(row)

  // Add capital gain if applicable.
  // If so, add the trading fees as sale expenses.
  if (sourceUnit !== 'EUR') {
    const saleUnitPrice = row.sentUnitPriceEur
    const saleExpenses = row.feeValueEur
    const sale = new Sale(row.date, sentAssets, saleUnitPrice, saleExpenses)
    events.saleEvents.push(sale)
  } else {
    // Just a purchase with the base fiat.
    // Add purchase expenses to the assets.
    const purchaseExpense = row.feeValueEur
    receivedAsset.addExpenseEur(purchaseExpense)
  }

  // Add received assets to the target account
  targetAccount.pushAsset(receivedAsset)
}
