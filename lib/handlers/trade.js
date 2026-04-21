const BigNumber = require('big.js')
const Asset = require('../Asset')
const Sale = require('../events/Sale')
const Acquisition = require('../events/Acquisition')
const Transaction = require('../events/Transaction')
const handleFee = require('./fee')
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
  const feeUnitPriceEur = row.feeUnitPriceEur

  // Determine fee total
  let feePriceEur = ZERO
  if (feeUnit && feeAmount.gt(0)) {
    feePriceEur = feeAmount.times(feeUnitPriceEur)
  }

  // Handle fee asset consumption and possible capital gain.
  // The fee might be in an unit other than the sent or received unit.
  handleFee(row, accounts, events)

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
  if (sourceUnit === 'EUR') {
    // Just a purchase with the base fiat.
    // Add as purchase expenses to the assets.
    receivedAsset.addExpenseEur(row.date, feePriceEur)
  } else {
    // Sold asset is applicable to capital gains tax.
    // Add the fees as sale expenses.
    // Fees are not included in the sent assets.
    // Possible capital gain from using assets for the fees is handled above.
    const saleUnitPrice = row.sentUnitPriceEur
    const saleExpenses = feePriceEur
    const saleOrigin = row.protocol
    const sale = new Sale(
      row.id,
      row.date,
      sentAssets.map(a => a.copy()), // Mutability of Asset can bite.
      saleUnitPrice,
      saleExpenses,
      saleOrigin,
      sourceName,
      row.documents
    )
    events.pushEvent(sale)
  }

  // Add received assets to the target account
  targetAccount.pushAsset(receivedAsset)

  // Record an acquisition event
  const recordedAssets = [receivedAsset.copy()]
  const aev = new Acquisition(row.id, row.date, row.type, recordedAssets)
  events.pushEvent(aev)

  // Record a transaction event.
  const tx = new Transaction(
    row,
    sourceAccount.getBalance(),
    targetAccount.getBalance()
  )
  events.pushEvent(tx)
}
