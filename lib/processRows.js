const Asset = require('./Asset')
const Income = require('./Income')

module.exports = function (accounts, rows) {
  // Convert rows to accounts, assets, income, gains, and losses.
  // Modifies the given account collection.
  //
  // Parameters
  //   accounts
  //     an AccountCollection
  //   rows
  //     an array of normalized transaction rows
  //

  // Process rows in chronological order.
  const timeline = rows.toReversed()

  // Collect income events.
  const incomeEvents = []
  // Collect sale events.
  const saleEvents = []

  // Collect transactions until next trade.
  let accumulatedTxs = []

  for (let i = 0; i < timeline.length; i++) {
    const row = timeline[i]

    console.log(row)

    if (row.type === 'airdrop') {
      // create or find account
      const name = row.toAccount
      const unit = row.receivedUnit
      const account = accounts.findOrCreateAccount(name, unit)
      // add asset
      const asset = new Asset(
        row.receivedAmount,
        row.receivedUnit,
        row.protocol,
        row.date,
        row.receivedUnitPriceEur,
        row.feeValueEur
      )
      account.pushAsset(asset)
      // add income
      const income = new Income(row.date, [asset])
      incomeEvents.push(income)

      continue
    }

    if (row.type === 'fee_rebate') {
      // find target account
      // add asset
      // add negative misc_purchase_expense
    }

    if (row.type === 'gift_in') {
      // create or find account
      // add asset
      // add gift_income
    }

    if (row.type === 'gift_out') {
      // find account
      // remove asset
      // add gift_expense
    }

    if (row.type === 'info') {
      continue // no-op
    }

    if (row.type === 'lose') {
      // find account
      // remove asset
      // add capital_loss
    }

    if (row.type === 'mining') {
      // create or find account
      // add asset
      // add income
    }

    if (row.type === 'move') {
      // find source account
      // create or find target account
      // remove or slice asset from source account
      // add asset to target account with added acquisition cost
    }

    if (row.type === 'payment_in') {
      // create or find target account
      // add asset
      // add income
    }

    if (row.type === 'payment_out') {
      // find source account
      // remove asset
      // add capital_gain or capital_loss
    }

    if (row.type === 'service') {
      continue // no-op
    }

    if (row.type === 'tax') {
      // find source account
      // remove asset
      // add tax_executed
    }

    if (row.type === 'tax_refund') {
      // find target account
      // add asset
      // add negative tax_executed
    }

    if (row.type === 'trade') {
      // pop the transactions
      const attachedTxs = accumulatedTxs
      accumulatedTxs = []
      // find the source account
      // create or find the target account
      // remove assets from the source account
      // add assets to the target account
      // add capital_gain or capital_loss
    }

    if (row.type === 'transaction') {
      // Collect until next trade
      accumulatedTxs.push(row)
      continue
    }
  }

  return { incomeEvents, saleEvents }
}
