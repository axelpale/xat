const BigNumber = require('big.js')
const Sale = require('../events/Sale')
const ZERO = new BigNumber(0)

module.exports = function (row, accounts, events) {
  // Handle the transaction fee.
  // If the fee asset is subject to capital gain tax then
  // using the asset as a fee is a sale event.
  //

  const sourceName = row.fromAccount
  const sourceUnit = row.sentUnit
  const targetUnit = row.receivedUnit

  const feeAccountName = row.feeAccount
  const feeAmount = row.feeAmount
  const feeUnit = row.feeUnit
  const feeUnitPriceEur = row.feeUnitPriceEur

  // No need to remove or mature zero fee.
  if (feeAmount.lte(0) || feeUnit === '') {
    return
  }

  // Find the fee asset.
  let feeAssets = null

  if (feeUnit === sourceUnit) {
    // Fee is taken from the source account in addition to the sent amount.
    const sourceAccount = accounts.findAccount(sourceName, feeUnit)

    if (!sourceAccount) {
      throw new Error('Account not found: ' + sourceName)
    }

    feeAssets = sourceAccount.popAssets(feeAmount)
  } else if (feeUnit === targetUnit) {
    // Fee is in the received asset unit. It was consumed and matured
    // at the same time than the received asset was received.
  } else {
    // Fee unit is something else, like ETH in ERC-20 token transfers.
    const feeAccount = accounts.findAccount(feeAccountName, feeUnit)

    if (!feeAccount) {
      throw new Error('Account for fees not found: ' + feeAccountName)
    }

    feeAssets = feeAccount.popAssets(feeAmount)
  }

  // If fee is in an unit that is subject to capital gain tax,
  // then register a sale event of the fee asset.
  // If the fee is EUR then no capital gain is triggered and
  // removing (popping) the fee from the account is enough.
  if (feeAssets) {
    if (feeAssets.length < 1) {
      throw new Error('Unexpected empty set of fee assets.')
    }

    if (feeUnit !== 'EUR') {
      // Fee is in an unit that is subject to capital gain tax.

      // Fee itself is an expense, thus its consumption does not
      // carry additional expenses.
      const feeExpenses = ZERO

      const feeSale = new Sale(
        row.date,
        feeAssets,
        feeUnitPriceEur,
        feeExpenses,
        row.protocol + ' Fee' // sale origin, answers where did the fee go.
      )

      events.pushEvent('sale', feeSale)
    }
  }
}
