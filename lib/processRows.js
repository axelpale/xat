const Asset = require('./Asset')
const Income = require('./Income')
const Sale = require('./Sale')

const createAssetFromReceived = function (row) {
  return new Asset(
    row.receivedAmount,
    row.receivedUnit,
    row.protocol,
    row.date,
    row.receivedUnitPriceEur,
    row.feeValueEur
  )
}

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
  // Collect gift events.
  const giftInEvents = []
  const giftOutEvents = []
  // Collect sale events.
  const saleEvents = []

  for (let i = 0; i < timeline.length; i++) {
    const row = timeline[i]

    try {
      if (row.type === 'airdrop') {
        // create or find account
        const name = row.toAccount
        const unit = row.receivedUnit
        const account = accounts.findOrCreateAccount(name, unit)
        // add asset
        const asset = createAssetFromReceived(row)
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
        continue
      }

      if (row.type === 'gift_in') {
        // create or find account
        const name = row.toAccount
        const unit = row.receivedUnit
        const account = accounts.findOrCreateAccount(name, unit)
        // add asset
        const asset = createAssetFromReceived(row)
        account.pushAsset(asset)
        // add gift_income
        const income = new Income(row.date, [asset])
        giftInEvents.push(income)

        continue
      }

      if (row.type === 'gift_out') {
        // find account
        // remove asset
        // add gift_expense
        continue
      }

      if (row.type === 'in') {
        // subtransaction
        // no-op
        continue
      }

      if (row.type === 'info') {
        continue // no-op
      }

      if (row.type === 'init') {
        // create or find account
        const name = row.toAccount
        const unit = row.receivedUnit
        const account = accounts.findOrCreateAccount(name, unit)
        // add asset
        const asset = createAssetFromReceived(row)
        account.pushAsset(asset)
        // no income events

        continue
      }

      if (row.type === 'lose') {
        // find account
        // remove asset
        // add capital_loss
        continue
      }

      if (row.type === 'mining') {
        // create or find account
        const name = row.toAccount
        const unit = row.receivedUnit
        const account = accounts.findOrCreateAccount(name, unit)
        // add asset
        const asset = createAssetFromReceived(row)
        account.pushAsset(asset)
        // add income
        const income = new Income(row.date, [asset])
        incomeEvents.push(income)

        continue
      }

      if (row.type === 'move') {
        // find source account
        // create or find target account
        // remove or slice asset from source account
        // add asset to target account with added acquisition cost
        continue
      }

      if (row.type === 'out') {
        // subtransaction
        // no-op
        continue
      }

      if (row.type === 'payment_in') {
        // create or find account
        const name = row.toAccount
        const unit = row.receivedUnit
        const account = accounts.findOrCreateAccount(name, unit)
        // add asset
        const asset = createAssetFromReceived(row)
        account.pushAsset(asset)
        // add income
        const income = new Income(row.date, [asset])
        incomeEvents.push(income)

        continue
      }

      if (row.type === 'payment_out') {
        // find source account
        const name = row.fromAccount
        const unit = row.sentUnit
        const account = accounts.findAccount(name, unit)
        if (!account) {
          console.warn('WARNING! Account not found: ' + name)
          console.warn('  Date: ' + row.date)
          console.warn('  Unit: ' + unit)
          continue
        }
        // remove asset
        const amount = row.sentAmount
        const sentAssets = account.popAssets(amount)
        // add capital_gain
        const salePrice = amount * row.sentUnitPriceEur
        const saleExpenses = row.feeValueEur
        const sale = new Sale(row.date, sentAssets, salePrice, saleExpenses)
        saleEvents.push(sale)

        continue
      }

      if (row.type === 'service') {
        continue // no-op
      }

      if (row.type === 'tax') {
        // find source account
        // remove asset
        // add tax_executed
        continue
      }

      if (row.type === 'tax_refund') {
        // find target account
        // add asset
        // add negative tax_executed
        continue
      }

      if (row.type === 'trade') {
        // find the source account
        const sourceName = row.fromAccount
        const sourceUnit = row.sentUnit
        const sourceAccount = accounts.findAccount(sourceName, sourceUnit)
        if (!sourceAccount) {
          console.warn('WARNING! Account not found: ' + sourceName)
          console.warn('  Date: ' + row.date)
          console.warn('  Unit: ' + sourceUnit)
          continue
        }
        // create or find the target account
        const targetName = row.toAccount
        const targetUnit = row.receivedUnit
        const targetAccount = accounts.findOrCreateAccount(targetName, targetUnit)
        if (!sourceAccount) {
          console.warn('WARNING! Account not found: ' + targetName)
          console.warn('  Date: ' + row.date)
          console.warn('  Unit: ' + targetUnit)
          continue
        }
        // remove sent assets from the source account
        const sentAmount = row.sentAmount
        const sentAssets = sourceAccount.popAssets(sentAmount)
        // add capital_gain if applicable
        if (sourceUnit !== 'EUR') {
          const salePrice = sentAmount * row.sentUnitPriceEur
          const saleExpenses = row.feeValueEur
          const sale = new Sale(row.date, sentAssets, salePrice, saleExpenses)
          saleEvents.push(sale)
        }
        // add received assets to the target account
        const receivedAsset = createAssetFromReceived(row)
        targetAccount.pushAsset(receivedAsset)

        // TODO handle capital gain or loss from the fee asset.

        continue
      }

      console.warn('Unexpected row type: ' + row.type)
    } catch (err) {
      console.warn('WARNING: ' + err.message)
      console.log(row)
      break
      // TODO continue to next row
    }
  }

  return {
    incomeEvents,
    giftInEvents,
    giftOutEvents,
    saleEvents
  }
}
